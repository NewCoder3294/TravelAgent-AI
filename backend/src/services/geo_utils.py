"""Geographic utilities for route visualization and mapping."""

import math
from typing import Optional, Tuple
from ..models import Coordinates, MapBounds


# Major airport coordinates database (expand as needed)
AIRPORT_COORDINATES = {
    # US Major Airports
    "SAN": {"lat": 32.7338, "lng": -117.1933, "city": "San Diego", "country": "USA"},
    "LAX": {"lat": 33.9416, "lng": -118.4085, "city": "Los Angeles", "country": "USA"},
    "SFO": {"lat": 37.6213, "lng": -122.3790, "city": "San Francisco", "country": "USA"},
    "SEA": {"lat": 47.4502, "lng": -122.3088, "city": "Seattle", "country": "USA"},
    "LAS": {"lat": 36.0840, "lng": -115.1537, "city": "Las Vegas", "country": "USA"},
    "PHX": {"lat": 33.4352, "lng": -112.0101, "city": "Phoenix", "country": "USA"},
    "DEN": {"lat": 39.8561, "lng": -104.6737, "city": "Denver", "country": "USA"},
    "JFK": {"lat": 40.6413, "lng": -73.7781, "city": "New York", "country": "USA"},
    "ORD": {"lat": 41.9742, "lng": -87.9073, "city": "Chicago", "country": "USA"},
    "MIA": {"lat": 25.7959, "lng": -80.2870, "city": "Miami", "country": "USA"},
    "ATL": {"lat": 33.6407, "lng": -84.4277, "city": "Atlanta", "country": "USA"},
    "DFW": {"lat": 32.8998, "lng": -97.0403, "city": "Dallas", "country": "USA"},
    "IAH": {"lat": 29.9902, "lng": -95.3368, "city": "Houston", "country": "USA"},
    "BOS": {"lat": 42.3656, "lng": -71.0096, "city": "Boston", "country": "USA"},
    "PDX": {"lat": 45.5898, "lng": -122.5951, "city": "Portland", "country": "USA"},
    "SLC": {"lat": 40.7899, "lng": -111.9791, "city": "Salt Lake City", "country": "USA"},
    "AUS": {"lat": 30.1975, "lng": -97.6664, "city": "Austin", "country": "USA"},
    "MSP": {"lat": 44.8848, "lng": -93.2223, "city": "Minneapolis", "country": "USA"},

    # North America
    "HAV": {"lat": 22.9892, "lng": -82.4091, "city": "Havana", "country": "Cuba"},

    # Mexico
    "TIJ": {"lat": 32.5411, "lng": -116.9703, "city": "Tijuana", "country": "Mexico"},
    "MEX": {"lat": 19.4363, "lng": -99.0721, "city": "Mexico City", "country": "Mexico"},
    "CUN": {"lat": 21.0365, "lng": -86.8771, "city": "Cancun", "country": "Mexico"},
    "GDL": {"lat": 20.5218, "lng": -103.3117, "city": "Guadalajara", "country": "Mexico"},
    "PVR": {"lat": 20.6801, "lng": -105.2544, "city": "Puerto Vallarta", "country": "Mexico"},

    # Canada
    "YVR": {"lat": 49.1939, "lng": -123.1844, "city": "Vancouver", "country": "Canada"},
    "YYZ": {"lat": 43.6777, "lng": -79.6248, "city": "Toronto", "country": "Canada"},
    "YUL": {"lat": 45.4706, "lng": -73.7408, "city": "Montreal", "country": "Canada"},

    # South America
    "GIG": {"lat": -22.8099, "lng": -43.2505, "city": "Rio de Janeiro", "country": "Brazil"},
    "GRU": {"lat": -23.4356, "lng": -46.4731, "city": "Sao Paulo", "country": "Brazil"},
    "EZE": {"lat": -34.8222, "lng": -58.5358, "city": "Buenos Aires", "country": "Argentina"},
    "LIM": {"lat": -12.0219, "lng": -77.1143, "city": "Lima", "country": "Peru"},
    "BOG": {"lat": 4.7016, "lng": -74.1469, "city": "Bogota", "country": "Colombia"},
    "SCL": {"lat": -33.3930, "lng": -70.7858, "city": "Santiago", "country": "Chile"},
    "CTG": {"lat": 10.4424, "lng": -75.5130, "city": "Cartagena", "country": "Colombia"},
    "UIO": {"lat": -0.1292, "lng": -78.3575, "city": "Quito", "country": "Ecuador"},

    # Europe
    "LHR": {"lat": 51.4700, "lng": -0.4543, "city": "London", "country": "UK"},
    "CDG": {"lat": 49.0097, "lng": 2.5479, "city": "Paris", "country": "France"},
    "FCO": {"lat": 41.8003, "lng": 12.2389, "city": "Rome", "country": "Italy"},
    "BCN": {"lat": 41.2974, "lng": 2.0833, "city": "Barcelona", "country": "Spain"},
    "MAD": {"lat": 40.4983, "lng": -3.5676, "city": "Madrid", "country": "Spain"},
    "AMS": {"lat": 52.3105, "lng": 4.7683, "city": "Amsterdam", "country": "Netherlands"},
    "BER": {"lat": 52.3667, "lng": 13.5033, "city": "Berlin", "country": "Germany"},
    "MUC": {"lat": 48.3538, "lng": 11.7750, "city": "Munich", "country": "Germany"},
    "PRG": {"lat": 50.1008, "lng": 14.2632, "city": "Prague", "country": "Czech Republic"},
    "VIE": {"lat": 48.1103, "lng": 16.5697, "city": "Vienna", "country": "Austria"},
    "LIS": {"lat": 38.7742, "lng": -9.1342, "city": "Lisbon", "country": "Portugal"},
    "ATH": {"lat": 37.9364, "lng": 23.9445, "city": "Athens", "country": "Greece"},
    "IST": {"lat": 41.2753, "lng": 28.7519, "city": "Istanbul", "country": "Turkey"},
    "DUB": {"lat": 53.4213, "lng": -6.2701, "city": "Dublin", "country": "Ireland"},
    "CPH": {"lat": 55.6180, "lng": 12.6560, "city": "Copenhagen", "country": "Denmark"},
    "ARN": {"lat": 59.6519, "lng": 17.9186, "city": "Stockholm", "country": "Sweden"},
    "OSL": {"lat": 60.1939, "lng": 11.1004, "city": "Oslo", "country": "Norway"},
    "KEF": {"lat": 63.9850, "lng": -22.6056, "city": "Reykjavik", "country": "Iceland"},

    # Asia
    "NRT": {"lat": 35.7720, "lng": 140.3929, "city": "Tokyo", "country": "Japan"},
    "HND": {"lat": 35.5494, "lng": 139.7798, "city": "Tokyo", "country": "Japan"},
    "ICN": {"lat": 37.4602, "lng": 126.4407, "city": "Seoul", "country": "South Korea"},
    "BKK": {"lat": 13.6900, "lng": 100.7501, "city": "Bangkok", "country": "Thailand"},
    "SIN": {"lat": 1.3644, "lng": 103.9915, "city": "Singapore", "country": "Singapore"},
    "HKG": {"lat": 22.3080, "lng": 113.9185, "city": "Hong Kong", "country": "Hong Kong"},
    "PVG": {"lat": 31.1443, "lng": 121.8083, "city": "Shanghai", "country": "China"},
    "PEK": {"lat": 40.0799, "lng": 116.6031, "city": "Beijing", "country": "China"},
    "DXB": {"lat": 25.2532, "lng": 55.3657, "city": "Dubai", "country": "UAE"},
    "BOM": {"lat": 19.0896, "lng": 72.8656, "city": "Mumbai", "country": "India"},
    "DEL": {"lat": 28.5562, "lng": 77.1000, "city": "Delhi", "country": "India"},
    "DPS": {"lat": -8.7467, "lng": 115.1667, "city": "Bali", "country": "Indonesia"},
    "HKT": {"lat": 8.1132, "lng": 98.3169, "city": "Phuket", "country": "Thailand"},
    "MNL": {"lat": 14.5086, "lng": 121.0194, "city": "Manila", "country": "Philippines"},
    "HAN": {"lat": 21.2212, "lng": 105.8072, "city": "Hanoi", "country": "Vietnam"},
    "SGN": {"lat": 10.8188, "lng": 106.6520, "city": "Ho Chi Minh", "country": "Vietnam"},
    "KUL": {"lat": 2.7456, "lng": 101.7072, "city": "Kuala Lumpur", "country": "Malaysia"},
    "TLV": {"lat": 32.0114, "lng": 34.8867, "city": "Tel Aviv", "country": "Israel"},

    # Africa
    "CAI": {"lat": 30.1219, "lng": 31.4056, "city": "Cairo", "country": "Egypt"},
    "RAK": {"lat": 31.6069, "lng": -8.0363, "city": "Marrakech", "country": "Morocco"},
    "CPT": {"lat": -33.9715, "lng": 18.6021, "city": "Cape Town", "country": "South Africa"},
    "JNB": {"lat": -26.1392, "lng": 28.2460, "city": "Johannesburg", "country": "South Africa"},
    "NBO": {"lat": -1.3192, "lng": 36.9278, "city": "Nairobi", "country": "Kenya"},
    "CMN": {"lat": 33.3676, "lng": -7.5898, "city": "Casablanca", "country": "Morocco"},
    "LOS": {"lat": 6.5774, "lng": 3.3213, "city": "Lagos", "country": "Nigeria"},
    "ACC": {"lat": 5.6052, "lng": -0.1668, "city": "Accra", "country": "Ghana"},
    "ADD": {"lat": 8.9806, "lng": 38.7992, "city": "Addis Ababa", "country": "Ethiopia"},

    # Oceania
    "SYD": {"lat": -33.9461, "lng": 151.1772, "city": "Sydney", "country": "Australia"},
    "MEL": {"lat": -37.6690, "lng": 144.8410, "city": "Melbourne", "country": "Australia"},
    "BNE": {"lat": -27.3942, "lng": 153.1218, "city": "Brisbane", "country": "Australia"},
    "AKL": {"lat": -37.0082, "lng": 174.7850, "city": "Auckland", "country": "New Zealand"},
    "PER": {"lat": -31.9403, "lng": 115.9672, "city": "Perth", "country": "Australia"},
    "NAN": {"lat": -17.7554, "lng": 177.4493, "city": "Fiji", "country": "Fiji"},
}


