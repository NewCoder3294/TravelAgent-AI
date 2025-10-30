# Trip Planner - Complete System Overview

## What This System Does

Creates an **interactive map visualization** showing all affordable travel destinations from your home airport:

1. **Enter**: Origin airport + dates + budget
2. **Get**: Hub (home) + Routes to all destinations radiating outward
3. **Click**: Any route to see detailed breakdown (flights, hotels, food, attractions, AI insights)

## Architecture Summary

```
User Request
    ↓
FastAPI Backend
    ↓
Parallel API (searches web for flights/hotels/food/attractions)
    ↓
Claude AI (analyzes, filters, generates insights)
    ↓
Route Data (hub + spoke visualization with map coordinates)
    ↓
Frontend Map (draws hub, routes, and markers)
```

## Data Flow

### Input (User Request)
```json
{
  "origin": "SAN",
  "date_range": {"start": "2024-12-15", "end": "2024-12-20"},
  "budget": 1500
}
```

### Output (Route Visualization Data)
```json
{
  "hub": {
    "airport_code": "SAN",
    "city": "San Diego",
    "coordinates": {"lat": 32.7338, "lng": -117.1933}
  },
  "routes": [
    {
      "city": "Las Vegas",
      "airport": "LAS",
      "route_path": {
        "start": {"lat": 32.7338, "lng": -117.1933},
        "end": {"lat": 36.0840, "lng": -115.1537},
        "distance_km": 420.5
      },
      "is_feasible": true,
      "total_cost": 1029.00,
      "breakdown": {...},
      "details": {...},
      "ai_insights": "..."
    }
  ],
  "map_bounds": {...},
  "recommended_zoom": 6
}
```

## Backend Components

### 1. **Parallel API Service** (`parallel_api.py`)
- Searches web for real-time travel data
- Runs multiple searches **concurrently**
- Returns raw search results

**What it searches:**
- ✈️ Flight prices and destinations
- 🏨 Hotel/accommodation costs
- 🍔 Food budgets
- 🎭 Tourist attractions (free & paid)

### 2. **Claude AI Agent** (`claude_agent.py`)
- Parses unstructured search results into clean data
- Filters best destinations based on budget
- Calculates cost breakdowns
- Generates natural language insights
- Creates money-saving tips

**AI Capabilities:**
- 🤖 Extracts prices from messy web search results
- 🎯 Intelligently ranks destinations
- 💡 Generates contextual insights
- 💰 Creates personalized saving strategies

### 3. **Geographic Service** (`geo_utils.py`)
- Maintains airport coordinate database
- Calculates distances between airports
- Estimates flight durations
- Computes map bounds and zoom levels

**Features:**
- 📍 40+ major airports with coordinates
- 📏 Haversine distance calculation
- 🗺️ Automatic map viewport calculation

### 4. **Orchestrator** (`orchestrator.py`)
- Coordinates the entire workflow
- Manages parallel execution
- Builds final route visualization data

**Workflow:**
1. Search flights (Parallel API)
2. Filter candidates (Claude AI)
3. Search all destinations in parallel
4. Analyze with Claude
5. Build routes with geographic data
6. Calculate map bounds
7. Return complete visualization package

## API Endpoints

### `POST /api/v1/trips/search`
Creates a new trip search job.

