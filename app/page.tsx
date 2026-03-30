"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bus, Users, MapPin, Shield, Clock, CreditCard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-green-900 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DIU Transport</h1>
                <p className="text-sm text-gray-600">Smart Transportation System</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-green-600 hover:bg-green-900">Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to DIU Smart Transport System</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience seamless campus transportation with digital ticketing, real-time tracking, and smart scheduling
            for Daffodil International University.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 bg-green-600 hover:bg-green-900">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CreditCard className="h-8 w-8 mb-2 text-green-900" />
              <CardTitle>Digital Ticketing</CardTitle>
              <CardDescription>Book and manage your bus tickets digitally with OneCard integration</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Instant ticket booking</li>
                <li>• QR code verification</li>
                <li>• Balance management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-green-900 mb-2" />
              <CardTitle>Real-time Tracking</CardTitle>
              <CardDescription>Track bus locations and get accurate arrival times</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Live bus locations</li>
                <li>• Route information</li>
                <li>• Estimated arrival times</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-green-900 mb-2" />
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>View bus schedules and plan your journey efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Complete timetables</li>
                <li>• Route planning</li>
                <li>• Schedule notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-green-900 mb-2" />
              <CardTitle>Multi-Role Access</CardTitle>
              <CardDescription>Different interfaces for students, staff, and administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Student dashboard</li>
                <li>• Staff verification tools</li>
                <li>• Admin management panel</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-green-900 mb-2" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>Built with security and reliability as top priorities</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Secure authentication</li>
                <li>• Data encryption</li>
                <li>• 24/7 availability</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bus className="h-8 w-8 text-green-900 mb-2" />
              <CardTitle>Campus Integration</CardTitle>
              <CardDescription>Seamlessly integrated with DIU campus systems</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• DIU email integration</li>
                <li>• Student ID verification</li>
                <li>• Campus-wide coverage</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-6">
            Join thousands of DIU students and staff using our smart transport system every day.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="px-8 bg-green-600 hover:bg-green-900">
              Create Your Account
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 DIU Smart Transport System. Built for Daffodil International University.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
