"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Area,
  AreaChart,
  LabelList,
} from "recharts"
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BookOpen,
  DollarSign,
  Clock,
  Target,
  PieChart as PieChartIcon,
  Download,
  Activity,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface PaymentRecord {
  id: string
  name: string
  finalPayment: number
  totalPaidAmount: number
  balancePayment: number
  paymentStatus: string
  paidDate?: string
  activity?: string
  enrolledCourse?: string
  category?: string
  paymentModes?: string[]
  cohort?: string
  instructor?: string
  courseStartDate?: string
}

interface PaymentsAnalyticsProps {
  records: PaymentRecord[]
}

interface AnalyticsData {
  totalReceived: number
  methodMix: Array<{ method: string; amount: number; percentage: number }>
}

const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"]

export function PaymentsAnalytics({ records }: PaymentsAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("month")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({ totalReceived: 0, methodMix: [] })
  const [loading, setLoading] = useState(false)
  // New: pinned cards for month/week revenue
  const [monthlyReceived, setMonthlyReceived] = useState<number>(0)
  const [weeklyReceived, setWeeklyReceived] = useState<number>(0)

  // Compute date range for the selected period
  const dateRange = useMemo(() => {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    let start: Date

    switch (selectedPeriod) {
      case "week":
        start = new Date(end)
        start.setDate(end.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        break
      case "quarter":
        const month = end.getMonth()
        const qStartMonth = Math.floor(month / 3) * 3
        start = new Date(end.getFullYear(), qStartMonth, 1, 0, 0, 0, 0)
        break
      case "year":
        start = new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0)
        break
      case "month":
      default:
        start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0)
        break
    }

    return { start, end }
  }, [selectedPeriod])

  // Fetch analytics data from API
  useEffect(() => {
    let ignore = false
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/payments/analytics?period=${selectedPeriod}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!ignore && json?.success) {
          setAnalyticsData({
            totalReceived: json.data?.totalReceived || 0,
            methodMix: json.data?.mix || [],
          })
        }
      } catch (e) {
        if (!ignore) {
          console.error("Analytics fetch failed:", e)
          setAnalyticsData({ totalReceived: 0, methodMix: [] })
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchAnalytics()
    return () => {
      ignore = true
    }
  }, [selectedPeriod])

  // Fetch fixed cards: this month and this week revenue
  useEffect(() => {
    let ignore = false
    async function fetchPinned() {
      try {
        const [mRes, wRes] = await Promise.all([
          fetch(`/api/payments/analytics?period=month`, { cache: 'no-store' }),
          fetch(`/api/payments/analytics?period=week`, { cache: 'no-store' }),
        ])
        if (!ignore) {
          if (mRes.ok) {
            const j = await mRes.json(); setMonthlyReceived(j?.data?.totalReceived || 0)
          } else { setMonthlyReceived(0) }
          if (wRes.ok) {
            const j2 = await wRes.json(); setWeeklyReceived(j2?.data?.totalReceived || 0)
          } else { setWeeklyReceived(0) }
        }
      } catch {
        if (!ignore) { setMonthlyReceived(0); setWeeklyReceived(0) }
      }
    }
    fetchPinned()
    return () => { ignore = true }
  }, [])

  // Generate analytics from local records data
  const localAnalytics = useMemo(() => {
    const { start, end } = dateRange
    
    // Filter records for the selected period
    const periodRecords = records.filter(record => {
      if (!record.paidDate) return false
      const paidDate = new Date(record.paidDate)
      return paidDate >= start && paidDate <= end && record.paymentStatus === "Completed"
    })

    // Calculate totals
    const totalStudents = new Set(periodRecords.map(r => r.id)).size
    const totalAmount = periodRecords.reduce((sum, r) => sum + (r.totalPaidAmount || 0), 0)
    const outstandingAmount = records.reduce((sum, r) => sum + (r.balancePayment || 0), 0)
    const completionRate = records.length > 0 ? (periodRecords.length / records.length) * 100 : 0

    // Course-wise breakdown
    const courseStats: Record<string, { students: number; amount: number; courses: Set<string> }> = {}
    periodRecords.forEach(record => {
      const course = record.activity || record.enrolledCourse || "Unknown"
      if (!courseStats[course]) {
        courseStats[course] = { students: 0, amount: 0, courses: new Set() }
      }
      courseStats[course].students += 1
      courseStats[course].amount += record.totalPaidAmount || 0
      courseStats[course].courses.add(course)
    })

    const courseBreakdown = Object.entries(courseStats)
      .map(([course, stats]) => ({
        course: course.length > 20 ? course.substring(0, 20) + "..." : course,
        students: stats.students,
        amount: stats.amount,
        percentage: totalAmount > 0 ? (stats.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)

    // Cohort-wise breakdown
    const cohortStats: Record<string, { students: number; amount: number }> = {}
    periodRecords.forEach(record => {
      const cohort = record.cohort || "Unspecified"
      if (!cohortStats[cohort]) {
        cohortStats[cohort] = { students: 0, amount: 0 }
      }
      cohortStats[cohort].students += 1
      cohortStats[cohort].amount += record.totalPaidAmount || 0
    })

    const cohortBreakdown = Object.entries(cohortStats)
      .map(([cohort, stats]) => ({
        cohort,
        students: stats.students,
        amount: stats.amount,
        percentage: totalStudents > 0 ? (stats.students / totalStudents) * 100 : 0
      }))
      .sort((a, b) => b.students - a.students)

    // Daily payment trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const dailyTrends = last7Days.map(dateStr => {
      const dayRecords = periodRecords.filter(r => 
        r.paidDate && r.paidDate.split('T')[0] === dateStr
      )
      return {
        date: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        amount: dayRecords.reduce((sum, r) => sum + (r.totalPaidAmount || 0), 0),
        transactions: dayRecords.length,
        students: new Set(dayRecords.map(r => r.id)).size
      }
    })

    // Payment status distribution
    const statusStats: Record<string, number> = {}
    records.forEach(record => {
      const status = record.paymentStatus || "Unknown"
      statusStats[status] = (statusStats[status] || 0) + 1
    })

    const statusDistribution = Object.entries(statusStats)
      .map(([status, count]) => ({
        status,
        count,
        percentage: records.length > 0 ? (count / records.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    // Helper to coerce various numeric shapes to number safely
    const toNumber = (val: any): number => {
      if (typeof val === 'number' && Number.isFinite(val)) return val
      if (typeof val === 'string') {
        const cleaned = val.replace(/^[^\d-]+/, '').replace(/[,₹$€£¥]/g, '')
        const n = Number.parseFloat(cleaned)
        return Number.isFinite(n) ? n : 0
      }
      return 0
    }

    // Payment completion distribution (like student performance buckets)
    const buckets = {
      'Fully Paid (100%)': 0,
      '75-99% Paid': 0,
      '50-74% Paid': 0,
      'Below 50%': 0,
    } as Record<string, number>

    records.forEach(r => {
      const total = Math.max(0, toNumber((r as any).finalPayment))
      const paid = Math.max(0, toNumber((r as any).totalPaidAmount))
      if (total <= 0) {
        // If no fee defined, skip bucket classification
        return
      }
      const pct = Math.min(100, (paid / total) * 100)
      if (pct >= 100 || (r.paymentStatus === 'Completed' && toNumber((r as any).balancePayment) <= 0)) {
        buckets['Fully Paid (100%)'] += 1
      } else if (pct >= 75) {
        buckets['75-99% Paid'] += 1
      } else if (pct >= 50) {
        buckets['50-74% Paid'] += 1
      } else {
        buckets['Below 50%'] += 1
      }
    })

    const paymentDistribution = [
      { name: 'Fully Paid (100%)', value: buckets['Fully Paid (100%)'] },
      { name: '75-99% Paid', value: buckets['75-99% Paid'] },
      { name: '50-74% Paid', value: buckets['50-74% Paid'] },
      { name: 'Below 50%', value: buckets['Below 50%'] },
    ]

    return {
      totalStudents,
      totalAmount,
      outstandingAmount,
      completionRate,
      courseBreakdown,
      cohortBreakdown,
      dailyTrends,
      statusDistribution,
      paymentDistribution,
      periodRecords: periodRecords.length,
      averagePayment: periodRecords.length > 0 ? totalAmount / periodRecords.length : 0
    }
  }, [records, dateRange])

  const handleExportReport = (format: "pdf" | "csv") => {
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} analytics report...`,
    })

    // Simulate export with actual data
    setTimeout(() => {
      const data = {
        period: selectedPeriod,
        dateRange,
        analytics: localAnalytics,
        paymentMethods: analyticsData.methodMix,
        totalReceived: analyticsData.totalReceived
      }
      
      if (format === "csv") {
        const csvContent = [
          ["Metric", "Value"],
          ["Period", selectedPeriod],
          ["Total Students", localAnalytics.totalStudents],
          ["Total Amount", localAnalytics.totalAmount],
          ["Outstanding Amount", localAnalytics.outstandingAmount],
          ["Completion Rate", `${localAnalytics.completionRate.toFixed(1)}%`],
          ["Average Payment", localAnalytics.averagePayment.toFixed(2)],
          ...localAnalytics.courseBreakdown.map(c => [`Course: ${c.course}`, c.amount]),
        ].map(row => row.join(",")).join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payments-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Export Complete",
        description: `Analytics report has been downloaded as ${format.toUpperCase()}.`,
      })
    }, 1500)
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "week": return "This Week"
      case "quarter": return "This Quarter"  
      case "year": return "This Year"
      default: return "This Month"
    }
  }

  return (
    <div className="space-y-6 analytics-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Payment Analytics</h3>
          <p className="text-gray-600">Comprehensive insights into payment performance and trends</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "week" | "month" | "quarter" | "year")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExportReport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("pdf")}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary cards: This Month, This Week, Outstanding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue - This Month */}
        <Card className="bg-orange-50 border-orange-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-orange-800 mb-1">₹{monthlyReceived.toLocaleString()}</p>
                <p className="text-xs text-orange-600">This month</p>
              </div>
              <div className="bg-orange-200 p-2 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM18 9H2v6a2 2 0 002 2h12a2 2 0 002-2V9z"/></svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue - This Week */}
        <Card className="bg-rose-50 border-rose-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-rose-600 text-sm font-medium mb-2">Revenue</p>
                <p className="text-3xl font-bold text-rose-800 mb-1">₹{weeklyReceived.toLocaleString()}</p>
                <p className="text-xs text-rose-600">This week</p>
              </div>
              <div className="bg-rose-200 p-2 rounded-lg">
                <svg className="w-5 h-5 text-rose-600" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM18 9H2v6a2 2 0 002 2h12a2 2 0 002-2V9z"/></svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card className="bg-green-50 border-green-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium mb-2">Outstanding Payments</p>
                <p className="text-3xl font-bold text-green-800 mb-1">₹{localAnalytics.outstandingAmount.toLocaleString()}</p>
                <p className="text-xs text-green-700">Across all students</p>
              </div>
              <div className="bg-green-200 p-2 rounded-lg">
                <svg className="w-5 h-5 text-green-700" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 4h2v2H6V8zm0 3h2v2H6v-2zm3-3h2v2H9V8zm0 3h2v2H9v-2zm3-3h2v2h-2V8z"/></svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

  {/* Removed extra metrics grid per request */}

      {/* Charts Section matching reference: two bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohorts Impacted */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Cohorts Impacted</CardTitle>
            <CardDescription>Payment distribution across cohorts</CardDescription>
          </CardHeader>
          <CardContent className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={localAnalytics.cohortBreakdown.map(c => ({ name: c.cohort, value: c.students }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v: any) => [v, 'Students']} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4,4,0,0]}>
                  <LabelList dataKey="value" position="top" className="text-xs font-bold fill-[#374151]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Courses Impacted */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Courses Impacted</CardTitle>
            <CardDescription>Course-wise payment distribution</CardDescription>
          </CardHeader>
          <CardContent className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={localAnalytics.courseBreakdown.map(c => ({ name: c.course, value: c.students }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v: any) => [v, 'Students']} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4,4,0,0]}>
                  <LabelList dataKey="value" position="top" className="text-xs font-bold fill-[#374151]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students by Course (revenue) */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Revenue by Course
            </CardTitle>
          </CardHeader>
          <CardContent className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={localAnalytics.courseBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="course" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Amount"]}
                  labelFormatter={(label) => `Course: ${label}`}
                />
                <Bar dataKey="amount" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students by Cohort */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students by Cohort
            </CardTitle>
          </CardHeader>
          <CardContent className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={localAnalytics.cohortBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.cohort}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="students"
                >
                  {localAnalytics.cohortBreakdown.map((entry, index) => (
                    <Cell key={`cell-cohort-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any) => [value, "Students"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {localAnalytics.cohortBreakdown.slice(0, 4).map((cohort, i) => (
                <div key={cohort.cohort} className="legend-item">
                  <div className="flex items-center">
                    <span 
                      className="legend-color" 
                      style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                    />
                    <span className="legend-text truncate">{cohort.cohort}</span>
                  </div>
                  <span className="legend-value">{cohort.students}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Mix */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method Mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <div className="relative">
                  <div className="h-40 w-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-white" />
                </div>
              </div>
            ) : analyticsData.methodMix.length === 0 || analyticsData.methodMix.every(m => m.amount === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <PieChartIcon className="h-7 w-7 text-gray-400" />
                </div>
                <div className="empty-state-title">No payment methods data</div>
                <div className="empty-state-description">Complete some payments to see the mix</div>
              </div>
            ) : (
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.methodMix.map(m => ({ name: m.method, value: m.amount }))}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={(entry: any) => entry.value > 0 ? `₹${Number(entry.value).toLocaleString()}` : ''}
                    >
                      {analyticsData.methodMix.map((entry, index) => (
                        <Cell key={`cell-method-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any) => [
                      `₹${Number(value || 0).toLocaleString()}`,
                      name
                    ]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {analyticsData.methodMix.map((method, i) => (
                    <div key={method.method} className="legend-item">
                      <div className="flex items-center">
                        <span 
                          className="legend-color" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                        />
                        <span className="legend-text">{method.method}</span>
                      </div>
                      <span className="legend-value">₹{method.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Payment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={localAnalytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.status} (${entry.count})`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {localAnalytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Completion Distribution (mirrors reference UI) */}
      <Card className="analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Payment Completion Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={localAnalytics.paymentDistribution}
              margin={{ top: 25, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={0} 
                textAnchor="middle" 
                height={50} 
                tick={{ fontSize: 11, fill: "#6b7280" }}
                label={{ value: 'Completion Categories', position: 'insideBottom', offset: 0 }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "#6b7280" }}
                label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax) + 1]}
              />
              <Tooltip 
                formatter={(value: any) => [value, 'Students']}
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#paymentPerformanceGradient)" 
                radius={[4, 4, 0, 0]}
              >
                <LabelList dataKey="value" position="top" className="text-xs font-bold fill-[#374151]" />
              </Bar>
              <defs>
                <linearGradient id="paymentPerformanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9370DB" />
                  <stop offset="100%" stopColor="#8A2BE2" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Payment Trends */}
      <Card className="analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Payment Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={localAnalytics.dailyTrends}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: any, name: any) => {
                  if (name === "amount") return [`₹${Number(value).toLocaleString()}`, "Amount"]
                  return [value, name === "transactions" ? "Transactions" : "Students"]
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="amount"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorAmount)"
                name="Amount"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="transactions"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#colorTransactions)"
                name="Transactions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Performance Table */}
      <Card className="analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Course Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {localAnalytics.courseBreakdown.map((course, index) => (
              <div key={course.course} className="performance-item">
                <div className="flex items-center gap-3">
                  <div className="performance-rank">
                    {index + 1}
                  </div>
                  <div className="performance-details">
                    <div className="performance-name">{course.course}</div>
                    <div className="performance-meta">
                      {course.students} students enrolled
                    </div>
                  </div>
                </div>
                <div className="performance-badges">
                  <Badge className="performance-badge primary">₹{course.amount.toLocaleString()}</Badge>
                  <Badge className="performance-badge secondary">{course.percentage.toFixed(1)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}