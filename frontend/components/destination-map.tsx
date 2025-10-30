"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { DestinationSummary } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, MapPin, Calendar, Thermometer, TrendingUp } from "lucide-react"

interface DestinationMapProps {
  destinations: DestinationSummary[]
  onDestinationClick?: (destination: DestinationSummary) => void
  selectedDestinationId?: string | null
  className?: string
}

export function DestinationMap({
  destinations,
  onDestinationClick,
  selectedDestinationId,
  className = "",
}: DestinationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [selectedDestination, setSelectedDestination] = useState<DestinationSummary | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Create map instance
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
      },
      center: [0, 20],
      zoom: 1.5,
    })

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right"
    )

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add/update markers when destinations change
  useEffect(() => {
    if (!mapRef.current || !destinations.length) return

    const map = mapRef.current

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Calculate bounds for all destinations
    const bounds = new maplibregl.LngLatBounds()

    // Add new markers
    const newMarkers = destinations.map((destination) => {
      const { lat, lng } = destination.coordinates

      // Create custom marker element
      const el = document.createElement("div")
      el.className = "destination-marker"

      const isSelected = selectedDestinationId === destination.id

      el.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="absolute -inset-2 bg-blue-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-md"></div>
          <div class="relative w-10 h-10 ${
            isSelected ? "bg-blue-600" : "bg-red-500"
          } rounded-full border-4 border-white shadow-lg group-hover:scale-110 transition-all flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            ${destination.name}
          </div>
        </div>
      `

      // Create marker
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .addTo(map)

      // Add click handler
      el.addEventListener("click", () => {
        setSelectedDestination(destination)
        onDestinationClick?.(destination)

        // Fly to the destination
        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 6),
          duration: 1000,
        })
      })

      // Add to bounds
      bounds.extend([lng, lat])

      return marker
    })

    markersRef.current = newMarkers

    // Fit map to show all markers
    if (destinations.length > 0) {
      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 350 }, // Extra right padding for detail panel
        maxZoom: 10,
        duration: 1000,
      })
    }
  }, [destinations, selectedDestinationId, onDestinationClick])

  // Update selected marker when selectedDestinationId changes
  useEffect(() => {
    if (selectedDestinationId) {
      const destination = destinations.find((d) => d.id === selectedDestinationId)
      if (destination) {
        setSelectedDestination(destination)

        // Fly to the destination
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [destination.coordinates.lng, destination.coordinates.lat],
            zoom: Math.max(mapRef.current.getZoom(), 6),
            duration: 1000,
          })
        }
      }
    }
  }, [selectedDestinationId, destinations])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Destination Detail Panel */}
      {selectedDestination && (
        <Card className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-auto shadow-2xl">
          <div className="relative">
            {selectedDestination.imageUrl && (
              <div className="relative h-48 w-full">
                <img
                  src={selectedDestination.imageUrl}
                  alt={selectedDestination.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  onClick={() => setSelectedDestination(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!selectedDestination.imageUrl && (
              <div className="flex justify-end p-4 pb-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDestination(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{selectedDestination.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {selectedDestination.country}, {selectedDestination.continent}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedDestination.description}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Best Time to Visit</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDestination.bestTimeToVisit}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Thermometer className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Temperature Range</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDestination.averageTempRange}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Popularity Score</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                          style={{ width: `${selectedDestination.popularityScore}%` }}
                        />
                      </div>
                      <Badge variant="secondary">{selectedDestination.popularityScore}/100</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" onClick={() => onDestinationClick?.(selectedDestination)}>
                  Plan Trip to {selectedDestination.name}
                </Button>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 p-4 shadow-lg">
        <div className="space-y-2">
          <div className="text-sm font-semibold mb-3">Map Legend</div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-md"></div>
            <span className="text-sm text-muted-foreground">Destination</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-md"></div>
            <span className="text-sm text-muted-foreground">Selected</span>
          </div>
          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Click on any marker to view details
          </div>
        </div>
      </Card>
    </div>
  )
}
