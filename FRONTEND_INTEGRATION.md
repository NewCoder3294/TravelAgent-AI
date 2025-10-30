# Frontend Integration Guide

This guide explains how to integrate the backend API with your map-based frontend.

## Overview

The backend returns a **hub-and-spoke route visualization** model:
- **Hub**: Your origin airport (home base)
- **Routes**: Lines from hub to each destination with all travel data
- **Map Bounds**: Recommended viewport to show all routes

## API Response Structure

### Complete Response Example

```json
{
  "job_id": "abc123xyz",
  "status": "completed",

  // Query that was searched
  "query": {
    "origin": "SAN",
    "dateRange": {
      "start": "2024-12-15",
      "end": "2024-12-20"
    },
    "budget": 1500,
    "nights": 5
  },

  // Hub (Origin) - Your home base
  "hub": {
    "airport_code": "SAN",
    "city": "San Diego",
    "country": "USA",
    "coordinates": {
      "lat": 32.7338,
      "lng": -117.1933
    }
  },

  // All routes from hub to destinations
  "routes": [
    {
      "destination_id": "r1a2b3c4",  // Unique ID for this route

      // Destination info
      "city": "Las Vegas",
      "country": "USA",
      "airport": "LAS",
      "coordinates": {
        "lat": 36.0840,
        "lng": -115.1537
      },

      // Route path data (for drawing lines on map)
      "route_path": {
        "start": {
          "lat": 32.7338,
          "lng": -117.1933
        },
        "end": {
          "lat": 36.0840,
          "lng": -115.1537
        },
        "distance_km": 420.5,
        "flight_duration": "1h 15m"
      },

      // Financial data
      "is_feasible": true,
      "total_cost": 1029.00,
      "remaining_budget": 471.00,
      "confidence": "high",

      "breakdown": {
        "flight": 89.00,
        "accommodation": 550.00,
        "food": 390.00,
        "attractions": 0.00
      },

      // Detailed info (shown when route is clicked)
      "details": {
        "flight_info": {
          "price": 89.00,
          "airline": "Southwest",
          "duration": "1h 15m"
        },
        "accommodation_info": {
          "avg_nightly_rate": 110.00,
          "total_nights": 5,
          "range": {"min": 60.00, "max": 200.00},
          "options": [
            "Budget hotels from $60/night",
            "Mid-range hotels from $110/night"
          ]
        },
        "food_info": {
          "avg_daily_budget": 65.00,
          "total_days": 6,
          "price_level": "moderate"
        },
        "attraction_info": {
          "free_attractions": [
            "Bellagio Fountains",
            "Fremont Street",
            "Welcome to Las Vegas Sign"
          ],
          "paid_attractions": [
            {"name": "High Roller", "cost": 30.00}
          ],
          "estimated_activity_cost": 0.00
        }
      },

      // AI-generated insights
      "ai_insights": "Las Vegas offers excellent value with many free attractions. The strip provides endless entertainment without spending money.",

      "savings_tips": [
        "Stay off-strip for cheaper hotels",
        "Use buffet lunch deals instead of dinner",
        "Walk the strip instead of taking taxis"
      ],

      "warnings": null
    },
    // ... more routes
  ],

  // Map visualization settings
  "map_bounds": {
    "north": 40.0,
    "south": 30.0,
    "east": -110.0,
    "west": -120.0
  },
  "recommended_zoom": 6,

  // Search metadata
  "search_metadata": {
    "total_searched": 12,
    "feasible_count": 8,
    "execution_time": 10.5,
    "timestamp": "2024-11-01T10:30:45Z"
  }
}
```

## Frontend Implementation Guide

### 1. Display the Hub (Origin)

```javascript
// When results arrive
const { hub, routes, map_bounds, recommended_zoom } = apiResponse;

// Add hub marker to map (special style - larger, different color)
const hubMarker = {
  type: 'hub',
  coordinates: [hub.coordinates.lng, hub.coordinates.lat],
  airport: hub.airport_code,
  city: hub.city,
  label: `${hub.city} (${hub.airport_code})`,
  icon: 'hub-icon' // Your custom hub icon
};

map.addMarker(hubMarker);
```

