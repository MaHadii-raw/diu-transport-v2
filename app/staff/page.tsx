"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bus, QrCode, MapPin, LogOut, Loader2 } from "lucide-react"
import ErrorBoundary from "@/components/ErrorBoundary"

export default function StaffDashboard() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "staff")) {
      router.push("/auth/login")
      return
    }
  }, [user, isLoading, router])

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
                  <p className="text-sm text-gray-600">Staff Dashboard</p>
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
                    <p className="text-xs text-gray-600">Staff Member</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h2>
            <p className="text-gray-600">Manage bus operations and verify student tickets.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <QrCode className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Verify Tickets</CardTitle>
                <CardDescription>Scan and verify student tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  QR Scanner (Coming Soon)
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Update Location</CardTitle>
                <CardDescription>Share bus location with students</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  GPS Tracking (Coming Soon)
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Bus className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Bus Status</CardTitle>
                <CardDescription>Update bus operational status</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  Status Update (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <h4 className="font-medium mb-2">Ticket Verification:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Ask students to show their QR code</li>
                    <li>• Scan the code using the verification tool</li>
                    <li>• Confirm the ticket is valid and not expired</li>
                    <li>• Mark the ticket as used after verification</li>
                  </ul>
                </div>
                <div className="text-sm text-gray-600">
                  <h4 className="font-medium mb-2">Location Updates:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Update bus location regularly during trips</li>
                    <li>• Enable GPS tracking when on duty</li>
                    <li>• Report any delays or issues promptly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tickets Verified:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Location Updates:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
