"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, MapPin, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import ErrorBoundary from "@/components/ErrorBoundary"

interface Path {
  _id: string
  name: string
  points: Array<{
    name: string
    order: number
  }>
  segments: Array<{
    from: string
    to: string
    fare: number
  }>
}

export default function BookTicketPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [paths, setPaths] = useState<Path[]>([])
  const [selectedPath, setSelectedPath] = useState<Path | null>(null)
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [fare, setFare] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPaths, setIsLoadingPaths] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // if (!user || user.role !== "student") {
    //   router.push("/auth/login")
    //   return
    // }
    fetchPaths()
  }, 
  
  // [user, router]
  []

)

  const fetchPaths = async () => {
    console.log(isLoading)
    console.log(isLoadingPaths)
    try {
      setIsLoadingPaths(true)
      const response = await fetch("/api/paths", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setPaths(data.paths)
      } else if (response.status === 401) {
        router.push("/auth/login")
      } else {
        setError("Failed to load routes. Please refresh the page.")
      }
    } catch (error) {
      console.error("Error fetching paths:", error)
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoadingPaths(false)
    }
  }

  const calculateFare = (pathId: string, pickupPoint: string, dropoffPoint: string) => {
    const path = paths.find((p) => p._id === pathId)
    if (!path) return 0

    const pickupIndex = path.points.findIndex((p) => p.name === pickupPoint)
    const dropoffIndex = path.points.findIndex((p) => p.name === dropoffPoint)

    if (pickupIndex === -1 || dropoffIndex === -1 || pickupIndex >= dropoffIndex) {
      return 0
    }

    let totalFare = 0
    for (let i = pickupIndex; i < dropoffIndex; i++) {
      const segment = path.segments.find((s) => s.from === path.points[i].name && s.to === path.points[i + 1].name)
      if (segment) {
        totalFare += segment.fare
      }
    }

    return totalFare
  }

  const handlePathChange = (pathId: string) => {
    const path = paths.find((p) => p._id === pathId)
    setSelectedPath(path || null)
    setPickup("")
    setDropoff("")
    setFare(0)
    setError("")
  }

  const handlePickupChange = (pickupPoint: string) => {
    setPickup(pickupPoint)
    if (dropoff) {
      const calculatedFare = calculateFare(selectedPath?._id || "", pickupPoint, dropoff)
      setFare(calculatedFare)
    }
    setError("")
  }

  const handleDropoffChange = (dropoffPoint: string) => {
    setDropoff(dropoffPoint)
    if (pickup) {
      const calculatedFare = calculateFare(selectedPath?._id || "", pickup, dropoffPoint)
      setFare(calculatedFare)
    }
    setError("")
  }

  const getAvailableDropoffPoints = () => {
    if (!selectedPath || !pickup) return []

    const pickupIndex = selectedPath.points.findIndex((p) => p.name === pickup)
    return selectedPath.points.filter((_, index) => index > pickupIndex)
  }

  const handleBookTicket = async () => {
    if (!selectedPath || !pickup || !dropoff || fare === 0) {
      setError("Please select all required fields")
      return
    }

    if ((user?.balance || 0) < fare) {
      setError("Insufficient balance. Please top up your OneCard.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/tickets/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user?._id,
          pathId: selectedPath._id,
          pathName: selectedPath.name,
          pickup,
          dropoff,
          fare,
        }),
      })

      const data = await response.json()
      console.log('hitting',data)

      if (response.ok) {
        // Update user balance in context
        updateUser({ balance: data.newBalance })

        toast({
          title: "Ticket booked successfully!",
          description: `Your ticket from ${pickup} to ${dropoff} has been booked.`,
        })
        router.push(`/student/ticket/${data.ticket._id}`)
      } else {
        if (response.status === 401) {
          router.push("/auth/login")
        } else if (response.status === 400) {
          setError(data.message || "Booking failed. Please check your details.")
        } else {
          setError("Server error. Please try again later.")
        }
      }
    } catch (error) {
      console.error("Booking error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/student" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Book Ticket</h1>
            <p className="text-gray-600">Select your journey details</p>
          </div>

          <div className="space-y-6">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  OneCard Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">৳{user.balance || 0}</div>
                {(user.balance || 0) < 50 && (
                  <p className="text-sm text-amber-600 mt-1">Low balance. Consider topping up in your profile.</p>
                )}
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle>Journey Details</CardTitle>
                <CardDescription>Select your pickup and dropoff points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isLoadingPaths ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Loading routes...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Select Route</Label>
                      <Select onValueChange={handlePathChange} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a route" />
                        </SelectTrigger>
                        <SelectContent>
                          {paths.map((path) => (
                            <SelectItem key={path._id} value={path._id}>
                              {path.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPath && (
                      <>
                        <div className="space-y-2">
                          <Label>Pickup Point</Label>
                          <Select value={pickup} onValueChange={handlePickupChange} disabled={isLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pickup point" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedPath.points.slice(0, -1).map((point) => (
                                <SelectItem key={point.name} value={point.name}>
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {point.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Dropoff Point</Label>
                          <Select value={dropoff} onValueChange={handleDropoffChange} disabled={!pickup || isLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dropoff point" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableDropoffPoints().map((point) => (
                                <SelectItem key={point.name} value={point.name}>
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {point.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {fare > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Fare:</span>
                          <span className="text-xl font-bold text-blue-600">৳{fare}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {pickup} → {dropoff}
                        </div>
                        {(user.balance || 0) < fare && (
                          <div className="text-sm text-red-600 mt-2">
                            Insufficient balance. Need ৳{fare - (user.balance || 0)} more.
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleBookTicket}
                      disabled={
                        !selectedPath || !pickup || !dropoff || fare === 0 || isLoading || (user.balance || 0) < fare
                      }
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        `Book Ticket - ৳${fare}`
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Route Preview */}
            {selectedPath && (
              <Card>
                <CardHeader>
                  <CardTitle>Route Preview</CardTitle>
                  <CardDescription>{selectedPath.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedPath.points.map((point, index) => (
                      <div key={point.name} className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            point.name === pickup
                              ? "bg-green-500"
                              : point.name === dropoff
                                ? "bg-red-500"
                                : "bg-gray-300"
                          }`}
                        />
                        <span className={`${point.name === pickup || point.name === dropoff ? "font-medium" : ""}`}>
                          {point.name}
                        </span>
                        {index < selectedPath.points.length - 1 && (
                          <span className="ml-auto text-sm text-gray-500">
                            ৳{selectedPath.segments.find((s) => s.from === point.name)?.fare || 0}
                          </span>
                        )}
                      </div>
                    ))}
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
