"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Plane,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Utensils,
  Ticket,
  Home,
} from "lucide-react"
import { api } from "@/lib/api"
import { RouteMap } from "@/components/route-map"
import { DetailedTripPanel } from "@/components/detailed-trip-panel"
import type { TripSearchResult, Route } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { useMemo } from "react"

type SearchState = "idle" | "searching" | "completed" | "error"

export default function HomePage() {
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

  // Budget filter for results (separate from search budget)
  const [budgetFilter, setBudgetFilter] = useState<number>(3000)

  const handleSearch = async () => {
    try {
      setState("searching")
      setProgress(0)
      setProgressMessage("Initializing AI search...")
      setError(null)
      setResults(null)
      setSelectedRoute(null)

      // Create search job
      const { job_id } = await api.createTripSearch({
        origin,
        date_range: { start: startDate, end: endDate },
        budget,
      })

      setProgressMessage("Searching destinations with parallel AI...")

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
      setBudgetFilter(budget) // Initialize filter to search budget
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
  }

  const calculateTripDuration = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  // Filter routes based on budget filter
  const filteredRoutes = useMemo(() => {
    if (!results) return []
    return results.routes.filter(route => route.total_cost <= budgetFilter)
  }, [results, budgetFilter])

  // Calculate max budget from results
  const maxBudget = useMemo(() => {
    if (!results || results.routes.length === 0) return budget
    return Math.max(...results.routes.map(r => r.total_cost))
  }, [results, budget])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">AI Trip Planner</h1>
            </div>
            <nav className="flex items-center gap-2">
              <Link href="/trips">
                <Button variant="ghost" size="sm">
                  My Trips
                </Button>
              </Link>
              <Link href="/considering">
                <Button variant="ghost" size="sm">
                  Considering
                </Button>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Form - Always visible in sidebar when searching/completed */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Search Form */}
          <div className={`${state === "idle" ? "lg:col-span-4" : "lg:col-span-1"}`}>
            <Card className={`p-6 ${state === "idle" ? "max-w-2xl mx-auto" : ""}`}>
              {state === "idle" && (
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">Find Your Perfect Trip</h2>
                  <p className="text-muted-foreground">
                    AI-powered search with parallel destination analysis
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin Airport</Label>
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="origin"
                      placeholder="SFO, LAX, JFK..."
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                      maxLength={3}
                      disabled={state === "searching"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={state === "searching"}
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
                      disabled={state === "searching"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Total Budget (USD)</Label>
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
                      disabled={state === "searching"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Includes flights, accommodation, food & activities
                  </p>
                </div>

                {state === "idle" && (
                  <Button className="w-full" size="lg" onClick={handleSearch}>
                    <Plane className="h-4 w-4 mr-2" />
                    Search Destinations
                  </Button>
                )}

                {state === "searching" && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Searching...</p>
                        <p className="text-xs text-muted-foreground">{progressMessage}</p>
                      </div>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <p className="text-xs text-center text-muted-foreground">{progress}% complete</p>
                  </div>
                )}

                {(state === "completed" || state === "error") && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setState("idle")
                      setResults(null)
                      setSelectedRoute(null)
                      setError(null)
                    }}
                  >
                    New Search
                  </Button>
                )}

                {state === "error" && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Search Failed</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {state === "completed" && results && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Search Completed!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Found</div>
                        <div className="font-bold text-lg">{results.routes.length}</div>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                        <div className="text-muted-foreground">In Budget</div>
                        <div className="font-bold text-lg text-green-600 dark:text-green-400">
                          {results.search_metadata.feasible_count}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {state === "idle" && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-3">
                    <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">How it works</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Our AI searches destinations in parallel, analyzes costs, and provides personalized
                        recommendations with Claude.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Main Content Area - Map & Results */}
          {(state === "searching" || state === "completed") && (
            <div className="lg:col-span-3 space-y-4">
              {state === "completed" && results && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Origin</div>
                      <div className="text-2xl font-bold">{results.hub.city}</div>
                      <div className="text-xs text-muted-foreground">{results.hub.airport_code}</div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Trip Duration</div>
                      <div className="text-2xl font-bold">{calculateTripDuration()} days</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                        {new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Showing</div>
                      <div className="text-2xl font-bold">{filteredRoutes.length} / {results.routes.length}</div>
                      <div className="text-xs text-muted-foreground">destinations</div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Budget Filter</div>
                      <div className="text-2xl font-bold">${budgetFilter.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">max cost</div>
                    </Card>
                  </div>

                  {/* Budget Filter Slider */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="budget-filter" className="text-base font-semibold">
                          Adjust Budget Filter
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{filteredRoutes.length} destinations</Badge>
                          <Badge variant={filteredRoutes.filter(r => r.is_feasible).length > 0 ? "default" : "destructive"}>
                            {filteredRoutes.filter(r => r.is_feasible).length} within original budget
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Slider
                            id="budget-filter"
                            min={budget * 0.5}
                            max={Math.ceil(maxBudget * 1.1)}
                            step={50}
                            value={[budgetFilter]}
                            onValueChange={(value) => setBudgetFilter(value[0])}
                            className="flex-1"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>${Math.round(budget * 0.5).toLocaleString()}</span>
                            <span className="font-medium text-foreground">${budgetFilter.toLocaleString()}</span>
                            <span>${Math.ceil(maxBudget * 1.1).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Slide to show more expensive trips. Routes shown on the map update in real-time.
                      </p>
                    </div>
                  </Card>

                  {/* Map */}
                  <Card className="p-0 overflow-hidden">
                    <div className="h-[600px]">
                      <RouteMap
                        hub={results.hub}
                        routes={filteredRoutes}
                        selectedRouteId={selectedRoute?.destination_id}
                        onRouteClick={handleRouteClick}
                        budgetFilter={budgetFilter}
                      />
                    </div>
                  </Card>

                  {/* Selected Route Details - New Comprehensive Panel */}
                  {selectedRoute && (
                    <DetailedTripPanel route={selectedRoute} tripDuration={calculateTripDuration()} />
                  )}

                  {/* OLD DETAIL PANEL - REMOVE THIS */}
                  {false && selectedRoute && (
                    <Card className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold">{selectedRoute.city}</h2>
                            <Badge variant={selectedRoute.is_feasible ? "default" : "destructive"}>
                              {selectedRoute.is_feasible ? "Within Budget" : "Over Budget"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedRoute.country}</span>
                            <span className="mx-2">•</span>
                            <Plane className="h-4 w-4" />
                            <span>{selectedRoute.airport}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
                          <div className="text-3xl font-bold">${selectedRoute.total_cost.toLocaleString()}</div>
                          {selectedRoute.is_feasible && (
                            <div className="text-sm text-green-600 dark:text-green-400">
                              ${selectedRoute.remaining_budget.toLocaleString()} remaining
                            </div>
                          )}
                        </div>
                      </div>

                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="costs">Costs</TabsTrigger>
                          <TabsTrigger value="insights">AI Insights</TabsTrigger>
                          <TabsTrigger value="tips">Tips</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                  <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">Flight</div>
                                  <div className="text-xs text-muted-foreground">Round trip</div>
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Distance</span>
                                  <span className="font-medium">
                                    {selectedRoute.route_path.distance_km.toFixed(0)} km
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Duration</span>
                                  <span className="font-medium">{selectedRoute.route_path.flight_duration}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Price</span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    ${selectedRoute.breakdown.flight.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                  <Home className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">Accommodation</div>
                                  <div className="text-xs text-muted-foreground">
                                    {calculateTripDuration() - 1} nights
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Nightly avg</span>
                                  <span className="font-medium">
                                    $
                                    {(
                                      selectedRoute.breakdown.accommodation /
                                      (calculateTripDuration() - 1)
                                    ).toFixed(0)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total nights</span>
                                  <span className="font-medium">{calculateTripDuration() - 1}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Price</span>
                                  <span className="font-bold text-purple-600 dark:text-purple-400">
                                    ${selectedRoute.breakdown.accommodation.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                  <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">Food</div>
                                  <div className="text-xs text-muted-foreground">Meals & drinks</div>
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Daily avg</span>
                                  <span className="font-medium">
                                    ${(selectedRoute.breakdown.food / calculateTripDuration()).toFixed(0)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total days</span>
                                  <span className="font-medium">{calculateTripDuration()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Price</span>
                                  <span className="font-bold text-orange-600 dark:text-orange-400">
                                    ${selectedRoute.breakdown.food.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                  <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">Activities</div>
                                  <div className="text-xs text-muted-foreground">Attractions & tours</div>
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Daily avg</span>
                                  <span className="font-medium">
                                    ${(selectedRoute.breakdown.attractions / calculateTripDuration()).toFixed(0)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total days</span>
                                  <span className="font-medium">{calculateTripDuration()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Price</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">
                                    ${selectedRoute.breakdown.attractions.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="costs" className="space-y-4 mt-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <span className="font-medium">Flights (Round Trip)</span>
                              <span className="text-lg font-bold">
                                ${selectedRoute.breakdown.flight.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <span className="font-medium">
                                Accommodation ({calculateTripDuration() - 1} nights)
                              </span>
                              <span className="text-lg font-bold">
                                ${selectedRoute.breakdown.accommodation.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <span className="font-medium">Food ({calculateTripDuration()} days)</span>
                              <span className="text-lg font-bold">
                                ${selectedRoute.breakdown.food.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <span className="font-medium">Activities & Attractions</span>
                              <span className="text-lg font-bold">
                                ${selectedRoute.breakdown.attractions.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                              <span className="font-bold text-lg">Total Cost</span>
                              <span className="text-2xl font-bold text-primary">
                                ${selectedRoute.total_cost.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="insights" className="mt-4">
                          {selectedRoute.ai_insights ? (
                            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                              <p className="text-sm leading-relaxed">{selectedRoute.ai_insights}</p>
                            </Card>
                          ) : (
                            <p className="text-sm text-muted-foreground">No insights available</p>
                          )}
                        </TabsContent>

                        <TabsContent value="tips" className="mt-4 space-y-3">
                          {selectedRoute.savings_tips && selectedRoute.savings_tips.length > 0 ? (
                            selectedRoute.savings_tips.map((tip, idx) => (
                              <Card key={idx} className="p-4">
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
                                    {idx + 1}
                                  </div>
                                  <p className="text-sm leading-relaxed">{tip}</p>
                                </div>
                              </Card>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No tips available</p>
                          )}

                          {selectedRoute.warnings && selectedRoute.warnings.length > 0 && (
                            <div className="mt-6">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                Important Warnings
                              </h4>
                              {selectedRoute.warnings.map((warning, idx) => (
                                <Card
                                  key={idx}
                                  className="p-4 mb-2 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                                >
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
                                </Card>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      <div className="flex gap-3 mt-6">
                        <Button className="flex-1" size="lg">
                          Add to Considering
                        </Button>
                        <Button variant="outline" size="lg">
                          View Details
                        </Button>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {state === "searching" && (
                <Card className="p-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Analyzing Destinations</h3>
                  <p className="text-muted-foreground mb-4">{progressMessage}</p>
                  <div className="max-w-md mx-auto">
                    <Progress value={progress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">{progress}% complete</p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
