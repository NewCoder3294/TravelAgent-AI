"""Mock search service for testing without external APIs."""

from typing import List, Dict
from ..models import FlightResult, AccommodationResult, FoodCostResult, AttractionResult


# Global destinations across all continents
GLOBAL_DESTINATIONS = [
    # North America
    {"city": "New York", "airport": "JFK", "country": "USA", "continent": "North America", "lat": 40.6413, "lon": -73.7781},
    {"city": "Los Angeles", "airport": "LAX", "country": "USA", "continent": "North America", "lat": 33.9416, "lon": -118.4085},
    {"city": "Las Vegas", "airport": "LAS", "country": "USA", "continent": "North America", "lat": 36.0840, "lon": -115.1537},
    {"city": "Miami", "airport": "MIA", "country": "USA", "continent": "North America", "lat": 25.7959, "lon": -80.2870},
    {"city": "Chicago", "airport": "ORD", "country": "USA", "continent": "North America", "lat": 41.9742, "lon": -87.9073},
    {"city": "San Francisco", "airport": "SFO", "country": "USA", "continent": "North America", "lat": 37.6213, "lon": -122.3790},
    {"city": "Seattle", "airport": "SEA", "country": "USA", "continent": "North America", "lat": 47.4502, "lon": -122.3088},
    {"city": "Boston", "airport": "BOS", "country": "USA", "continent": "North America", "lat": 42.3656, "lon": -71.0096},
    {"city": "Toronto", "airport": "YYZ", "country": "Canada", "continent": "North America", "lat": 43.6777, "lon": -79.6248},
    {"city": "Vancouver", "airport": "YVR", "country": "Canada", "continent": "North America", "lat": 49.1939, "lon": -123.1844},
    {"city": "Mexico City", "airport": "MEX", "country": "Mexico", "continent": "North America", "lat": 19.4363, "lon": -99.0721},
    {"city": "Cancun", "airport": "CUN", "country": "Mexico", "continent": "North America", "lat": 21.0365, "lon": -86.8771},
    {"city": "Havana", "airport": "HAV", "country": "Cuba", "continent": "North America", "lat": 22.9892, "lon": -82.4091},

    # South America
    {"city": "Rio de Janeiro", "airport": "GIG", "country": "Brazil", "continent": "South America", "lat": -22.8099, "lon": -43.2505},
    {"city": "Sao Paulo", "airport": "GRU", "country": "Brazil", "continent": "South America", "lat": -23.4356, "lon": -46.4731},
    {"city": "Buenos Aires", "airport": "EZE", "country": "Argentina", "continent": "South America", "lat": -34.8222, "lon": -58.5358},
    {"city": "Lima", "airport": "LIM", "country": "Peru", "continent": "South America", "lat": -12.0219, "lon": -77.1143},
    {"city": "Bogota", "airport": "BOG", "country": "Colombia", "continent": "South America", "lat": 4.7016, "lon": -74.1469},
    {"city": "Santiago", "airport": "SCL", "country": "Chile", "continent": "South America", "lat": -33.3930, "lon": -70.7858},
    {"city": "Cartagena", "airport": "CTG", "country": "Colombia", "continent": "South America", "lat": 10.4424, "lon": -75.5130},
    {"city": "Quito", "airport": "UIO", "country": "Ecuador", "continent": "South America", "lat": -0.1292, "lon": -78.3575},

    # Europe
    {"city": "London", "airport": "LHR", "country": "UK", "continent": "Europe", "lat": 51.4700, "lon": -0.4543},
    {"city": "Paris", "airport": "CDG", "country": "France", "continent": "Europe", "lat": 49.0097, "lon": 2.5479},
    {"city": "Rome", "airport": "FCO", "country": "Italy", "continent": "Europe", "lat": 41.8003, "lon": 12.2389},
    {"city": "Barcelona", "airport": "BCN", "country": "Spain", "continent": "Europe", "lat": 41.2974, "lon": 2.0833},
    {"city": "Madrid", "airport": "MAD", "country": "Spain", "continent": "Europe", "lat": 40.4983, "lon": -3.5676},
    {"city": "Amsterdam", "airport": "AMS", "country": "Netherlands", "continent": "Europe", "lat": 52.3105, "lon": 4.7683},
    {"city": "Berlin", "airport": "BER", "country": "Germany", "continent": "Europe", "lat": 52.3667, "lon": 13.5033},
    {"city": "Munich", "airport": "MUC", "country": "Germany", "continent": "Europe", "lat": 48.3538, "lon": 11.7750},
    {"city": "Prague", "airport": "PRG", "country": "Czech Republic", "continent": "Europe", "lat": 50.1008, "lon": 14.2632},
    {"city": "Vienna", "airport": "VIE", "country": "Austria", "continent": "Europe", "lat": 48.1103, "lon": 16.5697},
    {"city": "Lisbon", "airport": "LIS", "country": "Portugal", "continent": "Europe", "lat": 38.7742, "lon": -9.1342},
    {"city": "Athens", "airport": "ATH", "country": "Greece", "continent": "Europe", "lat": 37.9364, "lon": 23.9445},
    {"city": "Istanbul", "airport": "IST", "country": "Turkey", "continent": "Europe", "lat": 41.2753, "lon": 28.7519},
    {"city": "Dublin", "airport": "DUB", "country": "Ireland", "continent": "Europe", "lat": 53.4213, "lon": -6.2701},
    {"city": "Copenhagen", "airport": "CPH", "country": "Denmark", "continent": "Europe", "lat": 55.6180, "lon": 12.6560},
    {"city": "Stockholm", "airport": "ARN", "country": "Sweden", "continent": "Europe", "lat": 59.6519, "lon": 17.9186},
    {"city": "Oslo", "airport": "OSL", "country": "Norway", "continent": "Europe", "lat": 60.1939, "lon": 11.1004},
    {"city": "Reykjavik", "airport": "KEF", "country": "Iceland", "continent": "Europe", "lat": 63.9850, "lon": -22.6056},

    # Asia
    {"city": "Tokyo", "airport": "NRT", "country": "Japan", "continent": "Asia", "lat": 35.7720, "lon": 140.3929},
    {"city": "Seoul", "airport": "ICN", "country": "South Korea", "continent": "Asia", "lat": 37.4602, "lon": 126.4407},
    {"city": "Bangkok", "airport": "BKK", "country": "Thailand", "continent": "Asia", "lat": 13.6900, "lon": 100.7501},
    {"city": "Singapore", "airport": "SIN", "country": "Singapore", "continent": "Asia", "lat": 1.3644, "lon": 103.9915},
    {"city": "Hong Kong", "airport": "HKG", "country": "Hong Kong", "continent": "Asia", "lat": 22.3080, "lon": 113.9185},
    {"city": "Shanghai", "airport": "PVG", "country": "China", "continent": "Asia", "lat": 31.1443, "lon": 121.8083},
    {"city": "Beijing", "airport": "PEK", "country": "China", "continent": "Asia", "lat": 40.0799, "lon": 116.6031},
    {"city": "Dubai", "airport": "DXB", "country": "UAE", "continent": "Asia", "lat": 25.2532, "lon": 55.3657},
    {"city": "Mumbai", "airport": "BOM", "country": "India", "continent": "Asia", "lat": 19.0896, "lon": 72.8656},
    {"city": "Delhi", "airport": "DEL", "country": "India", "continent": "Asia", "lat": 28.5562, "lon": 77.1000},
    {"city": "Bali", "airport": "DPS", "country": "Indonesia", "continent": "Asia", "lat": -8.7467, "lon": 115.1667},
    {"city": "Phuket", "airport": "HKT", "country": "Thailand", "continent": "Asia", "lat": 8.1132, "lon": 98.3169},
    {"city": "Manila", "airport": "MNL", "country": "Philippines", "continent": "Asia", "lat": 14.5086, "lon": 121.0194},
    {"city": "Hanoi", "airport": "HAN", "country": "Vietnam", "continent": "Asia", "lat": 21.2212, "lon": 105.8072},
    {"city": "Ho Chi Minh", "airport": "SGN", "country": "Vietnam", "continent": "Asia", "lat": 10.8188, "lon": 106.6520},
    {"city": "Kuala Lumpur", "airport": "KUL", "country": "Malaysia", "continent": "Asia", "lat": 2.7456, "lon": 101.7072},
    {"city": "Tel Aviv", "airport": "TLV", "country": "Israel", "continent": "Asia", "lat": 32.0114, "lon": 34.8867},

    # Africa
    {"city": "Cairo", "airport": "CAI", "country": "Egypt", "continent": "Africa", "lat": 30.1219, "lon": 31.4056},
    {"city": "Marrakech", "airport": "RAK", "country": "Morocco", "continent": "Africa", "lat": 31.6069, "lon": -8.0363},
    {"city": "Cape Town", "airport": "CPT", "country": "South Africa", "continent": "Africa", "lat": -33.9715, "lon": 18.6021},
    {"city": "Johannesburg", "airport": "JNB", "country": "South Africa", "continent": "Africa", "lat": -26.1392, "lon": 28.2460},
    {"city": "Nairobi", "airport": "NBO", "country": "Kenya", "continent": "Africa", "lat": -1.3192, "lon": 36.9278},
    {"city": "Casablanca", "airport": "CMN", "country": "Morocco", "continent": "Africa", "lat": 33.3676, "lon": -7.5898},
    {"city": "Lagos", "airport": "LOS", "country": "Nigeria", "continent": "Africa", "lat": 6.5774, "lon": 3.3213},
    {"city": "Accra", "airport": "ACC", "country": "Ghana", "continent": "Africa", "lat": 5.6052, "lon": -0.1668},
    {"city": "Addis Ababa", "airport": "ADD", "country": "Ethiopia", "continent": "Africa", "lat": 8.9806, "lon": 38.7992},

    # Oceania
    {"city": "Sydney", "airport": "SYD", "country": "Australia", "continent": "Oceania", "lat": -33.9461, "lon": 151.1772},
    {"city": "Melbourne", "airport": "MEL", "country": "Australia", "continent": "Oceania", "lat": -37.6690, "lon": 144.8410},
    {"city": "Brisbane", "airport": "BNE", "country": "Australia", "continent": "Oceania", "lat": -27.3942, "lon": 153.1218},
    {"city": "Auckland", "airport": "AKL", "country": "New Zealand", "continent": "Oceania", "lat": -37.0082, "lon": 174.7850},
    {"city": "Perth", "airport": "PER", "country": "Australia", "continent": "Oceania", "lat": -31.9403, "lon": 115.9672},
    {"city": "Fiji", "airport": "NAN", "country": "Fiji", "continent": "Oceania", "lat": -17.7554, "lon": 177.4493},
]

