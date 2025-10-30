# Trip Planner - Interactive Route Map Visualization

An intelligent trip planning application that creates a **visual hub-and-spoke route map** showing all affordable travel destinations from your home airport. Powered by **Parallel API** for real-time search and **Claude AI** for smart analysis.

## 🎯 What It Does

Enter your **origin airport**, **dates**, and **budget** → Get an **interactive map** with:
- 🏠 **Hub** (your home airport)
- ✈️ **Routes** (lines radiating to each destination)
- 🗺️ **Markers** (color-coded by feasibility)
- 💰 **Full breakdown** when you click any route (flights, hotels, food, attractions, AI insights)

## ✨ Features

### Visual Route System
- **Hub-and-Spoke Model**: Origin airport as central hub with routes radiating outward
- **Interactive Map Data**: Complete coordinates, paths, and bounds for map rendering
- **Color-Coded Routes**: Green (within budget) vs Red (over budget)
- **Route Details**: Click any route to see full breakdown

### Smart AI Analysis
- **Budget Intelligence**: Claude AI analyzes all costs (flights, hotels, food, attractions)
- **Natural Language Insights**: AI-generated summaries for each destination
- **Money-Saving Tips**: Personalized recommendations to reduce costs
- **Confidence Scoring**: High/medium/low confidence for each estimate

### High Performance
- **Parallel Search**: All destinations searched concurrently (8-12 seconds)
- **Smart Caching**: Instant results for repeated queries (< 1 second)
- **Async Operations**: Non-blocking background processing
- **No Redis Required**: Simple in-memory cache for easy setup

## Architecture

### Backend (Python)

- **FastAPI**: Modern, async web framework
- **Parallel API**: Concurrent web searches for travel data
- **Claude SDK**: AI-powered analysis and insights
- **Redis**: Caching and job queue management
- **WebSockets**: Real-time progress updates

### Key Design Principles

1. **Parallel Execution**: All searches run concurrently for maximum speed
2. **AI-First**: Claude makes intelligent decisions about destinations and budgets
3. **Cache-Optimized**: Aggressive caching minimizes API costs
4. **Real-time**: WebSocket updates keep users informed during searches

## 🚀 Getting Started

### Prerequisites

