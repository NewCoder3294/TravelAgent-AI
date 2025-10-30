import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Calendar,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Plane,
  Hotel,
  UtensilsCrossed,
  Landmark,
  Clock,
  Star,
} from "lucide-react"
import { getTripPlanById, getTripListItemById } from "@/lib/mock-data"
import { formatMoney, formatDate, formatDuration } from "@/lib/format"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tripPlan = getTripPlanById(id)
  const tripListItem = getTripListItemById(id)

  if (!tripPlan || !tripListItem) {
    notFound()
  }

  const { destination, flights, stays, foodSpots, attractions, totalMin, totalMax, fitScore } = tripPlan
  const duration = Math.ceil(
    (new Date(tripPlan.dates.end).getTime() - new Date(tripPlan.dates.start).getTime()) / (1000 * 60 * 60 * 24),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/considering">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="aspect-[21/9] w-full rounded-xl overflow-hidden mb-6 shadow-lg bg-muted">
            {tripListItem.coverImg && (
              <img
                src={tripListItem.coverImg || "/placeholder.svg"}
                alt={destination.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-balance">{tripListItem.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">
                    {destination.name}, {destination.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-lg">
                    {formatDate(tripPlan.dates.start)} - {formatDate(tripPlan.dates.end)} ({duration} days)
                  </span>
                </div>
              </div>
            </div>
            <Badge className="text-lg px-4 py-2">
              <TrendingUp className="w-5 h-5 mr-2" />
              {fitScore}% fit
            </Badge>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Your Budget</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(tripListItem.budget)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Estimated Cost</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(totalMin)}</p>
              <p className="text-xs text-muted-foreground">to {formatMoney(totalMax)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Budget Status</span>
              </div>
              <p className="text-2xl font-bold text-green-600">Under Budget</p>
              <p className="text-xs text-muted-foreground">
                {formatMoney({ amount: tripListItem.budget.amount - totalMin.amount, currency: "USD" })} remaining
              </p>
            </Card>
          </div>
        </div>

        {/* Destination Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">About {destination.name}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">{destination.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Best Time to Visit</p>
              <p className="font-medium">{destination.bestTimeToVisit}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Temperature Range</p>
              <p className="font-medium">{destination.averageTempRange}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Popularity</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <p className="font-medium">{destination.popularityScore}/100</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Tabs */}
        <Tabs defaultValue="flights" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flights">
              <Plane className="w-4 h-4 mr-2" />
              Flights
            </TabsTrigger>
            <TabsTrigger value="stays">
              <Hotel className="w-4 h-4 mr-2" />
              Stays
            </TabsTrigger>
            <TabsTrigger value="food">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Food
            </TabsTrigger>
            <TabsTrigger value="attractions">
              <Landmark className="w-4 h-4 mr-2" />
              Attractions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="space-y-4 mt-6">
            {flights.map((flight) => (
              <Card key={flight.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">
                      {flight.from} → {flight.to}
                    </p>
                    <p className="text-sm text-muted-foreground">{flight.airline}</p>
                  </div>
                  <p className="text-xl font-bold">{formatMoney(flight.price)}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Departure</p>
                    <p className="font-medium">{new Date(flight.departureTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Arrival</p>
                    <p className="font-medium">{new Date(flight.arrivalTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Duration</p>
                    <p className="font-medium">{formatDuration(flight.duration)}</p>
                  </div>
                </div>
                {flight.stops === 0 && <Badge className="mt-3">Direct Flight</Badge>}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stays" className="space-y-4 mt-6">
            {stays.map((stay) => (
              <Card key={stay.id} className="p-4">
                <div className="flex gap-4">
                  {stay.imageUrl && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={stay.imageUrl || "/placeholder.svg"}
                        alt={stay.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{stay.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{stay.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatMoney(stay.pricePerNight)}</p>
                        <p className="text-xs text-muted-foreground">per night</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{stay.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({stay.reviewCount} reviews)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stay.amenities.slice(0, 4).map((amenity) => (
                        <Badge key={amenity} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="food" className="space-y-4 mt-6">
            {foodSpots.map((spot) => (
              <Card key={spot.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{spot.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {spot.type} • {spot.cuisine}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{spot.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{"$".repeat(spot.priceLevel)}</span>
                  </div>
                  <span className="text-muted-foreground">({spot.reviewCount} reviews)</span>
                </div>
                {spot.mustTry && (
                  <div className="mt-3">
                    <Badge variant="secondary">Must Try: {spot.mustTry}</Badge>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="attractions" className="space-y-4 mt-6">
            {attractions.map((attraction) => (
              <Card key={attraction.id} className="p-4">
                <div className="flex gap-4">
                  {attraction.imageUrl && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={attraction.imageUrl || "/placeholder.svg"}
                        alt={attraction.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{attraction.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{attraction.type}</p>
                      </div>
                      <p className="text-lg font-bold">{formatMoney(attraction.price)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{attraction.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{formatDuration(attraction.estimatedDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{attraction.rating}</span>
                        <span className="text-muted-foreground">({attraction.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <Button size="lg" className="flex-1">
            Add to Considering
          </Button>
          <Button size="lg" variant="outline" className="flex-1 bg-transparent">
            Customize Trip
          </Button>
        </div>
      </main>
    </div>
  )
}
