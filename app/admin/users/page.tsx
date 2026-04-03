"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { ArrowLeft, Users, Plus, Edit, Trash2, Search, CreditCard } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Student {
  _id: string
  name: string
  email: string
  studentId: string
  balance: number
  createdAt: string
}

export default function UsersManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    balance: 0,
    password: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }
    fetchStudents()
  }, [user, router])

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredStudents(filtered)
  }, [students, searchTerm])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setStudents(data.users)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const url = editingStudent ? `/api/admin/users/${editingStudent._id}` : "/api/admin/users"
      const method = editingStudent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: "student",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: editingStudent ? "Student updated" : "Student created",
          description: `${formData.name} has been ${editingStudent ? "updated" : "added"} successfully.`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchStudents()
      } else {
        setError(data.message || "Operation failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      balance: student.balance,
      password: "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}?`)) return

    try {
      const response = await fetch(`/api/admin/users/${studentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Student deleted",
          description: `${studentName} has been removed from the system.`,
        })
        fetchStudents()
      } else {
        const data = await response.json()
        toast({
          title: "Delete failed",
          description: data.message || "Failed to delete student",
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
      email: "",
      studentId: "",
      balance: 100,
      password: "",
    })
    setEditingStudent(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">Manage student accounts and balances</p>
        </div>

        <div className="space-y-6">
          {/* Header Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Students ({filteredStudents.length})
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                      <DialogDescription>
                        {editingStudent ? "Update student information" : "Create a new student account"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="student@diu.edu.bd"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input
                          id="studentId"
                          placeholder="Enter student ID (up to 16 digits)"
                          value={formData.studentId}
                          onChange={(e) =>
                            handleInputChange("studentId", e.target.value.replace(/\D/g, "").slice(0, 16))
                          }
                          maxLength={16}
                          required
                        />
                        <p className="text-xs text-gray-500">Numbers only, maximum 16 digits</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="balance">Initial Balance (৳)</Label>
                        <Input
                          id="balance"
                          type="number"
                          min="0"
                          value={formData.balance}
                          onChange={(e) => handleInputChange("balance", Number(e.target.value))}
                          required
                        />
                      </div>

                      {!editingStudent && (
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button type="submit" className="flex-1">
                          {editingStudent ? "Update Student" : "Create Student"}
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
            <CardContent>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading students...</p>
                </div>
              ) : filteredStudents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.studentId}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1 text-green-600" />
                            <span className="font-medium text-green-600">৳{student.balance}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(student._id, student.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No students found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
