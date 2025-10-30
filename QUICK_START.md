# Quick Start Guide - Trip Planner Backend

Get the backend running in **3 simple steps** - no Redis required!

## Prerequisites

- ✅ Python 3.11+
- ✅ Your Anthropic API key ([Get one here](https://console.anthropic.com/))

## Step 1: Set Your API Key

Edit the `.env` file and add your Anthropic API key:

```bash
# Open .env in your editor
nano .env

# Or
code .env
```

Update this line:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

To your actual key:
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

Save and close.

## Step 2: Run the Backend

```bash
cd backend
./run.sh
```

This script will:
1. Create a virtual environment
2. Install all dependencies
3. Start the FastAPI server on port 4000

You should see:
```
✅ Starting FastAPI server on port 4000...
📍 API will be available at: http://localhost:4000
📚 API docs available at: http://localhost:4000/docs

INFO:     Uvicorn running on http://0.0.0.0:4000
INFO:     Application startup complete.
✅ Simple in-memory cache initialized
```

## Step 3: Test It!

### Option A: Interactive API Docs (Easiest)

1. **Open your browser** to http://localhost:4000/docs

2. **Click on** `POST /api/v1/trips/search`

3. **Click "Try it out"**

4. **Use this example request:**
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

5. **Click "Execute"**

6. **Copy the `job_id`** from the response

7. Wait 10-15 seconds, then **use** `GET /api/v1/trips/results/{job_id}` to get results

### Option B: Using curl

```bash
# 1. Create a search
curl -X POST http://localhost:4000/api/v1/trips/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LAX",
    "date_range": {"start": "2024-12-10", "end": "2024-12-15"},
    "budget": 2000
  }'

# Save the job_id from response

# 2. Get results (wait 10-15 seconds first)
curl http://localhost:4000/api/v1/trips/results/YOUR_JOB_ID | python3 -m json.tool
```

### Option C: Using the Example Script

```bash
# In a new terminal, from the backend directory
cd backend
source venv/bin/activate
python example_request.py
```

## What You'll Get

The API returns a **hub-and-spoke route visualization** with:

### Hub (Your origin)
```json
{
  "hub": {
    "airport_code": "SAN",
    "city": "San Diego",
    "country": "USA",
    "coordinates": {"lat": 32.7338, "lng": -117.1933}
  }
}
```

### Routes (Lines from hub to each destination)
```json
{
  "routes": [
    {
      "destination_id": "r1a2b3c4",
      "city": "Las Vegas",
      "airport": "LAS",
      "coordinates": {"lat": 36.0840, "lng": -115.1537},

      // Route path for drawing on map
      "route_path": {
        "start": {"lat": 32.7338, "lng": -117.1933},
        "end": {"lat": 36.0840, "lng": -115.1537},
        "distance_km": 420.5,
        "flight_duration": "1h 15m"
      },

      // Financial data
      "is_feasible": true,
      "total_cost": 1029.00,
      "breakdown": {
        "flight": 89.00,
        "accommodation": 550.00,
        "food": 390.00,
        "attractions": 0.00
      },

      // Detailed info (for when route is clicked)
      "details": { /* ... */ },
      "ai_insights": "Las Vegas offers excellent value...",
      "savings_tips": ["Stay off-strip...", "..."]
    }
  ]
}
```

### Map Visualization Data
```json
{
  "map_bounds": {
    "north": 40.0,
    "south": 30.0,
    "east": -110.0,
    "west": -120.0
  },
  "recommended_zoom": 6
}
```

## Frontend Integration

See `FRONTEND_INTEGRATION.md` for complete details on how to:
- Display the hub on your map
- Draw route lines from hub to destinations
- Add destination markers
- Handle route clicks to show details
- Color-code by feasibility (green = within budget, red = over budget)

## Troubleshooting

### "ModuleNotFoundError"
```bash
# Make sure you activated the virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### "Invalid API key" or "Unauthorized"
- Check that `ANTHROPIC_API_KEY` is set correctly in `.env`
- Make sure you're using a valid Anthropic API key (starts with `sk-ant-`)
- Restart the server after updating `.env`

### Server won't start
```bash
# Check if port 4000 is already in use
lsof -i :4000

# Kill the process if needed
kill -9 <PID>

# Or use a different port
python -m uvicorn src.main:app --reload --port 5000
```

### No results or empty routes
- Wait the full 10-15 seconds for search to complete
- Try a different origin airport
- Try a larger budget
- Check server logs for errors

## Next Steps

1. ✅ Backend is running
2. 📊 Test the API and see the route data
3. 🗺️ Build your frontend map visualization
4. 🎨 Use the route data to draw lines and markers
5. 🚀 Deploy!

## Example Origins to Try

| Airport | City | Good For |
|---------|------|----------|
| SAN | San Diego | West Coast routes |
| LAX | Los Angeles | Wide variety |
| JFK | New York | East Coast & International |
| ORD | Chicago | Central US |
| MIA | Miami | Caribbean & South America |
| SEA | Seattle | Pacific Northwest |
| DEN | Denver | Mountain West |

## Support

- **API Documentation**: http://localhost:4000/docs
- **Frontend Integration**: See `FRONTEND_INTEGRATION.md`
- **Architecture Details**: See `design.md`

Happy mapping! 🗺️✈️
