"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MapPin, List, Plus, Star, Calendar } from "lucide-react"
import { mockEntries, mockLocations } from "@/lib/mock-data"
import Link from "next/link"
import { InteractiveMap } from "@/components/interactive-map"
import { TripPlannerDrawer } from "@/components/trip-planner-drawer"

export default function ExplorePage() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const selectedLocationData = selectedLocation ? mockLocations.find((l) => l.id === selectedLocation) : null

  const entriesForLocation = selectedLocation ? mockEntries.filter((e) => e.locationId === selectedLocation) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">TripJournal</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <List className="w-4 h-4 mr-2" />
                  Entries
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="ghost" size="sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  Explore
                </Button>
              </Link>
              <TripPlannerDrawer />
              <Link href="/">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Your Travels</h2>
          <p className="text-gray-600">Click on a location to see your memories from that place</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="p-4 h-[600px]">
              <InteractiveMap
                locations={mockLocations}
                entries={mockEntries}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {selectedLocationData ? (
              <>
                <Card className="p-4">
                  <h3 className="text-xl font-bold mb-2">{selectedLocationData.name}</h3>
                  <p className="text-gray-600 mb-4">{selectedLocationData.country}</p>
                  <div className="text-sm text-gray-500">
                    <p>
                      {entriesForLocation.length} {entriesForLocation.length === 1 ? "entry" : "entries"}
                    </p>
                  </div>
                </Card>

                <div className="space-y-3">
                  {entriesForLocation.map((entry) => (
                    <Link key={entry.id} href={`/entry/${entry.id}`}>
                      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={entry.images[0] || "/placeholder.svg"}
                              alt={entry.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1 truncate">{entry.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{entry.rating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{entry.description}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Select a Location</h3>
                <p className="text-sm text-gray-600">
                  Click on a marker on the map to view your entries from that location
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
