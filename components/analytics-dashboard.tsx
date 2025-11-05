"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Users, Clock, AlertCircle, Download, Calendar, Target, Award, Activity } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AnalyticsDashboardProps {
  events: any[]
}

export default function AnalyticsDashboard({ events }: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedMetric, setSelectedMetric] = useState("attendance")

  // Generate analytics data
  const generatePeakHoursData = () => {
    const hourCounts: { [key: number]: number } = {}

    events.forEach((event) => {
      const hour = Number.parseInt(event.startTime.split(":")[0])
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      classes: hourCounts[hour] || 0,
      utilization: ((hourCounts[hour] || 0) / Math.max(...Object.values(hourCounts), 1)) * 100,
    }))
  }

  const generateInstructorUtilization = () => {
    const instructorStats: { [key: string]: { classes: number; students: number } } = {}

    events.forEach((event) => {
      if (!instructorStats[event.instructor]) {
        instructorStats[event.instructor] = { classes: 0, students: 0 }
      }
      instructorStats[event.instructor].classes += 1
      instructorStats[event.instructor].students += event.students
    })

    return Object.entries(instructorStats).map(([instructor, stats]) => ({
      instructor: instructor.split(" ")[0], // First name only for display
      classes: stats.classes,
      students: stats.students,
      utilization: (stats.classes / events.length) * 100,
      avgStudentsPerClass: stats.students / stats.classes,
    }))
  }

  const generateClassPopularity = () => {
    const categoryStats: { [key: string]: number } = {}

    events.forEach((event) => {
      categoryStats[event.category] = (categoryStats[event.category] || 0) + event.students
    })

    return Object.entries(categoryStats).map(([category, students]) => ({
      category,
      students,
      percentage: (students / events.reduce((sum, e) => sum + e.students, 0)) * 100,
    }))
  }

  const generateCancellationTrends = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()

    return last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      cancellations: events.filter((e) => e.isCancelled && e.date.toISOString().split("T")[0] === date).length,
      total: events.filter((e) => e.date.toISOString().split("T")[0] === date).length,
    }))
  }

  const generateWaitlistData = () => {
    return events
      .filter((e) => e.waitlist && e.waitlist.length > 0)
      .map((event) => ({
        className: event.title,
        waitlistSize: event.waitlist?.length || 0,
        capacity: event.maxCapacity || event.students,
        conversionRate: Math.random() * 80 + 20, // Mock conversion rate
      }))
  }

  const generateEngagementScores = () => {
    return events.map((event) => ({
      className: event.title,
      attendance: (event.students / (event.maxCapacity || event.students)) * 100,
      satisfaction: Math.random() * 30 + 70, // Mock satisfaction score
      engagement: Math.random() * 40 + 60, // Mock engagement score
    }))
  }

  const peakHoursData = generatePeakHoursData()
  const instructorData = generateInstructorUtilization()
  const popularityData = generateClassPopularity()
  const cancellationData = generateCancellationTrends()
  const waitlistData = generateWaitlistData()
  const engagementData = generateEngagementScores()

  const handleExportReport = (format: "pdf" | "csv") => {
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} report...`,
    })

    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Analytics report has been downloaded as ${format.toUpperCase()}.`,
      })
    }, 2000)
  }

  const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-700">Analytics Dashboard</h2>
          <p className="text-gray-500">Comprehensive insights into your schedule performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExportReport("pdf")}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">+12% from last {selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(events.reduce((sum, e) => sum + e.students, 0) / events.length)}
            </div>
            <p className="text-xs text-muted-foreground">+5% from last {selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((events.filter((e) => e.isCancelled).length / events.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">-2% from last {selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">+8% from last {selectedPeriod}</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Peak Hours Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="classes" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Class Popularity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Class Popularity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={popularityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // Type of label render props from recharts is broad; cast to access our data fields safely
                      label={(entry: any) => `${(entry.category ?? entry.name) as string} ${Number.parseFloat(((entry.percentage ?? (entry.percent ?? 0) * 100) as number).toString()).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="students"
                    >
                      {popularityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Instructor Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instructorData.map((instructor, index) => (
                  <div key={instructor.instructor} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-purple-700">{instructor.instructor.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{instructor.instructor}</h4>
                        <p className="text-sm text-gray-600">
                          {instructor.classes} classes • {instructor.students} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{instructor.utilization.toFixed(1)}% utilization</Badge>
                        <Badge variant="outline">{instructor.avgStudentsPerClass.toFixed(1)} avg/class</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waitlist Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Waitlist Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {waitlistData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.className}</p>
                        <p className="text-sm text-gray-600">{item.waitlistSize} on waitlist</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.conversionRate.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">conversion rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={cancellationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={cancellationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Total Classes" />
                  <Line type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={2} name="Cancellations" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Class Engagement Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagementData.slice(0, 5).map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.className}</span>
                      <span className="text-sm text-gray-600">{item.engagement.toFixed(1)}% engagement</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full"
                        style={{ width: `${item.engagement}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Attendance: {item.attendance.toFixed(1)}%</span>
                      <span>Satisfaction: {item.satisfaction.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
