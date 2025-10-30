"""Claude AI agent service for intelligent trip analysis."""

import json
from typing import List, Dict, Any, Optional
import anthropic
import structlog

from ..config import settings
from ..models import (
    Destination,
    DestinationData,
    CostBreakdown,
    DestinationDetails,
    FlightInfo,
    AccommodationInfo,
    FoodInfo,
    AttractionInfo,
)
import re

logger = structlog.get_logger()


class ClaudeAgent:
    """AI agent powered by Claude for trip planning and analysis."""

    def __init__(self):
        self.test_mode = settings.test_mode
        if not self.test_mode:
            self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.claude_model

    def _create_tools(self) -> List[Dict[str, Any]]:
        """Define tools for Claude to use."""
        return [
            {
                "name": "calculate_trip_cost",
                "description": "Calculates total trip cost with detailed breakdown",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "flight_cost": {"type": "number", "description": "Flight cost"},
                        "nightly_rate": {"type": "number", "description": "Average nightly hotel rate"},
                        "nights": {"type": "integer", "description": "Number of nights"},
                        "daily_food_cost": {"type": "number", "description": "Average daily food cost"},
                        "days": {"type": "integer", "description": "Number of days"},
                        "attraction_costs": {
                            "type": "array",
                            "items": {"type": "number"},
                            "description": "List of attraction costs",
                        },
                    },
                    "required": [
                        "flight_cost",
                        "nightly_rate",
                        "nights",
                        "daily_food_cost",
                        "days",
                    ],
                },
            },
            {
                "name": "assess_feasibility",
                "description": "Determines if destination fits within budget constraints",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "total_cost": {"type": "number", "description": "Total calculated cost"},
                        "budget": {"type": "number", "description": "User's total budget"},
                        "buffer_percentage": {
                            "type": "number",
                            "description": "Buffer percentage for safety (default 10%)",
                            "default": 10,
                        },
                    },
                    "required": ["total_cost", "budget"],
                },
            },
            {
                "name": "extract_prices_from_text",
                "description": "Extract pricing information from search result text",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "Text containing price information"},
                        "price_type": {
                            "type": "string",
                            "enum": ["flight", "hotel", "food", "attraction"],
                            "description": "Type of price to extract",
                        },
                    },
                    "required": ["text", "price_type"],
                },
            },
        ]

    async def parse_search_results(
        self, search_results: List[Dict[str, Any]], result_type: str
    ) -> Dict[str, Any]:
        """
        Use Claude to parse and extract structured data from search results.

        Args:
            search_results: Raw search results from Parallel API
            result_type: Type of results ('flight', 'accommodation', 'food', 'attractions')

        Returns:
            Structured data extracted from search results
        """
        # In test mode, just parse the mock data directly
        if self.test_mode and result_type == "flight":
            destinations = []
            for result in search_results:
                # Extract data from mock format
                content = result.get('content', '')
                # Parse: "Round trip flight from SAN to LAS - $89. Las Vegas, USA. ... Coordinates: lat, lon."
                # First get the main flight info
                match = re.search(r'to (\w+) - \$([0-9.]+)\. ([^,]+), ([^.]+)', content)
                # Then get coordinates - use \d instead of [0-9.] to avoid capturing trailing period
                coord_match = re.search(r'Coordinates:\s*([-]?\d+\.?\d*),\s*([-]?\d+\.?\d*)', content)

                if match:
                    airport, price, city, country = match.groups()
                    dest_data = {
                        "city": city.strip(),
                        "airport": airport.strip(),
                        "country": country.strip(),
                        "price": float(price),
                    }

                    # Add coordinates if found
                    if coord_match:
                        lat, lon = coord_match.groups()
                        dest_data["coordinates"] = (float(lat), float(lon))
                    else:
                        dest_data["coordinates"] = (0.0, 0.0)

                    destinations.append(dest_data)
            return {"destinations": destinations}

        # Create a prompt for Claude to extract structured data
        results_text = "\n\n".join(
            [
                f"Source {i+1}:\nTitle: {r.get('title', '')}\nContent: {r.get('content', '')}\nURL: {r.get('url', '')}"
                for i, r in enumerate(search_results[:10])
            ]
        )

        if result_type == "flight":
            prompt = f"""Analyze these search results about flights and extract pricing and destination information.

Search Results:
{results_text}

Extract and return JSON with this structure:
{{
  "destinations": [
    {{
      "city": "City Name",
      "country": "Country",
      "airport": "XXX",
      "price": 150.00,
      "airline": "Airline name if available",
      "duration": "Duration if available"
    }}
  ]
}}

Only include destinations with clear pricing. Be conservative with estimates."""

        elif result_type == "accommodation":
            prompt = f"""Analyze these search results about hotel/accommodation prices and extract pricing information.

Search Results:
{results_text}

Extract and return JSON with:
{{
  "avg_nightly_rate": 100.00,
  "min_price": 60.00,
  "max_price": 200.00,
  "options": ["Description of budget option", "Description of mid-range option"]
}}"""

        elif result_type == "food":
            prompt = f"""Analyze these search results about daily food costs and extract pricing information.

Search Results:
{results_text}

Extract and return JSON with:
{{
  "avg_daily_budget": 50.00,
  "price_level": "budget|moderate|expensive",
  "confidence": "high|medium|low"
}}"""

        elif result_type == "attractions":
            prompt = f"""Analyze these search results about attractions and activities and extract information.

Search Results:
{results_text}

Extract and return JSON with:
{{
  "free_attractions": ["Attraction 1", "Attraction 2"],
  "paid_attractions": [
    {{"name": "Attraction", "cost": 25.00}}
  ],
  "estimated_activity_cost": 75.00
}}"""

        else:
            raise ValueError(f"Unknown result type: {result_type}")

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract JSON from response
            response_text = message.content[0].text
            # Find JSON in response (handle cases where Claude adds explanation)
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                logger.warning(f"No JSON found in Claude response for {result_type}")
                return {}

        except Exception as e:
            logger.error(f"Error parsing {result_type} with Claude", error=str(e))
            return {}

    async def filter_flight_candidates(
        self, flight_results: List[Dict[str, Any]], budget: float
    ) -> List[Dict[str, Any]]:
        """
        Use Claude to intelligently filter and rank flight options.

        Args:
            flight_results: List of flight results
            budget: Total trip budget

        Returns:
            Filtered and ranked list of candidate destinations
        """
        max_flight_budget = budget * settings.flight_budget_threshold

        # In test mode, use simple filtering
        if self.test_mode:
            filtered = [
                {
                    "city": f.get("city"),
                    "airport": f.get("airport"),
                    "price": f.get("price"),
                    "country": f.get("country", "USA"),
                    "reasoning": f"Within budget at ${f.get('price'):.2f}"
                }
                for f in flight_results
                if f.get("price", float('inf')) < max_flight_budget
            ]
            # Sort by price and return top destinations
            return sorted(filtered, key=lambda x: x["price"])[:settings.max_destinations_to_analyze]

        prompt = f"""Given a total trip budget of ${budget:.2f}, analyze these flight options and select the best candidates.

Flight Options:
{json.dumps(flight_results, indent=2)}

Rules:
1. Flight cost should be less than ${max_flight_budget:.2f} (60% of total budget)
2. Prioritize good value destinations (lower cost, interesting locations)
3. Return maximum {settings.max_destinations_to_analyze} destinations

Return JSON array with selected destinations and brief reasoning:
[
  {{
    "city": "City Name",
    "airport": "XXX",
    "price": 150.00,
    "reasoning": "Why this is a good option"
  }}
]"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text
            start_idx = response_text.find("[")
            end_idx = response_text.rfind("]") + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                return []

        except Exception as e:
            logger.error("Error filtering flights with Claude", error=str(e))
            # Fallback: simple price-based filtering
            return sorted(
                [f for f in flight_results if f.get("price", float("inf")) < max_flight_budget],
                key=lambda x: x.get("price", 0),
            )[: settings.max_destinations_to_analyze]

    async def analyze_destination(
        self,
        destination_data: Dict[str, Any],
        budget: float,
        nights: int,
        days: int,
    ) -> Destination:
        """
        Analyze a destination and create a complete Destination object with insights.

        Args:
            destination_data: Combined data for the destination
            budget: Total budget
            nights: Number of nights
            days: Number of days

        Returns:
            Complete Destination object with AI insights
        """
        # Extract data
        flight_data = destination_data.get("flight", {})
        accommodation_data = destination_data.get("accommodation", {})
        food_data = destination_data.get("food", {})
        attraction_data = destination_data.get("attractions", {})

        # In test mode, use simple calculation
        if self.test_mode:
            flight_cost = flight_data.get("price", 0.0)
            hotel_cost = accommodation_data.get("avg_nightly_rate", 0.0) * nights
            food_cost = food_data.get("avg_daily_budget", 0.0) * days
            attraction_cost = attraction_data.get("estimated_activity_cost", 0.0)

            total_cost = flight_cost + hotel_cost + food_cost + attraction_cost
            is_feasible = total_cost <= budget

            return Destination(
                city=flight_data.get("city", "Unknown"),
                country=flight_data.get("country", "Unknown"),
                airport=flight_data.get("airport", "XXX"),
                coordinates=flight_data.get("coordinates", (0.0, 0.0)),
                is_feasible=is_feasible,
                total_cost=total_cost,
                remaining_budget=budget - total_cost,
                confidence="high",
                breakdown=CostBreakdown(
                    flight=flight_cost,
                    accommodation=hotel_cost,
                    food=food_cost,
                    attractions=attraction_cost,
                ),
                details=DestinationDetails(
                    flight_info=FlightInfo(
                        price=flight_cost,
                        airline=flight_data.get("airline"),
                        duration=flight_data.get("duration"),
                    ),
                    accommodation_info=AccommodationInfo(
                        avg_nightly_rate=accommodation_data.get("avg_nightly_rate", 0.0),
                        total_nights=nights,
                        range=accommodation_data.get("range", {"min": 0, "max": 0}),
                        options=accommodation_data.get("options", []),
                    ),
                    food_info=FoodInfo(
                        avg_daily_budget=food_data.get("avg_daily_budget", 0.0),
                        total_days=days,
                        price_level=food_data.get("price_level", "moderate"),
                    ),
                    attraction_info=AttractionInfo(
                        free_attractions=attraction_data.get("free_attractions", []),
                        paid_attractions=attraction_data.get("paid_attractions", []),
                        estimated_activity_cost=attraction_cost,
                    ),
                ),
                ai_insights=f"{flight_data.get('city')} offers great value with a total cost of ${total_cost:.2f}. {'This destination fits comfortably within your budget.' if is_feasible else 'This destination exceeds your budget.'}",
                savings_tips=[
                    "Book accommodations in advance for better rates",
                    "Look for free walking tours",
                    "Use public transportation instead of taxis",
                ],
                warnings=None if is_feasible else ["Budget exceeded"],
            )

        prompt = f"""Analyze this destination for a trip and provide detailed cost breakdown and insights.

