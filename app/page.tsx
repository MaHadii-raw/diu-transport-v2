"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Bus,
  MapPin,
  ShieldCheck,
  Clock3,
  CreditCard,
  Bell,
  ArrowRight,
  Route,
  Users,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case "student":
          router.push("/student")
          break
        case "staff":
          router.push("/staff")
          break
        case "admin":
          router.push("/admin")
          break
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
              <Bus className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">DIU Transport</h1>
              <p className="text-sm text-slate-500">Smart Campus Transportation System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              >
                Login
              </Button>
            </Link>

            <Link href="/auth/register">
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-200 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-100 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
              Easy booking • Real-time tracking • Smart travel
            </div>

            <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Smarter Bus Travel for the
              <span className="block text-emerald-600"> DIU Community</span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Book seats, check routes, track buses, and manage your daily campus travel with one
              modern platform built for Daffodil International University students and staff.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-emerald-600 px-8 text-white hover:bg-emerald-700"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-slate-300 bg-white px-8 text-slate-700 hover:bg-slate-100"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">24/7</p>
                <p className="text-sm text-slate-500">Access to schedules</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">Live</p>
                <p className="text-sm text-slate-500">Bus tracking updates</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">Smart</p>
                <p className="text-sm text-slate-500">Digital transport system</p>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-emerald-100">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Today&apos;s Overview</p>
                  <h3 className="text-2xl font-bold text-slate-900">Campus Transport</h3>
                </div>

                <div className="rounded-2xl bg-emerald-100 p-3">
                  <Bus className="h-7 w-7 text-emerald-600" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-slate-900">Route A - Dhanmondi to DIU</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      On Time
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    Live location available
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-slate-900">Next Departure</p>
                    <span className="text-sm font-semibold text-slate-700">8:30 AM</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    Arrives at campus in approximately 35 minutes
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-slate-900">Ticket Status</p>
                    <span className="text-sm font-semibold text-emerald-700">Active</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CreditCard className="h-4 w-4" />
                    OneCard linked and ready for booking
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">Live Alerts</p>
                  <p className="text-xs text-slate-500">Route and schedule notifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Key Features
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything You Need for Daily Campus Travel
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Designed to make transportation easier, faster, and more organized for students, staff,
            and administrators.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <CreditCard className="h-7 w-7 text-emerald-600" />
              </div>
              <h4 className="mb-2 text-2xl font-bold text-slate-900">Digital Ticketing</h4>
              <p className="mb-4 text-slate-600">
                Book bus seats easily through a digital system with fast verification and simple
                ticket management.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Instant booking experience</li>
                <li>• QR-based ticket validation</li>
                <li>• Smooth payment integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                <MapPin className="h-7 w-7 text-blue-600" />
              </div>
              <h4 className="mb-2 text-2xl font-bold text-slate-900">Real-time Tracking</h4>
              <p className="mb-4 text-slate-600">
                Track bus location in real time and see estimated arrival updates to plan your
                journey better.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Live route monitoring</li>
                <li>• Accurate ETA updates</li>
                <li>• Better trip planning</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                <Clock3 className="h-7 w-7 text-amber-600" />
              </div>
              <h4 className="mb-2 text-2xl font-bold text-slate-900">Smart Scheduling</h4>
              <p className="mb-4 text-slate-600">
                Stay updated with route timings, departure schedules, and trip planning from one
                dashboard.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Complete timetable access</li>
                <li>• Better time management</li>
                <li>• Schedule-based planning</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <h4 className="mb-2 text-2xl font-bold text-slate-900">Multi-Role Access</h4>
              <p className="mb-4 text-slate-600">
                Separate dashboards and access levels for students, staff, and administrators.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Student booking dashboard</li>
                <li>• Staff verification tools</li>
                <li>• Admin control panel</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100">
                <Route className="h-7 w-7 text-cyan-600" />
              </div>
              <h4 className="mb-2 text-2xl font-bold text-slate-900">Route Information</h4>
              <p className="mb-4 text-slate-600">
                View route details, stop information, and travel updates to avoid confusion during
                daily travel.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Clear stop details</li>
                <li>• Easy route understanding</li>
                <li>• Better travel decisions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
                <ShieldCheck className="h-7 w-7 text-rose-600" />
              </div>
              <h4 className="mb-2 text-2xl font-bold text-slate-900">Secure & Reliable</h4>
              <p className="mb-4 text-slate-600">
                Built with secure access, reliable booking flow, and protected user information.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Protected authentication</li>
                <li>• Safer user data handling</li>
                <li>• Reliable system access</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Why Choose Us
            </p>

            <h3 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A Better Transportation Experience for DIU
            </h3>

            <p className="mt-5 max-w-xl text-slate-300">
              This platform helps reduce confusion, saves time, and improves daily transport
              management through one clean and organized system.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-2 text-lg font-semibold">Fast Access</h4>
              <p className="text-sm text-slate-300">
                Students and staff can quickly view transport information without delay.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-2 text-lg font-semibold">Organized Travel</h4>
              <p className="text-sm text-slate-300">
                Clear schedules and route updates help everyone plan the day better.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-2 text-lg font-semibold">Smart Management</h4>
              <p className="text-sm text-slate-300">
                Administrators can manage transport services more effectively from one place.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-2 text-lg font-semibold">Modern Experience</h4>
              <p className="text-sm text-slate-300">
                Clean design and simple navigation make the system easier to use every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-12 text-center text-white shadow-xl sm:px-10">
          <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Use DIU Smart Transport?
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-emerald-50">
            Create your account today and enjoy a smarter, faster, and more organized campus travel
            experience.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="h-12 rounded-xl bg-white px-8 text-emerald-700 hover:bg-slate-100"
              >
                Create Account
              </Button>
            </Link>

            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white bg-transparent px-8 text-white hover:bg-white/10"
              >
                Login Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
              <Bus className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <p className="font-semibold text-slate-900">DIU Transport</p>
              <p className="text-sm text-slate-500">Smart Transportation System</p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} DIU Smart Transport System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}