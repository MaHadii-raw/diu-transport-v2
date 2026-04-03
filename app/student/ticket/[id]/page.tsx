"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, CreditCard, QrCode, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import QRCode from "qrcode"
import ErrorBoundary from "@/components/ErrorBoundary"

interface Ticket {
  _id: string
  pathName: string
  pickup: string
  dropoff: string
  fare: number
  used: boolean
  createdAt: string
  expiresAt: string
  verifiedAt?: string
  verifiedBy?: string
}

export default function TicketDetailsPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [isLoadingTicket, setIsLoadingTicket] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      router.push("/auth/login")
      return
    }

    if (user && params.id) {
      fetchTicket()
    }
  }, [user, isLoading, router, params.id])

  const fetchTicket = async () => {
    try {
      setIsLoadingTicket(true)
      const response = await fetch(`/api/tickets/${params.id}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setTicket(data.ticket)

        // Generate QR code
        const qrData = JSON.stringify({
          ticketId: data.ticket._id,
          userId: user?._id,
          fare: data.ticket.fare,
          route: `${data.ticket.pickup} → ${data.ticket.dropoff}`,
        })

        const qrUrl = await QRCode.toDataURL(qrData)
        setQrCodeUrl(qrUrl)
      } else if (response.status === 404) {
        setError("Ticket not found")
      } else if (response.status === 403) {
        setError("Access denied")
      } else {
        setError("Failed to load ticket")
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoadingTicket(false)
    }
  }

  const getTicketStatus = () => {
    if (!ticket) return { status: "unknown", color: "gray", text: "Unknown" }

    if (ticket.used) {
      return { status: "used", color: "green", text: "Used" }
    }

    if (new Date(ticket.expiresAt) < new Date()) {
      return { status: "expired", color: "red", text: "Expired" }
    }

    return { status: "valid", color: "blue", text: "Valid" }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading || isLoadingTicket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-900">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/student">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) return null

  const ticketStatus = getTicketStatus()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/student" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ticket Details</h1>
            <p className="text-gray-600">Your digital bus ticket</p>
          </div>

          <div className="space-y-6">
            {/* Ticket Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{ticket.pathName}</CardTitle>
                    <CardDescription>Ticket ID: {ticket._id.slice(-8)}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      ticketStatus.status === "valid"
                        ? "default"
                        : ticketStatus.status === "used"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {ticketStatus.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route Information */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">{ticket.pickup}</span>
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-4"></div>
                  <div className="flex items-center">
                    <span className="font-medium">{ticket.dropoff}</span>
                    <MapPin className="h-5 w-5 text-red-600 ml-2" />
                  </div>
                </div>

                {/* Fare Information */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-primary mr-2" />
                    <span className="font-medium">Fare Paid</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">৳{ticket.fare}</span>
                </div>

                {/* Timing Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm font-medium">Booked At</p>
                      <p className="text-sm text-gray-600">{formatDate(ticket.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm font-medium">Expires At</p>
                      <p className="text-sm text-gray-600">{formatDate(ticket.expiresAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                {ticket.used && ticket.verifiedAt && (
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-800">Ticket Verified</p>
                      <p className="text-sm text-green-600">Used on {formatDate(ticket.verifiedAt)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code Card */}
            {ticketStatus.status === "valid" && (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    QR Code
                  </CardTitle>
                  <CardDescription>Show this to the bus staff for verification</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  {qrCodeUrl && (
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                      <img src={qrCodeUrl || "/placeholder.svg"} alt="Ticket QR Code" className="w-48 h-48 mx-auto" />
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-4">
                    This QR code contains your ticket information for verification
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {ticketStatus.status === "valid" ? (
                    <>
                      <p>• Show the QR code to the bus staff when boarding</p>
                      <p>• Keep this ticket until your journey is complete</p>
                      <p>• This ticket is valid for 24 hours from booking time</p>
                      <p>• Contact support if you face any issues</p>
                    </>
                  ) : ticketStatus.status === "used" ? (
                    <>
                      <p>• This ticket has been successfully used</p>
                      <p>• Thank you for using DIU Transport System</p>
                      <p>• You can book a new ticket anytime from your dashboard</p>
                    </>
                  ) : (
                    <>
                      <p>• This ticket has expired and cannot be used</p>
                      <p>• Please book a new ticket for your journey</p>
                      <p>• Contact support if you believe this is an error</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Link href="/student/book-ticket" className="flex-1">
                <Button className="w-full">Book Another Ticket</Button>
              </Link>
              <Link href="/student/support" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Get Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
