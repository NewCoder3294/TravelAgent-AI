"""FastAPI application for trip planner backend."""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from nanoid import generate
import structlog

from .config import settings
from .models import TripSearchRequest, CreateJobResponse, JobStatus, TripSearchResult
from .services.simple_cache import cache  # Using simple in-memory cache (no Redis required)
from .services.orchestrator import orchestrator

# Configure logging
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ]
)

logger = structlog.get_logger()


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self):
        self.active_connections: Dict[str, list[WebSocket]] = {}

    async def connect(self, job_id: str, websocket: WebSocket):
        """Connect a client to a specific job."""
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        self.active_connections[job_id].append(websocket)
        logger.info(f"WebSocket connected", job_id=job_id)

    def disconnect(self, job_id: str, websocket: WebSocket):
        """Disconnect a client from a job."""
        if job_id in self.active_connections:
            self.active_connections[job_id].remove(websocket)
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]
        logger.info(f"WebSocket disconnected", job_id=job_id)

    async def send_progress(self, job_id: str, data: dict):
        """Send progress update to all connected clients for a job."""
        if job_id in self.active_connections:
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_json({"type": "progress", "data": data})
                except Exception as e:
                    logger.error(f"Error sending progress", error=str(e))

    async def send_completed(self, job_id: str, result: dict):
        """Send completion notification to all connected clients."""
        if job_id in self.active_connections:
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_json({"type": "completed", "data": result})
                except Exception as e:
                    logger.error(f"Error sending completion", error=str(e))

    async def send_error(self, job_id: str, error: str):
        """Send error notification to all connected clients."""
        if job_id in self.active_connections:
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_json({"type": "error", "error": error})
                except Exception as e:
                    logger.error(f"Error sending error", error=str(e))


manager = ConnectionManager()


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    # Startup
    logger.info("Starting application...")
    await cache.connect()
    yield
    # Shutdown
    logger.info("Shutting down application...")
    await cache.disconnect()


# Create FastAPI app
app = FastAPI(
    title="Trip Planner API",
    description="AI-powered trip planner with parallel search and Claude SDK",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Background task to run trip search
async def run_trip_search_task(job_id: str, request: TripSearchRequest):
    """Background task to execute trip search."""
    try:
        result = await orchestrator.search_trip(job_id, request)
        await manager.send_completed(job_id, result.dict())
    except Exception as e:
        logger.error(f"Trip search task failed", job_id=job_id, error=str(e))
        await manager.send_error(job_id, str(e))


# API Routes

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Trip Planner API",
        "version": "1.0.0",
    }


@app.post("/api/v1/trips/search", response_model=CreateJobResponse)
async def create_trip_search(request: TripSearchRequest):
    """
    Create a new trip search job.

    This endpoint queues a new trip search and returns a job ID immediately.
    Use WebSocket or status endpoint to monitor progress.
    """
    # Generate unique job ID
    job_id = generate(size=10)

    # Check if we have a cached result for this exact query
    query_hash = cache.query_hash(request.dict())
    cached_result = await cache.get(cache.search_key(query_hash))

    if cached_result:
        logger.info("Returning cached search result", job_id=job_id)
        # Store as new job result
        await cache.set(cache.result_key(job_id), cached_result, settings.cache_ttl_results)
        await cache.set(
            cache.status_key(job_id),
            {
                "job_id": job_id,
                "status": "completed",
                "progress": 100,
                "message": "Retrieved from cache",
                "updated_at": datetime.utcnow().isoformat(),
            },
            settings.cache_ttl_results,
        )
    else:
        # Initialize job status
        await cache.set(
            cache.status_key(job_id),
            {
                "job_id": job_id,
                "status": "queued",
                "progress": 0,
                "message": "Job queued",
                "updated_at": datetime.utcnow().isoformat(),
            },
            settings.cache_ttl_results,
        )

        # Start background task
        asyncio.create_task(run_trip_search_task(job_id, request))

    return CreateJobResponse(
        job_id=job_id, status="processing", created_at=datetime.utcnow().isoformat()
    )


@app.get("/api/v1/trips/status/{job_id}", response_model=JobStatus)
async def get_trip_status(job_id: str):
    """
    Get the current status of a trip search job.

    Returns progress information and current status.
    """
    status_data = await cache.get(cache.status_key(job_id))

    if not status_data:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatus(**status_data)


@app.get("/api/v1/trips/results/{job_id}", response_model=TripSearchResult)
async def get_trip_results(job_id: str):
    """
    Get the results of a completed trip search.

    Returns the full trip search results including all destinations.
    """
    result_data = await cache.get(cache.result_key(job_id))

    if not result_data:
        # Check if job exists but not completed
        status_data = await cache.get(cache.status_key(job_id))
        if status_data:
            status = status_data.get("status")
            if status in ["queued", "processing"]:
                raise HTTPException(
                    status_code=202, detail="Job is still processing. Check status endpoint."
                )
            elif status == "failed":
                raise HTTPException(status_code=500, detail="Job failed")

        raise HTTPException(status_code=404, detail="Results not found")

    return TripSearchResult(**result_data)


@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for real-time job updates.

    Clients can connect to receive real-time progress updates and results.
    """
    await manager.connect(job_id, websocket)

    try:
        # Send initial status
        status_data = await cache.get(cache.status_key(job_id))
        if status_data:
            await websocket.send_json({"type": "status", "data": status_data})

        # Keep connection alive and listen for progress updates
        while True:
            # Check for updates every second
            await asyncio.sleep(1)

            status_data = await cache.get(cache.status_key(job_id))
            if status_data:
                await websocket.send_json({"type": "progress", "data": status_data})

                # If completed or failed, send final result and close
                if status_data.get("status") in ["completed", "failed"]:
                    if status_data.get("status") == "completed":
                        result_data = await cache.get(cache.result_key(job_id))
                        if result_data:
                            await websocket.send_json({"type": "completed", "data": result_data})
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected", job_id=job_id)
    except Exception as e:
        logger.error(f"WebSocket error", job_id=job_id, error=str(e))
    finally:
        manager.disconnect(job_id, websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