Budget: ${budget:.2f}
Duration: {nights} nights, {days} days

Destination Data:
{json.dumps(destination_data, indent=2)}

Calculate:
1. Total cost = flight + (hotel × nights) + (food × days) + attractions
2. Whether it's feasible within budget
3. Money-saving tips specific to this destination
4. Any warnings or concerns

Return JSON with:
{{
  "total_cost": 1000.00,
  "is_feasible": true,
  "confidence": "high|medium|low",
  "breakdown": {{
    "flight": 150.00,
    "accommodation": 500.00,
    "food": 300.00,
    "attractions": 50.00
  }},
  "ai_insights": "Brief analysis of this destination as a trip option",
  "savings_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "warnings": ["Warning if any"]
}}"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                tools=self._create_tools(),
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                analysis = json.loads(json_str)

                # Build Destination object
                flight_data = destination_data.get("flight", {})
                accommodation_data = destination_data.get("accommodation", {})
                food_data = destination_data.get("food", {})
                attraction_data = destination_data.get("attractions", {})

                breakdown = analysis.get("breakdown", {})

                return Destination(
                    city=flight_data.get("city", "Unknown"),
                    country=flight_data.get("country", "Unknown"),
                    airport=flight_data.get("airport", "XXX"),
                    coordinates=flight_data.get("coordinates", (0.0, 0.0)),
                    is_feasible=analysis.get("is_feasible", False),
                    total_cost=analysis.get("total_cost", 0.0),
                    remaining_budget=budget - analysis.get("total_cost", 0.0),
                    confidence=analysis.get("confidence", "medium"),
                    breakdown=CostBreakdown(**breakdown),
                    details=DestinationDetails(
                        flight_info=FlightInfo(
                            price=breakdown.get("flight", 0.0),
                            airline=flight_data.get("airline"),
                            duration=flight_data.get("duration"),
                        ),
                        accommodation_info=AccommodationInfo(
                            avg_nightly_rate=accommodation_data.get("avg_nightly_rate", 0.0),
                            total_nights=nights,
                            range=accommodation_data.get("range", {"min": 0, "max": 0}),
                            options=accommodation_data.get("options", []),
                        ),
                        food_info=FoodInfo(
                            avg_daily_budget=food_data.get("avg_daily_budget", 0.0),
                            total_days=days,
                            price_level=food_data.get("price_level", "moderate"),
                        ),
                        attraction_info=AttractionInfo(
                            free_attractions=attraction_data.get("free_attractions", []),
                            paid_attractions=attraction_data.get("paid_attractions", []),
                            estimated_activity_cost=attraction_data.get(
                                "estimated_activity_cost", 0.0
                            ),
                        ),
                    ),
                    ai_insights=analysis.get("ai_insights", ""),
                    savings_tips=analysis.get("savings_tips", []),
                    warnings=analysis.get("warnings"),
                )

        except Exception as e:
            logger.error("Error analyzing destination with Claude", error=str(e))
            # Return a fallback destination object
            raise


# Global agent instance
claude_agent = ClaudeAgent()
