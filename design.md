# Architecture: Live Budget Map (Claude-Powered with Parallel Search)

This document outlines the architecture for a web application that allows a user to find feasible travel destinations based on a total trip budget, including flights, hotels, and local costs.

## Overview

This is a **backend-heavy, AI agent-driven system** powered by the **Claude SDK** and **parallel search APIs**. The architecture is asynchronous, designed to handle long-running, complex research tasks without blocking the user interface. It consists of a thin frontend client, a Node.js/TypeScript backend using Claude SDK for orchestration, parallel search workers for data gathering, and a task queue to manage asynchronous operations.



---

## 1. Frontend (Client)

The frontend is a "thin client" responsible only for user input and data visualization.

* **Stack:**
    * **Framework:** React (Next.js) or Svelte (SvelteKit)
    * **Mapping:** Mapbox GL JS or Leaflet.js
    * **Real-time:** `socket.io-client`
    * **Styling:** Tailwind CSS

* **Key Responsibilities:**
    1.  Provide a simple UI for user input:
        * Origin Airport (e.g., "SAN")
        * Date Range (e.g., "Nov 15 - Nov 20", which implies 5 nights)
        * Total Trip Budget (e.g., "$1500")
    2.  On submit, send this data via an HTTP POST request to the Backend API.
    3.  Receive a `jobId` (e.g., `job-12345`) back from the API immediately.
    4.  Instantly open a WebSocket connection to the API server and "subscribe" to updates for that `jobId`.
    5.  Display a loading/progress state (e.g., "Agent is researching flights...").
    6.  When a "COMPLETED" message arrives via WebSocket, receive the final JSON payload.
    7.  Parse the JSON and render the results on the map (e.g., color-coding pins green for "feasible" and red for "over budget").
    8.  Display detailed results (est. flight cost, hotel, food) in a popup or sidebar when a user clicks a pin.

---

## 2. Backend API (Web Server / Agent Orchestrator)

This server manages requests, orchestrates the Claude agent, and coordinates parallel search operations.

* **Stack:**
    * **Framework:** Node.js (TypeScript) + Fastify or Express
    * **AI Agent:** `@anthropic-ai/sdk` (Claude SDK)
    * **Parallel Search:** Tavily API, SerpAPI, or similar search aggregators
    * **Real-time:** `socket.io` (server-side)
    * **Task Queue:** BullMQ (Redis-backed)

* **API Endpoints:**

    **POST /api/v1/trips/search**
    * **Description:** Creates a new trip search job
    * **Request Body:**
      ```json
      {
        "origin": "SAN",
        "dateRange": {
          "start": "2024-11-15",
          "end": "2024-11-20"
        },
        "budget": 1500,
        "preferences": {
          "includeActivities": true,
          "maxFlightHours": 12
        }
      }
      ```
    * **Response:** `202 Accepted`
      ```json
      {
        "jobId": "job-12345",
        "status": "processing",
        "createdAt": "2024-11-01T10:30:00Z"
      }
      ```

    **GET /api/v1/trips/status/:jobId**
    * **Description:** Get the current status of a trip search job
    * **Response:**
      ```json
      {
        "jobId": "job-12345",
        "status": "completed|processing|failed",
        "progress": 75,
        "message": "Analyzing accommodation options...",
        "updatedAt": "2024-11-01T10:30:45Z"
      }
      ```

    **GET /api/v1/trips/results/:jobId**
    * **Description:** Retrieve completed trip search results
    * **Response:** (see Results Schema below)

    **WebSocket /ws**
    * **Events:**
      * `subscribe`: `{ jobId: "job-12345" }`
      * `progress`: `{ jobId, progress, message }`
      * `completed`: `{ jobId, results }`
      * `error`: `{ jobId, error }`

