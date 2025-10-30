"""Service for interacting with Parallel API for search operations."""

import asyncio
import httpx
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import structlog

from ..config import settings
from ..models import (
    FlightResult,
    AccommodationResult,
    FoodCostResult,
    AttractionResult,
)
from .mock_search import mock_search

logger = structlog.get_logger()


class ParallelAPIService:
    """Service for parallel web searches using Parallel API."""

    def __init__(self):
        self.api_key = settings.parallel_api_key
        self.base_url = settings.parallel_api_base_url
        self.test_mode = settings.test_mode
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        if self.test_mode:
            logger.info("🧪 Running in TEST MODE - using mock data")

    async def _search(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        """
        Perform a search using Parallel API.

        Args:
            query: Search query string
            num_results: Number of results to return

        Returns:
            List of search results
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/search",
                    headers=self.headers,
                    json={
                        "query": query,
                        "num_results": num_results,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])

            except httpx.HTTPError as e:
                logger.error(f"Parallel API search error", query=query, error=str(e))
                return []

    async def search_flights(
        self, origin: str, date_range: Dict[str, str], max_results: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search for flight options from origin.

        Args:
            origin: Origin airport code (e.g., 'SAN')
            date_range: Dict with 'start' and 'end' dates
            max_results: Maximum number of flight results

        Returns:
            List of raw search results (dicts)
        """
        logger.info(
            "Searching flights",
            origin=origin,
            dates=f"{date_range['start']} to {date_range['end']}",
        )

        # Use mock data in test mode
        if self.test_mode:
            results = await mock_search.search_flights(origin, date_range, max_results)
        else:
            start_date = date_range["start"]
            end_date = date_range["end"]
            query = f"cheapest flights from {origin} departing {start_date} returning {end_date} round trip destinations prices"
            results = await self._search(query, num_results=max_results)

        logger.info(f"Found {len(results)} flight options")
        return results


    async def search_accommodation(self, city: str, date_range: Dict[str, str]) -> AccommodationResult:
        """
        Search for accommodation prices in a city.

        Args:
            city: City name
            date_range: Dict with 'start' and 'end' dates

        Returns:
            AccommodationResult object
        """
        logger.info("Searching accommodation", city=city)

        # Use mock data in test mode
        if self.test_mode:
            return await mock_search.search_accommodation(city, date_range)

        start_date = date_range["start"]
        end_date = date_range["end"]
        query = f"average hotel prices {city} {start_date} to {end_date} accommodation budget mid-range"
        results = await self._search(query, num_results=10)

        # Parse results - needs LLM to extract structured pricing data
        return AccommodationResult(
            city=city,
            avg_nightly_rate=0.0,
            range={"min": 0.0, "max": 0.0},
            options=[],
            source="parallel_api",
        )

    async def search_food_costs(self, city: str) -> FoodCostResult:
        """
        Search for average food costs in a city.

        Args:
            city: City name

        Returns:
            FoodCostResult object
        """
        logger.info("Searching food costs", city=city)

        # Use mock data in test mode
        if self.test_mode:
            return await mock_search.search_food_costs(city)

        query = f"average daily food cost {city} budget meals restaurants price per day"
        results = await self._search(query, num_results=8)

        # Parse results - will use Claude to extract structured data
        return FoodCostResult(
            city=city,
            avg_daily_budget=0.0,
            price_level="moderate",
            sources=[r.get("url", "") for r in results[:3]],
            confidence="medium",
        )

    async def search_attractions(self, city: str) -> AttractionResult:
        """
        Search for attractions and activities in a city.

        Args:
            city: City name

        Returns:
            AttractionResult object
        """
        logger.info("Searching attractions", city=city)

        # Use mock data in test mode
        if self.test_mode:
            return await mock_search.search_attractions(city)

        # Search for both free and paid attractions
        free_query = f"free attractions things to do {city} no cost activities"
        paid_query = f"top attractions {city} prices admission cost"

        # Run searches in parallel
        free_results, paid_results = await asyncio.gather(
            self._search(free_query, num_results=10),
            self._search(paid_query, num_results=10),
        )

        # Parse results - will use Claude to extract structured data
        return AttractionResult(
            city=city,
            free_attractions=[],
            paid_attractions=[],
            estimated_activity_cost=0.0,
        )

    async def search_all_for_destination(
        self, city: str, date_range: Dict[str, str]
    ) -> Tuple[AccommodationResult, FoodCostResult, AttractionResult]:
        """
        Search all data types for a destination in parallel.

        Args:
            city: City name
            date_range: Date range for the trip

        Returns:
            Tuple of (accommodation, food, attractions) results
        """
        logger.info(f"Running parallel searches for {city}")

        # Execute all searches in parallel
        accommodation, food, attractions = await asyncio.gather(
            self.search_accommodation(city, date_range),
            self.search_food_costs(city),
            self.search_attractions(city),
            return_exceptions=True,  # Don't fail entire batch if one fails
        )

        # Handle exceptions
        if isinstance(accommodation, Exception):
            logger.error(f"Accommodation search failed for {city}", error=str(accommodation))
            accommodation = AccommodationResult(
                city=city,
                avg_nightly_rate=0.0,
                range={"min": 0.0, "max": 0.0},
                options=[],
                source="error",
            )

        if isinstance(food, Exception):
            logger.error(f"Food search failed for {city}", error=str(food))
            food = FoodCostResult(
                city=city,
                avg_daily_budget=0.0,
                price_level="moderate",
                sources=[],
                confidence="low",
            )

        if isinstance(attractions, Exception):
            logger.error(f"Attraction search failed for {city}", error=str(attractions))
            attractions = AttractionResult(
                city=city,
                free_attractions=[],
                paid_attractions=[],
                estimated_activity_cost=0.0,
            )

        return accommodation, food, attractions


# Global service instance
parallel_api = ParallelAPIService()
