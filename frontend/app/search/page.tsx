"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plane, Calendar, DollarSign, Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import { RouteMap } from "@/components/route-map"
import type { TripSearchResult, Route } from "@/lib/types"
import Link from "next/link"

type SearchState = "idle" | "searching" | "completed" | "error"

export default function SearchPage() {
  const [state, setState] = useState<SearchState>("idle")
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<TripSearchResult | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  // Form state
  const [origin, setOrigin] = useState("SFO")
  const [startDate, setStartDate] = useState("2025-07-01")
  const [endDate, setEndDate] = useState("2025-07-10")
  const [budget, setBudget] = useState(3000)

  const handleSearch = async () => {
    try {
      setState("searching")
      setProgress(0)
      setProgressMessage("Initializing search...")
      setError(null)
      setResults(null)

      // Create search job
      const { job_id } = await api.createTripSearch({
        origin,
        date_range: { start: startDate, end: endDate },
        budget,
      })

      setProgressMessage("Searching destinations...")

      // Poll for completion with progress updates
      const result = await api.pollJobCompletion(
        job_id,
        (status) => {
          setProgress(status.progress)
          setProgressMessage(status.message)
        },
        60,
        2000
      )

      setResults(result)
      setState("completed")
      setProgress(100)
      setProgressMessage("Search completed!")
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "An error occurred")
      setProgressMessage("Search failed")
    }
  }

  const handleRouteClick = (route: Route) => {
    setSelectedRoute(route)
    // You can navigate to a detailed trip page here
    console.log("Selected route:", route)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Plane className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">AI Trip Search</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {state === "idle" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Find Your Perfect Destination</h2>
              <p className="text-muted-foreground">
                Our AI will search and compare destinations within your budget using parallel search
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin Airport (IATA Code)</Label>
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="origin"
                      placeholder="SFO, LAX, JFK..."
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                      maxLength={3}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter your departure airport code</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (USD)</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="budget"
                      type="number"
                      min={500}
                      max={50000}
                      step={100}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total budget including flights, accommodation, food, and activities
                  </p>
                </div>

                <Button className="w-full" size="lg" onClick={handleSearch}>
                  <Plane className="h-4 w-4 mr-2" />
                  Search Destinations
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <div className="text-blue-600 dark:text-blue-400">
                  <Plane className="h-5 w-5" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    How it works
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Our AI agent uses parallel search to find destinations, compare prices, and provide
                    personalized recommendations based on your budget and preferences.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {state === "searching" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-2 w-full">
                  <h3 className="text-xl font-semibold">Searching Destinations...</h3>
                  <p className="text-muted-foreground">{progressMessage}</p>
                </div>
                <div className="w-full space-y-2">
                  <Progress value={progress} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{progress}% complete</span>
                    <span>This may take 30-60 seconds</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">AI Powered</div>
                <div className="text-xs text-muted-foreground">Claude analyzes each destination</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">Parallel Search</div>
                <div className="text-xs text-muted-foreground">Multiple destinations at once</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">Smart Insights</div>
                <div className="text-xs text-muted-foreground">Savings tips & recommendations</div>
              </Card>
            </div>
          </div>
        )}

        {state === "completed" && results && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Search Results</h2>
                  <p className="text-muted-foreground">
                    Found {results.routes.length} destinations - {results.search_metadata.feasible_count} within
                    budget
                  </p>
                </div>
                <Button onClick={() => setState("idle")} variant="outline">
                  New Search
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Feasible Routes
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {results.search_metadata.feasible_count}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Searched</div>
                  <div className="text-2xl font-bold">{results.search_metadata.total_searched}</div>
                </Card>

                <Card className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Origin</div>
                  <div className="text-2xl font-bold">{results.hub.city}</div>
                  <div className="text-xs text-muted-foreground">{results.hub.airport_code}</div>
                </Card>

                <Card className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Search Time</div>
                  <div className="text-2xl font-bold">{results.search_metadata.execution_time.toFixed(1)}s</div>
                </Card>
              </div>
            </Card>

            {/* Map */}
            <div className="h-[600px] rounded-lg overflow-hidden border">
              <RouteMap
                hub={results.hub}
                routes={results.routes}
                selectedRouteId={selectedRoute?.destination_id}
                onRouteClick={handleRouteClick}
              />
            </div>

            {/* Route List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.routes.map((route) => (
                <Card
                  key={route.destination_id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedRoute?.destination_id === route.destination_id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleRouteClick(route)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{route.city}</h3>
                      <p className="text-sm text-muted-foreground">{route.country}</p>
                    </div>
                    <Badge variant={route.is_feasible ? "default" : "destructive"}>
                      {route.is_feasible ? "In Budget" : "Over"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Cost</span>
                      <span className="font-bold text-lg">${route.total_cost.toLocaleString()}</span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Flight</span>
                        <span>${route.breakdown.flight.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accommodation</span>
                        <span>${route.breakdown.accommodation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Food & Activities</span>
                        <span>
                          ${(route.breakdown.food + route.breakdown.attractions).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Plane className="h-3 w-3" />
                        <span>{route.route_path.flight_duration}</span>
                        <span className="mx-1">•</span>
                        <span>{route.route_path.distance_km.toFixed(0)} km</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 border-red-200 dark:border-red-800">
              <div className="flex flex-col items-center space-y-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Search Failed</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <Button onClick={() => setState("idle")}>Try Again</Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
