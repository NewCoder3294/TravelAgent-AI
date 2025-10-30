# Trip Planner with Interactive Maps - Setup Guide

This guide will help you set up and run your AI-powered trip planner with interactive map visualization.

## 🎯 What's Been Implemented

### ✅ Interactive Map Features

1. **Destination Map** (`/`)
   - World map with clickable destination markers
   - Smart clustering when zoomed out (purple circles with counts)
   - Click markers to see destination details
   - Dark/Light theme support with auto-switching map tiles
   - Responsive detail panels with destination info

2. **Route Map** (`/search`)
   - Origin hub visualization (green marker)
   - Flight route lines connecting hub to destinations
   - Green solid lines: Routes within budget
   - Red dashed lines: Routes over budget
   - Click routes to see detailed cost breakdowns, AI insights, and savings tips

3. **Backend Integration**
   - API service module for all backend endpoints
   - Real-time search with progress tracking
   - WebSocket support for live updates
   - Polling fallback mechanism

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Anthropic API key (for Claude)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ANTHROPIC_API_KEY="your-key-here"

# Start the backend server
python -m uvicorn src.main:app --reload --port 4000
```

The backend will be available at `http://localhost:4000`

### 2. Frontend Setup

```bash
cd frontend1

# Install dependencies
npm install

# The .env.local file is already configured with:
# NEXT_PUBLIC_API_URL=http://localhost:4000

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📍 Using the Application

### Explore Destinations (Mock Data)

1. Navigate to `http://localhost:3000`
2. Browse destinations by continent/country
3. Toggle between Map and List views
4. Click map markers to see destination details
5. Use search and filters to narrow down options

**Map Features:**
- **Zoom out**: Destinations automatically cluster together
- **Click clusters**: Zoom in to see individual destinations
- **Click markers**: View detailed information
- **Theme toggle**: Switch between light/dark mode (top right)

### AI-Powered Search (Backend Required)

1. Click the **"AI Search"** button in the header
2. Enter your trip details:
   - **Origin**: Airport code (e.g., SFO, LAX, JFK)
   - **Dates**: Start and end dates
   - **Budget**: Total budget in USD
3. Click **"Search Destinations"**
4. Watch the real-time progress bar as AI analyzes destinations
5. View results on the interactive route map

**Route Map Features:**
- **Green hub marker**: Your origin airport
- **Blue destination markers**: Routes within budget
- **Red destination markers**: Routes over budget
- **Flight path lines**: Visual routes from origin to destination
- **Click any route**: See detailed breakdown including:
  - Total cost and remaining budget
  - Flight, accommodation, food, and activity costs
  - AI-generated insights
  - Money-saving tips
  - Warnings and considerations

## 📂 Project Structure

```
trip-planner/
├── frontend1/
│   ├── app/
│   │   ├── page.tsx                      # Main explore page
│   │   ├── search/page.tsx               # AI search page (NEW)
│   │   ├── trips/page.tsx                # User trips
│   │   ├── considering/page.tsx          # Trips under consideration
│   │   └── trip/[id]/page.tsx           # Trip details
│   ├── components/
│   │   ├── destination-map.tsx           # Basic destination map (NEW)
│   │   ├── destination-map-clustered.tsx # Advanced map with clustering (NEW)
│   │   ├── route-map.tsx                 # Route visualization for API results (NEW)
│   │   ├── theme-toggle.tsx              # Dark/light mode toggle (NEW)
│   │   └── ui/                           # shadcn/ui components
│   └── lib/
│       ├── api.ts                        # Backend API integration (NEW)
│       ├── types.ts                      # TypeScript types
│       └── mock-data.ts                  # Mock data for testing
├── backend/
│   └── src/
│       ├── main.py                       # FastAPI server with endpoints
│       ├── orchestrator.py               # Search workflow coordinator
│       ├── claude_agent.py               # AI-powered data parsing
│       ├── parallel_api.py               # Parallel web search
│       └── models.py                     # Pydantic schemas
└── SETUP.md                              # This file
```

## 🗺️ Map Components

### 1. DestinationMap (`destination-map.tsx`)
Basic interactive map for displaying destinations with markers and popups.

**Usage:**
```tsx
<DestinationMap
  destinations={destinations}
  onDestinationClick={(dest) => console.log(dest)}
  selectedDestinationId={selectedId}
/>
```

### 2. DestinationMapClustered (`destination-map-clustered.tsx`)
Advanced map with automatic marker clustering for better UX.

**Features:**
- Grid-based clustering algorithm
- Zoom-dependent cluster size
- Purple cluster markers showing count
- Automatic bounds fitting
- Theme-aware styling

**Usage:**
```tsx
<DestinationMapClustered
  destinations={destinations}
  onDestinationClick={(dest) => console.log(dest)}
  selectedDestinationId={selectedId}
/>
```

### 3. RouteMap (`route-map.tsx`)
Specialized map for displaying trip search results with routes.

**Features:**
- Origin hub marker (green)
- Flight path visualization
- Feasibility indicators (green/red)
- Cost breakdown popups
- AI insights and tips

**Usage:**
```tsx
<RouteMap
  hub={searchResults.hub}
  routes={searchResults.routes}
  onRouteClick={(route) => handleRouteSelection(route)}
  selectedRouteId={selectedRoute?.destination_id}
/>
```

## 🔌 API Integration

