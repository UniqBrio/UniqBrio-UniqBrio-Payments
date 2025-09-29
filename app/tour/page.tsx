"use client"

import type React from "react"

import { useState, useEffect } from "react"
import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Home,
  Users,
  Calendar,
  BarChart3,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  TrendingUp,
  DollarSign,
  Award,
  Target,
  Smartphone,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  MessageSquare,
  CreditCard,
  PieChart,
  BarChart,
  CalendarIcon,
  UserCog,
  Trophy,
  Music,
  Dumbbell,
  Paintbrush,
  Camera,
  Mic,
  Medal,
  Star,
  Activity,
  Crown,
  Sparkles,
  BookOpen,
  GraduationCap,
  UserCheck,
  CheckCircle,
  Clock,
  MapPin,
  Wifi,
  LineChart,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
  features: string[]
  category: "overview" | "dashboard" | "programs" | "students" | "staff" | "payments" | "attendance"
}

const AnimatedCard = ({
  children,
  delay = 0,
  className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        "transform transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95",
        className,
      )}
    >
      {children}
    </div>
  )
}

const PulseIcon = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("animate-pulse", className)}>{children}</div>
)

const FloatingIcon = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("animate-bounce", className)}>{children}</div>
)

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to UniqBrio Sports & Arts Academy",
    description: "Your comprehensive platform for athletic and artistic excellence",
    icon: <Home className="h-6 w-6" />,
    category: "overview",
    features: [
      "Complete sports and arts academy management",
      "Performance tracking for athletes and artists",
      "Multi-discipline program management",
      "Parent and coach communication portal",
      "Competition and event scheduling",
    ],
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <AnimatedCard delay={0}>
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-600 via-purple-500 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-spin-slow shadow-2xl">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent mb-2">
              Elite Sports & Arts Academy
            </h2>
            <p className="text-gray-600 text-lg">Powered by UniqBrio</p>
          </AnimatedCard>
        </div>
        <AnimatedCard delay={300}>
          <div className="grid grid-cols-2 gap-6">
            <Card className="hover:shadow-2xl transition-all duration-500 hover:scale-105 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <FloatingIcon>
                    <Dumbbell className="h-8 w-8 text-purple-600 mr-2" />
                  </FloatingIcon>
                  <PulseIcon>
                    <Music className="h-8 w-8 text-orange-600" />
                  </PulseIcon>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
                  320+
                </div>
                <div className="text-sm text-gray-600 font-medium">Athletes & Artists</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl transition-all duration-500 hover:scale-105 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <FloatingIcon>
                    <Trophy className="h-8 w-8 text-orange-600 mr-2" />
                  </FloatingIcon>
                  <PulseIcon>
                    <Paintbrush className="h-8 w-8 text-purple-600" />
                  </PulseIcon>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                  18
                </div>
                <div className="text-sm text-gray-600 font-medium">Active Programs</div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={600}>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl hover:from-purple-200 hover:to-purple-100 transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg">
              <FloatingIcon>
                <Dumbbell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              </FloatingIcon>
              <div className="text-sm font-semibold text-purple-700">Sports</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl hover:from-orange-200 hover:to-orange-100 transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg">
              <FloatingIcon>
                <Music className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              </FloatingIcon>
              <div className="text-sm font-semibold text-orange-700">Music</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-orange-100 rounded-xl hover:from-purple-200 hover:to-orange-200 transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg">
              <FloatingIcon>
                <Paintbrush className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              </FloatingIcon>
              <div className="text-sm font-semibold text-purple-700">Visual Arts</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-purple-100 rounded-xl hover:from-orange-200 hover:to-purple-200 transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg">
              <FloatingIcon>
                <Camera className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              </FloatingIcon>
              <div className="text-sm font-semibold text-orange-700">Media Arts</div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Performance Dashboard",
    description: "Real-time insights into athletic and artistic performance with comprehensive analytics",
    icon: <BarChart3 className="h-6 w-6" />,
    category: "dashboard",
    features: [
      "Live performance tracking with interactive charts",
      "Competition results analysis and forecasting",
      "Training attendance monitoring with trends",
      "Skill progression analytics across programs",
      "Revenue and enrollment metrics with ROI tracking",
    ],
    content: (
      <div className="space-y-6">
        <AnimatedCard delay={0}>
          <div className="grid grid-cols-4 gap-4">
            <Card className="hover:scale-105 transition-all duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-purple-600 animate-pulse">450</p>
                  </div>
                  <FloatingIcon>
                    <Users className="h-10 w-10 text-purple-600" />
                  </FloatingIcon>
                </div>
                <p className="text-xs text-purple-600 mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% from last month
                </p>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Active Courses</p>
                    <p className="text-2xl font-bold text-orange-600 animate-pulse">24</p>
                  </div>
                  <FloatingIcon>
                    <BookOpen className="h-10 w-10 text-orange-600" />
                  </FloatingIcon>
                </div>
                <p className="text-xs text-orange-600 mt-2">Same as last month</p>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-green-600 animate-pulse">$45,670</p>
                  </div>
                  <FloatingIcon>
                    <DollarSign className="h-10 w-10 text-green-600" />
                  </FloatingIcon>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Staff Count</p>
                    <p className="text-2xl font-bold text-blue-600 animate-pulse">32</p>
                  </div>
                  <FloatingIcon>
                    <UserCog className="h-10 w-10 text-blue-600" />
                  </FloatingIcon>
                </div>
                <p className="text-xs text-blue-600 mt-2 flex items-center">
                  <Plus className="h-3 w-3 mr-1" />
                  +2 from last month
                </p>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={300}>
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-purple-100 to-orange-100">
              <TabsTrigger
                value="attendance"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="enrollment"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Enrollment
              </TabsTrigger>
              <TabsTrigger
                value="courseDistribution"
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
              >
                Distribution
              </TabsTrigger>
              <TabsTrigger
                value="monthlyRoi"
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
              >
                ROI
              </TabsTrigger>
              <TabsTrigger
                value="forecast"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Forecast
              </TabsTrigger>
            </TabsList>
            <TabsContent value="attendance" className="mt-6">
              <Card className="hover:shadow-xl transition-shadow duration-300 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-purple-700">
                    <PulseIcon>
                      <BarChart className="h-5 w-5 mr-2" />
                    </PulseIcon>
                    Weekly Attendance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { day: "Monday", present: 85, absent: 15, color: "purple" },
                      { day: "Tuesday", present: 88, absent: 12, color: "orange" },
                      { day: "Wednesday", present: 90, absent: 10, color: "purple" },
                      { day: "Thursday", present: 92, absent: 8, color: "orange" },
                      { day: "Friday", present: 85, absent: 15, color: "purple" },
                      { day: "Saturday", present: 78, absent: 22, color: "orange" },
                    ].map((item, index) => (
                      <AnimatedCard key={index} delay={index * 100}>
                        <div className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200">
                          <span className="text-sm font-medium w-20">{item.day}</span>
                          <div className="flex-1 mx-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all duration-1000 ease-out",
                                    item.color === "purple"
                                      ? "bg-gradient-to-r from-purple-500 to-purple-600"
                                      : "bg-gradient-to-r from-orange-500 to-orange-600",
                                  )}
                                  style={{ width: `${item.present}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12">{item.present}%</span>
                            </div>
                          </div>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="enrollment" className="mt-6">
              <Card className="hover:shadow-xl transition-shadow duration-300 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-orange-700">
                    <PulseIcon>
                      <LineChart className="h-5 w-5 mr-2" />
                    </PulseIcon>
                    Student Enrollment Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4 animate-pulse">
                      ↗ 95
                    </div>
                    <p className="text-lg text-gray-600 mb-2">New Students This Month</p>
                    <p className="text-sm text-orange-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 mr-1 animate-bounce" />
                      +18% growth rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="courseDistribution" className="mt-6">
              <Card className="hover:shadow-xl transition-shadow duration-300 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-purple-700">
                    <FloatingIcon>
                      <PieChart className="h-5 w-5 mr-2" />
                    </FloatingIcon>
                    Program Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "Sports Programs", value: 35, icon: <Dumbbell className="h-5 w-5" />, color: "purple" },
                      { name: "Music Programs", value: 25, icon: <Music className="h-5 w-5" />, color: "orange" },
                      { name: "Visual Arts", value: 20, icon: <Paintbrush className="h-5 w-5" />, color: "purple" },
                      { name: "Media Arts", value: 15, icon: <Camera className="h-5 w-5" />, color: "orange" },
                    ].map((item, index) => (
                      <AnimatedCard key={index} delay={index * 150}>
                        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                              item.color === "purple"
                                ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                                : "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
                            )}
                          >
                            {item.icon}
                          </div>
                          <div className="text-2xl font-bold text-gray-800 animate-pulse">{item.value}%</div>
                          <div className="text-sm text-gray-600 font-medium">{item.name}</div>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="monthlyRoi" className="mt-6">
              <Card className="hover:shadow-xl transition-shadow duration-300 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-orange-700">
                    <PulseIcon>
                      <TrendingUp className="h-5 w-5 mr-2" />
                    </PulseIcon>
                    Return on Investment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4 animate-pulse">
                      25%
                    </div>
                    <p className="text-lg text-gray-600 mb-2">Monthly ROI</p>
                    <p className="text-sm text-orange-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 mr-1 animate-bounce" />
                      Best performance this year
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="forecast" className="mt-6">
              <Card className="hover:shadow-xl transition-shadow duration-300 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-purple-700">
                    <PulseIcon>
                      <Target className="h-5 w-5 mr-2" />
                    </PulseIcon>
                    Performance Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 animate-pulse">+28%</div>
                      <div className="text-sm text-gray-600">Revenue Growth</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 animate-pulse">+15%</div>
                      <div className="text-sm text-gray-600">New Enrollments</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg">
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
                        +22%
                      </div>
                      <div className="text-sm text-gray-600">Performance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </AnimatedCard>
      </div>
    ),
  },
  {
    id: "programs",
    title: "Program Management",
    description: "Comprehensive sports and arts program administration with advanced analytics",
    icon: <BookOpen className="h-6 w-6" />,
    category: "programs",
    features: [
      "Multi-discipline program creation and management",
      "Training schedule optimization and management",
      "Skill level progression tracking with analytics",
      "Equipment and facility booking system",
      "Performance assessment tools and reporting",
    ],
    content: (
      <div className="space-y-6">
        <AnimatedCard delay={0}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <div className="w-80 h-10 bg-white rounded-lg border-2 border-purple-200 pl-10 shadow-lg animate-pulse"></div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="hover:scale-105 transition-transform duration-200 border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter Programs
              </Button>
              <Button
                size="sm"
                className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Program
              </Button>
            </div>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={200}>
          <div className="grid grid-cols-2 gap-6">
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-500 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse shadow-lg">
                    <Dumbbell className="h-8 w-8 text-white" />
                  </div>
                  <Badge className="bg-green-500 text-white animate-bounce shadow-md">Active</Badge>
                </div>
                <h3 className="text-xl font-bold text-purple-700 mb-2">Elite Basketball Training</h3>
                <p className="text-sm text-gray-600 mb-4">Advanced basketball skills and team strategy development</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-1 text-purple-600" />
                    32 athletes
                  </span>
                  <span className="font-bold text-green-600 text-lg animate-pulse">$450/month</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span className="font-medium">Coach: Mike Johnson</span>
                  <Badge variant="outline" className="border-purple-300 text-purple-600">
                    Advanced
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:scale-110 transition-transform duration-200 text-purple-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:scale-110 transition-transform duration-200 text-purple-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:scale-110 transition-transform duration-200 text-purple-600"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-500 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center animate-pulse shadow-lg">
                    <Music className="h-8 w-8 text-white" />
                  </div>
                  <Badge variant="outline" className="border-orange-300 text-orange-600 animate-bounce">
                    Enrollment Open
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-orange-700 mb-2">Classical Piano Mastery</h3>
                <p className="text-sm text-gray-600 mb-4">Individual and group piano lessons for all skill levels</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-1 text-orange-600" />
                    18 students
                  </span>
                  <span className="font-bold text-green-600 text-lg animate-pulse">$380/month</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span className="font-medium">Instructor: Sarah Chen</span>
                  <Badge variant="outline" className="border-orange-300 text-orange-600">
                    Intermediate
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:scale-110 transition-transform duration-200 text-orange-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:scale-110 transition-transform duration-200 text-orange-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:scale-110 transition-transform duration-200 text-orange-600"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={400}>
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                <PulseIcon>
                  <BarChart3 className="h-6 w-6 mr-3 text-purple-600" />
                </PulseIcon>
                Program Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 animate-pulse">95%</div>
                  <div className="text-sm text-gray-600 font-medium">Retention Rate</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-orange-600 animate-pulse">4.9</div>
                  <div className="text-sm text-gray-600 font-medium">Avg Rating</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
                    87%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Skill Improvement</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 animate-pulse">$28,750</div>
                  <div className="text-sm text-gray-600 font-medium">Monthly Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    ),
  },
  {
    id: "students",
    title: "Student Management",
    description: "Comprehensive student enrollment, progress tracking, and parent communication",
    icon: <Users className="h-6 w-6" />,
    category: "students",
    features: [
      "Student enrollment and onboarding system",
      "Individual performance tracking and analytics",
      "Parent communication portal with real-time updates",
      "Skill progression monitoring across programs",
      "Attendance and behavior tracking with insights",
    ],
    content: (
      <div className="space-y-6">
        <AnimatedCard delay={0}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <div className="w-80 h-10 bg-white rounded-lg border-2 border-purple-200 pl-10 shadow-lg animate-pulse"></div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="hover:scale-105 transition-transform duration-200 border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter Students
              </Button>
              <Button
                size="sm"
                className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-orange-600 to-purple-500 hover:from-orange-700 hover:to-purple-600 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={200}>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <Card className="hover:scale-105 transition-all duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-purple-600 animate-pulse mb-2">320</div>
                <div className="text-sm text-gray-600 font-medium">Total Students</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-green-600 animate-pulse mb-2">298</div>
                <div className="text-sm text-gray-600 font-medium">Active Students</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-orange-600 animate-pulse mb-2">22</div>
                <div className="text-sm text-gray-600 font-medium">New This Month</div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={400}>
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-white to-purple-50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                <PulseIcon>
                  <GraduationCap className="h-6 w-6 mr-3 text-purple-600" />
                </PulseIcon>
                Student Profiles & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Alex Rodriguez",
                    program: "Basketball Elite",
                    level: "Advanced",
                    performance: 92,
                    icon: <Dumbbell className="h-6 w-6 text-purple-600" />,
                    status: "Active",
                    attendance: 96,
                    color: "purple",
                  },
                  {
                    name: "Emma Thompson",
                    program: "Classical Piano",
                    level: "Intermediate",
                    performance: 88,
                    icon: <Music className="h-6 w-6 text-orange-600" />,
                    status: "Active",
                    attendance: 94,
                    color: "orange",
                  },
                  {
                    name: "Marcus Johnson",
                    program: "Digital Art",
                    level: "Beginner",
                    performance: 75,
                    icon: <Paintbrush className="h-6 w-6 text-purple-600" />,
                    status: "Active",
                    attendance: 89,
                    color: "purple",
                  },
                ].map((student, index) => (
                  <AnimatedCard key={index} delay={index * 150}>
                    <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 hover:scale-102 transition-all duration-300 shadow-sm hover:shadow-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                            student.color === "purple"
                              ? "bg-gradient-to-br from-purple-500 to-purple-600"
                              : "bg-gradient-to-br from-orange-500 to-orange600",
                          )}
                        >
                          {student.icon}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-800">{student.name}</p>
                          <p className="text-sm text-gray-600 font-medium">{student.program}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Activity className="h-3 w-3 mr-1 text-green-500" />
                              Attendance: {student.attendance}%
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              {student.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge
                            variant={
                              student.level === "Advanced"
                                ? "default"
                                : student.level === "Intermediate"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={cn(
                              "animate-pulse mb-2",
                              student.level === "Advanced" && "bg-purple-600",
                              student.level === "Intermediate" && "bg-orange-500",
                            )}
                          >
                            {student.level}
                          </Badge>
                          <div className="text-sm text-gray-600 font-medium">{student.performance}% performance</div>
                        </div>
                        <div className="w-24">
                          <Progress
                            value={student.performance}
                            className={cn("h-3", student.color === "purple" ? "text-purple-600" : "text-orange-600")}
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:scale-110 transition-transform duration-200 text-purple-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:scale-110 transition-transform duration-200 text-orange-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    ),
  },
  {
    id: "staff",
    title: "Staff Management",
    description: "Comprehensive coaching and administrative staff management with performance tracking",
    icon: <UserCog className="h-6 w-6" />,
    category: "staff",
    features: [
      "Coach and instructor profile management",
      "Schedule and availability optimization",
      "Performance and rating tracking system",
      "Payroll and compensation management",
      "Professional development tracking and certification",
    ],
    content: (
      <div className="space-y-6">
        <AnimatedCard delay={0}>
          <div className="grid grid-cols-4 gap-6 mb-6">
            <Card className="hover:scale-105 transition-all duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Dumbbell className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-purple-600 animate-pulse mb-2">12</div>
                <div className="text-sm text-gray-600 font-medium">Sports Coaches</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Music className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-orange-600 animate-pulse mb-2">8</div>
                <div className="text-sm text-gray-600 font-medium">Music Instructors</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-orange-50 shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Paintbrush className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent animate-pulse mb-2">
                  4
                </div>
                <div className="text-sm text-gray-600 font-medium">Art Teachers</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-purple-50 shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <UserCheck className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-orange-600 animate-pulse mb-2">6</div>
                <div className="text-sm text-gray-600 font-medium">Support Staff</div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={200}>
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-white to-purple-50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                <PulseIcon>
                  <Crown className="h-6 w-6 mr-3 text-purple-600" />
                </PulseIcon>
                Top Performing Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Mike Johnson",
                    role: "Basketball Coach",
                    specialty: "Elite Training & Strategy",
                    rating: 4.9,
                    students: 32,
                    experience: "8 years",
                    icon: <Dumbbell className="h-6 w-6 text-purple-600" />,
                    status: "Available",
                    color: "purple",
                  },
                  {
                    name: "Sarah Chen",
                    role: "Piano Instructor",
                    specialty: "Classical & Jazz Performance",
                    rating: 4.8,
                    students: 18,
                    experience: "12 years",
                    icon: <Music className="h-6 w-6 text-orange-600" />,
                    status: "In Session",
                    color: "orange",
                  },
                  {
                    name: "David Martinez",
                    role: "Art Teacher",
                    specialty: "Digital & Traditional Arts",
                    rating: 4.7,
                    students: 24,
                    experience: "6 years",
                    icon: <Paintbrush className="h-6 w-6 text-purple-600" />,
                    status: "Available",
                    color: "purple",
                  },
                ].map((staff, index) => (
                  <AnimatedCard key={index} delay={index * 150}>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-purple-50 hover:to-orange-50 hover:scale-102 transition-all duration-300 shadow-sm hover:shadow-lg border-2 border-gray-100 hover:border-purple-200">
                      <div className="flex items-center space-x-4">
                        <div
                          className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
                            staff.color === "purple"
                              ? "bg-gradient-to-br from-purple-500 to-purple-600"
                              : "bg-gradient-to-br from-orange-500 to-orange-600",
                          )}
                        >
                          {staff.icon}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-800">{staff.name}</p>
                          <p className="text-sm text-gray-600 font-medium">{staff.role}</p>
                          <p className="text-xs text-gray-500">{staff.specialty}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {staff.experience}
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {staff.students} students
                            </span>
                            <span>•</span>
                            <Badge
                              variant={staff.status === "Available" ? "secondary" : "outline"}
                              className={cn(
                                "text-xs animate-pulse",
                                staff.status === "Available" && "bg-green-100 text-green-700",
                                staff.status === "In Session" && "bg-orange-100 text-orange-700",
                              )}
                            >
                              {staff.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-2">
                          <Star className="h-5 w-5 text-yellow-500 mr-1 animate-pulse" />
                          <span className="text-lg font-bold text-gray-800">{staff.rating}</span>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:scale-110 transition-transform duration-200 text-purple-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:scale-110 transition-transform duration-200 text-orange-600"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:scale-110 transition-transform duration-200 text-purple-600"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={400}>
          <div className="grid grid-cols-2 gap-6">
            <Card className="hover:shadow-xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-purple-700">
                  <FloatingIcon>
                    <Clock className="h-5 w-5 mr-2" />
                  </FloatingIcon>
                  Schedule Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Morning Sessions</span>
                    <Badge className="bg-purple-600 text-white animate-pulse">8 Active</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg">
                    <span className="text-sm font-medium">Afternoon Sessions</span>
                    <Badge className="bg-orange-600 text-white animate-pulse">12 Active</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-100 to-orange-100 rounded-lg">
                    <span className="text-sm font-medium">Evening Sessions</span>
                    <Badge className="bg-gradient-to-r from-purple-600 to-orange-600 text-white animate-pulse">
                      6 Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                    <span className="text-sm font-medium">Available Staff</span>
                    <Badge className="bg-green-600 text-white animate-pulse">18 Ready</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-xl transition-shadow duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-orange-700">
                  <FloatingIcon>
                    <Award className="h-5 w-5 mr-2" />
                  </FloatingIcon>
                  Staff Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600 animate-bounce" />
                    <div>
                      <span className="text-sm font-medium">Coach of the Month</span>
                      <p className="text-xs text-gray-600">Mike Johnson - Basketball</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                    <Medal className="h-6 w-6 text-purple-600 animate-bounce" />
                    <div>
                      <span className="text-sm font-medium">Best Student Progress</span>
                      <p className="text-xs text-gray-600">Sarah Chen - Piano</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg">
                    <Star className="h-6 w-6 text-orange-600 animate-bounce" />
                    <div>
                      <span className="text-sm font-medium">Innovation Award</span>
                      <p className="text-xs text-gray-600">David Martinez - Digital Arts</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
      </div>
    ),
  },
  {
    id: "payments",
    title: "Payment Management",
    description: "Comprehensive billing and payment processing with advanced financial analytics",
    icon: <CreditCard className="h-6 w-6" />,
    category: "payments",
    features: [
      "Automated billing and invoicing system",
      "Multiple payment method support and processing",
      "Payment plan and installment options",
      "Financial reporting and analytics dashboard",
      "Late payment tracking and automated reminders",
    ],
    content: (
      <div className="space-y-6">
        <AnimatedCard delay={0}>
          <div className="grid grid-cols-4 gap-6 mb-6">
            <Card className="hover:scale-105 transition-all duration-300 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-3xl font-bold text-green-600 animate-pulse mb-2">$78,450</div>
                <div className="text-sm text-gray-600 font-medium">Monthly Revenue</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-3xl font-bold text-blue-600 animate-pulse mb-2">298</div>
                <div className="text-sm text-gray-600 font-medium">Paid Accounts</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Clock className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-3xl font-bold text-orange-600 animate-pulse mb-2">12</div>
                <div className="text-sm text-gray-600 font-medium">Pending Payments</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-3xl font-bold text-purple-600 animate-pulse mb-2">18%</div>
                <div className="text-sm text-gray-600 font-medium">Growth Rate</div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={200}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-purple-100 to-orange-100">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Payment Overview
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
              >
                Recent Transactions
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Financial Analytics
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card className="hover:shadow-xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-purple-700">
                      <PulseIcon>
                        <CreditCard className="h-5 w-5 mr-2" />
                      </PulseIcon>
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Credit Cards</span>
                        </div>
                        <Badge className="bg-blue-600 text-white animate-pulse">245 users</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Mobile Payments</span>
                        </div>
                        <Badge className="bg-green-600 text-white animate-pulse">89 users</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium">Bank Transfer</span>
                        </div>
                        <Badge className="bg-purple-600 text-white animate-pulse">67 users</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-xl transition-shadow duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-orange-700">
                      <PulseIcon>
                        <Calendar className="h-5 w-5 mr-2" />
                      </PulseIcon>
                      Payment Plans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                        <span className="text-sm font-medium">Monthly Plans</span>
                        <Badge className="bg-purple-600 text-white animate-pulse">180 active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg">
                        <span className="text-sm font-medium">Quarterly Plans</span>
                        <Badge className="bg-orange-600 text-white animate-pulse">95 active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-orange-100 rounded-lg">
                        <span className="text-sm font-medium">Annual Plans</span>
                        <Badge className="bg-gradient-to-r from-purple-600 to-orange-600 text-white animate-pulse">
                          45 active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <Card className="hover:shadow-xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                    <PulseIcon>
                      <Activity className="h-5 w-5 mr-2 text-purple-600" />
                    </PulseIcon>
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        student: "Alex Rodriguez",
                        amount: "$450",
                        program: "Basketball Elite",
                        status: "Completed",
                        time: "2 hours ago",
                        color: "purple",
                      },
                      {
                        student: "Emma Thompson",
                        amount: "$380",
                        program: "Piano Lessons",
                        status: "Completed",
                        time: "4 hours ago",
                        color: "orange",
                      },
                      {
                        student: "Marcus Johnson",
                        amount: "$320",
                        program: "Digital Art",
                        status: "Pending",
                        time: "6 hours ago",
                        color: "purple",
                      },
                      {
                        student: "Sofia Williams",
                        amount: "$290",
                        program: "Guitar Classes",
                        status: "Completed",
                        time: "1 day ago",
                        color: "orange",
                      },
                    ].map((transaction, index) => (
                      <AnimatedCard key={index} delay={index * 100}>
                        <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 transition-all duration-300 shadow-sm hover:shadow-lg">
                          <div>
                            <p className="font-bold text-lg text-gray-800">{transaction.student}</p>
                            <p className="text-sm text-gray-600 font-medium">{transaction.program}</p>
                            <p className="text-xs text-gray-500">{transaction.time}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl text-green-600 animate-pulse mb-2">{transaction.amount}</p>
                            <Badge
                              variant={transaction.status === "Completed" ? "secondary" : "outline"}
                              className={cn(
                                "animate-pulse",
                                transaction.status === "Completed" && "bg-green-100 text-green-700",
                                transaction.status === "Pending" && "bg-orange-100 text-orange-700",
                              )}
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card className="hover:shadow-xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-purple-700">
                      <PulseIcon>
                        <PieChart className="h-5 w-5 mr-2" />
                      </PulseIcon>
                      Revenue by Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                        <span className="text-sm flex items-center font-medium">
                          <Dumbbell className="h-4 w-4 text-purple-600 mr-2" />
                          Sports Programs
                        </span>
                        <span className="font-bold text-purple-600 animate-pulse">$42,300</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg">
                        <span className="text-sm flex items-center font-medium">
                          <Music className="h-4 w-4 text-orange-600 mr-2" />
                          Music Programs
                        </span>
                        <span className="font-bold text-orange-600 animate-pulse">$26,150</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-orange-100 rounded-lg">
                        <span className="text-sm flex items-center font-medium">
                          <Paintbrush className="h-4 w-4 text-purple-600 mr-2" />
                          Art Programs
                        </span>
                        <span className="font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
                          $10,000
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-xl transition-shadow duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-orange-700">
                      <PulseIcon>
                        <TrendingUp className="h-5 w-5 mr-2" />
                      </PulseIcon>
                      Payment Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4 animate-pulse">
                        ↗ 18%
                      </div>
                      <p className="text-lg text-gray-600 mb-2">Revenue Growth</p>
                      <p className="text-sm text-orange-600 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 mr-1 animate-bounce" />
                        Compared to last month
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </AnimatedCard>
      </div>
    ),
  },
  {
    id: "attendance",
    title: "Selfie Attendance System",
    description: "Modern facial recognition attendance tracking with real-time analytics",
    icon: <Camera className="h-6 w-6" />,
    category: "attendance",
    features: [
      "Facial recognition check-in/out system",
      "Real-time attendance tracking and monitoring",
      "Location-based verification and geofencing",
      "Automated attendance reports and analytics",
      "Parent notification system with instant updates",
    ],
    content: (
      <div className="space-y-6">
        <AnimatedCard delay={0}>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <Card className="hover:scale-105 transition-all duration-300 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Camera className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-blue-600 animate-pulse mb-2">298</div>
                <div className="text-sm text-gray-600 font-medium">Today's Check-ins</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-green-600 animate-pulse mb-2">94%</div>
                <div className="text-sm text-gray-600 font-medium">Attendance Rate</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 transition-all duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-lg">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Clock className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-4xl font-bold text-orange-600 animate-pulse mb-2">18</div>
                <div className="text-sm text-gray-600 font-medium">Late Arrivals</div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={200}>
          <div className="grid grid-cols-2 gap-6">
            <Card className="hover:shadow-2xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-purple-700">
                  <PulseIcon>
                    <Smartphone className="h-6 w-6 mr-3" />
                  </PulseIcon>
                  Selfie Check-in Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="w-40 h-40 bg-gradient-to-br from-purple-100 via-purple-200 to-orange-100 rounded-full mx-auto flex items-center justify-center animate-pulse shadow-2xl">
                    <Camera className="h-20 w-20 text-purple-600" />
                  </div>
                  <div className="space-y-4">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 hover:scale-105 transition-all duration-300 shadow-lg text-lg py-3">
                      <Camera className="h-5 w-5 mr-2" />
                      Take Selfie Check-in
                    </Button>
                    <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-green-600 animate-pulse" />
                        <span className="font-medium">Location Verified</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Wifi className="h-4 w-4 text-blue-600 animate-pulse" />
                        <span className="font-medium">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl transition-shadow duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-orange-700">
                  <PulseIcon>
                    <Activity className="h-6 w-6 mr-3" />
                  </PulseIcon>
                  Live Attendance Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      name: "Alex Rodriguez",
                      time: "8:45 AM",
                      status: "Checked In",
                      program: "Basketball",
                      color: "purple",
                    },
                    { name: "Emma Thompson", time: "9:12 AM", status: "Checked In", program: "Piano", color: "orange" },
                    { name: "Marcus Johnson", time: "9:30 AM", status: "Checked In", program: "Art", color: "purple" },
                    { name: "Sofia Williams", time: "10:05 AM", status: "Late", program: "Guitar", color: "orange" },
                  ].map((entry, index) => (
                    <AnimatedCard key={index} delay={index * 100}>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-purple-50 hover:to-orange-50 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shadow-md",
                              entry.color === "purple"
                                ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                : "bg-gradient-to-br from-orange-500 to-orange-600",
                            )}
                          >
                            <Camera className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{entry.name}</p>
                            <p className="text-xs text-gray-600">{entry.program}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 font-medium">{entry.time}</p>
                          <Badge
                            variant={entry.status === "Checked In" ? "secondary" : "outline"}
                            className={cn(
                              "text-xs animate-pulse mt-1",
                              entry.status === "Checked In" && "bg-green-100 text-green-700",
                              entry.status === "Late" && "bg-orange-100 text-orange-700",
                            )}
                          >
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={400}>
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                <PulseIcon>
                  <BarChart3 className="h-6 w-6 mr-3 text-purple-600" />
                </PulseIcon>
                Attendance Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 animate-pulse">94%</div>
                  <div className="text-sm text-gray-600 font-medium">Overall Rate</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Dumbbell className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 animate-pulse">96%</div>
                  <div className="text-sm text-gray-600 font-medium">Sports Programs</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Music className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-orange-600 animate-pulse">92%</div>
                  <div className="text-sm text-gray-600 font-medium">Arts Programs</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 animate-pulse">8:52</div>
                  <div className="text-sm text-gray-600 font-medium">Avg Check-in</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    ),
  },
]

const categories = [
  { id: "all", name: "All Features", icon: <Home className="h-4 w-4" /> },
  { id: "overview", name: "Overview", icon: <Eye className="h-4 w-4" /> },
  { id: "dashboard", name: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "programs", name: "Programs", icon: <BookOpen className="h-4 w-4" /> },
  { id: "students", name: "Students", icon: <Users className="h-4 w-4" /> },
  { id: "staff", name: "Staff", icon: <UserCog className="h-4 w-4" /> },
  { id: "payments", name: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { id: "attendance", name: "Attendance", icon: <Camera className="h-4 w-4" /> },
]

export default function UniqBrioSportsArtsTour() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        nextStep()
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, selectedCategory])

  const nextStep = () => {
    if (selectedCategory === "all") {
      setCurrentStep((prev) => (prev + 1) % tourSteps.length)
    } else {
      const currentFilteredIndex = getCurrentStepInFiltered()
      const nextFilteredIndex = (currentFilteredIndex + 1) % filteredSteps.length
      const nextStepId = filteredSteps[nextFilteredIndex].id
      const nextStepIndex = tourSteps.findIndex((step) => step.id === nextStepId)
      setCurrentStep(nextStepIndex)
    }
  }

  const prevStep = () => {
    if (selectedCategory === "all") {
      setCurrentStep((prev) => (prev - 1 + tourSteps.length) % tourSteps.length)
    } else {
      const currentFilteredIndex = getCurrentStepInFiltered()
      const prevFilteredIndex = (currentFilteredIndex - 1 + filteredSteps.length) % filteredSteps.length
      const prevStepId = filteredSteps[prevFilteredIndex].id
      const prevStepIndex = tourSteps.findIndex((step) => step.id === prevStepId)
      setCurrentStep(prevStepIndex)
    }
  }

  const goToStep = (index: number) => {
    setCurrentStep(index)
    setIsPlaying(false)
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setIsPlaying(false)

    // When a category is selected, go to the first step of that category
    if (categoryId === "all") {
      setCurrentStep(0)
    } else {
      const firstStepIndex = tourSteps.findIndex((step) => step.category === categoryId)
      if (firstStepIndex !== -1) {
        setCurrentStep(firstStepIndex)
      }
    }
  }

  const filteredSteps =
    selectedCategory === "all" ? tourSteps : tourSteps.filter((step) => step.category === selectedCategory)

  // Update the current step to be relative to filtered steps
  const getCurrentStepInFiltered = () => {
    if (selectedCategory === "all") {
      return currentStep
    }
    const filteredIndex = filteredSteps.findIndex((step) => step.id === tourSteps[currentStep].id)
    return filteredIndex !== -1 ? filteredIndex : 0
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedCard delay={0}>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-orange-500 to-purple-600 rounded-full flex items-center justify-center mr-4 animate-spin-slow shadow-2xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                  UniqBrio Sports & Arts Academy Tour
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Discover excellence in athletic and artistic education management
                </p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((category, index) => (
                <AnimatedCard key={category.id} delay={index * 50}>
                  <Button
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryChange(category.id)}
                    className={cn(
                      "flex items-center gap-2 hover:scale-105 transition-all duration-300 shadow-lg",
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-purple-600 to-orange-600 text-white border-0"
                        : "border-purple-300 text-purple-600 hover:bg-purple-50",
                    )}
                  >
                    {category.icon}
                    {category.name}
                  </Button>
                </AnimatedCard>
              ))}
            </div>

            {/* Tour Controls */}
            <div className="flex items-center justify-center space-x-6 mb-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevStep}
                className="hover:scale-110 transition-transform duration-200 border-purple-300 text-purple-600 hover:bg-purple-50 w-12 h-12 bg-transparent"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="hover:scale-110 transition-transform duration-200 bg-gradient-to-r from-purple-600 to-orange-600 text-white border-0 w-12 h-12"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextStep}
                className="hover:scale-110 transition-transform duration-200 border-orange-300 text-orange-600 hover:bg-orange-50 w-12 h-12 bg-transparent"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3 ml-6">
                <span className="text-sm text-gray-600 font-medium">
                  Step {getCurrentStepInFiltered() + 1} of {filteredSteps.length}
                </span>
                <div className="w-40">
                  <Progress value={((getCurrentStepInFiltered() + 1) / filteredSteps.length) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Main Tour Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step Navigation */}
          <div className="lg:col-span-1">
            <AnimatedCard delay={200}>
              <Card className="hover:shadow-2xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                    <PulseIcon>
                      <CalendarIcon className="h-6 w-6 mr-3 text-purple-600" />
                    </PulseIcon>
                    Tour Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredSteps.map((step, index) => (
                      <AnimatedCard key={step.id} delay={index * 50}>
                        <button
                          onClick={() => goToStep(tourSteps.indexOf(step))}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border-2 transition-all duration-300",
                            tourSteps[currentStep].id === step.id
                              ? "bg-gradient-to-r from-purple-50 to-orange-50 border-purple-300 text-purple-700 scale-105 shadow-lg"
                              : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 border-gray-200 hover:scale-102 hover:shadow-md",
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={cn(
                                "p-3 rounded-full transition-all duration-300",
                                tourSteps[currentStep].id === step.id
                                  ? "bg-gradient-to-br from-purple-500 to-orange-500 text-white animate-pulse"
                                  : "bg-gray-100 text-gray-600",
                              )}
                            >
                              {step.icon}
                            </div>
                            <div>
                              <p className="font-bold text-lg">{step.title}</p>
                              <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                          </div>
                        </button>
                      </AnimatedCard>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>

          {/* Current Step Content */}
          <div className="lg:col-span-2">
            <AnimatedCard delay={400}>
              <Card className="h-full hover:shadow-2xl transition-shadow duration-300 border-purple-200 bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full text-white animate-pulse shadow-lg">
                        {tourSteps[currentStep].icon}
                      </div>
                      <div>
                        <CardTitle className="text-3xl bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                          {tourSteps[currentStep].title}
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-600 mt-2">
                          {tourSteps[currentStep].description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="capitalize animate-pulse bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700 border-purple-300"
                    >
                      {tourSteps[currentStep].category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Features List */}
                    <div>
                      <h3 className="font-bold text-xl mb-4 flex items-center bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                        <FloatingIcon>
                          <Sparkles className="h-5 w-5 mr-3 text-orange-500" />
                        </FloatingIcon>
                        Key Features
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tourSteps[currentStep].features.map((feature, index) => (
                          <AnimatedCard key={index} delay={index * 100}>
                            <div className="flex items-center space-x-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 p-3 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md">
                              <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-orange-600 rounded-full animate-pulse"></div>
                              <span className="text-sm text-gray-700 font-medium">{feature}</span>
                            </div>
                          </AnimatedCard>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Content */}
                    <div>
                      <h3 className="font-bold text-xl mb-4 flex items-center bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                        <PulseIcon>
                          <Smartphone className="h-5 w-5 mr-3 text-purple-500" />
                        </PulseIcon>
                        Interactive Preview
                      </h3>
                      <div className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-orange-50 transition-all duration-300 shadow-lg">
                        {tourSteps[currentStep].content}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <AnimatedCard delay={600}>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <FloatingIcon>
                    <Dumbbell className="h-8 w-8 text-purple-600 mr-2" />
                  </FloatingIcon>
                  <PulseIcon>
                    <Music className="h-8 w-8 text-orange-600" />
                  </PulseIcon>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
                  320+
                </div>
                <div className="text-sm text-gray-600 font-medium">Athletes & Artists</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-300 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Trophy className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-3xl font-bold text-orange-600 animate-pulse">18</div>
                <div className="text-sm text-gray-600 font-medium">Active Programs</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-300 border-purple-200 bg-gradient-to-br from-purple-50 to-orange-50">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <UserCog className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
                  24
                </div>
                <div className="text-sm text-gray-600 font-medium">Coaches & Instructors</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-300 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
              <CardContent className="p-6 text-center">
                <FloatingIcon>
                  <Medal className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
                </FloatingIcon>
                <div className="text-3xl font-bold text-yellow-600 animate-pulse">47</div>
                <div className="text-sm text-gray-600 font-medium">Competitions Won</div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>

        {/* Call to Action */}
        <AnimatedCard delay={800}>
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-purple-600 via-purple-500 to-orange-500 text-white hover:shadow-2xl transition-shadow duration-300 border-0">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold mb-6 animate-pulse">Ready to Elevate Your Sports & Arts Academy?</h2>
                <p className="text-xl mb-8 opacity-90">
                  Experience the full power of UniqBrio's specialized platform for athletic and artistic excellence
                </p>
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="hover:scale-110 transition-transform duration-200 bg-white text-purple-700 hover:bg-gray-100 shadow-lg px-8 py-4 text-lg"
                  >
                    <Trophy className="h-6 w-6 mr-2" />
                    Start Free Trial
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedCard>
      </div>
      </div>
    </MainLayout>
  )
}
