"""Simple in-memory cache service (Redis-free alternative)."""

import json
import hashlib
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import structlog

logger = structlog.get_logger()


class CacheEntry:
    """Cache entry with expiration."""

    def __init__(self, value: Any, ttl: int):
        self.value = value
        self.expires_at = datetime.utcnow() + timedelta(seconds=ttl)

    def is_expired(self) -> bool:
        """Check if entry is expired."""
        return datetime.utcnow() > self.expires_at


class SimpleCacheService:
    """Simple in-memory cache service (no Redis required)."""

    def __init__(self):
        self._cache: Dict[str, CacheEntry] = {}
        logger.info("✅ Simple in-memory cache initialized")

    async def connect(self):
        """No-op for compatibility with Redis cache."""
        pass

    async def disconnect(self):
        """No-op for compatibility with Redis cache."""
        pass

    async def get(self, key: str) -> Optional[Any]:
        """Get cached data."""
        try:
            entry = self._cache.get(key)
            if entry is None:
                return None

            if entry.is_expired():
                del self._cache[key]
                return None

            return entry.value
        except Exception as e:
            logger.error(f"Cache get error for key {key}", error=str(e))
            return None

    async def set(self, key: str, value: Any, ttl: int):
        """Set cached data with TTL."""
        try:
            self._cache[key] = CacheEntry(value, ttl)
        except Exception as e:
            logger.error(f"Cache set error for key {key}", error=str(e))

    async def delete(self, key: str):
        """Delete cached data."""
        try:
            if key in self._cache:
                del self._cache[key]
        except Exception as e:
            logger.error(f"Cache delete error for key {key}", error=str(e))

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        try:
            entry = self._cache.get(key)
            if entry is None:
                return False
            if entry.is_expired():
                del self._cache[key]
                return False
            return True
        except Exception as e:
            logger.error(f"Cache exists error for key {key}", error=str(e))
            return False

    def clear_expired(self):
        """Clear all expired entries."""
        expired_keys = [key for key, entry in self._cache.items() if entry.is_expired()]
        for key in expired_keys:
            del self._cache[key]
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")

    # Helper methods for generating cache keys

    @staticmethod
    def flight_key(origin: str, date_hash: str) -> str:
        """Generate cache key for flights."""
        return f"flight:{origin}:{date_hash}"

    @staticmethod
    def destination_key(city: str, data_type: str) -> str:
        """Generate cache key for destination data."""
        return f"destination:{city}:{data_type}"

    @staticmethod
    def result_key(job_id: str) -> str:
        """Generate cache key for job results."""
        return f"result:{job_id}"

    @staticmethod
    def status_key(job_id: str) -> str:
        """Generate cache key for job status."""
        return f"status:{job_id}"

    @staticmethod
    def search_key(query_hash: str) -> str:
        """Generate cache key for search deduplication."""
        return f"search:{query_hash}"

    @staticmethod
    def date_hash(start: str, end: str) -> str:
        """Create hash from date range."""
        return f"{start}_{end}"

    @staticmethod
    def query_hash(data: dict) -> str:
        """Create hash from query data."""
        query_str = json.dumps(data, sort_keys=True)
        return hashlib.md5(query_str.encode()).hexdigest()


# Global cache instance (simple in-memory version)
cache = SimpleCacheService()