# Price multipliers based on distance/region from US origins
PRICE_MULTIPLIERS = {
    "North America": {"base": 150, "multiplier": 1.0},
    "South America": {"base": 400, "multiplier": 1.3},
    "Europe": {"base": 600, "multiplier": 1.5},
    "Asia": {"base": 700, "multiplier": 1.7},
    "Africa": {"base": 800, "multiplier": 1.6},
    "Oceania": {"base": 900, "multiplier": 1.8},
}

def calculate_flight_price(origin: str, destination: dict) -> float:
    """Calculate realistic flight price based on origin and destination."""
    import random

    continent = destination["continent"]
    pricing = PRICE_MULTIPLIERS[continent]

    # Add some randomness for realism
    base_price = pricing["base"] + random.randint(-100, 200)

    # Adjust based on destination popularity
    if destination["city"] in ["Paris", "London", "Tokyo", "Dubai", "Sydney"]:
        base_price *= 1.1  # Popular destinations slightly more expensive

    return round(base_price, 2)

# Mock accommodation pricing
MOCK_ACCOMMODATION = {
    "Las Vegas": {"avg": 110.0, "min": 60.0, "max": 200.0},
    "Phoenix": {"avg": 95.0, "min": 65.0, "max": 150.0},
    "Seattle": {"avg": 180.0, "min": 120.0, "max": 300.0},
    "Denver": {"avg": 140.0, "min": 90.0, "max": 220.0},
    "Portland": {"avg": 150.0, "min": 100.0, "max": 250.0},
    "Austin": {"avg": 130.0, "min": 85.0, "max": 200.0},
    "Tijuana": {"avg": 60.0, "min": 30.0, "max": 100.0},
    "Salt Lake City": {"avg": 120.0, "min": 80.0, "max": 180.0},
    "San Francisco": {"avg": 220.0, "min": 150.0, "max": 400.0},
    "New York": {"avg": 250.0, "min": 180.0, "max": 500.0},
    "Chicago": {"avg": 160.0, "min": 110.0, "max": 280.0},
    "Miami": {"avg": 170.0, "min": 120.0, "max": 300.0},
}

