"use client"

import { useState, useEffect, useMemo } from "react"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  BookOpen,
  Filter,
  ArrowUpDown,
  Trophy,
  Users,
  Star,
  Eye,
  Trash2,
  GraduationCap,
  CheckCircle,
  Banknote,
  Pencil,
  Clock,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Course } from "@/types/course"

// Type definitions
type DraftType = {
  id: string
  name: string
  updatedAt: number
  instructor?: string
  description?: string
  level?: string
  type?: string
  priceINR?: number
  tags?: string[]
  schedule?: string
  maxStudents?: number
  location?: string
  schedulePeriod?: any
  sessionDetails?: any
  frequencyDetails?: any
  frequencies?: any[]
  chapters?: any[]
  referralCode?: string
  commissionRate?: string
  referralStart?: string
  referralEnd?: string
  referralStatus?: string
  faqs?: any[]
  reminderSettings?: any
  freeGifts?: string[]
  status?: string
  courseCategory?: string
  [key: string]: any
}

// Local Cohort type for state
interface Cohort {
  id: string
  name: string
  courseId: string
  notes: string
  startTime?: string
  endTime?: string
  capacity: number
  members: string[]
}

// Enhanced sample data
const sampleCourses: Course[] = [
  {
    id: "CRS001",
    name: "Advanced React Development",
    instructor: "Jane Smith",
    instructorId: "INST001",
    description: "Master advanced React concepts including hooks, context, and performance optimization.",
    level: "Advanced",
    type: "Online",
    duration: "12 weeks",
    priceINR: 24999,
    price: 300,
    currency: "INR",
    schedule: "Mon, Wed 7:00 PM - 9:00 PM",
    maxStudents: 25,
    enrolledStudents: 18,
    location: "Online",
    tags: ["React", "JavaScript", "Frontend", "Advanced"],
    modules: [],
    completionRate: 85,
    schedulePeriod: { startDate: "2024-01-01", endDate: "2024-03-31", totalWeeks: "12" },
    sessionDetails: { sessionDuration: "2", maxClasses: "2" },
    frequencyDetails: { selectedDays: ["Monday", "Wednesday"], dayTimes: {} },
    frequencies: [{ days: ["Monday", "Wednesday"], start: "19:00", end: "21:00", sessions: "1" }],
    chapters: [
      { name: "Advanced Hooks", description: "Deep dive into React hooks and custom hooks." },
      { name: "Performance Optimization", description: "Learn React performance best practices." },
    ],
    referralCode: "REACT2024",
    commissionRate: "10",
    referralStart: "2024-01-01",
    referralEnd: "2024-03-31",
    referralStatus: "Active",
    affiliateTracking: {
      enabled: true,
      referralCode: "REACT2024",
      commissionRate: 10,
      totalReferrals: 5,
      totalCommission: 500,
    },
    emiPlans: [],
    scholarships: [],
    taxInfo: {
      gstEnabled: true,
      gstRate: 18,
      educationTaxRate: 0,
      pan: "ABCDE1234F",
      autoGeneration: true,
      invoicePrefix: "INV2025",
      lastInvoiceNumber: 1001,
      taxDocuments: [],
    },
    faqs: [
      {
        question: "What prerequisites are required?",
        answer: "Basic knowledge of React and JavaScript is required.",
        isEditing: false,
      },
    ],
    reminderSettings: {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      customSchedule: [],
      frequency: "weekly",
      customDays: "",
      customInterval: "",
    },
    freeGifts: ["Course Certificate", "Bonus Materials"],
    status: "Active",
    courseCategory: "Regular",
    rating: 4.8,
    cohortAnalysis: [],
    learningBehavior: {
      bestLearningTimes: [],
      engagementWindows: [],
      preferredContentTypes: [],
      averageSessionDuration: 0,
      peakActivityDays: [],
    },
    roiCalculator: {
      courseCost: 0,
      expectedSalaryIncrease: 0,
      timeToROI: 0,
      industryAverageSalary: 0,
      skillDemandScore: 0,
    },
    dropoffPrediction: {
      riskScore: 0,
      riskFactors: [],
      interventionSuggestions: [],
    },
    sharedResources: [],
    versionControl: [],
    materialAnalytics: {
      resourceId: "MAT001",
      views: 0,
      downloads: 0,
      averageRating: 0,
      successRate: 0,
      engagementTime: 0,
    },
    credentialVerification: false,
    marketplaceEnabled: false,
    ltiIntegration: false,
    contentSecurity: {
      watermarkEnabled: false,
      downloadProtection: false,
      screenRecordingProtection: false,
      accessLogging: false,
      licenseTracking: false,
    },
    offlineAccess: {
      enabled: false,
      downloadLimit: 0,
      currentDownloads: 0,
      expiryDays: 0,
      accessLogs: [],
    },
    industryPartners: [],
    events: [],
    alumniNetwork: [],
    promotionTemplates: [],
    seasonalPromos: [],
    growthAnalytics: {
      enrollmentTrend: [],
      revenueTrend: [],
      completionTrend: [],
      satisfactionTrend: [],
    },
  },
  {
    id: "CRS002",
    name: "UI/UX Design Fundamentals",
    instructor: "John Doe",
    instructorId: "INST002",
    description: "Learn the fundamentals of user interface and user experience design.",
    level: "Beginner",
    type: "Hybrid",
    duration: "8 weeks",
    priceINR: 15999,
    price: 200,
    currency: "INR",
    schedule: "Tue, Thu 6:00 PM - 8:00 PM",
    maxStudents: 20,
    enrolledStudents: 15,
    location: "Studio A & Online",
    tags: ["Design", "UI", "UX", "Beginner"],
    modules: [],
    completionRate: 92,
    schedulePeriod: { startDate: "2024-02-01", endDate: "2024-03-31", totalWeeks: "8" },
    sessionDetails: { sessionDuration: "2", maxClasses: "2" },
    frequencyDetails: { selectedDays: ["Tuesday", "Thursday"], dayTimes: {} },
    frequencies: [{ days: ["Tuesday", "Thursday"], start: "18:00", end: "20:00", sessions: "1" }],
    chapters: [
      { name: "Design Principles", description: "Learn fundamental design principles." },
      { name: "User Research", description: "Understanding user needs and behaviors." },
    ],
    referralCode: "DESIGN2024",
    commissionRate: "8",
    referralStart: "2024-02-01",
    referralEnd: "2024-03-31",
    referralStatus: "Active",
    affiliateTracking: {
      enabled: true,
      referralCode: "DESIGN2024",
      commissionRate: 8,
      totalReferrals: 3,
      totalCommission: 200,
    },
    emiPlans: [],
    scholarships: [],
    taxInfo: {
      gstEnabled: true,
      gstRate: 18,
      educationTaxRate: 0,
      pan: "ABCDE5678G",
      autoGeneration: true,
      invoicePrefix: "INV2026",
      lastInvoiceNumber: 1002,
      taxDocuments: [],
    },
    faqs: [],
    reminderSettings: {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      customSchedule: [],
      frequency: "weekly",
      customDays: "",
      customInterval: "",
    },
    freeGifts: ["Design Templates", "Resource Pack"],
    status: "Active",
    courseCategory: "Regular",
    rating: 4.6,
    cohortAnalysis: [],
    learningBehavior: {
      bestLearningTimes: [],
      engagementWindows: [],
      preferredContentTypes: [],
      averageSessionDuration: 0,
      peakActivityDays: [],
    },
    roiCalculator: {
      courseCost: 0,
      expectedSalaryIncrease: 0,
      timeToROI: 0,
      industryAverageSalary: 0,
      skillDemandScore: 0,
    },
    dropoffPrediction: {
      riskScore: 0,
      riskFactors: [],
      interventionSuggestions: [],
    },
    sharedResources: [],
    versionControl: [],
    materialAnalytics: {
      resourceId: "MAT002",
      views: 0,
      downloads: 0,
      averageRating: 0,
      successRate: 0,
      engagementTime: 0,
    },
    credentialVerification: false,
    marketplaceEnabled: false,
    ltiIntegration: false,
    contentSecurity: {
      watermarkEnabled: false,
      downloadProtection: false,
      screenRecordingProtection: false,
      accessLogging: false,
      licenseTracking: false,
    },
    offlineAccess: {
      enabled: false,
      downloadLimit: 0,
      currentDownloads: 0,
      expiryDays: 0,
      accessLogs: [],
    },
    industryPartners: [],
    events: [],
    alumniNetwork: [],
    promotionTemplates: [],
    seasonalPromos: [],
    growthAnalytics: {
      enrollmentTrend: [],
      revenueTrend: [],
      completionTrend: [],
      satisfactionTrend: [],
    },
  },
]

