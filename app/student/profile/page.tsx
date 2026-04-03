"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, User, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import ErrorBoundary from "@/components/ErrorBoundary"

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [topupAmount, setTopupAmount] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isTopping, setIsTopping] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      router.push("/auth/login")
      return
    }

    if (user) {
      setName(user.name)
    }
  }, [user, isLoading, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError("")

    try {
      const response = await fetch(`/api/users/${user?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        updateUser({ name: data.user.name })
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      } else {
        setError(data.message || "Failed to update profile")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTopping(true)
    setError("")

    const amount = Number.parseFloat(topupAmount)
    if (!amount || amount <= 0 || amount > 1000) {
      setError("Please enter a valid amount between ৳1 and ৳1000")
      setIsTopping(false)
      return
    }

    try {
      const response = await fetch(`/api/users/${user?._id}/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()

      if (response.ok) {
        updateUser({ balance: data.newBalance })
        setTopupAmount("")
        toast({
          title: "Top-up successful",
          description: `৳${amount} has been added to your OneCard balance.`,
        })
      } else {
        setError(data.message || "Failed to top up balance")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsTopping(false)
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
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/student" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and OneCard balance</p>
          </div>

          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.photo || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-600">ID: {user.studentId}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isUpdating}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Read-only)</Label>
                    <Input id="email" value={user.email} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID (Read-only)</Label>
                    <Input id="studentId" value={user.studentId} disabled />
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* OneCard Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  OneCard Balance
                </CardTitle>
                <CardDescription>Top up your balance for ticket purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-2">৳{user.balance || 0}</div>
                  <p className="text-sm text-gray-600">Current balance</p>
                </div>

                <form onSubmit={handleTopup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Top-up Amount (৳)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      placeholder="Enter amount (max ৳1000)"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      disabled={isTopping}
                      required
                    />
                  </div>

                  <div className="flex space-x-2">
                    {[50, 100, 200, 500].map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTopupAmount(amount.toString())}
                        disabled={isTopping}
                      >
                        ৳{amount}
                      </Button>
                    ))}
                  </div>

                  <Button type="submit" disabled={isTopping || !topupAmount}>
                    {isTopping ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Top Up Balance"
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is a demo top-up system. In production, this would integrate with actual
                    payment gateways.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