* **Key Responsibilities:**
    1.  Accept trip search requests and generate unique `jobId`
    2.  Queue jobs using BullMQ for asynchronous processing
    3.  Orchestrate Claude agent to analyze search results and make decisions
    4.  Coordinate parallel search queries for flights, hotels, food, and attractions
    5.  Manage WebSocket connections for real-time progress updates
    6.  Store intermediate and final results in Redis
    7.  Handle error states and retry logic

---

## 3. Parallel Search Layer

The data aggregation layer that performs concurrent searches across multiple domains.

* **Stack:**
    * **Search APIs:**
      * **Tavily API** - Parallel web search for real-time data
      * **SerpAPI** or **Google Search API** - Backup/supplementary search
      * **Flight APIs:** Skyscanner API, Amadeus API, or Google Flights scraper
      * **Accommodation APIs:** Booking.com API, Hotels.com, or similar
    * **Orchestration:** Node.js with Promise.all() for parallel execution

* **Search Modules:**

    **FlightSearchModule**
    * Query multiple flight data sources simultaneously
    * Find cheapest destinations from origin within date range
    * Return top 15-20 destinations sorted by price
    * Cache results in Redis (TTL: 1 hour)

    **AccommodationSearchModule**
    * For each candidate destination, search hotel/accommodation prices
    * Use parallel queries to multiple booking platforms
    * Calculate average nightly rate
    * Include range (budget to mid-range options)

    **FoodCostSearchModule**
    * Search "average daily food cost in [City]"
    * Query multiple sources: Numbeo, Budget Your Trip, travel blogs
    * Use Claude to parse and synthesize pricing from search results
    * Return estimated daily food budget

    **AttractionSearchModule**
    * Search "free attractions in [City]" and "top things to do in [City]"
    * Identify free vs paid activities
    * Extract costs for major tourist attractions
    * Use Claude to summarize and categorize

* **Key Responsibilities:**
    1.  Execute search queries in parallel using Promise.all()
    2.  Aggregate and deduplicate results from multiple sources
    3.  Cache search results to minimize API calls
    4.  Handle rate limiting and retries
    5.  Return structured data to Claude agent for analysis

---

## 4. Claude Agent Worker (The "Brain")

This is the intelligent orchestrator powered by Claude SDK. It analyzes search data, makes budgeting decisions, and synthesizes recommendations.

* **Stack:**
    * **Language:** Node.js (TypeScript)
    * **AI Agent:** `@anthropic-ai/sdk` with streaming
    * **Task Management:** BullMQ Workers
    * **Tools:**
        * Parallel Search Layer (via internal API calls)
        * Budget calculation utilities
        * Data aggregation and deduplication logic

* **Agent Workflow (Claude-Orchestrated):**

    **Phase 1: Initial Flight Discovery**
    ```typescript
    // Trigger parallel flight search
    const flightResults = await searchFlights({
      origin: job.origin,
      dateRange: job.dateRange,
      maxResults: 20
    });

    // Claude analyzes and filters candidates
    const prompt = `Given a budget of ${job.budget} and these flight options:
    ${JSON.stringify(flightResults)}

    Filter destinations where flight cost is < 60% of total budget.
    Return top 10 candidates as JSON array with: city, airport, price, reasoning`;

    const candidates = await claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: prompt }],
      tools: [/* budget calculator tool */]
    });
    ```

    **Phase 2: Parallel Multi-Domain Research**
    ```typescript
    // For each candidate, launch parallel searches
    const detailedData = await Promise.all(
      candidates.map(async (destination) => {
        const [accommodation, food, attractions] = await Promise.all([
          searchAccommodation(destination.city, job.dateRange),
          searchFoodCosts(destination.city),
          searchAttractions(destination.city)
        ]);

        return { destination, accommodation, food, attractions };
      })
    );
    ```

    **Phase 3: Claude Analysis & Budget Synthesis**
    ```typescript
    // Claude analyzes all data and makes final recommendations
    const analysis = await claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      messages: [{
        role: "user",
        content: `Analyze these destinations for a ${job.budget} budget trip:
        ${JSON.stringify(detailedData)}

        Calculate total costs (flight + accommodation + food + attractions).
        Mark each as feasible/not feasible.
        Provide money-saving tips for each destination.
        Output as structured JSON.`
      }],
      tools: [
        {
          name: "calculate_trip_cost",
          description: "Calculate total trip cost with breakdown",
          input_schema: { /* ... */ }
        }
      ]
    });
    ```

    **Phase 4: Result Finalization**
    * Store complete results in Redis with key `result:${jobId}`
    * Emit progress updates via Socket.io
    * Publish completion event to notify API server
    * Cache successful searches for similar queries