export default function CourseManagementPage() {
  // State management
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false)
  const [isViewCourseDialogOpen, setIsViewCourseDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedFilters, setSelectedFilters] = useState<{
    level: string[]
    type: string[]
    status: string[]
    priceRange: [number, number]
  }>({
    level: [],
    type: [],
    status: [],
    priceRange: [0, 100000],
  })

  // Load courses on mount
  useEffect(() => {
    setCourses(sampleCourses)
  }, [])

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    return courses
      .filter((course) => {
        const matchesSearch =
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesLevel = selectedFilters.level.length === 0 || selectedFilters.level.includes(course.level)
        const matchesType = selectedFilters.type.length === 0 || selectedFilters.type.includes(course.type)
        const matchesStatus = selectedFilters.status.length === 0 || selectedFilters.status.includes(course.status)

        const matchesPrice =
          course.priceINR >= selectedFilters.priceRange[0] && course.priceINR <= selectedFilters.priceRange[1]

        return matchesSearch && matchesLevel && matchesType && matchesStatus && matchesPrice
      })
      .sort((a, b) => {
        let aValue: any, bValue: any
        switch (sortBy) {
          case "name":
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case "priceINR":
            aValue = a.priceINR
            bValue = b.priceINR
            break
          case "instructor":
            aValue = a.instructor.toLowerCase()
            bValue = b.instructor.toLowerCase()
            break
          default:
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
        }

        if (typeof aValue === "string") {
          return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        } else {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue
        }
      })
  }, [courses, searchTerm, selectedFilters, sortBy, sortOrder])

  // Calculate statistics
  const stats = {
    totalCourses: courses.length,
    activeCourses: courses.filter((c) => c.status === "Active").length,
    totalStudents: courses.reduce((sum, c) => sum + c.enrolledStudents, 0),
    totalRevenue: courses.reduce((sum, c) => sum + c.priceINR * c.enrolledStudents, 0),
    averageRating: courses.length > 0 ? courses.reduce((sum, c) => sum + c.rating, 0) / courses.length : 0,
    completionRate: courses.length > 0 ? courses.reduce((sum, c) => sum + c.completionRate, 0) / courses.length : 0,
  }

  const handleCreateCourse = () => {
    setIsAddCourseDialogOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsAddCourseDialogOpen(true)
  }

  const handleDeleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId))
    toast({
      title: "Course Deleted",
      description: "The course has been successfully deleted.",
    })
  }

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsViewCourseDialogOpen(true)
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-orange-500 text-white rounded-xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="h-8 w-8" />
              <h1 className="text-3xl md:text-4xl font-bold">Course Management</h1>
            </div>
            <p className="text-lg mb-6 opacity-90">
              Create, manage, and track your courses with comprehensive analytics and advanced features.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="secondary"
                className="bg-white text-purple-700 hover:bg-gray-100"
                onClick={handleCreateCourse}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Courses</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalCourses}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Courses</p>
                  <p className="text-2xl font-bold text-green-900">{stats.activeCourses}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Revenue (INR)</p>
                  <p className="text-2xl font-bold text-orange-900">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
                </div>
                <Banknote className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Completion</p>
                  <p className="text-2xl font-bold text-indigo-900">{stats.completionRate.toFixed(0)}%</p>
                </div>
                <Trophy className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses, instructors, descriptions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>All Courses</DropdownMenuItem>
                    <DropdownMenuItem>Active Only</DropdownMenuItem>
                    <DropdownMenuItem>Draft Only</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("name")}>
                      Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("priceINR")}>
                      Price {sortBy === "priceINR" && (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("instructor")}>
                      Instructor {sortBy === "instructor" && (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none border-l"
                  >
                    <div className="flex flex-col gap-0.5 w-4 h-4">
                      <div className="bg-current h-0.5 rounded-sm"></div>
                      <div className="bg-current h-0.5 rounded-sm"></div>
                      <div className="bg-current h-0.5 rounded-sm"></div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCourses.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first course.</p>
                  <Button onClick={handleCreateCourse}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-600 transition-colors">
                          {course.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                      </div>
                      <Badge variant={course.status === "Active" ? "default" : "secondary"}>{course.status}</Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {course.enrolledStudents}/{course.maxStudents} students
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {course.duration}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                        {course.rating.toFixed(1)} rating
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        <Badge variant="outline">{course.type}</Badge>
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                      <div className="text-lg font-bold text-purple-600">₹{course.priceINR.toLocaleString()}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewCourse(course)
                        }}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditCourse(course)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCourse(course.id)
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Price (INR)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No courses found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedCourses.map((course) => (
                      <TableRow key={course.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.level}</Badge>
                        </TableCell>
                        <TableCell>
                          {course.enrolledStudents}/{course.maxStudents}
                        </TableCell>
                        <TableCell>₹{course.priceINR.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={course.status === "Active" ? "default" : "secondary"}>{course.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewCourse(course)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditCourse(course)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCourse(course.id)
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* View Course Dialog */}
        <Dialog open={isViewCourseDialogOpen} onOpenChange={setIsViewCourseDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Course Details
              </DialogTitle>
              <DialogDescription>View comprehensive course information and analytics</DialogDescription>
            </DialogHeader>

            {selectedCourse && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{selectedCourse.name}</h3>
                    <p className="text-muted-foreground mb-4">{selectedCourse.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Instructor: {selectedCourse.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Duration: {selectedCourse.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        <span>Rating: {selectedCourse.rating.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedCourse.enrolledStudents}</div>
                        <div className="text-sm text-blue-600">Enrolled Students</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{selectedCourse.priceINR.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600">Course Price</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{selectedCourse.completionRate}%</div>
                        <div className="text-sm text-purple-600">Completion Rate</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{selectedCourse.maxStudents}</div>
                        <div className="text-sm text-orange-600">Max Capacity</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Course Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Schedule</h4>
                  <p className="text-muted-foreground">{selectedCourse.schedule}</p>
                  <p className="text-sm text-muted-foreground mt-1">Location: {selectedCourse.location}</p>
                </div>

                {selectedCourse.chapters && selectedCourse.chapters.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Course Chapters</h4>
                    <div className="space-y-2">
                      {selectedCourse.chapters.map((chapter, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <h5 className="font-medium">{chapter.name}</h5>
                          <p className="text-sm text-muted-foreground">{chapter.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create/Edit Course Dialog */}
        <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {selectedCourse ? "Edit Course" : "Create New Course"}
              </DialogTitle>
              <DialogDescription>
                {selectedCourse ? "Update course information" : "Create a new course with all the details"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseName">Course Name *</Label>
                  <Input id="courseName" placeholder="Enter course name" defaultValue={selectedCourse?.name || ""} />
                </div>
                <div>
                  <Label htmlFor="instructor">Instructor *</Label>
                  <Input
                    id="instructor"
                    placeholder="Enter instructor name"
                    defaultValue={selectedCourse?.instructor || ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your course..."
                  rows={3}
                  defaultValue={selectedCourse?.description || ""}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="level">Level *</Label>
                  <select
                    id="level"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    defaultValue={selectedCourse?.level || ""}
                  >
                    <option value="">Select level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    defaultValue={selectedCourse?.type || ""}
                  >
                    <option value="">Select type</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Input id="duration" placeholder="e.g., 8 weeks" defaultValue={selectedCourse?.duration || ""} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (INR) *</Label>
                  <Input id="price" type="number" placeholder="25000" defaultValue={selectedCourse?.priceINR || ""} />
                </div>
                <div>
                  <Label htmlFor="maxStudents">Max Students *</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    placeholder="25"
                    defaultValue={selectedCourse?.maxStudents || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule">Schedule *</Label>
                  <Input
                    id="schedule"
                    placeholder="Mon, Wed 7:00 PM - 9:00 PM"
                    defaultValue={selectedCourse?.schedule || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Online / Studio A" defaultValue={selectedCourse?.location || ""} />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => setIsAddCourseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle form submission here
                    setIsAddCourseDialogOpen(false)
                    setSelectedCourse(null)
                    toast({
                      title: selectedCourse ? "Course Updated" : "Course Created",
                      description: selectedCourse
                        ? "Course has been updated successfully."
                        : "New course has been created successfully.",
                    })
                  }}
                >
                  {selectedCourse ? "Update Course" : "Create Course"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