### 2. Draw Routes (Lines from Hub to Destinations)

```javascript
routes.forEach(route => {
  // Draw route line on map
  const routeLine = {
    id: route.destination_id,
    coordinates: [
      [route.route_path.start.lng, route.route_path.start.lat],
      [route.route_path.end.lng, route.route_path.end.lat]
    ],
    // Style based on feasibility
    color: route.is_feasible ? '#00ff00' : '#ff0000',  // Green if feasible, red if not
    width: 2,
    opacity: 0.7
  };

  map.addLine(routeLine);
});
```

### 3. Add Destination Markers

```javascript
routes.forEach(route => {
  const marker = {
    id: route.destination_id,
    coordinates: [route.coordinates.lng, route.coordinates.lat],
    city: route.city,
    airport: route.airport,
    // Style based on feasibility
    color: route.is_feasible ? 'green' : 'red',
    // Data to show in popup
    data: {
      totalCost: route.total_cost,
      remainingBudget: route.remaining_budget,
      breakdown: route.breakdown
    }
  };

  map.addMarker(marker);
});
```

### 4. Handle Route Click (Show Details)

```javascript
// When user clicks on a route or destination
function onRouteClick(destinationId) {
  const route = routes.find(r => r.destination_id === destinationId);

  if (!route) return;

  // Show detail panel with all information
  showDetailPanel({
    title: `${route.city}, ${route.country}`,
    subtitle: `${route.airport} - ${route.route_path.distance_km} km away`,

    // Cost summary
    totalCost: route.total_cost,
    isFeasible: route.is_feasible,
    remainingBudget: route.remaining_budget,

    // Breakdown
    breakdown: route.breakdown,

    // Flight details
    flight: route.details.flight_info,

    // Accommodation details
    accommodation: route.details.accommodation_info,

    // Food details
    food: route.details.food_info,

    // Attractions
    attractions: route.details.attraction_info,

    // AI insights
    insights: route.ai_insights,
    savingsTips: route.savings_tips,
    warnings: route.warnings
  });
}
```

### 5. Set Map Viewport

```javascript
// Fit map to show all routes
map.fitBounds([
  [map_bounds.west, map_bounds.south],  // Southwest corner
  [map_bounds.east, map_bounds.north]   // Northeast corner
], {
  padding: 50,
  zoom: recommended_zoom
});
```

### 6. Interactive Features

#### Highlight Route on Hover

```javascript
function onRouteHover(destinationId) {
  // Highlight the route line
  map.updateLine(destinationId, {
    width: 4,
    opacity: 1.0
  });

  // Pulse the destination marker
  map.pulseMarker(destinationId);
}

function onRouteHoverEnd(destinationId) {
  // Reset route line
  map.updateLine(destinationId, {
    width: 2,
    opacity: 0.7
  });

  // Stop pulsing marker
  map.stopPulse(destinationId);
}
```

#### Filter Routes

```javascript
// Show only feasible routes
function showOnlyFeasible() {
  routes.forEach(route => {
    const visible = route.is_feasible;
    map.setLineVisibility(route.destination_id, visible);
    map.setMarkerVisibility(route.destination_id, visible);
  });
}

// Show all routes
function showAllRoutes() {
  routes.forEach(route => {
    map.setLineVisibility(route.destination_id, true);
    map.setMarkerVisibility(route.destination_id, true);
  });
}
```

#### Sort Routes

```javascript
// Sort by cost (cheapest first)
const sortedByCost = [...routes].sort((a, b) => a.total_cost - b.total_cost);

// Sort by distance (closest first)
const sortedByDistance = [...routes].sort((a, b) =>
  a.route_path.distance_km - b.route_path.distance_km
);

// Sort by feasibility (feasible first)
const sortedByFeasibility = [...routes].sort((a, b) =>
  b.is_feasible - a.is_feasible
);
```

## Example: React Component