* **Key Responsibilities:**
    1.  Process jobs from BullMQ queue
    2.  Orchestrate parallel search operations
    3.  Use Claude to intelligently filter and prioritize destinations
    4.  Calculate accurate budget breakdowns with Claude's reasoning
    5.  Generate natural language explanations for recommendations
    6.  Handle edge cases (no flights available, over budget, etc.)
    7.  Provide real-time progress updates to frontend

---

## User Workflow (Step-by-Step)

1.  **User** -> **Frontend:** Enters "SAN", "Nov 15-20", "$1200".
2.  **Frontend** -> **API (HTTP):** `POST /api/v1/trips/search` with user data.
3.  **API** -> **BullMQ:** Creates job `{job: "job-12345", data: ...}` in queue.
4.  **API** -> **Frontend (HTTP):** Responds `202 Accepted` with `{"jobId": "job-12345", "status": "processing"}`.
5.  **Frontend** -> **API (WebSocket):** Connects to `/ws` and subscribes to `"job-12345"`.
6.  **Claude Agent Worker** -> **BullMQ:** Picks up `job-12345` from queue.

7.  **Claude Agent (Phase 1 - Flight Discovery):**
    * Worker emits: `{progress: 10, message: "Searching for flights..."}`
    * Calls Parallel Search: `searchFlights("SAN", "Nov 15-20")`
    * Receives 20 flight options in 2-3 seconds
    * Claude filters: "Keep only flights < 60% of $1200 budget"
    * Result: 12 candidate destinations

8.  **Claude Agent (Phase 2 - Parallel Multi-Domain Search):**
    * Worker emits: `{progress: 30, message: "Researching 12 destinations..."}`
    * Launches parallel searches using Promise.all():
      ```
      For LAS, TIJ, PHX, SEA, DEN, AUS... (in parallel):
        - searchAccommodation()
        - searchFoodCosts()
        - searchAttractions()
      ```
    * All 12 destinations researched simultaneously (4-6 seconds total)
    * Worker emits: `{progress: 60, message: "Analyzing costs..."}`

9.  **Claude Agent (Phase 3 - Intelligent Analysis):**
    * Worker emits: `{progress: 80, message: "Calculating budgets with AI..."}`
    * Claude analyzes all data:
      * LAS: Flight $89 + Hotel $110/night × 5 + Food $65/day × 6 = $1029 ✓
      * TIJ: Flight $45 + Hotel $60/night × 5 + Food $40/day × 6 = $585 ✓
      * SEA: Flight $150 + Hotel $180/night × 5 + Food $85/day × 6 = $1560 ✗
    * Claude adds insights: "LAS has many free attractions. TIJ offers best value."
    * Creates final JSON with recommendations

10. **Claude Agent (Phase 4 - Completion):**
    * Saves result to Redis: `result:job-12345`
    * Worker emits: `{progress: 100, status: "completed"}`

11. **API** -> **Frontend (WebSocket):**
    * Receives completion event
    * Fetches final result from Redis
    * Pushes complete JSON to client:
      ```json
      {
        "destinations": [
          {
            "city": "Las Vegas",
            "airport": "LAS",
            "coordinates": [36.1699, -115.1398],
            "isFeasible": true,
            "totalCost": 1029,
            "breakdown": {
              "flight": 89,
              "accommodation": 550,
              "food": 390,
              "attractions": 0
            },
            "confidence": "high",
            "aiInsights": "Vegas offers many free attractions...",
            "savingsTips": ["Stay off-strip for cheaper hotels", "Use buffet deals"]
          }
        ]
      }
      ```