**Request:**
```json
{
  "origin": "SAN",
  "date_range": {
    "start": "2024-12-15",
    "end": "2024-12-20"
  },
  "budget": 1500
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

### `GET /api/v1/trips/status/{job_id}`
Check search progress.

**Response:**
```json
{
  "job_id": "abc123xyz",
  "status": "processing",
  "progress": 45,
  "message": "Analyzing destinations..."
}
```

### `GET /api/v1/trips/results/{job_id}`
Get complete route visualization data.

**Response:**
```json
{
  "hub": {...},
  "routes": [...],
  "map_bounds": {...},
  "recommended_zoom": 6,
  "search_metadata": {...}
}
```

### `WebSocket /ws/{job_id}`
Real-time progress updates.

**Events:**
- `progress` - Search progress updates
- `completed` - Final results
- `error` - Error notifications

## Frontend Integration

### What You Need to Build

1. **Map Component**
   - Display hub at origin coordinates
   - Draw route lines from hub to each destination
   - Add markers for each destination
   - Color-code by feasibility (green/red)

2. **Route List**
   - Show all routes sorted by cost
   - Filter: feasible only / all routes
   - Click to select route

3. **Route Detail Panel**
   - Shows when route is clicked
   - Displays all breakdown data
   - Shows AI insights and tips
   - Lists attractions and accommodation options

### Map Libraries Supported

- ✅ **Mapbox GL JS** - Recommended
- ✅ **Leaflet.js** - Simple and lightweight
- ✅ **Google Maps** - Full-featured
- ✅ **React Map GL** - For React apps

See `FRONTEND_INTEGRATION.md` for complete code examples.

## Key Features

### Visual Route System
- **Hub**: Your origin airport (larger marker, different color)
- **Routes**: Lines radiating from hub to each destination
- **Color Coding**: Green = within budget, Red = over budget
- **Interactive**: Click any route to see full details

### Smart Budget Analysis
- Breaks down costs: Flight + Accommodation + Food + Attractions
- Calculates total and remaining budget
- Provides confidence levels (high/medium/low)
- Includes warnings when applicable

### AI Insights
- Natural language summaries for each destination
- Money-saving tips personalized to each city
- Contextual recommendations
- Attraction suggestions (free & paid)

### Performance Optimizations
- ✅ Parallel searches (8-12 seconds vs 30-60s sequential)
- ✅ In-memory caching (instant for repeated queries)
- ✅ Async operations (non-blocking)
- ✅ Smart deduplication

## Technology Stack

**Backend:**
- Python 3.11+
- FastAPI (async web framework)
- Anthropic Claude SDK (AI agent)
- Parallel API (web search)
- Pydantic (data validation)
- httpx (async HTTP)

**No Dependencies:**
- ❌ No Redis required (simple in-memory cache)
- ❌ No database required
- ❌ No Docker required (optional)

## Running the System

### Quick Start (3 steps)

1. **Set API key in `.env`:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```

2. **Run backend:**
   ```bash
   cd backend
   ./run.sh
   ```

3. **Test API:**
   - Open http://localhost:4000/docs
   - Try `POST /api/v1/trips/search`
   - Get results from `GET /api/v1/trips/results/{job_id}`

See `QUICK_START.md` for detailed instructions.

## Response Time

- **First search**: 8-15 seconds
- **Cached search**: < 1 second
- **Status check**: < 50ms

## Supported Airports

Currently 40+ major airports including:

**US:** SAN, LAX, SFO, SEA, LAS, PHX, DEN, JFK, ORD, MIA, ATL, etc.
**International:** LHR, CDG, NRT, ICN, SYD, DXB, etc.

Easy to add more - see `geo_utils.py`

## Cost Breakdown Example

```
Las Vegas from San Diego ($1,029 total)
├─ Flight: $89
├─ Accommodation: $550 (5 nights × $110/night)
├─ Food: $390 (6 days × $65/day)
└─ Attractions: $0 (free activities available)

Remaining Budget: $471
Status: ✅ FEASIBLE
```

## Sample Use Cases

### Budget Traveler
- **Input**: $800 budget, 5 days
- **Output**: Nearby affordable destinations (Vegas, Tijuana, Phoenix)
- **Value**: Shows only realistic options within budget

### Flexible Dates
- **Input**: $2000 budget, 1 week
- **Output**: Wide range including some international
- **Value**: AI insights help choose best value

### Group Trip Planning
- **Input**: Multiple people, moderate budget
- **Output**: Destinations with group-friendly activities
- **Value**: Shows free attractions to reduce per-person costs

## Future Enhancements

Potential features to add:

- [ ] Save searches and favorite routes
- [ ] Compare multiple origin airports
- [ ] Multi-city trip planning
- [ ] Real-time price updates
- [ ] Email price alerts
- [ ] Direct booking links
- [ ] Weather data integration
- [ ] Events calendar

## Files Reference

**Core Backend:**
- `main.py` - FastAPI server
- `models.py` - Data models
- `orchestrator.py` - Search coordinator
- `parallel_api.py` - Web search service
- `claude_agent.py` - AI analysis
- `geo_utils.py` - Geographic calculations
- `simple_cache.py` - In-memory cache

**Documentation:**
- `QUICK_START.md` - How to run
- `FRONTEND_INTEGRATION.md` - How to build frontend
- `TESTING.md` - Testing guide
- `design.md` - Architecture details

**Configuration:**
- `.env` - API keys
- `requirements.txt` - Python dependencies
- `run.sh` - Startup script

## Support

**Getting Started:**
1. Read `QUICK_START.md`
2. Run the backend
3. Test with example script
4. Build your frontend

**Integration:**
1. Read `FRONTEND_INTEGRATION.md`
2. Use the API response to render your map
3. Implement route clicking and details
4. Add filters and sorting

**Questions?**
- Check the API docs: http://localhost:4000/docs
- Review example responses
- Test with different airports and budgets

---

**The backend provides everything you need to build an interactive travel map. Just fetch the data and visualize it! 🗺️✈️**