- ✅ Python 3.11+
- ✅ Anthropic API key ([Get one free](https://console.anthropic.com/))
- ❌ No Redis required
- ❌ No Docker required (optional)

### Quick Start (3 Steps)

1. **Add your Anthropic API key to `.env`**
```bash
# Edit .env file
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

2. **Run the backend**
```bash
cd backend
./run.sh
```

3. **Test it!**
- Open http://localhost:4000/docs
- Try the API with the interactive docs
- Or run the example script: `python example_request.py`

**That's it!** The API is running and ready to use.

### Detailed Guides

- **🚀 Quick Start**: See `QUICK_START.md` for step-by-step instructions
- **🗺️ Frontend Integration**: See `FRONTEND_INTEGRATION.md` for map visualization code
- **🧪 Testing**: See `TESTING.md` for comprehensive testing guide
- **📚 System Overview**: See `SYSTEM_OVERVIEW.md` for architecture details

## 📡 API Usage

### 1. Create Search

```bash
curl -X POST http://localhost:4000/api/v1/trips/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "SAN",
    "date_range": {"start": "2024-12-15", "end": "2024-12-20"},
    "budget": 1500
  }'
```

**Response:**
```json
{
  "job_id": "abc123xyz",
  "status": "processing"
}
```

### 2. Get Results (wait 10-15 seconds)

```bash
curl http://localhost:4000/api/v1/trips/results/abc123xyz
```

**Response:**
```json
{
  "hub": {
    "airport_code": "SAN",
    "city": "San Diego",
    "coordinates": {"lat": 32.7338, "lng": -117.1933}
  },
  "routes": [
    {
      "destination_id": "r1a2b3c4",
      "city": "Las Vegas",
      "airport": "LAS",
      "coordinates": {"lat": 36.0840, "lng": -115.1537},
      "route_path": {
        "start": {"lat": 32.7338, "lng": -117.1933},
        "end": {"lat": 36.0840, "lng": -115.1537},
        "distance_km": 420.5,
        "flight_duration": "1h 15m"
      },
      "is_feasible": true,
      "total_cost": 1029.00,
      "breakdown": {
        "flight": 89.00,
        "accommodation": 550.00,
        "food": 390.00,
        "attractions": 0.00
      },
      "ai_insights": "Las Vegas offers excellent value...",
      "savings_tips": ["Stay off-strip...", "..."]
    }
  ],
  "map_bounds": {
    "north": 40.0,
    "south": 30.0,
    "east": -110.0,
    "west": -120.0
  },
  "recommended_zoom": 6
}
```

### 3. Use for Map Visualization

```javascript
// Display hub
map.addMarker({
  coordinates: [hub.coordinates.lng, hub.coordinates.lat],
  icon: 'hub-icon',
  size: 'large'
});

// Draw routes
routes.forEach(route => {
  // Draw line from hub to destination
  map.addLine({
    coordinates: [
      [route.route_path.start.lng, route.route_path.start.lat],
      [route.route_path.end.lng, route.route_path.end.lat]
    ],
    color: route.is_feasible ? '#00ff00' : '#ff0000'
  });

  // Add destination marker
  map.addMarker({
    coordinates: [route.coordinates.lng, route.coordinates.lat],
    color: route.is_feasible ? 'green' : 'red',
    onClick: () => showDetails(route)
  });
});

// Fit map to bounds
map.fitBounds([
  [map_bounds.west, map_bounds.south],
  [map_bounds.east, map_bounds.north]
]);
```

## How It Works

### Search Workflow

```
1. User submits search request
   ↓
2. API creates job and returns job_id immediately
   ↓
3. Background process starts:
   │
   ├─→ Parallel API searches for flights (2-3s)
   │   ↓
   ├─→ Claude filters top 10 destinations by budget
   │   ↓
   ├─→ For each destination (in parallel):
   │   ├─→ Search accommodation prices
   │   ├─→ Search food costs
   │   └─→ Search attractions
   │   ↓
   ├─→ Claude analyzes each destination:
   │   ├─→ Calculate total costs
   │   ├─→ Determine feasibility
   │   ├─→ Generate insights and tips
   │   └─→ Identify warnings
   │   ↓
   └─→ Results cached and returned
```

**Total Time**: ~8-12 seconds

### Claude AI Capabilities

1. **Data Extraction**: Parses unstructured search results into structured pricing data
2. **Smart Filtering**: Selects best destinations based on budget constraints
3. **Cost Analysis**: Calculates detailed breakdowns with reasoning
4. **Insights Generation**: Provides natural language recommendations
5. **Tip Generation**: Creates money-saving suggestions specific to each destination

## Project Structure

```
trip-planner/
├── backend/                 # Python backend
│   ├── src/
│   │   ├── main.py         # FastAPI application
│   │   ├── config.py       # Configuration
│   │   ├── models.py       # Pydantic models
│   │   └── services/
│   │       ├── parallel_api.py    # Parallel API integration
│   │       ├── claude_agent.py    # Claude AI agent
│   │       ├── orchestrator.py    # Search coordinator
│   │       └── cache.py           # Redis cache
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── design.md              # Architecture documentation
├── docker-compose.yml     # Docker setup
├── .env                   # Environment variables
└── README.md             # This file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trips/search` | Create new trip search job |
| GET | `/api/v1/trips/status/{job_id}` | Get job status and progress |
| GET | `/api/v1/trips/results/{job_id}` | Get completed search results |
| WS | `/ws/{job_id}` | WebSocket for real-time updates |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PARALLEL_API_KEY` | API key for Parallel API | Required |
| `ANTHROPIC_API_KEY` | API key for Claude | Required |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `PORT` | Server port | `4000` |
| `DEBUG` | Debug mode | `True` |

### Cache TTL Settings

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| Flight searches | 1 hour | Reduce redundant flight queries |
| Destination data | 24 hours | Cache hotel/food/attraction data |
| Job results | 7 days | Allow users to revisit results |
| Search deduplication | 30 minutes | Instant response for duplicate queries |

## Development

### Running Tests

```bash
cd backend
pytest
```

### Code Formatting

```bash
# Format code
black src/

# Lint
ruff check src/
```

## Deployment

### Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

### Production Considerations

- Set `DEBUG=False` in production
- Configure proper CORS origins
- Set up Redis persistence
- Enable rate limiting
- Configure monitoring and logging
- Use environment-specific API keys
- Set up SSL/TLS certificates

## Performance

- **Search Time**: 8-12 seconds average
- **Cached Queries**: < 1 second
- **Concurrent Searches**: Unlimited (rate-limited by external APIs)
- **Scalability**: Horizontal scaling via Docker replicas

## ✅ NEW: Interactive Frontend with Map Visualization

**The frontend is now fully integrated!** 🎉

### Frontend Features
- ✅ Interactive map with MapLibre GL JS
- ✅ Budget-based search form
- ✅ Real-time progress tracking
- ✅ Clickable destination nodes on map
- ✅ Full trip details on node click
- ✅ Dark/Light theme support
- ✅ Responsive design

### How to Run the Complete System

**1. Start the Backend:**
```bash
cd backend
python -m uvicorn src.main:app --reload --port 4000
```

**2. Start the Frontend:**
```bash
cd frontend1
npm install
npm run dev
```

**3. Open the App:**
Navigate to `http://localhost:3000` and start searching!

### Using the Frontend

1. Enter your **origin airport** (e.g., SFO)
2. Set your **travel dates**
3. Set your **budget** (in USD)
4. Click **"Search Destinations"**
5. Watch the AI search in real-time
6. **Click any destination node** on the map to see:
   - Complete cost breakdown
   - Flight details
   - AI-generated insights
   - Money-saving tips
   - Warnings and considerations

The map shows:
- 🟢 **Green marker**: Your origin (hub)
- 🔵 **Blue markers**: Destinations within budget
- 🔴 **Red markers**: Destinations over budget
- **Lines**: Flight routes from origin to destinations

## Future Enhancements

- [ ] User accounts and saved searches
- [ ] Price alerts and notifications
- [ ] More destination filters (climate, activities, etc.)
- [ ] Multi-city trip planning
- [ ] Flight booking integration
- [ ] Trip sharing and collaboration

## Troubleshooting

### Redis connection error

```bash
# Check if Redis is running
redis-cli ping

# Start Redis if needed
redis-server
```

### API key errors

Make sure your `.env` file has valid API keys:
```bash
cat .env
```

### Import errors

Make sure all dependencies are installed:
```bash
pip install -r backend/requirements.txt
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ using Claude AI and Parallel API