```jsx
import React, { useState, useEffect } from 'react';
import Map from './Map';
import RouteList from './RouteList';
import RouteDetail from './RouteDetail';

function TripPlanner() {
  const [tripData, setTripData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Fetch trip search results
  useEffect(() => {
    // Assume we have a job_id from search
    fetch(`/api/v1/trips/results/${jobId}`)
      .then(res => res.json())
      .then(data => setTripData(data));
  }, [jobId]);

  if (!tripData) return <div>Loading...</div>;

  const { hub, routes, map_bounds, recommended_zoom } = tripData;

  return (
    <div className="trip-planner">
      {/* Left sidebar: Route list */}
      <RouteList
        routes={routes}
        onRouteSelect={setSelectedRoute}
        selectedId={selectedRoute?.destination_id}
      />

      {/* Center: Map */}
      <Map
        hub={hub}
        routes={routes}
        bounds={map_bounds}
        zoom={recommended_zoom}
        onRouteClick={route => setSelectedRoute(route)}
      />

      {/* Right sidebar: Route details */}
      {selectedRoute && (
        <RouteDetail
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}
    </div>
  );
}
```

## Mapbox GL JS Example

```javascript
import mapboxgl from 'mapbox-gl';

function initializeMap(tripData) {
  const { hub, routes, map_bounds } = tripData;

  // Initialize map
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    bounds: [
      [map_bounds.west, map_bounds.south],
      [map_bounds.east, map_bounds.north]
    ]
  });

  map.on('load', () => {
    // Add hub marker
    new mapboxgl.Marker({ color: '#4a90e2', scale: 1.5 })
      .setLngLat([hub.coordinates.lng, hub.coordinates.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <h3>${hub.city}</h3>
        <p>${hub.airport_code}</p>
      `))
      .addTo(map);

    // Add route lines
    routes.forEach(route => {
      // Add line
      map.addLayer({
        id: `route-${route.destination_id}`,
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [route.route_path.start.lng, route.route_path.start.lat],
                [route.route_path.end.lng, route.route_path.end.lat]
              ]
            }
          }
        },
        paint: {
          'line-color': route.is_feasible ? '#00ff00' : '#ff0000',
          'line-width': 2,
          'line-opacity': 0.7
        }
      });

      // Add destination marker
      new mapboxgl.Marker({
        color: route.is_feasible ? '#00ff00' : '#ff0000'
      })
        .setLngLat([route.coordinates.lng, route.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <h3>${route.city}</h3>
          <p><strong>$${route.total_cost.toFixed(2)}</strong></p>
          <p>${route.is_feasible ? '✅ Within budget' : '❌ Over budget'}</p>
        `))
        .addTo(map);
    });
  });

  return map;
}
```

## Color Coding Recommendations

```javascript
const colors = {
  // Routes
  feasible: '#22c55e',     // Green for within budget
  overBudget: '#ef4444',   // Red for over budget
  hub: '#3b82f6',          // Blue for origin hub

  // Markers
  feasibleMarker: '#16a34a',
  overBudgetMarker: '#dc2626',
  hubMarker: '#2563eb',

  // Route hover
  routeHover: '#fbbf24',   // Yellow when hovering
};
```

## Testing the API

### Step 1: Make a search request

```bash
curl -X POST http://localhost:4000/api/v1/trips/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "SAN",
    "date_range": {"start": "2024-12-15", "end": "2024-12-20"},
    "budget": 1500
  }'
```

### Step 2: Get results (use job_id from step 1)

```bash
curl http://localhost:4000/api/v1/trips/results/{job_id}
```

### Step 3: Use the response to render your map!

## Questions?

The backend provides all the data you need to create an interactive map:
- ✅ Hub coordinates
- ✅ Route paths (start → end coordinates)
- ✅ Destination markers
- ✅ All cost and detail data for popups
- ✅ Map bounds and zoom level
- ✅ Color coding (feasible vs. over budget)

Just fetch the data and render it on your map library of choice (Mapbox, Leaflet, Google Maps, etc.)!