### API Service (`lib/api.ts`)

The `TripPlannerAPI` class provides methods to interact with the backend:

```typescript
import { api } from '@/lib/api'

// Create a trip search
const { job_id } = await api.createTripSearch({
  origin: "SFO",
  date_range: { start: "2025-07-01", end: "2025-07-10" },
  budget: 3000
})

// Poll for completion with progress updates
const results = await api.pollJobCompletion(
  job_id,
  (status) => {
    console.log(`Progress: ${status.progress}%`)
    console.log(`Message: ${status.message}`)
  }
)

// Or use WebSocket for real-time updates
const ws = api.connectWebSocket(job_id, {
  onProgress: (data) => console.log('Progress:', data),
  onCompleted: (data) => console.log('Completed:', data),
  onError: (error) => console.error('Error:', error)
})
```

### Backend Endpoints

#### POST `/api/v1/trips/search`
Create a new trip search job.

**Request:**
```json
{
  "origin": "SFO",
  "date_range": { "start": "2025-07-01", "end": "2025-07-10" },
  "budget": 3000
}
```

**Response:**
```json
{
  "job_id": "abc123",
  "status": "processing",
  "created_at": "2025-10-26T12:00:00Z"
}
```

#### GET `/api/v1/trips/status/{job_id}`
Get the current status of a search job.

**Response:**
```json
{
  "job_id": "abc123",
  "status": "processing",
  "progress": 45,
  "message": "Analyzing destinations...",
  "updated_at": "2025-10-26T12:00:30Z"
}
```

#### GET `/api/v1/trips/results/{job_id}`
Get the results of a completed search.

**Response:**
```json
{
  "job_id": "abc123",
  "status": "completed",
  "hub": {
    "airport_code": "SFO",
    "city": "San Francisco",
    "country": "United States",
    "coordinates": { "lat": 37.7749, "lng": -122.4194 }
  },
  "routes": [
    {
      "destination_id": "paris-fr",
      "city": "Paris",
      "country": "France",
      "airport": "CDG",
      "coordinates": { "lat": 48.8566, "lng": 2.3522 },
      "is_feasible": true,
      "total_cost": 2850,
      "remaining_budget": 150,
      "breakdown": {
        "flight": 850,
        "accommodation": 1200,
        "food": 500,
        "attractions": 300
      },
      "ai_insights": "Paris is excellent for your budget...",
      "savings_tips": ["Book flights 2 months in advance", "Use metro instead of taxis"],
      "route_path": {
        "distance_km": 8956,
        "flight_duration": "11h 30m"
      }
    }
  ],
  "search_metadata": {
    "total_searched": 50,
    "feasible_count": 12,
    "execution_time": 45.2
  }
}
```

#### WebSocket `/ws/{job_id}`
Real-time updates for search progress.

**Messages:**
```json
// Progress update
{ "type": "progress", "progress": 45, "message": "Analyzing destinations..." }

// Completion
{ "type": "completed", "results": { ... } }

// Error
{ "type": "error", "error": "Search failed" }
```

## 🎨 Customization

### Map Styles

The maps automatically switch between light and dark tiles based on the theme:

- **Light mode**: OpenStreetMap tiles
- **Dark mode**: Stadia Maps dark tiles

To change map styles, edit the `getMapStyle` function in the map components.

### Marker Colors

Current color scheme:
- **Green**: Origin hub
- **Blue**: Selected destination / Feasible route
- **Red**: Unselected destination / Over budget
- **Purple**: Cluster marker

### Environment Variables

Create or edit `frontend1/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Optional: Map tile provider API keys
# NEXT_PUBLIC_MAPBOX_TOKEN=your-token
```

## 🐛 Troubleshooting

### Frontend doesn't connect to backend

1. Ensure backend is running on port 4000
2. Check `.env.local` has correct API URL
3. Restart frontend dev server after changing env vars

### Map not loading

1. Check browser console for errors
2. Ensure MapLibre GL CSS is imported
3. Try clearing browser cache

### Search always fails

1. Verify backend has valid `ANTHROPIC_API_KEY`
2. Check backend logs for errors
3. Ensure origin airport code is valid IATA code

### Markers not clustering

1. Zoom level affects clustering (zoom out to see clusters)
2. Need at least 2 destinations in same grid cell
3. Clustering disabled at zoom level 6+

## 📚 Additional Resources

- **MapLibre GL JS Docs**: https://maplibre.org/maplibre-gl-js/docs/
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Anthropic Claude API**: https://docs.anthropic.com/

## ✨ Features Summary

### Frontend Features
✅ Interactive world map with MapLibre GL JS
✅ Smart marker clustering
✅ Click-to-view destination details
✅ Dark/Light theme support
✅ Route visualization with flight paths
✅ Real-time search progress tracking
✅ Cost breakdown displays
✅ AI insights and savings tips
✅ Responsive design

### Backend Features
✅ Parallel destination search
✅ Claude AI integration for insights
✅ Cost estimation and feasibility checking
✅ WebSocket real-time updates
✅ Progress tracking
✅ Error handling and logging

## 🎉 Next Steps

1. Add user authentication
2. Save search results to database
3. Implement trip booking flow
4. Add more destinations to database
5. Integrate real flight/hotel APIs
6. Add user reviews and ratings
7. Implement trip sharing features

---

**Need Help?** Check the troubleshooting section or open an issue in the repository.
