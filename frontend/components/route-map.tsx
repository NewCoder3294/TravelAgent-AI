"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Route, Hub } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, MapPin, Plane, DollarSign, AlertCircle, Lightbulb, CheckCircle } from "lucide-react"
import { useTheme } from "next-themes"

interface RouteMapProps {
  hub: Hub
  routes: Route[]
  onRouteClick?: (route: Route) => void
  selectedRouteId?: string | null
  className?: string
  budgetFilter?: number  // Current budget filter for dynamic feasibility
}

export function RouteMap({ hub, routes, onRouteClick, selectedRouteId, className = "", budgetFilter }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const hubMarkerRef = useRef<maplibregl.Marker | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const { theme } = useTheme()

  // Helper to determine if route is feasible based on current budget filter
  const isRouteFeasible = (route: Route) => {
    // If budgetFilter is provided, use it; otherwise fall back to route.is_feasible
    if (budgetFilter !== undefined) {
      return route.total_cost <= budgetFilter
    }
    return route.is_feasible
  }

  // Map styles for light and dark mode
  const getMapStyle = (isDark: boolean) => ({
    version: 8,
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: isDark
          ? ["https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"]
          : ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: isDark
          ? '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "simple-tiles",
        type: "raster",
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  })

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return

    const isDark = theme === "dark"

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(isDark),
      center: [hub.coordinates.lng, hub.coordinates.lat],
      zoom: 3,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(new maplibregl.FullscreenControl(), "top-right")

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update map style when theme changes
  useEffect(() => {
    if (!mapRef.current) return
    const isDark = theme === "dark"
    mapRef.current.setStyle(getMapStyle(isDark))
  }, [theme])

  // Add hub marker and route markers
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    // Clean up old markers and lines
    const cleanupMarkers = () => {
      // Remove destination markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Remove route lines
      routes.forEach((route) => {
        if (map.getLayer(`route-line-${route.destination_id}`)) {
          map.removeLayer(`route-line-${route.destination_id}`)
        }
        if (map.getSource(`route-${route.destination_id}`)) {
          map.removeSource(`route-${route.destination_id}`)
        }
      })
    }

    const setupMarkers = () => {
      // Clean up existing markers first
      cleanupMarkers()

      // Add hub marker (origin) only once
      if (!hubMarkerRef.current) {
        const hubEl = document.createElement("div")
        hubEl.innerHTML = `
          <div class="relative">
            <div class="absolute -inset-3 bg-green-500 rounded-full opacity-30 blur-lg"></div>
            <div class="relative w-12 h-12 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </div>
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-lg whitespace-nowrap shadow-lg">
              ${hub.city} (Origin)
            </div>
          </div>
        `

        hubMarkerRef.current = new maplibregl.Marker({ element: hubEl, anchor: "center" })
          .setLngLat([hub.coordinates.lng, hub.coordinates.lat])
          .addTo(map)
      }

      // Add route markers and lines
      routes.forEach((route) => {
        const isSelected = selectedRouteId === route.destination_id
        const isFeasible = isRouteFeasible(route)

        // Create route line
        if (map.getSource(`route-${route.destination_id}`)) {
          map.removeLayer(`route-line-${route.destination_id}`)
          map.removeSource(`route-${route.destination_id}`)
        }

        map.addSource(`route-${route.destination_id}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [hub.coordinates.lng, hub.coordinates.lat],
                [route.coordinates.lng, route.coordinates.lat],
              ],
            },
          },
        })

        map.addLayer({
          id: `route-line-${route.destination_id}`,
          type: "line",
          source: `route-${route.destination_id}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": isSelected ? "#3b82f6" : isFeasible ? "#10b981" : "#ef4444",
            "line-width": isSelected ? 4 : 2,
            "line-opacity": isSelected ? 1 : 0.6,
            "line-dasharray": isFeasible ? [1] : [2, 2],
          },
        })

        // Destination marker
        const destEl = document.createElement("div")
        destEl.className = "cursor-pointer"
        destEl.innerHTML = `
          <div class="relative group">
            <div class="absolute -inset-2 ${
              isFeasible ? "bg-blue-500" : "bg-red-500"
            } rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-md"></div>
            <div class="relative w-10 h-10 ${
              isSelected
                ? "bg-blue-600 scale-110"
                : isFeasible
                  ? "bg-blue-500"
                  : "bg-red-500 opacity-60"
            } rounded-full border-4 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-all flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
              ${route.city} - $${route.total_cost.toLocaleString()}
            </div>
          </div>
        `

        destEl.addEventListener("click", () => {
          setSelectedRoute(route)
          onRouteClick?.(route)

          // Fly to destination
          map.flyTo({
            center: [route.coordinates.lng, route.coordinates.lat],
            zoom: 6,
            duration: 1000,
          })

          // Highlight the route line
          routes.forEach((r) => {
            if (map.getLayer(`route-line-${r.destination_id}`)) {
              const rFeasible = isRouteFeasible(r)
              map.setPaintProperty(
                `route-line-${r.destination_id}`,
                "line-color",
                r.destination_id === route.destination_id ? "#3b82f6" : rFeasible ? "#10b981" : "#ef4444"
              )
              map.setPaintProperty(
                `route-line-${r.destination_id}`,
                "line-width",
                r.destination_id === route.destination_id ? 4 : 2
              )
              map.setPaintProperty(
                `route-line-${r.destination_id}`,
                "line-opacity",
                r.destination_id === route.destination_id ? 1 : 0.6
              )
            }
          })
        })

        const marker = new maplibregl.Marker({ element: destEl, anchor: "bottom" })
          .setLngLat([route.coordinates.lng, route.coordinates.lat])
          .addTo(map)

        markersRef.current.push(marker)
      })

      // Fit map to show all routes
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([hub.coordinates.lng, hub.coordinates.lat])
      routes.forEach((r) => bounds.extend([r.coordinates.lng, r.coordinates.lat]))

      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: selectedRoute ? 400 : 50 },
        maxZoom: 8,
        duration: 1000,
      })
    }

    if (map.loaded()) {
      setupMarkers()
    } else {
      map.on("load", setupMarkers)
    }
  }, [routes, hub, selectedRouteId, onRouteClick])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Route Detail Panel */}
      {selectedRoute && (
        <Card className="absolute top-4 right-4 w-96 max-h-[calc(100%-2rem)] overflow-auto shadow-2xl">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold">{selectedRoute.city}</h3>
                  {selectedRoute.is_feasible ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedRoute.country}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRoute(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Badge */}
            <Badge variant={selectedRoute.is_feasible ? "default" : "destructive"} className="text-xs">
              {selectedRoute.is_feasible ? `Within Budget - $${selectedRoute.remaining_budget} remaining` : "Over Budget"}
            </Badge>

            {/* Cost Summary */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Cost</span>
                <span className="text-2xl font-bold">${selectedRoute.total_cost.toLocaleString()}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flights</span>
                  <span>${selectedRoute.breakdown.flight.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accommodation</span>
                  <span>${selectedRoute.breakdown.accommodation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Food</span>
                  <span>${selectedRoute.breakdown.food.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attractions</span>
                  <span>${selectedRoute.breakdown.attractions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Flight Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plane className="h-4 w-4 text-blue-500" />
                <span>Flight Details</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Route</span>
                  <span className="font-medium">
                    {selectedRoute.airport} ({selectedRoute.route_path.distance_km.toFixed(0)} km)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="font-medium">{selectedRoute.route_path.flight_duration}</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {selectedRoute.ai_insights && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>AI Insights</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedRoute.ai_insights}</p>
              </div>
            )}

            {/* Savings Tips */}
            {selectedRoute.savings_tips && selectedRoute.savings_tips.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>Money Saving Tips</span>
                </div>
                <ul className="space-y-1">
                  {selectedRoute.savings_tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {selectedRoute.warnings && selectedRoute.warnings.length > 0 && (
              <div className="space-y-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>Warnings</span>
                </div>
                <ul className="space-y-1">
                  {selectedRoute.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                      <span>•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button className="w-full" onClick={() => onRouteClick?.(selectedRoute)}>
                View Full Itinerary
              </Button>
              <Button variant="outline" className="w-full">
                Add to Considering
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 p-4 shadow-lg">
        <div className="space-y-2">
          <div className="text-sm font-semibold mb-3">Route Map</div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 shadow-md"></div>
            <span className="text-sm text-muted-foreground">Origin ({hub.city})</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full border-4 border-white dark:border-gray-800 shadow-md"></div>
            <span className="text-sm text-muted-foreground">Feasible Route</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-red-500 opacity-60 rounded-full border-4 border-white dark:border-gray-800 shadow-md"></div>
            <span className="text-sm text-muted-foreground">Over Budget</span>
          </div>
          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Click routes to view details
          </div>
        </div>
      </Card>
    </div>
  )
}
