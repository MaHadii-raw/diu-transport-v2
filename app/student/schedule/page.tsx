"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import ErrorBoundary from "@/components/ErrorBoundary"

interface Schedule {
  _id: string
  pathName: string
  departureTimes: string[]
  capacity: number
}

export default function SchedulePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      router.push("/auth/login")
      return
    }

    if (user) {
      fetchSchedules()
    }
  }, [user, isLoading, router])

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setIsLoadingSchedules(false)
    }
  }

  if (isLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Bus Schedules</h1>
            <p className="text-gray-600">View departure times for all routes</p>
          </div>

          {isLoadingSchedules ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading schedules...</span>
            </div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedules Available</h3>
                <p className="text-gray-600">
                  Bus schedules will be displayed here once they are added by administrators.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {schedules.map((schedule) => (
                <Card key={schedule._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      {schedule.pathName}
                    </CardTitle>
                    <CardDescription>Capacity: {schedule.capacity} passengers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {schedule.departureTimes.map((time, index) => (
                        <div key={index} className="flex items-center justify-center p-3 bg-blue-50 rounded-lg border">
                          <Clock className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="font-medium text-blue-900">{time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
