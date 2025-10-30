"""Configuration management for the trip planner backend."""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    host: str = "0.0.0.0"
    port: int = 4000
    debug: bool = True

    # Test mode (uses mock data instead of real APIs)
    test_mode: bool = True  # Set to False when you have real API access

    # API Keys
    parallel_api_key: str
    anthropic_api_key: str

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Cache TTL (in seconds)
    cache_ttl_flight: int = 3600  # 1 hour
    cache_ttl_destination: int = 86400  # 24 hours
    cache_ttl_results: int = 604800  # 7 days
    cache_ttl_search: int = 1800  # 30 minutes

    # Parallel API configuration
    # Note: Update this URL if you have access to actual Parallel API
    parallel_api_base_url: str = "https://api.tavily.com"  # Using Tavily as alternative

    # Claude configuration
    claude_model: str = "claude-3-5-sonnet-20241022"  # Latest Sonnet model
    claude_max_tokens: int = 4096
    claude_temperature: float = 0.7

    # Search configuration
    max_flight_results: int = 50
    max_destinations_to_analyze: int = 25
    flight_budget_threshold: float = 0.6  # Max 60% of budget on flights

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Global settings instance
settings = Settings()
