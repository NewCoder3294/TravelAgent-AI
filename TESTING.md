# Testing Guide - Trip Planner Backend

This guide will walk you through testing the backend API step by step.

## Prerequisites Checklist

- [ ] Python 3.11+ installed
- [ ] Redis installed
- [ ] Anthropic API key
- [ ] Parallel API key (already in .env)

## Step-by-Step Testing

### 1. Start Redis

Open a **new terminal window** and run:

```bash
redis-server
```

Keep this terminal open. You should see output like:
```
* Ready to accept connections
```

### 2. Set Up Python Environment

In your **main terminal**, navigate to the backend directory:

```bash
cd /Users/michael/Desktop/Me/trip-planner/backend
```

Create and activate a virtual environment:

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install all required packages (FastAPI, Anthropic, httpx, etc.)

### 4. Verify Your API Keys

Make sure your `.env` file has valid API keys:

```bash
cat ../.env
```

You should see:
- `PARALLEL_API_KEY=FURlScvZooYSq0Nm60G3LQ13yLjDSgd08h9viGHo`
- `ANTHROPIC_API_KEY=sk-ant-...` (your actual key)

If `ANTHROPIC_API_KEY` is not set, edit the file:

```bash
# Open in your editor
nano ../.env

# Or use your preferred editor
code ../.env
```

### 5. Start the Backend Server

```bash
python -m uvicorn src.main:app --reload --port 4000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:4000
INFO:     Application startup complete.
✅ Redis connected
```

**Important**: Keep this terminal open while testing!

---

## Testing Methods

Now that the server is running, you can test it in several ways:

### Method 1: Using the Example Python Script (Recommended)

Open a **new terminal** and run:

```bash
cd /Users/michael/Desktop/Me/trip-planner/backend

# Activate the virtual environment
source venv/bin/activate

# Run the example script
python example_request.py
```

This will:
1. Create a trip search from SAN (San Diego)
2. Poll for progress updates
3. Display results with all destinations, costs, and AI insights

**Expected output:**
```
🔍 Starting trip search...
📍 Origin: SAN
📅 Dates: 2024-12-XX to 2024-12-XX
💰 Budget: $1500

1️⃣  Creating search job...
✅ Job created: abc123

2️⃣  Polling for status updates...
   Progress: 10% - Searching for flights...
   Progress: 20% - Analyzing flight options with AI...
   Progress: 30% - Researching 10 destinations in parallel...
   ...
   Progress: 100% - Search completed!

✅ Search completed!

3️⃣  Fetching results...
================================================================================
TRIP SEARCH RESULTS
================================================================================

📊 Searched: 10 destinations
✅ Feasible: 6 destinations
⏱️  Execution time: 12.34s

1. Las Vegas, USA (LAS)
   Status: ✅ FEASIBLE
   Total Cost: $1029.00
   Remaining: $471.00

   Breakdown:
   - Flight: $89.00
   - Accommodation: $550.00
   - Food: $390.00
   - Attractions: $0.00

   💡 Insights: Vegas offers many free attractions...
   💰 Tips:
      • Stay off-strip for cheaper hotels
      • Use buffet deals
      • Walk the strip instead of taxis
```

### Method 2: Using curl (Command Line)

**Step 1: Create a search job**

```bash
curl -X POST http://localhost:4000/api/v1/trips/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "SAN",
    "date_range": {
      "start": "2024-12-15",
      "end": "2024-12-20"
    },
    "budget": 1500,
    "preferences": {
      "include_activities": true
    }
  }'
```

**Response:**
```json
{
  "job_id": "abc123xyz",
  "status": "processing",
  "created_at": "2024-11-01T10:30:00Z"
}
```

**Step 2: Check status (replace abc123xyz with your actual job_id)**

```bash
curl http://localhost:4000/api/v1/trips/status/abc123xyz
```

**Step 3: Get results (when status is "completed")**

```bash
curl http://localhost:4000/api/v1/trips/results/abc123xyz | jq
```

