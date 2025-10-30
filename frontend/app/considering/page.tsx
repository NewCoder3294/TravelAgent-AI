"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plane,
  Calendar,
  ListIcon,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Trash2,
  ExternalLink,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import { mockTripListItems, getDestinationById } from "@/lib/mock-data"
import { formatMoney, formatDate } from "@/lib/format"
import Link from "next/link"
import type { TripListItem } from "@/lib/types"

type ViewMode = "kanban" | "list"

export default function ConsideringPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const consideringTrips = mockTripListItems.filter((t) => t.status === "CONSIDERING")

  const handleRemoveTrip = (tripId: string) => {
    // In production, this would update the backend
    console.log("Remove trip:", tripId)
  }

  const handleBookTrip = (tripId: string) => {
    // In production, this would update status to BOOKED
    console.log("Book trip:", tripId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Plane className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">TripPlanner</h1>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Link href="/trips">
                <Button variant="ghost" size="sm">
                  <ListIcon className="w-4 h-4 mr-2" />
                  My Trips
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-3xl font-bold mb-2">Considering Trips</h2>
              <p className="text-muted-foreground">Compare and evaluate your potential trips before booking</p>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <LayoutList className="w-4 h-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{consideringTrips.length} trips</Badge>
            <span className="text-sm text-muted-foreground">
              Total budget:{" "}
              {formatMoney({ amount: consideringTrips.reduce((sum, t) => sum + t.budget.amount, 0), currency: "USD" })}
            </span>
          </div>
        </div>

        {consideringTrips.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-4">
              Start exploring destinations to add trips to your consideration list
            </p>
            <Link href="/">
              <Button>
                <Plane className="w-4 h-4 mr-2" />
                Explore Destinations
              </Button>
            </Link>
          </Card>
        ) : viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consideringTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onRemove={handleRemoveTrip} onBook={handleBookTrip} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {consideringTrips.map((trip) => (
              <TripListRow key={trip.id} trip={trip} onRemove={handleRemoveTrip} onBook={handleBookTrip} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TripCard({
  trip,
  onRemove,
  onBook,
}: {
  trip: TripListItem
  onRemove: (id: string) => void
  onBook: (id: string) => void
}) {
  const destination = getDestinationById(trip.destinationId)
  const duration = Math.ceil(
    (new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) / (1000 * 60 * 60 * 24),
  )

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative bg-muted">
        {trip.coverImg && (
          <img src={trip.coverImg || "/placeholder.svg"} alt={trip.title} className="w-full h-full object-cover" />
        )}
        {trip.score && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trip.score}% fit
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{trip.title}</h3>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(trip.dates.start)} - {formatDate(trip.dates.end)} ({duration} days)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Budget: {formatMoney(trip.budget)}</span>
            </div>
            {trip.totalEst && <span className="text-xs text-muted-foreground">Est: {formatMoney(trip.totalEst)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/trip/${trip.id}`} className="flex-1">
            <Button variant="default" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => onRemove(trip.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function TripListRow({
  trip,
  onRemove,
  onBook,
}: {
  trip: TripListItem
  onRemove: (id: string) => void
  onBook: (id: string) => void
}) {
  const destination = getDestinationById(trip.destinationId)
  const duration = Math.ceil(
    (new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) / (1000 * 60 * 60 * 24),
  )

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {trip.coverImg && (
            <img src={trip.coverImg || "/placeholder.svg"} alt={trip.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
              <p className="text-sm text-muted-foreground">
                {destination?.name}, {destination?.country}
              </p>
            </div>
            {trip.score && (
              <Badge variant="secondary">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trip.score}% fit
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{duration} days</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{formatMoney(trip.budget)}</span>
            </div>
            {trip.totalEst && <span className="text-xs">Est: {formatMoney(trip.totalEst)}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/trip/${trip.id}`}>
            <Button variant="default" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => onRemove(trip.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
