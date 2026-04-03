"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Clock, Plus, Edit, Trash2, Users, Route } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Path {
  _id: string
  name: string
}

interface Schedule {
  _id: string
  pathId: string
  pathName: string
  departureTimes: string[]
  capacity: number
  active: boolean
  createdAt: string
}

export default function SchedulesManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [paths, setPaths] = useState<Path[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [formData, setFormData] = useState({
    pathId: "",
    departureTimes: ["08:00"],
    capacity: 40,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }
    fetchPaths()
    fetchSchedules()
  }, [user, router])

  const fetchPaths = async () => {
    try {
      const response = await fetch("/api/paths")
      if (response.ok) {
        const data = await response.json()
        setPaths(data.paths)
      }
    } catch (error) {
      console.error("Error fetching paths:", error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/admin/schedules")
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.departureTimes]
    newTimes[index] = value
    setFormData((prev) => ({ ...prev, departureTimes: newTimes }))
  }

  const addDepartureTime = () => {
    setFormData((prev) => ({
      ...prev,
      departureTimes: [...prev.departureTimes, "09:00"],
    }))
  }

  const removeDepartureTime = (index: number) => {
    if (formData.departureTimes.length <= 1) return // Minimum 1 time required

    const newTimes = formData.departureTimes.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, departureTimes: newTimes }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.pathId) {
      setError("Please select a route")
      return
    }

    if (formData.departureTimes.some((time) => !time)) {
      setError("All departure times must be set")
      return
    }

    try {
      const pathName = paths.find((p) => p._id === formData.pathId)?.name || ""

      const url = editingSchedule ? `/api/admin/schedules/${editingSchedule._id}` : "/api/admin/schedules"
      const method = editingSchedule ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          pathName,
          departureTimes: formData.departureTimes.sort(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: editingSchedule ? "Schedule updated" : "Schedule created",
          description: `Schedule for ${pathName} has been ${editingSchedule ? "updated" : "created"} successfully.`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchSchedules()
      } else {
        setError(data.message || "Operation failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      pathId: schedule.pathId,
      departureTimes: [...schedule.departureTimes],
      capacity: schedule.capacity,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (scheduleId: string, pathName: string) => {
    if (!confirm(`Are you sure you want to delete the schedule for "${pathName}"?`)) return

    try {
      const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Schedule deleted",
          description: `Schedule for ${pathName} has been removed.`,
        })
        fetchSchedules()
      } else {
        const data = await response.json()
        toast({
          title: "Delete failed",
          description: data.message || "Failed to delete schedule",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      pathId: "",
      departureTimes: ["08:00"],
      capacity: 40,
    })
    setEditingSchedule(null)
    setError("")
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600">Configure bus schedules and capacity for each route</p>
        </div>

        <div className="space-y-6">
          {/* Header Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Schedules ({schedules.length})
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
                      <DialogDescription>
                        {editingSchedule ? "Update schedule information" : "Create a new bus schedule"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label>Route</Label>
                        <Select
                          value={formData.pathId}
                          onValueChange={(value) => handleInputChange("pathId", value)}
                          disabled={!!editingSchedule}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a route" />
                          </SelectTrigger>
                          <SelectContent>
                            {paths.map((path) => (
                              <SelectItem key={path._id} value={path._id}>
                                {path.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Bus Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.capacity}
                          onChange={(e) => handleInputChange("capacity", Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Departure Times</Label>
                          <Button type="button" size="sm" onClick={addDepartureTime}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Time
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {formData.departureTimes.map((time, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={time}
                                onChange={(e) => handleTimeChange(index, e.target.value)}
                                required
                              />
                              {formData.departureTimes.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeDepartureTime(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button type="submit" className="flex-1">
                          {editingSchedule ? "Update Schedule" : "Create Schedule"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleDialogClose}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Schedules List */}
          <div className="grid gap-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading schedules...</p>
              </div>
            ) : schedules.length > 0 ? (
              schedules.map((schedule) => (
                <Card key={schedule._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Route className="h-5 w-5 mr-2" />
                        {schedule.pathName}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={schedule.active ? "default" : "secondary"}>
                          {schedule.active ? "Active" : "Inactive"}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(schedule._id, schedule.pathName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {schedule.capacity} seats • {schedule.departureTimes.length} daily departures
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Departure Times</h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {schedule.departureTimes.map((time) => (
                            <Badge key={time} variant="outline" className="justify-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No schedules configured yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
