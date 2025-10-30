"""Trip search orchestrator - coordinates parallel searches and Claude analysis."""

import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import structlog

from ..models import (
    TripSearchRequest,
    TripSearchResult,
    Destination,
    SearchMetadata,
    SearchError,
    Hub,
    Route,
    RoutePathData,
    Coordinates,
    MapBounds,
)
from ..config import settings
from .parallel_api import parallel_api
from .claude_agent import claude_agent
from .simple_cache import cache  # Using simple in-memory cache (no Redis required)
from .geo_utils import geo_service
from nanoid import generate

logger = structlog.get_logger()


class TripSearchOrchestrator:
    """Orchestrates the entire trip search process."""

    def __init__(self):
        self.parallel_api = parallel_api
        self.claude_agent = claude_agent
        self.cache = cache

    def _calculate_trip_duration(self, start: str, end: str) -> Tuple[int, int]:
        """Calculate nights and days from date range."""
        from datetime import datetime

        start_date = datetime.strptime(start, "%Y-%m-%d")
        end_date = datetime.strptime(end, "%Y-%m-%d")
        delta = end_date - start_date
        nights = delta.days
        days = nights + 1
        return nights, days

    async def update_progress(
        self, job_id: str, progress: int, message: str, status: str = "processing"
    ):
        """Update job progress in cache."""
        status_data = {
            "job_id": job_id,
            "status": status,
            "progress": progress,
            "message": message,
            "updated_at": datetime.utcnow().isoformat(),
        }
        await self.cache.set(
            self.cache.status_key(job_id), status_data, settings.cache_ttl_results
        )
        logger.info(f"Progress update: {message}", job_id=job_id, progress=progress)

    async def search_trip(self, job_id: str, request: TripSearchRequest) -> TripSearchResult:
        """
        Execute complete trip search workflow.

        Args:
            job_id: Unique job identifier
            request: Trip search request

        Returns:
            TripSearchResult with all analyzed destinations
        """
        start_time = datetime.utcnow()
        errors: List[SearchError] = []

        try:
            # Calculate trip duration
            nights, days = self._calculate_trip_duration(
                request.date_range.start, request.date_range.end
            )

            # Phase 1: Search for flights
            await self.update_progress(job_id, 10, "Searching for flights...")

            # Check cache first
            date_hash = self.cache.date_hash(request.date_range.start, request.date_range.end)
            flight_cache_key = self.cache.flight_key(request.origin, date_hash)
            cached_flights = await self.cache.get(flight_cache_key)

            if cached_flights:
                logger.info("Using cached flight data")
                flight_search_results = cached_flights
            else:
                flight_search_results = await self.parallel_api.search_flights(
                    request.origin,
                    {"start": request.date_range.start, "end": request.date_range.end},
                    max_results=settings.max_flight_results,
                )
                # Cache flight results
                await self.cache.set(
                    flight_cache_key, flight_search_results, settings.cache_ttl_flight
                )

            # Parse flight results with Claude
            await self.update_progress(job_id, 20, "Analyzing flight options with AI...")

            flight_data = await self.claude_agent.parse_search_results(
                flight_search_results, "flight"
            )
            candidates = await self.claude_agent.filter_flight_candidates(
                flight_data.get("destinations", []), request.budget
            )

            if not candidates:
                logger.warning("No flight candidates found within budget")

                # Build Hub information even when no flights found
                origin_info = geo_service.get_airport_info(request.origin)
                if not origin_info:
                    origin_info = {
                        "city": request.origin,
                        "country": "Unknown",
                        "lat": 0.0,
                        "lng": 0.0,
                    }

                hub = Hub(
                    airport_code=request.origin,
                    city=origin_info["city"],
                    country=origin_info["country"],
                    coordinates=Coordinates(lat=origin_info["lat"], lng=origin_info["lng"]),
                )

                # Default map bounds (world view)
                map_bounds = MapBounds(north=85, south=-85, east=180, west=-180)

                return TripSearchResult(
                    job_id=job_id,
                    status="failed",
                    query={
                        "origin": request.origin,
                        "dateRange": request.date_range.dict(),
                        "budget": request.budget,
                        "nights": nights,
                    },
                    hub=hub,
                    routes=[],
                    map_bounds=map_bounds,
                    recommended_zoom=2,
                    destinations=[],
                    search_metadata=SearchMetadata(
                        total_searched=0,
                        feasible_count=0,
                        execution_time=(datetime.utcnow() - start_time).total_seconds(),
                        timestamp=datetime.utcnow().isoformat(),
                    ),
                    errors=[
                        SearchError(
                            city="N/A",
                            reason="No flights found within budget",
                            severity="error",
                        )
                    ],
                )

            logger.info(f"Found {len(candidates)} candidate destinations")

            # Phase 2: Parallel multi-domain search for each destination
            await self.update_progress(
                job_id, 30, f"Researching {len(candidates)} destinations in parallel..."
            )

            destination_data_list = await self._search_all_destinations(
                candidates, request.date_range.dict(), errors
            )

            # Phase 3: Claude analysis for each destination
            await self.update_progress(
                job_id, 70, "Analyzing costs and generating insights with AI..."
            )

            destinations = await self._analyze_all_destinations(
                destination_data_list, request.budget, nights, days, errors
            )

            # Phase 4: Finalize results with route visualization data
            await self.update_progress(job_id, 95, "Finalizing results and creating map routes...")

            execution_time = (datetime.utcnow() - start_time).total_seconds()
            feasible_count = sum(1 for d in destinations if d.is_feasible)

            # Build Hub information
            origin_info = geo_service.get_airport_info(request.origin)
            if not origin_info:
                origin_info = {
                    "city": request.origin,
                    "country": "Unknown",
                    "lat": 0.0,
                    "lng": 0.0,
                }

            hub = Hub(
                airport_code=request.origin,
                city=origin_info["city"],
                country=origin_info["country"],
                coordinates=Coordinates(lat=origin_info["lat"], lng=origin_info["lng"]),
            )

            # Convert destinations to routes with geographic data
            routes = self._build_routes(hub, destinations)

            # Calculate map bounds for all routes
            all_coords = [hub.coordinates] + [route.coordinates for route in routes]
            map_bounds = geo_service.calculate_map_bounds(all_coords)
            recommended_zoom = geo_service.calculate_recommended_zoom(map_bounds)

            result = TripSearchResult(
                job_id=job_id,
                status="completed" if not errors else "partial",
                query={
                    "origin": request.origin,
                    "dateRange": request.date_range.dict(),
                    "budget": request.budget,
                    "nights": nights,
                },
                hub=hub,
                routes=routes,
                map_bounds=map_bounds,
                recommended_zoom=recommended_zoom,
                search_metadata=SearchMetadata(
                    total_searched=len(candidates),
                    feasible_count=feasible_count,
                    execution_time=execution_time,
                    timestamp=datetime.utcnow().isoformat(),
                ),
                errors=errors if errors else None,
                destinations=destinations,  # Legacy compatibility
            )

            # Cache the final result
            await self.cache.set(
                self.cache.result_key(job_id), result.dict(), settings.cache_ttl_results
            )

            await self.update_progress(job_id, 100, "Search completed!", status="completed")

            logger.info(
                "Trip search completed",
                job_id=job_id,
                destinations=len(destinations),
                feasible=feasible_count,
                time=execution_time,
            )

            return result

        except Exception as e:
            logger.error("Trip search failed", job_id=job_id, error=str(e))
            await self.update_progress(job_id, 0, f"Search failed: {str(e)}", status="failed")
            raise

    async def _search_all_destinations(
        self, candidates: List[Dict[str, Any]], date_range: dict, errors: List[SearchError]
    ) -> List[Dict[str, Any]]:
        """Search all data for all candidate destinations in parallel."""
        tasks = []
        for candidate in candidates:
            city = candidate.get("city", "Unknown")
            tasks.append(self._search_single_destination(candidate, date_range, city, errors))

        # Execute all searches in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out None results and exceptions
        valid_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error("Destination search failed", error=str(result))
                continue
            if result is not None:
                valid_results.append(result)

        return valid_results

    async def _search_single_destination(
        self,
        candidate: Dict[str, Any],
        date_range: dict,
        city: str,
        errors: List[SearchError],
    ) -> Optional[Dict[str, Any]]:
        """Search all data types for a single destination."""
        try:
            # Check cache for each data type
            accommodation_key = self.cache.destination_key(city, "accommodation")
            food_key = self.cache.destination_key(city, "food")
            attractions_key = self.cache.destination_key(city, "attractions")

            # Try to get from cache
            cached_accommodation = await self.cache.get(accommodation_key)
            cached_food = await self.cache.get(food_key)
            cached_attractions = await self.cache.get(attractions_key)

            # Run parallel searches for non-cached data
            search_tasks = []
            if not cached_accommodation:
                search_tasks.append(("accommodation", self.parallel_api.search_accommodation(city, date_range)))
            if not cached_food:
                search_tasks.append(("food", self.parallel_api.search_food_costs(city)))
            if not cached_attractions:
                search_tasks.append(("attractions", self.parallel_api.search_attractions(city)))

            # Execute parallel searches
            if search_tasks:
                results = await asyncio.gather(*[task[1] for task in search_tasks])
                search_results = dict(zip([task[0] for task in search_tasks], results))
            else:
                search_results = {}

            # Combine cached and fresh results
            accommodation_data = cached_accommodation or search_results.get("accommodation")
            food_data = cached_food or search_results.get("food")
            attractions_data = cached_attractions or search_results.get("attractions")

            # Cache new results
            if not cached_accommodation and accommodation_data:
                await self.cache.set(
                    accommodation_key, accommodation_data.dict(), settings.cache_ttl_destination
                )
            if not cached_food and food_data:
                await self.cache.set(food_key, food_data.dict(), settings.cache_ttl_destination)
            if not cached_attractions and attractions_data:
                await self.cache.set(
                    attractions_key, attractions_data.dict(), settings.cache_ttl_destination
                )

            return {
                "flight": candidate,
                "accommodation": accommodation_data.dict() if hasattr(accommodation_data, 'dict') else accommodation_data,
                "food": food_data.dict() if hasattr(food_data, 'dict') else food_data,
                "attractions": attractions_data.dict() if hasattr(attractions_data, 'dict') else attractions_data,
            }

        except Exception as e:
            logger.error(f"Error searching destination {city}", error=str(e))
            errors.append(
                SearchError(city=city, reason=f"Search failed: {str(e)}", severity="warning")
            )
            return None

    async def _analyze_all_destinations(
        self,
        destination_data_list: List[Dict[str, Any]],
        budget: float,
        nights: int,
        days: int,
        errors: List[SearchError],
    ) -> List[Destination]:
        """Analyze all destinations with Claude in parallel."""
        tasks = []
        for data in destination_data_list:
            tasks.append(self._analyze_single_destination(data, budget, nights, days, errors))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out None results and exceptions
        destinations = []
        for result in results:
            if isinstance(result, Exception):
                logger.error("Destination analysis failed", error=str(result))
                continue
            if result is not None:
                destinations.append(result)

        return destinations

    async def _analyze_single_destination(
        self,
        destination_data: Dict[str, Any],
        budget: float,
        nights: int,
        days: int,
        errors: List[SearchError],
    ) -> Optional[Destination]:
        """Analyze a single destination with Claude."""
        city = destination_data.get("flight", {}).get("city", "Unknown")
        try:
            return await self.claude_agent.analyze_destination(
                destination_data, budget, nights, days
            )
        except Exception as e:
            logger.error(f"Error analyzing destination {city}", error=str(e))
            errors.append(
                SearchError(city=city, reason=f"Analysis failed: {str(e)}", severity="warning")
            )
            return None

    def _build_routes(self, hub: Hub, destinations: List[Destination]) -> List[Route]:
        """
        Convert destinations to route objects with geographic routing data.

        Args:
            hub: Origin hub information
            destinations: List of analyzed destinations

        Returns:
            List of Route objects with path data
        """
        routes = []

        for dest in destinations:
            # Get destination coordinates
            dest_coords = geo_service.get_coordinates(dest.airport)
            if not dest_coords:
                # Fallback: use coordinates from destination object
                dest_coords = Coordinates(lat=dest.coordinates[0], lng=dest.coordinates[1])

            # Calculate route path data
            distance = geo_service.haversine_distance(
                hub.coordinates.lat,
                hub.coordinates.lng,
                dest_coords.lat,
                dest_coords.lng,
            )

            duration = dest.details.flight_info.duration or geo_service.estimate_flight_duration(
                distance
            )

            route_path = RoutePathData(
                start=hub.coordinates,
                end=dest_coords,
                distance_km=round(distance, 2),
                flight_duration=duration,
            )

            # Create route object
            route = Route(
                destination_id=generate(size=8),  # Unique ID for frontend
                city=dest.city,
                country=dest.country,
                airport=dest.airport,
                coordinates=dest_coords,
                route_path=route_path,
                is_feasible=dest.is_feasible,
                total_cost=dest.total_cost,
                remaining_budget=dest.remaining_budget,
                confidence=dest.confidence,
                breakdown=dest.breakdown,
                details=dest.details,
                ai_insights=dest.ai_insights,
                savings_tips=dest.savings_tips,
                warnings=dest.warnings,
            )

            routes.append(route)

        # Sort routes: feasible first, then by cost
        routes.sort(key=lambda r: (not r.is_feasible, r.total_cost))

        return routes


# Global orchestrator instance
orchestrator = TripSearchOrchestrator()