(Note: `jq` prettifies JSON output. Install with `brew install jq`)

### Method 3: Using a GUI Tool (Postman/Insomnia)

1. **Download Postman** or **Insomnia** (free API testing tools)

2. **Create a new POST request:**
   - URL: `http://localhost:4000/api/v1/trips/search`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "origin": "LAX",
       "date_range": {
         "start": "2024-12-01",
         "end": "2024-12-07"
       },
       "budget": 2000,
       "preferences": {
         "include_activities": true
       }
     }
     ```

3. **Send the request** and save the `job_id`

4. **Create a GET request:**
   - URL: `http://localhost:4000/api/v1/trips/results/{job_id}`
   - Wait 10-15 seconds, then send

### Method 4: Using Your Browser

1. **Open your browser** and go to:
   ```
   http://localhost:4000/docs
   ```

2. **You'll see the FastAPI interactive docs** (Swagger UI)

3. **Click on** `POST /api/v1/trips/search`

4. **Click "Try it out"**

5. **Edit the request body** and click "Execute"

6. **Copy the job_id** from the response

7. **Use** `GET /api/v1/trips/results/{job_id}` to get results

---

## Sample Test Cases

### Test 1: Budget Trip from San Diego

```json
{
  "origin": "SAN",
  "date_range": {
    "start": "2024-12-10",
    "end": "2024-12-15"
  },
  "budget": 800
}
```

Expected: Nearby destinations like Las Vegas, Tijuana, Phoenix

### Test 2: Moderate Budget from Los Angeles

```json
{
  "origin": "LAX",
  "date_range": {
    "start": "2025-01-15",
    "end": "2025-01-22"
  },
  "budget": 2000
}
```

Expected: More distant destinations, possibly international

### Test 3: High Budget from New York

```json
{
  "origin": "JFK",
  "date_range": {
    "start": "2025-02-01",
    "end": "2025-02-08"
  },
  "budget": 3500
}
```

Expected: Wide range of domestic and international options

---

## Troubleshooting

### Issue: "Connection refused" error

**Solution:**
```bash
# Start Redis in a new terminal
redis-server
```

### Issue: "Module not found" error

**Solution:**
```bash
# Make sure you're in the backend directory
cd /Users/michael/Desktop/Me/trip-planner/backend

# Make sure venv is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "API key not found" error

**Solution:**
- Make sure `.env` file has `ANTHROPIC_API_KEY` set
- Restart the server after updating `.env`

### Issue: "No flights found" or empty results

**Possible causes:**
- Parallel API might be rate-limited (wait a minute and try again)
- Try a different origin airport code
- Try a larger budget

### Issue: Server crashes or throws errors

**Solution:**
```bash
# Check server logs in the terminal where uvicorn is running
# Common issues:
# 1. Redis not connected - start redis-server
# 2. Invalid API keys - check .env
# 3. Network issues - check internet connection
```

### Check Server Logs

The server will print detailed logs. Look for:
- ✅ Redis connected
- 🔍 Searching flights
- 💡 Found X flight options
- ⚠️ Warnings or errors

---

## Expected Performance

- **Job creation**: Instant (< 100ms)
- **Search execution**: 8-15 seconds
- **Cached results**: < 1 second
- **Status check**: < 50ms

---

## Next Steps

Once testing is successful:

1. ✅ Backend is working
2. ⏭️  Build frontend (React/Next.js)
3. 🔗 Connect frontend to backend API
4. 🚀 Deploy to production

---

## Quick Commands Reference

```bash
# Start Redis (in separate terminal)
redis-server

# Start backend server
cd backend
source venv/bin/activate
python -m uvicorn src.main:app --reload --port 4000

# Run example test
python example_request.py

# Test with curl
curl -X POST http://localhost:4000/api/v1/trips/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"SAN","date_range":{"start":"2024-12-15","end":"2024-12-20"},"budget":1500}'

# View API docs
open http://localhost:4000/docs
```
