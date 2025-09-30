"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle, Plus, Database, Users } from "lucide-react"

interface Course {
  id: string
  name: string
  instructor: string
  priceINR: number
  level: string
  type: string
  courseCategory: string
  status: string
}

interface RegistrationData {
  name: string
  course: string
  level: string
  type: string
  category: string
  courseType: string
  paymentFrequency: string
  phoneNumber: string
  email: string
}

export default function StudentRegistrationForm() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [creatingData, setCreatingData] = useState(false)
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    name: "",
    course: "",
    level: "Beginner",
    type: "Individual",
    category: "Beginner",
    courseType: "Individual",
    paymentFrequency: "Monthly",
    phoneNumber: "",
    email: ""
  })
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // Fetch available courses
  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await fetch('/api/courses')
      const result = await response.json()
      
      if (result.success) {
        setCourses(result.data)
        console.log('Fetched courses:', result.data.length)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch courses",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast({
        title: "Error", 
        description: "Failed to connect to courses API",
        variant: "destructive"
      })
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }))
    
    // Update selected course when course changes
    if (field === 'course') {
      const course = courses.find(c => c.name === value)
      setSelectedCourse(course || null)
      
      // Auto-fill level and type from course if available
      if (course) {
        setRegistrationData(prev => ({
          ...prev,
          level: course.level,
          type: course.type
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registrationData.name || !registrationData.course || !registrationData.phoneNumber || !registrationData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Registration Successful! 🎉",
          description: result.message,
        })
        
        // Reset form
        setRegistrationData({
          name: "",
          course: "",
          level: "Beginner",
          type: "Individual", 
          category: "Beginner",
          courseType: "Individual",
          paymentFrequency: "Monthly",
          phoneNumber: "",
          email: ""
        })
        setSelectedCourse(null)
        
        console.log('Registration result:', result.data)
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Registration Failed",
        description: "Network error - please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createSampleData = async () => {
    try {
      setCreatingData(true)
      
      const response = await fetch('/api/debug/sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sample Data Created! 🚀",
          description: `Created ${result.data.courses.created} courses and ${result.data.students.created} students with payment records`,
        })
        
        // Refresh courses
        fetchCourses()
      } else {
        toast({
          title: "Failed to Create Sample Data",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Sample data creation error:', error)
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive"
      })
    } finally {
      setCreatingData(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Student Registration System</h1>
        <p className="text-gray-600">Register students and automatically create payment records</p>
      </div>

      {/* Sample Data Creation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            Create sample courses and student data to test the payment system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={createSampleData}
            disabled={creatingData}
            className="w-full"
            variant="outline"
          >
            {creatingData ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Sample Data...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Sample Courses & Students
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              New Student Registration
            </CardTitle>
            <CardDescription>
              Register a new student and automatically create payment records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Student Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter student name"
                  value={registrationData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                {loadingCourses ? (
                  <div className="flex items-center gap-2 p-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading courses...
                  </div>
                ) : (
                  <Select 
                    value={registrationData.course} 
                    onValueChange={(value) => handleInputChange('course', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.name}>
                          {course.name} - ₹{course.priceINR.toLocaleString()} ({course.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Course Details (Auto-filled) */}
              {selectedCourse && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                  <div><strong>Instructor:</strong> {selectedCourse.instructor}</div>
                  <div><strong>Price:</strong> ₹{selectedCourse.priceINR.toLocaleString()}</div>
                  <div><strong>Level:</strong> {selectedCourse.level}</div>
                  <div><strong>Category:</strong> {selectedCourse.courseCategory}</div>
                </div>
              )}

              {/* Level */}
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select 
                  value={registrationData.level} 
                  onValueChange={(value) => handleInputChange('level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Class Type</Label>
                <Select 
                  value={registrationData.type} 
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Group">Group</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Frequency */}
              <div className="space-y-2">
                <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                <Select 
                  value={registrationData.paymentFrequency} 
                  onValueChange={(value) => handleInputChange('paymentFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One-time">One-time Payment</SelectItem>
                    <SelectItem value="Monthly">Monthly (3 installments)</SelectItem>
                    <SelectItem value="Quarterly">Quarterly (4 installments)</SelectItem>
                    <SelectItem value="Weekly">Weekly (12 installments)</SelectItem>
                    <SelectItem value="Semi-annual">Semi-annual (2 installments)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={registrationData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@email.com"
                  value={registrationData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering Student...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Register Student & Create Payments
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Available Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Available Courses</CardTitle>
            <CardDescription>
              {loadingCourses ? 'Loading...' : `${courses.length} courses available`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No courses available</p>
                <p className="text-sm text-gray-500">Create sample data to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="font-medium">{course.name}</div>
                    <div className="text-sm text-gray-600">
                      Instructor: {course.instructor}
                    </div>
                    <div className="text-sm text-gray-600">
                      Price: ₹{course.priceINR.toLocaleString()} | Level: {course.level}
                    </div>
                    <div className="text-xs text-gray-500">
                      {course.courseCategory} | {course.type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}