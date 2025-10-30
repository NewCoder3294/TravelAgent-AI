"""Data models for the trip planner API."""

from datetime import datetime
from typing import List, Optional, Literal, Dict, Any, Tuple
from pydantic import BaseModel, Field, field_validator


# Request Models
class DateRange(BaseModel):
    """Date range for trip."""
    start: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")


class Preferences(BaseModel):
    """User preferences for trip search."""
    include_activities: bool = True
    max_flight_hours: Optional[int] = Field(None, ge=1, le=24)
    accommodation_type: Optional[Literal["budget", "mid-range", "luxury"]] = None


class TripSearchRequest(BaseModel):
    """Request payload for trip search."""
    origin: str = Field(..., min_length=3, max_length=3, description="IATA airport code")
    date_range: DateRange
    budget: float = Field(..., ge=100, le=100000)
    preferences: Optional[Preferences] = None

    @field_validator("origin")
    @classmethod
    def validate_origin_uppercase(cls, v: str) -> str:
        """Ensure origin is uppercase."""
        return v.upper()


# Search Result Models
class FlightResult(BaseModel):
    """Flight search result."""
    destination: str
    airport: str
    city: str
    country: str
    price: float
    airline: Optional[str] = None
    duration: Optional[str] = None
    coordinates: Optional[Tuple[float, float]] = None


class AccommodationResult(BaseModel):
    """Accommodation search result."""
    city: str
    avg_nightly_rate: float
    range: Dict[str, float] = Field(..., description="Min and max prices")
    options: List[str]
    source: str


class FoodCostResult(BaseModel):
    """Food cost search result."""
    city: str
    avg_daily_budget: float
    price_level: Literal["budget", "moderate", "expensive"]
    sources: List[str]
    confidence: Literal["high", "medium", "low"]


class AttractionResult(BaseModel):
    """Attraction search result."""
    city: str
    free_attractions: List[str]
    paid_attractions: List[Dict[str, Any]]
    estimated_activity_cost: float


# Combined Destination Data
class DestinationData(BaseModel):
    """Combined data for a destination."""
    destination: FlightResult
    accommodation: AccommodationResult
    food: FoodCostResult
    attractions: AttractionResult


# Geographic and Route Models
class Coordinates(BaseModel):
    """Geographic coordinates."""
    lat: float
    lng: float


class RoutePathData(BaseModel):
    """Visual route path data for map rendering."""
    start: Coordinates
    end: Coordinates
    distance_km: Optional[float] = None
    flight_duration: Optional[str] = None


class Hub(BaseModel):
    """Origin hub information."""
    airport_code: str
    city: str
    country: str
    coordinates: Coordinates


# Final Result Models
class CostBreakdown(BaseModel):
    """Cost breakdown for a destination."""
    flight: float
    accommodation: float
    food: float
    attractions: float


class FlightInfo(BaseModel):
    """Detailed flight information."""
    price: float
    airline: Optional[str] = None
    duration: Optional[str] = None


class AccommodationInfo(BaseModel):
    """Detailed accommodation information."""
    avg_nightly_rate: float
    total_nights: int
    range: Dict[str, float]
    options: List[str]


class FoodInfo(BaseModel):
    """Detailed food cost information."""
    avg_daily_budget: float
    total_days: int
    price_level: Literal["budget", "moderate", "expensive"]


class AttractionInfo(BaseModel):
    """Detailed attraction information."""
    free_attractions: List[str]
    paid_attractions: List[Dict[str, Any]]
    estimated_activity_cost: float


class DestinationDetails(BaseModel):
    """Detailed information for a destination."""
    flight_info: FlightInfo
    accommodation_info: AccommodationInfo
    food_info: FoodInfo
    attraction_info: AttractionInfo


class Route(BaseModel):
    """A route from hub to destination with all travel data."""
    # Destination Info
    destination_id: str  # Unique ID for this route
    city: str
    country: str
    airport: str
    coordinates: Coordinates

    # Route Visual Data
    route_path: RoutePathData

    # Financial Data
    is_feasible: bool
    total_cost: float
    remaining_budget: float
    confidence: Literal["high", "medium", "low"]
    breakdown: CostBreakdown

    # Detailed Information (shown when route is clicked)
    details: DestinationDetails
    ai_insights: str
    savings_tips: List[str]
    warnings: Optional[List[str]] = None


class Destination(BaseModel):
    """Final destination result with all details (legacy format)."""
    city: str
    country: str
    airport: str
    coordinates: Tuple[float, float]
    is_feasible: bool
    total_cost: float
    remaining_budget: float
    confidence: Literal["high", "medium", "low"]
    breakdown: CostBreakdown
    details: DestinationDetails
    ai_insights: str
    savings_tips: List[str]
    warnings: Optional[List[str]] = None


class SearchError(BaseModel):
    """Error during search."""
    city: str
    reason: str
    severity: Literal["warning", "error"]


class SearchMetadata(BaseModel):
    """Metadata about the search."""
    total_searched: int
    feasible_count: int
    execution_time: float
    timestamp: str


class MapBounds(BaseModel):
    """Map boundaries for visualization."""
    north: float
    south: float
    east: float
    west: float


class TripSearchResult(BaseModel):
    """Complete trip search result with hub-and-spoke route visualization."""
    job_id: str
    status: Literal["completed", "partial", "failed"]

    # Query Information
    query: dict

    # Hub (Origin) Information
    hub: Hub

    # All Routes from Hub to Destinations
    routes: List[Route]

    # Map Visualization Data
    map_bounds: MapBounds  # Recommended map viewport
    recommended_zoom: int  # Recommended zoom level

    # Search Metadata
    search_metadata: SearchMetadata
    errors: Optional[List[SearchError]] = None

    # Legacy compatibility
    destinations: Optional[List[Destination]] = None


# Job Status Models
class JobStatus(BaseModel):
    """Status of a search job."""
    job_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    progress: int = Field(..., ge=0, le=100)
    message: str
    updated_at: str
    result: Optional[TripSearchResult] = None


# Response Models
class CreateJobResponse(BaseModel):
    """Response when creating a new job."""
    job_id: str
    status: str
    created_at: str
