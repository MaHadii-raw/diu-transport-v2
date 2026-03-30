"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bus, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  console.log(email, password)
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (!email.endsWith("@diu.edu.bd")) {
      setError("Please use your DIU email address")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.user)
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.name}!`,
        })

        // Redirect based on role
        switch (data.user.role) {
          case "student":
            router.push("/student")
            break
          case "staff":
            router.push("/staff")
            break
          case "admin":
            router.push("/admin")
            break
          default:
            router.push("/")
        }
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          setError(data.message || "Invalid email or password")
        } else if (response.status === 500) {
          setError("Server error. Please try again later.")
        } else {
          setError(data.message || "Login failed")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center mb-4">
            <Bus className="h-8 w-8 text-green-900 mr-2" />
            <h1 className="text-2xl font-bold">DIU Transport</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your DIU credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@diu.edu.bd"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("") // Clear error when user starts typing
                  }}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError("") // Clear error when user starts typing
                  }}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-800" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-green-600 hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
