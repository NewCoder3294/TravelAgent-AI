"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plane,
  Calendar,
  ArrowLeft,
  Search,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { mockTripListItems, getDestinationById } from "@/lib/mock-data"
import { formatMoney, formatDate } from "@/lib/format"
import Link from "next/link"
import type { TripListItem, TripStatus } from "@/lib/types"

type FilterStatus = "ALL" | TripStatus

export default function TripsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")

  const filteredTrips = useMemo(() => {
    let trips = mockTripListItems

    // Filter by status
    if (filterStatus !== "ALL") {
      trips = trips.filter((t) => t.status === filterStatus)
    }

    // Filter by search
    if (searchQuery) {
      trips = trips.filter((t) => {
        const dest = getDestinationById(t.destinationId)
        return (
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest?.country.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    // Sort by date (most recent first)
    return trips.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [searchQuery, filterStatus])

  const statusCounts = {
    ALL: mockTripListItems.length,
    CONSIDERING: mockTripListItems.filter((t) => t.status === "CONSIDERING").length,
    BOOKED: mockTripListItems.filter((t) => t.status === "BOOKED").length,
    COMPLETED: mockTripListItems.filter((t) => t.status === "COMPLETED").length,
  }

  const handleReplan = (tripId: string) => {
    // In production, this would create a new trip based on the old one
    console.log("Replan trip:", tripId)
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
              <Link href="/considering">
                <Button variant="ghost" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Considering
                  {statusCounts.CONSIDERING > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                      {statusCounts.CONSIDERING}
                    </Badge>
                  )}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">My Trips</h2>
          <p className="text-muted-foreground">Your complete travel history and upcoming adventures</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search trips by destination or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ALL">
                All
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                  {statusCounts.ALL}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="CONSIDERING">
                Considering
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                  {statusCounts.CONSIDERING}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="BOOKED">
                Booked
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                  {statusCounts.BOOKED}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="COMPLETED">
                Completed
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                  {statusCounts.COMPLETED}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Link href="/">
              <Button>
                <Plane className="w-4 h-4 mr-2" />
                Explore Destinations
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <TripRow key={trip.id} trip={trip} onReplan={handleReplan} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TripRow({ trip, onReplan }: { trip: TripListItem; onReplan: (id: string) => void }) {
  const destination = getDestinationById(trip.destinationId)
  const duration = Math.ceil(
    (new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) / (1000 * 60 * 60 * 24),
  )

  const statusConfig = {
    CONSIDERING: {
      icon: Clock,
      label: "Considering",
      variant: "secondary" as const,
    },
    BOOKED: {
      icon: Calendar,
      label: "Booked",
      variant: "default" as const,
    },
    COMPLETED: {
      icon: CheckCircle2,
      label: "Completed",
      variant: "outline" as const,
    },
  }

  const config = statusConfig[trip.status]
  const StatusIcon = config.icon

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {trip.coverImg && (
            <img src={trip.coverImg || "/placeholder.svg"} alt={trip.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-xl mb-1">{trip.title}</h3>
              <p className="text-sm text-muted-foreground">
                {destination?.name}, {destination?.country}
              </p>
            </div>
            <Badge variant={config.variant}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dates</p>
              <p className="text-sm font-medium">
                {formatDate(trip.dates.start)} - {formatDate(trip.dates.end)}
              </p>
              <p className="text-xs text-muted-foreground">{duration} days</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="text-sm font-medium">{formatMoney(trip.budget)}</p>
              {trip.totalEst && <p className="text-xs text-muted-foreground">Est: {formatMoney(trip.totalEst)}</p>}
            </div>
            {trip.score && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fit Score</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">{trip.score}%</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm font-medium">{formatDate(trip.updatedAt)}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Link href={`/trip/${trip.id}`}>
            <Button variant="default" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          {trip.status === "COMPLETED" && (
            <Button variant="outline" size="sm" onClick={() => onReplan(trip.id)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Replan
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