12. **Frontend:**
    * Receives complete data
    * Loading spinner disappears
    * Map pins render with color coding (green = feasible, red = over budget)
    * User clicks LAS pin -> Shows breakdown modal with AI insights

**Total Time:** ~8-12 seconds (vs 30-60s sequential)

---

## 5. Results Schema

The final output returned to the frontend follows this structure:

```typescript
interface TripSearchResult {
  jobId: string;
  status: 'completed' | 'partial' | 'failed';
  query: {
    origin: string;
    dateRange: DateRange;
    budget: number;
    nights: number;
  };
  destinations: Destination[];
  searchMetadata: {
    totalSearched: number;
    feasibleCount: number;
    executionTime: number;
    timestamp: string;
  };
}

interface Destination {
  city: string;
  country: string;
  airport: string;
  coordinates: [number, number]; // [lat, lng]
  isFeasible: boolean;
  totalCost: number;
  remainingBudget: number;
  confidence: 'high' | 'medium' | 'low';

  breakdown: {
    flight: number;
    accommodation: number;
    food: number;
    attractions: number;
  };

  details: {
    flightInfo: {
      price: number;
      airline?: string;
      duration?: string;
    };
    accommodationInfo: {
      avgNightlyRate: number;
      totalNights: number;
      range: { min: number; max: number };
      options: string[]; // ["Budget hotels from $80/night", "Mid-range $110/night"]
    };
    foodInfo: {
      avgDailyBudget: number;
      totalDays: number;
      priceLevel: 'budget' | 'moderate' | 'expensive';
    };
    attractionInfo: {
      freeAttractions: string[];
      paidAttractions: Array<{ name: string; cost: number }>;
      estimatedActivityCost: number;
    };
  };

  aiInsights: string; // Claude-generated natural language summary
  savingsTips: string[]; // ["Book hotels near downtown", "Use public transit"]
  warnings?: string[]; // ["Limited accommodation options", "Peak season pricing"]
}
```

---

## 6. Technology Stack Summary

