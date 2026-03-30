"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bus, ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface RegisterResponse {
  userId: string
  emailSent: boolean
  emailService?: string
  fallback?: boolean
  otp?: string
  message?: string
}

interface OTPResponse {
  message: string
}

export default function RegisterPage() {
  const [step, setStep] = useState(1) // 1: Basic info, 2: OTP verification
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    studentId: "",
    otp: "",
    password: "",
    confirmPassword: "",
  })
  const [userId, setUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [emailService, setEmailService] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("") // Clear error when user starts typing
  }

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required"
    if (!formData.email.trim()) return "Email is required"
    if (!formData.email.endsWith("@diu.edu.bd")) return "Please use a valid DIU email address"
    if (formData.role === "student" && !formData.studentId.trim()) return "Student ID is required"
    if (formData.role === "student" && (formData.studentId.length < 1 || formData.studentId.length > 16)) {
      return "Student ID must be 1-16 digits"
    }
    if (formData.role === "student" && !/^\d+$/.test(formData.studentId)) {
      return "Student ID must contain only numbers"
    }
    if (formData.password.length < 6) return "Password must be at least 6 characters"
    if (!/(?=.*[a-z])/.test(formData.password)) return "Password must contain at least one lowercase letter"
    if (!/(?=.*[A-Z])/.test(formData.password)) return "Password must contain at least one uppercase letter"
    if (!/(?=.*\d)/.test(formData.password)) return "Password must contain at least one number"
    if (formData.password !== formData.confirmPassword) return "Passwords do not match"
    return null
  }

  const handleStep1Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          role: formData.role,
          ...(formData.role === "student" && { studentId: formData.studentId }),
        }),
      })

      const data: RegisterResponse = await response.json()

      if (response.ok) {
        setUserId(data.userId)
        setEmailSent(data.emailSent)
        setEmailService(data.emailService || "unknown")

        let toastMessage = `Registration initiated! OTP sent to ${formData.email}.`

        if (data.fallback) {
          toastMessage += " (Email delivery failed - check console for OTP)"
        } else if (data.emailService === "emailjs") {
          toastMessage += " Check your email inbox."
        }

        toast({
          title: "Registration successful",
          description: toastMessage,
        })

        // Show development OTP if available
        if (process.env.NODE_ENV !== "production" && data.otp) {
          console.log(`🔐 Development OTP for ${formData.email}: ${data.otp}`)
        }

        setStep(2)
      } else {
        setError(data.message || "Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          otp: formData.otp,
        }),
      })

      const data: OTPResponse = await response.json()

      if (response.ok) {
        toast({
          title: "Account verified successfully!",
          description: "You can now login with your credentials.",
        })
        router.push("/auth/login")
      } else {
        setError(data.message || "OTP verification failed")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
        }),
      })

      const data: RegisterResponse = await response.json()

      if (response.ok) {
        setEmailSent(data.emailSent)
        setEmailService(data.emailService || "unknown")

        let toastMessage = `New OTP sent to ${formData.email}.`

        if (data.fallback) {
          toastMessage += " (Email delivery failed - check console for OTP)"
        } else if (data.emailService === "emailjs") {
          toastMessage += " Check your email inbox."
        }

        toast({
          title: "OTP resent",
          description: toastMessage,
        })

        // Show development OTP if available
        if (process.env.NODE_ENV !== "production" && data.otp) {
          console.log(`🔐 Development OTP for ${formData.email}: ${data.otp}`)
        }
      } else {
        setError(data.message || "Failed to resend OTP")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2text-green-600" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center mb-4">
            <Bus className="h-8 w-8 text-green-900 mr-2" />
            <h1 className="text-2xl font-bold">DIU Transport</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register - Step {step} of 2</CardTitle>
            <CardDescription>
              {step === 1 && "Enter your information to create an account"}
              {step === 2 && "Verify your email with the OTP sent to you"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">DIU Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.name@diu.edu.bd"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      placeholder="Enter your student ID (up to 16 digits)"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange("studentId", e.target.value.replace(/\D/g, "").slice(0, 16))}
                      disabled={isLoading}
                      maxLength={16}
                      required
                    />
                    <p className="text-xs text-gray-500">Enter your student ID (numbers only, maximum 16 digits)</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 6 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-800" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleOtpVerification} className="space-y-4">
                {/* Email Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    {emailSent ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <Mail className="h-5 w-5 text-green-600 mr-2" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {emailSent ? "Email sent successfully!" : "Email delivery status unknown"}
                      </p>
                      <p className="text-xs text-blue-700">
                        OTP sent to {formData.email}
                        {emailService && ` via ${emailService}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    placeholder="6-digit OTP"
                    value={formData.otp}
                    onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Check your email inbox for the verification code
                    {process.env.NODE_ENV !== "production" && " (or console in development)"}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Account"
                  )}
                </Button>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={resendOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Resend OTP"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-green-600 hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
