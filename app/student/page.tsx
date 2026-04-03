"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bus, CreditCard, MapPin, Clock, Ticket, User, LogOut, Calendar, HelpCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import ErrorBoundary from "@/components/ErrorBoundary"

interface DashboardStats {
  totalTickets: number
  activeTickets: number
  balance: number
}

export default function StudentDashboard() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      router.push("/auth/login")
      return
    }

    if (user) {
      fetchDashboardStats()
    }
  }, [user, isLoading, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`/api/tickets/user/${user?._id}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const activeTickets = data.tickets.filter(
          (ticket: any) => !ticket.used && new Date(ticket.expiresAt) > new Date(),
        ).length

        setStats({
          totalTickets: data.tickets.length,
          activeTickets,
          balance: user?.balance || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
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
                  <p className="text-sm text-gray-600">Student Dashboard</p>
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
                    <p className="text-xs text-gray-600">{user.studentId}</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h2>
            <p className="text-gray-600">Manage your transportation needs from your dashboard.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OneCard Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">৳{isLoadingStats ? "..." : stats?.balance || 0}</div>
                <p className="text-xs text-muted-foreground">Available for tickets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.activeTickets || 0}</div>
                <p className="text-xs text-muted-foreground">Valid tickets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.totalTickets || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/student/book-ticket">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Ticket className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Book Ticket</CardTitle>
                  <CardDescription>Reserve your bus seat</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/student/track-bus">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Track Bus</CardTitle>
                  <CardDescription>Real-time bus locations</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/student/schedule">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">View Schedule</CardTitle>
                  <CardDescription>Bus timetables</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/student/profile">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <User className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">My Profile</CardTitle>
                  <CardDescription>Account settings</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Your latest bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">Loading recent tickets...</div>
                    <Link href="/student/book-ticket">
                      <Button variant="outline" className="w-full bg-transparent">
                        Book Your First Ticket
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Help</CardTitle>
                <CardDescription>Common actions and support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/student/support">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Get Support
                  </Button>
                </Link>
                <Link href="/student/profile">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Top Up Balance
                  </Button>
                </Link>
                <Link href="/student/schedule">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Clock className="h-4 w-4 mr-2" />
                    Check Schedules
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