# Mock food costs
MOCK_FOOD = {
    "Las Vegas": 65.0,
    "Phoenix": 55.0,
    "Seattle": 85.0,
    "Denver": 70.0,
    "Portland": 75.0,
    "Austin": 60.0,
    "Tijuana": 40.0,
    "Salt Lake City": 60.0,
    "San Francisco": 95.0,
    "New York": 100.0,
    "Chicago": 80.0,
    "Miami": 75.0,
}


class MockSearchService:
    """Mock search service for testing."""

    async def search_flights(self, origin: str, date_range: Dict[str, str], max_results: int = 50) -> List[Dict]:
        """Return mock flight results from global destinations."""
        import random

        # Get up to max_results random destinations
        destinations = random.sample(GLOBAL_DESTINATIONS, min(len(GLOBAL_DESTINATIONS), max_results))

        # Return as search results format
        results = []
        for dest in destinations:
            price = calculate_flight_price(origin, dest)
            results.append({
                "title": f"Flight to {dest['city']}",
                "content": f"Round trip flight from {origin} to {dest['airport']} - ${price}. {dest['city']}, {dest['country']}. Airlines: Multiple carriers available. {dest['continent']}. Coordinates: {dest['lat']}, {dest['lon']}.",
                "url": f"https://flights.example.com/{dest['airport']}",
            })
        return results

    async def search_accommodation(self, city: str, date_range: Dict[str, str]) -> AccommodationResult:
        """Return mock accommodation data with specific hotel names."""
        import random

        pricing = MOCK_ACCOMMODATION.get(city, {"avg": 100.0, "min": 60.0, "max": 150.0})

        # Generate specific hotel names based on city
        hotel_types = ["Grand Hotel", "Plaza Hotel", "Boutique Inn", "City Lodge", "Luxury Resort", "Budget Hostel", "Downtown Apartments"]
        specific_hotels = []

        # Budget option
        budget_name = f"{random.choice(['Cozy', 'Budget', 'Smart'])} {random.choice(['Hostel', 'Lodge', 'Inn'])}"
        specific_hotels.append({
            "name": f"{budget_name} {city}",
            "type": "hostel",
            "price_per_night": pricing["min"],
            "rating": round(random.uniform(3.8, 4.3), 1),
            "amenities": ["WiFi", "Shared Kitchen", "Common Areas"]
        })

        # Mid-range option
        midrange_name = f"{random.choice(['City', 'Central', 'Metropolitan'])} {random.choice(['Hotel', 'Inn', 'Suites'])}"
        specific_hotels.append({
            "name": f"{midrange_name} {city}",
            "type": "hotel",
            "price_per_night": pricing["avg"],
            "rating": round(random.uniform(4.2, 4.6), 1),
            "amenities": ["WiFi", "Breakfast", "Gym", "Restaurant"]
        })

        # Luxury option
        luxury_name = f"{random.choice(['Grand', 'Royal', 'Imperial'])} {random.choice(['Hotel', 'Resort', 'Palace'])}"
        specific_hotels.append({
            "name": f"{luxury_name} {city}",
            "type": "resort",
            "price_per_night": pricing["max"],
            "rating": round(random.uniform(4.6, 4.9), 1),
            "amenities": ["WiFi", "Spa", "Pool", "Fine Dining", "Concierge", "Gym"]
        })

        # Convert to strings or detailed format
        options_detailed = [
            f"{hotel['name']} - {hotel['type'].title()} - ${hotel['price_per_night']:.0f}/night - ⭐{hotel['rating']} - {', '.join(hotel['amenities'][:3])}"
            for hotel in specific_hotels
        ]

        return AccommodationResult(
            city=city,
            avg_nightly_rate=pricing["avg"],
            range={"min": pricing["min"], "max": pricing["max"]},
            options=options_detailed,
            source="mock_data"
        )

    async def search_food_costs(self, city: str) -> FoodCostResult:
        """Return mock food cost data."""
        daily_cost = MOCK_FOOD.get(city, 70.0)

        price_level = "budget" if daily_cost < 60 else ("moderate" if daily_cost < 90 else "expensive")

        return FoodCostResult(
            city=city,
            avg_daily_budget=daily_cost,
            price_level=price_level,
            sources=["Mock Data", "Test Source"],
            confidence="high"
        )

    async def search_attractions(self, city: str) -> AttractionResult:
        """Return mock attraction data with specific names and prices."""
        import random

        # Generic free attractions
        free_base = [
            f"{city} Central Park",
            f"{city} Historic District",
            f"{city} Waterfront Walk",
            f"{city} City Museum (Free Days)",
            f"{city} Public Gardens",
            "Local Markets and Bazaars"
        ]

        # Generic paid attractions with varied types
        attraction_templates = [
            {"type": "museum", "names": ["National Museum", "Art Gallery", "History Museum", "Science Center"]},
            {"type": "landmark", "names": ["City Tower", "Historic Palace", "Cathedral", "Famous Square"]},
            {"type": "tour", "names": ["City Walking Tour", "Boat Tour", "Food Tour", "Bike Tour"]},
            {"type": "entertainment", "names": ["Theater Show", "Concert Hall", "Opera House", "Live Performance"]},
            {"type": "activity", "names": ["Adventure Park", "Zoo", "Aquarium", "Theme Park"]},
        ]

        paid = []
        for template in random.sample(attraction_templates, min(4, len(attraction_templates))):
            name = f"{city} {random.choice(template['names'])}"
            base_cost = {
                "museum": random.randint(15, 35),
                "landmark": random.randint(20, 50),
                "tour": random.randint(25, 75),
                "entertainment": random.randint(40, 120),
                "activity": random.randint(30, 80),
            }[template["type"]]

            paid.append({
                "name": name,
                "cost": float(base_cost),
                "type": template["type"],
                "description": f"Visit the famous {name}",
                "duration": f"{random.choice(['2-3', '3-4', '1-2', '4-5'])} hours",
                "rating": round(random.uniform(4.0, 4.8), 1)
            })

        # Select random free attractions
        free_selected = random.sample(free_base, min(4, len(free_base)))

        return AttractionResult(
            city=city,
            free_attractions=free_selected,
            paid_attractions=paid,
            estimated_activity_cost=sum(a["cost"] for a in paid) * 0.6  # Assume visit 60% of attractions
        )


# Global instance
mock_search = MockSearchService()
