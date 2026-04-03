"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserCheck, MapPin, Bus, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import ErrorBoundary from "@/components/ErrorBoundary"

interface AdminStats {
  totalUsers: number
  totalStaff: number
  totalPaths: number
  totalTickets: number
}

export default function AdminDashboard() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login")
      return
    }

    if (user) {
      fetchStats()
    }
  }, [user, isLoading, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoadingStats(false)
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
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Bus className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DIU Transport</h1>
                  <p className="text-sm text-gray-600">Admin Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photo || "/placeholder.svg"} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">Administrator</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
            <p className="text-gray-600">Manage the DIU Transport System</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Registered students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.totalStaff || 0}</div>
                <p className="text-xs text-muted-foreground">Active staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bus Routes</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.totalPaths || 0}</div>
                <p className="text-xs text-muted-foreground">Active routes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.totalTickets || 0}</div>
                <p className="text-xs text-muted-foreground">All time bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/users">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Manage Users</CardTitle>
                  <CardDescription>Student accounts and profiles</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/staff">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <UserCheck className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Manage Staff</CardTitle>
                  <CardDescription>Staff accounts and permissions</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/routes">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Bus Routes</CardTitle>
                  <CardDescription>Manage routes and stops</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/schedules">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Bus className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Schedules</CardTitle>
                  <CardDescription>Bus timetables and capacity</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
