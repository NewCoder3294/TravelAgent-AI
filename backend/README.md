# Trip Planner Backend

AI-powered trip planner backend using **Parallel API** for search and **Claude SDK** for intelligent analysis.

## Architecture

### Core Components

1. **Parallel API Service** - Performs concurrent web searches for:
   - Flight prices and destinations
   - Accommodation costs
   - Food budgets
   - Tourist attractions

2. **Claude Agent** - AI-powered analysis using Anthropic's Claude:
   - Parses search results into structured data
   - Filters and ranks destinations
   - Calculates budgets with detailed breakdowns
   - Generates money-saving tips and insights

3. **FastAPI Server** - RESTful API with WebSocket support:
   - Job creation and management
   - Real-time progress updates
   - Result retrieval

4. **Redis Cache** - Performance optimization:
   - Caches flight searches (1 hour)
   - Caches destination data (24 hours)
   - Stores job results (7 days)
   - Deduplicates identical queries

## Setup

### Prerequisites

- Python 3.11+
- Redis server running locally or remotely

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Copy ../env and add your API keys:
# - PARALLEL_API_KEY
# - ANTHROPIC_API_KEY
```

### Environment Variables

Create or update `../.env`:

```env
# API Keys
PARALLEL_API=your_parallel_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Server
HOST=0.0.0.0
PORT=4000
DEBUG=True
```

## Running the Server

```bash
# Development mode (with auto-reload)
python -m uvicorn src.main:app --reload --port 4000

# Production mode
python -m uvicorn src.main:app --host 0.0.0.0 --port 4000 --workers 4
```

## API Endpoints

### POST /api/v1/trips/search

Create a new trip search job.

**Request:**
```json
{
  "origin": "SAN",
  "date_range": {
    "start": "2024-12-15",
    "end": "2024-12-20"
  },
  "budget": 1500,
  "preferences": {
    "include_activities": true,
    "max_flight_hours": 12
  }
}
```

**Response:**
```json
{
  "job_id": "abc123xyz",
  "status": "processing",
  "created_at": "2024-11-01T10:30:00Z"
}
```

### GET /api/v1/trips/status/{job_id}

Get current job status and progress.

**Response:**
```json
{
  "job_id": "abc123xyz",
  "status": "processing",
  "progress": 45,
  "message": "Analyzing costs...",
  "updated_at": "2024-11-01T10:30:15Z"
}
```

### GET /api/v1/trips/results/{job_id}

Get completed search results.

**Response:**
```json
{
  "job_id": "abc123xyz",
  "status": "completed",
  "destinations": [...],
  "search_metadata": {
    "total_searched": 12,
    "feasible_count": 8,
    "execution_time": 8.5,
    "timestamp": "2024-11-01T10:30:30Z"
  }
}
```

### WebSocket /ws/{job_id}

Real-time updates for job progress.

**Events:**
- `status` - Initial status
- `progress` - Progress updates
- `completed` - Final results
- `error` - Error notifications

## Project Structure

```
backend/
├── src/
│   ├── config.py              # Configuration and settings
│   ├── models.py              # Pydantic models
│   ├── main.py                # FastAPI application
│   └── services/
│       ├── parallel_api.py    # Parallel API search service
│       ├── claude_agent.py    # Claude AI agent
│       ├── orchestrator.py    # Search orchestration
│       └── cache.py           # Redis cache service
├── requirements.txt
├── pyproject.toml
└── README.md
```

## How It Works

### Workflow

1. **Client submits request** → POST /api/v1/trips/search
2. **Server creates job** → Returns job_id immediately
3. **Parallel flight search** → Queries Parallel API for flights
4. **Claude filters candidates** → AI selects best 10 destinations
5. **Parallel multi-domain search** → For each destination:
   - Search accommodation prices
   - Search food costs
   - Search attractions
6. **Claude analyzes each destination** → Calculates budgets, generates insights
7. **Results cached and returned** → Available via API or WebSocket

### Performance

- **Parallel execution**: All searches run concurrently
- **Smart caching**: Repeated queries return instantly
- **Estimated time**: 8-12 seconds for full search

## Development

### Code Style

```bash
# Format code
black src/

# Lint code
ruff check src/
```

### Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=src
```

## Deployment

### Docker

```bash
# Build image
docker build -t trip-planner-backend .

# Run container
docker run -p 4000:4000 \
  -e PARALLEL_API_KEY=your_key \
  -e ANTHROPIC_API_KEY=your_key \
  -e REDIS_URL=redis://redis:6379 \
  trip-planner-backend
```

### Production Checklist

- [ ] Set DEBUG=False in production
- [ ] Use proper CORS origins (not *)
- [ ] Set up Redis persistence
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts
- [ ] Use environment-specific API keys
- [ ] Enable rate limiting

## License

MIT
