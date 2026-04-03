"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { ArrowLeft, Route, Plus, Edit, Trash2, DollarSign, GripVertical } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface PathPoint {
  name: string
  order: number
}

interface PathSegment {
  from: string
  to: string
  fare: number
}

interface Path {
  _id: string
  name: string
  points: PathPoint[]
  segments: PathSegment[]
  active: boolean
  createdAt: string
}

export default function RoutesManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [paths, setPaths] = useState<Path[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPath, setEditingPath] = useState<Path | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    points: ["", ""],
    fares: [0],
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }
    fetchPaths()
  }, [user, router])

  const fetchPaths = async () => {
    try {
      const response = await fetch("/api/admin/paths")
      if (response.ok) {
        const data = await response.json()
        setPaths(data.paths)
      }
    } catch (error) {
      console.error("Error fetching paths:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePointChange = (index: number, value: string) => {
    const newPoints = [...formData.points]
    newPoints[index] = value
    setFormData((prev) => ({ ...prev, points: newPoints }))
  }

  const handleFareChange = (index: number, value: number) => {
    const newFares = [...formData.fares]
    newFares[index] = value
    setFormData((prev) => ({ ...prev, fares: newFares }))
  }

  const addPoint = () => {
    setFormData((prev) => ({
      ...prev,
      points: [...prev.points, ""],
      fares: [...prev.fares, 0],
    }))
  }

  const removePoint = (index: number) => {
    if (formData.points.length <= 2) return // Minimum 2 points required

    const newPoints = formData.points.filter((_, i) => i !== index)
    const newFares = formData.fares.filter((_, i) => i !== index - 1)
    setFormData((prev) => ({ ...prev, points: newPoints, fares: newFares }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate points
    if (formData.points.some((point) => !point.trim())) {
      setError("All points must have names")
      return
    }

    // Validate fares
    if (formData.fares.some((fare) => fare <= 0)) {
      setError("All fares must be greater than 0")
      return
    }

    try {
      const points = formData.points.map((name, index) => ({
        name: name.trim(),
        order: index,
      }))

      const segments = formData.fares.map((fare, index) => ({
        from: formData.points[index],
        to: formData.points[index + 1],
        fare,
      }))

      const url = editingPath ? `/api/admin/paths/${editingPath._id}` : "/api/admin/paths"
      const method = editingPath ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          points,
          segments,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: editingPath ? "Route updated" : "Route created",
          description: `${formData.name} has been ${editingPath ? "updated" : "created"} successfully.`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchPaths()
      } else {
        setError(data.message || "Operation failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleEdit = (path: Path) => {
    setEditingPath(path)
    setFormData({
      name: path.name,
      points: path.points.map((p) => p.name),
      fares: path.segments.map((s) => s.fare),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (pathId: string, pathName: string) => {
    if (!confirm(`Are you sure you want to delete the route "${pathName}"?`)) return

    try {
      const response = await fetch(`/api/admin/paths/${pathId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Route deleted",
          description: `${pathName} has been removed from the system.`,
        })
        fetchPaths()
      } else {
        const data = await response.json()
        toast({
          title: "Delete failed",
          description: data.message || "Failed to delete route",
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
      name: "",
      points: ["", ""],
      fares: [0],
    })
    setEditingPath(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600">Configure transport routes and segment fares</p>
        </div>

        <div className="space-y-6">
          {/* Header Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Route className="h-5 w-5 mr-2" />
                  Routes ({paths.length})
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Route
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingPath ? "Edit Route" : "Add New Route"}</DialogTitle>
                      <DialogDescription>
                        {editingPath ? "Update route information and fares" : "Create a new transport route"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Route Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., DIU to New Market"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Route Points & Fares</Label>
                          <Button type="button" size="sm" onClick={addPoint}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Point
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {formData.points.map((point, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <div className="flex-1">
                                  <Input
                                    placeholder={`Point ${index + 1} (e.g., DIU Main Campus)`}
                                    value={point}
                                    onChange={(e) => handlePointChange(index, e.target.value)}
                                    required
                                  />
                                </div>
                                {formData.points.length > 2 && (
                                  <Button type="button" size="sm" variant="outline" onClick={() => removePoint(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              {index < formData.points.length - 1 && (
                                <div className="ml-6 flex items-center space-x-2">
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    placeholder="Fare (৳)"
                                    min="1"
                                    value={formData.fares[index] || ""}
                                    onChange={(e) => handleFareChange(index, Number(e.target.value))}
                                    className="w-32"
                                    required
                                  />
                                  <span className="text-sm text-gray-500">
                                    ৳{formData.fares[index] || 0} from {point || `Point ${index + 1}`} to{" "}
                                    {formData.points[index + 1] || `Point ${index + 2}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Route Preview</h4>
                          <div className="space-y-1">
                            {formData.points.map((point, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                <span>{point || `Point ${index + 1}`}</span>
                                {index < formData.points.length - 1 && (
                                  <span className="ml-auto text-blue-600 font-medium">
                                    ৳{formData.fares[index] || 0}
                                  </span>
                                )}
                              </div>
                            ))}
                            <div className="pt-2 border-t border-blue-200 mt-2">
                              <span className="text-blue-800 font-medium">
                                Total Route Fare: ৳{formData.fares.reduce((sum, fare) => sum + (fare || 0), 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button type="submit" className="flex-1">
                          {editingPath ? "Update Route" : "Create Route"}
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

          {/* Routes List */}
          <div className="grid gap-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading routes...</p>
              </div>
            ) : paths.length > 0 ? (
              paths.map((path) => (
                <Card key={path._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Route className="h-5 w-5 mr-2" />
                        {path.name}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={path.active ? "default" : "secondary"}>
                          {path.active ? "Active" : "Inactive"}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(path)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(path._id, path.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {path.points.length} stops • Total fare: ৳
                      {path.segments.reduce((sum, segment) => sum + segment.fare, 0)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {path.points.map((point, index) => (
                        <div key={point.name} className="flex items-center">
                          <div className="flex items-center flex-1">
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${
                                index === 0
                                  ? "bg-green-500"
                                  : index === path.points.length - 1
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                              }`}
                            ></div>
                            <span className="font-medium">{point.name}</span>
                          </div>
                          {index < path.points.length - 1 && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="mr-2">→</span>
                              <span className="font-medium text-green-600">
                                ৳{path.segments.find((s) => s.from === point.name)?.fare || 0}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No routes configured yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
