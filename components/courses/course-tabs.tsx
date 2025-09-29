"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseGrid } from "./course-grid"
import { MarketingToolsTab } from "./marketing-tools-tab"
import { CourseSettingsTab } from "./course-settings-tab"
import { CourseChaptersTab } from "./course-chapters-tab"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, TrendingUp, DollarSign } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  category: string
  status: "Draft" | "Published" | "Archived" | "Under Review"
  price: number
  currency: string
  enrolledStudents: number
  duration: string
  rating: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  createdAt: string
  updatedAt: string
}

interface CourseTabsProps {
  courses: Course[]
  onEditCourse: (course: Course) => void
  onDeleteCourse: (courseId: string) => void
  onViewCourse: (course: Course) => void
  isLoading?: boolean
}

export function CourseTabs({ courses, onEditCourse, onDeleteCourse, onViewCourse, isLoading }: CourseTabsProps) {
  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === "Published").length,
    totalStudents: courses.reduce((sum, course) => sum + course.enrolledStudents, 0),
    totalRevenue: courses.reduce((sum, course) => sum + course.price * course.enrolledStudents, 0),
  }

  return (
    <Tabs defaultValue="courses" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="courses">All Courses</TabsTrigger>
        <TabsTrigger value="chapters">Chapters</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="marketing">Marketing Tools</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="courses" className="space-y-6">
        <CourseGrid
          courses={courses}
          onEditCourse={onEditCourse}
          onDeleteCourse={onDeleteCourse}
          onViewCourse={onViewCourse}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="chapters" className="space-y-6">
        <CourseChaptersTab />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">{stats.publishedCourses} published</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.length > 0
                  ? (courses.reduce((sum, course) => sum + course.rating, 0) / courses.length).toFixed(1)
                  : "0.0"}
              </div>
              <p className="text-xs text-muted-foreground">Average course rating</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="mx-auto h-12 w-12 mb-4" />
              <p>Detailed analytics coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="marketing">
        <MarketingToolsTab />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <CourseSettingsTab />
      </TabsContent>
    </Tabs>
  )
}