class GeoService:
    """Service for geographic calculations and data."""

    @staticmethod
    def get_airport_info(airport_code: str) -> Optional[dict]:
        """Get airport information including coordinates."""
        return AIRPORT_COORDINATES.get(airport_code.upper())

    @staticmethod
    def get_coordinates(airport_code: str) -> Optional[Coordinates]:
        """Get coordinates for an airport."""
        info = AIRPORT_COORDINATES.get(airport_code.upper())
        if info:
            return Coordinates(lat=info["lat"], lng=info["lng"])
        return None

    @staticmethod
    def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate great circle distance between two points in kilometers.
        Uses the Haversine formula.
        """
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])

        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))

        # Earth radius in kilometers
        r = 6371

        return c * r

    @staticmethod
    def calculate_distance(origin: str, destination: str) -> Optional[float]:
        """Calculate distance between two airports in kilometers."""
        origin_coords = GeoService.get_coordinates(origin)
        dest_coords = GeoService.get_coordinates(destination)

        if not origin_coords or not dest_coords:
            return None

        return GeoService.haversine_distance(
            origin_coords.lat, origin_coords.lng, dest_coords.lat, dest_coords.lng
        )

    @staticmethod
    def estimate_flight_duration(distance_km: float) -> str:
        """
        Estimate flight duration based on distance.
        Assumes average speed of 800 km/h.
        """
        if distance_km <= 0:
            return "Unknown"

        hours = distance_km / 800
        hours_int = int(hours)
        minutes = int((hours - hours_int) * 60)

        if hours_int > 0:
            return f"{hours_int}h {minutes}m"
        else:
            return f"{minutes}m"

    @staticmethod
    def calculate_map_bounds(coordinates_list: list[Coordinates], padding: float = 0.1) -> MapBounds:
        """
        Calculate map bounds that encompass all coordinates.

        Args:
            coordinates_list: List of Coordinates objects
            padding: Percentage of padding to add (0.1 = 10%)

        Returns:
            MapBounds object with north, south, east, west
        """
        if not coordinates_list:
            # Default to world view
            return MapBounds(north=85, south=-85, east=180, west=-180)

        lats = [c.lat for c in coordinates_list]
        lngs = [c.lng for c in coordinates_list]

        min_lat, max_lat = min(lats), max(lats)
        min_lng, max_lng = min(lngs), max(lngs)

        # Add padding
        lat_padding = (max_lat - min_lat) * padding
        lng_padding = (max_lng - min_lng) * padding

        return MapBounds(
            north=max_lat + lat_padding,
            south=min_lat - lat_padding,
            east=max_lng + lng_padding,
            west=min_lng - lng_padding,
        )

    @staticmethod
    def calculate_recommended_zoom(bounds: MapBounds) -> int:
        """
        Calculate recommended zoom level based on map bounds.

        Returns:
            Zoom level (1-20, where 1 is world view, 20 is street level)
        """
        lat_diff = abs(bounds.north - bounds.south)
        lng_diff = abs(bounds.east - bounds.west)
        max_diff = max(lat_diff, lng_diff)

        # Rough zoom level calculation
        if max_diff > 100:
            return 3  # Continental view
        elif max_diff > 50:
            return 4  # Multi-country view
        elif max_diff > 25:
            return 5  # Country view
        elif max_diff > 10:
            return 6  # Regional view
        elif max_diff > 5:
            return 7  # State/province view
        else:
            return 8  # City-level view

    @staticmethod
    def add_airport_to_database(
        airport_code: str, lat: float, lng: float, city: str, country: str
    ):
        """Add a new airport to the database (for dynamic expansion)."""
        AIRPORT_COORDINATES[airport_code.upper()] = {
            "lat": lat,
            "lng": lng,
            "city": city,
            "country": country,
        }


# Global service instance
geo_service = GeoService()
