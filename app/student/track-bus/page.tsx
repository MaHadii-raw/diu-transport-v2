"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Navigation, RefreshCw, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import ErrorBoundary from "@/components/ErrorBoundary"

interface BusLocation {
  _id: string
  staffId: string
  location: {
    lat: number
    lng: number
  }
  timestamp: string
}

interface Path {
  _id: string
  name: string
}

export default function TrackBusPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [paths, setPaths] = useState<Path[]>([])
  const [selectedPath, setSelectedPath] = useState("")
  const [busLocations, setBusLocations] = useState<BusLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/auth/login")
      return
    }
    if (!authLoading && user && user.role === "student") {
      fetchPaths()
    }
  }, [user, authLoading, router])

  const fetchPaths = async () => {
    try {
      const response = await fetch("/api/paths")
      if (response.ok) {
        const data = await response.json()
        setPaths(data.paths)
      }
    } catch (error) {
      console.error("Error fetching paths:", error)
    }
  }

  const fetchBusLocations = async () => {
    if (!selectedPath) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/bus/location/${selectedPath}`)
      if (response.ok) {
        const data = await response.json()
        setBusLocations(data.locations)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Error fetching bus locations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLocationAge = (timestamp: string) => {
    const now = new Date()
    const locationTime = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - locationTime.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }

  const isLocationRecent = (timestamp: string) => {
    const now = new Date()
    const locationTime = new Date(timestamp)
    const diffMinutes = (now.getTime() - locationTime.getTime()) / (1000 * 60)
    return diffMinutes < 10 // Consider recent if less than 10 minutes old
  }

  useEffect(() => {
    if (selectedPath) {
      fetchBusLocations()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchBusLocations, 30000)
      return () => clearInterval(interval)
    }
  }, [selectedPath])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/student" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Track Bus</h1>
            <p className="text-gray-600">View real-time bus locations</p>
          </div>

          <div className="space-y-6">
            {/* Route Selection */}
            {paths.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Select Route</CardTitle>
                  <CardDescription>Choose a route to track buses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedPath} onValueChange={setSelectedPath}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a route to track" />
                    </SelectTrigger>
                    <SelectContent>
                      {paths.map((path) => (
                        <SelectItem key={path._id} value={path._id}>
                          {path.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPath && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {lastUpdated && <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>}
                      </div>
                      <Button onClick={fetchBusLocations} disabled={isLoading} size="sm">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Live Bus Tracking
                  </CardTitle>
                  <CardDescription>Track buses in real-time on campus routes</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <div className="bg-blue-50 rounded-lg p-8">
                    <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time Tracking Coming Soon</h3>
                    <p className="text-gray-600 mb-4">
                      Live bus tracking with GPS integration will be available in the next update.
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>Features will include:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• Live bus locations on map</li>
                        <li>• Estimated arrival times</li>
                        <li>• Route progress tracking</li>
                        <li>• Push notifications</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bus Locations */}
            {selectedPath && busLocations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Navigation className="h-5 w-5 mr-2" />
                    Active Buses
                  </CardTitle>
                  <CardDescription>
                    Real-time locations of buses on {paths.find((p) => p._id === selectedPath)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading && busLocations.length === 0 ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : busLocations.length > 0 ? (
                    <div className="space-y-4">
                      {busLocations.map((location, index) => (
                        <div key={location._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                              <h3 className="font-medium">Bus #{index + 1}</h3>
                            </div>
                            <Badge variant={isLocationRecent(location.timestamp) ? "default" : "secondary"}>
                              {isLocationRecent(location.timestamp) ? "Live" : "Offline"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Latitude</p>
                              <p className="font-mono">{location.location.lat.toFixed(6)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Longitude</p>
                              <p className="font-mono">{location.location.lng.toFixed(6)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {getLocationAge(location.timestamp)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = `https://www.google.com/maps?q=${location.location.lat},${location.location.lng}`
                                window.open(url, "_blank")
                              }}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              View on Map
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No active buses found</p>
                      <p className="text-sm text-gray-400">
                        Buses will appear here when staff members share their location
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Map Placeholder */}
            {selectedPath && busLocations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Route Map</CardTitle>
                  <CardDescription>Interactive map view (Development placeholder)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Interactive Map</p>
                      <p className="text-sm text-gray-400">Integration with Google Maps or Leaflet would go here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