### Backend (Node.js/TypeScript)
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "fastify": "^4.26.0",
    "@fastify/websocket": "^10.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.0",
    "socket.io": "^4.6.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0"
  },
  "searchAPIs": {
    "tavily": "For parallel web search",
    "serpapi": "Backup search provider",
    "amadeus": "Flight data API",
    "rapidapi": "Hotels and accommodation"
  }
}
```

### Frontend (React/Next.js)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "mapbox-gl": "^3.0.0",
    "socket.io-client": "^4.6.0",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### Infrastructure
- **Redis**: Job queue, caching, pub/sub
- **BullMQ**: Distributed task queue with retry logic
- **Docker**: Containerization for deployment

---

## 7. Caching & Performance Strategy

### Redis Caching Layers

**1. Flight Data Cache**
- **Key Pattern:** `flight:${origin}:${dateHash}`
- **TTL:** 1 hour
- **Purpose:** Avoid redundant flight API calls for same origin/dates

**2. Destination Data Cache**
- **Key Pattern:** `destination:${city}:accommodation|food|attractions`
- **TTL:** 24 hours
- **Purpose:** Cache city-specific pricing data

**3. Job Results Cache**
- **Key Pattern:** `result:${jobId}`
- **TTL:** 7 days
- **Purpose:** Allow users to revisit results

**4. Search Deduplication**
- **Key Pattern:** `search:${queryHash}`
- **TTL:** 30 minutes
- **Purpose:** Return cached results for identical queries

### Parallel Execution Optimization

```typescript
// Example: Nested parallel execution for maximum speed
async function processDestinations(candidates: Candidate[]) {
  // Outer parallelization: All destinations at once
  return await Promise.all(
    candidates.map(async (destination) => {
      // Inner parallelization: All data types for each destination
      const [accommodation, food, attractions] = await Promise.all([
        searchWithCache('accommodation', destination.city),
        searchWithCache('food', destination.city),
        searchWithCache('attractions', destination.city)
      ]);

      return { destination, accommodation, food, attractions };
    })
  );
}
```

---

## 8. Error Handling & Resilience

### API Error Responses

**Rate Limiting**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

**Partial Results**
```json
{
  "status": "partial",
  "destinations": [...], // Successfully analyzed destinations
  "errors": [
    {
      "city": "Tokyo",
      "reason": "Flight data unavailable",
      "severity": "warning"
    }
  ]
}
```

### Retry Logic (BullMQ)

```typescript
const jobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: {
    age: 86400 // 24 hours
  },
  removeOnFail: {
    age: 604800 // 7 days
  }
};
```

### Claude API Fallbacks

```typescript
// If Claude API fails, fall back to deterministic calculation
try {
  const analysis = await claude.messages.create({...});
} catch (error) {
  // Fallback to simple math-based budget calculation
  return calculateBudgetDeterministic(searchData);
}
```

---

## 9. Claude Agent Tools Definition

The Claude agent uses custom tools for structured budget analysis:

```typescript
const tools = [
  {
    name: "calculate_trip_cost",
    description: "Calculates total trip cost with detailed breakdown",
    input_schema: {
      type: "object",
      properties: {
        flight_cost: { type: "number" },
        nightly_rate: { type: "number" },
        nights: { type: "number" },
        daily_food_cost: { type: "number" },
        days: { type: "number" },
        attraction_costs: {
          type: "array",
          items: { type: "number" }
        }
      },
      required: ["flight_cost", "nightly_rate", "nights", "daily_food_cost", "days"]
    }
  },
  {
    name: "assess_feasibility",
    description: "Determines if destination fits within budget constraints",
    input_schema: {
      type: "object",
      properties: {
        total_cost: { type: "number" },
        budget: { type: "number" },
        buffer_percentage: { type: "number", default: 10 }
      },
      required: ["total_cost", "budget"]
    }
  },
  {
    name: "generate_savings_tips",
    description: "Generates money-saving recommendations for a destination",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string" },
        cost_breakdown: { type: "object" },
        free_attractions: { type: "array", items: { type: "string" } }
      },
      required: ["city", "cost_breakdown"]
    }
  }
];
```

---

## 10. Deployment Architecture

### Development Environment
```
Frontend (Next.js dev server) :3000
Backend API (Fastify) :4000
Redis :6379
BullMQ Worker process (Node.js)
```

### Production (Docker Compose)

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
      - NEXT_PUBLIC_WS_URL=ws://api:4000

  api:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
    depends_on:
      - redis

  worker:
    build: ./backend
    command: node dist/worker.js
    environment:
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - redis
    deploy:
      replicas: 2  # Scale workers horizontally

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Scaling Strategy

**Horizontal Scaling:**
- Scale worker processes: 2-5 workers for production
- Each worker processes jobs from shared BullMQ queue
- Workers auto-scale based on queue depth

**Vertical Scaling:**
- Increase worker memory for handling more concurrent searches
- Redis memory allocation for larger caches

---

## 11. Key Advantages of This Architecture

1. **Speed:** Parallel search reduces latency from 30-60s to 8-12s
2. **Intelligence:** Claude provides natural language insights and smart filtering
3. **Scalability:** Horizontal worker scaling handles traffic spikes
4. **Resilience:** BullMQ retry logic and error handling ensure reliability
5. **User Experience:** Real-time WebSocket updates show progress
6. **Cost Efficiency:** Redis caching minimizes redundant API calls
7. **Flexibility:** Easy to add new search sources or data types
8. **Modern Stack:** TypeScript throughout for type safety