"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Location, JournalEntry } from "@/lib/types"

interface InteractiveMapProps {
  locations: Location[]
  entries: JournalEntry[]
  selectedLocation: string | null
  onLocationSelect: (locationId: string) => void
}

export function InteractiveMap({ locations, entries, selectedLocation, onLocationSelect }: InteractiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw world map background (simplified)
    ctx.fillStyle = "#e5e7eb"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw simplified continents
    ctx.fillStyle = "#d1d5db"

    // North America
    ctx.beginPath()
    ctx.ellipse(rect.width * 0.2, rect.height * 0.3, 80, 100, 0, 0, Math.PI * 2)
    ctx.fill()

    // South America
    ctx.beginPath()
    ctx.ellipse(rect.width * 0.25, rect.height * 0.65, 50, 80, 0, 0, Math.PI * 2)
    ctx.fill()

    // Europe
    ctx.beginPath()
    ctx.ellipse(rect.width * 0.5, rect.height * 0.25, 60, 50, 0, 0, Math.PI * 2)
    ctx.fill()

    // Africa
    ctx.beginPath()
    ctx.ellipse(rect.width * 0.52, rect.height * 0.55, 70, 90, 0, 0, Math.PI * 2)
    ctx.fill()

    // Asia
    ctx.beginPath()
    ctx.ellipse(rect.width * 0.7, rect.height * 0.35, 120, 100, 0, 0, Math.PI * 2)
    ctx.fill()

    // Australia
    ctx.beginPath()
    ctx.ellipse(rect.width * 0.8, rect.height * 0.7, 50, 40, 0, 0, Math.PI * 2)
    ctx.fill()

    // Convert lat/lng to canvas coordinates (simplified projection)
    const latLngToCanvas = (lat: number, lng: number) => {
      const x = ((lng + 180) / 360) * rect.width
      const y = ((90 - lat) / 180) * rect.height
      return { x, y }
    }

    // Draw location markers
    locations.forEach((location) => {
      const { x, y } = latLngToCanvas(location.coordinates.lat, location.coordinates.lng)
      const entriesCount = entries.filter((e) => e.locationId === location.id).length

      // Draw marker shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.beginPath()
      ctx.arc(x + 2, y + 2, 8 + entriesCount * 2, 0, Math.PI * 2)
      ctx.fill()

      // Draw marker
      const isSelected = selectedLocation === location.id
      const isHovered = hoveredLocation === location.id

      ctx.fillStyle = isSelected ? "#2563eb" : isHovered ? "#3b82f6" : "#ef4444"
      ctx.beginPath()
      ctx.arc(x, y, 8 + entriesCount * 2, 0, Math.PI * 2)
      ctx.fill()

      // Draw marker border
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw entry count
      if (entriesCount > 0) {
        ctx.fillStyle = "white"
        ctx.font = "bold 10px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(entriesCount.toString(), x, y)
      }
    })
  }, [locations, entries, selectedLocation, hoveredLocation])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert lat/lng to canvas coordinates
    const latLngToCanvas = (lat: number, lng: number) => {
      const canvasX = ((lng + 180) / 360) * rect.width
      const canvasY = ((90 - lat) / 180) * rect.height
      return { x: canvasX, y: canvasY }
    }

    // Check if click is near any location
    for (const location of locations) {
      const { x: locX, y: locY } = latLngToCanvas(location.coordinates.lat, location.coordinates.lng)
      const entriesCount = entries.filter((e) => e.locationId === location.id).length
      const radius = 8 + entriesCount * 2

      const distance = Math.sqrt((x - locX) ** 2 + (y - locY) ** 2)
      if (distance <= radius + 5) {
        onLocationSelect(location.id)
        return
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert lat/lng to canvas coordinates
    const latLngToCanvas = (lat: number, lng: number) => {
      const canvasX = ((lng + 180) / 360) * rect.width
      const canvasY = ((90 - lat) / 180) * rect.height
      return { x: canvasX, y: canvasY }
    }

    // Check if mouse is near any location
    let foundHover = false
    for (const location of locations) {
      const { x: locX, y: locY } = latLngToCanvas(location.coordinates.lat, location.coordinates.lng)
      const entriesCount = entries.filter((e) => e.locationId === location.id).length
      const radius = 8 + entriesCount * 2

      const distance = Math.sqrt((x - locX) ** 2 + (y - locY) ** 2)
      if (distance <= radius + 5) {
        setHoveredLocation(location.id)
        canvas.style.cursor = "pointer"
        foundHover = true
        break
      }
    }

    if (!foundHover) {
      setHoveredLocation(null)
      canvas.style.cursor = "default"
    }
  }

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-full rounded-lg"
      />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
          <span>Unselected location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
          <span>Selected location</span>
        </div>
      </div>
    </div>
  )
}
