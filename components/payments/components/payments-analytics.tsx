"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import {
  TrendingUp,
  BookOpen,
} from "lucide-react"

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
  

  const [monthlyReceived, setMonthlyReceived] = useState<number>(0)
  const [weeklyReceived, setWeeklyReceived] = useState<number>(0)

  const formatINR = (value: number) => `INR ${Number(value || 0).toLocaleString('en-IN')}`

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

  // Choose data source for breakdowns: if the selected period has no paid entries,
  // fall back to ALL available course records so charts still show course/cohort impact.
  const fallbackAllRecords = records
  const breakdownSource = periodRecords.length > 0 ? periodRecords : fallbackAllRecords

  // Calculate totals (period-based for KPIs)
  const totalStudents = new Set(breakdownSource.map(r => r.id)).size
  const totalAmount = breakdownSource.reduce((sum, r) => sum + (r.totalPaidAmount || 0), 0)
    const outstandingAmount = records.reduce((sum, r) => sum + (r.balancePayment || 0), 0)
  const completionRate = records.length > 0 ? (periodRecords.length / records.length) * 100 : 0

    // Course-wise breakdown
    const courseStats: Record<string, { students: number; amount: number; courses: Set<string> }> = {}
    breakdownSource.forEach(record => {
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

    // Cohort breakdown removed per request

    
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
      statusDistribution,
      paymentDistribution,
      periodRecords: periodRecords.length,
      averagePayment: periodRecords.length > 0 ? totalAmount / periodRecords.length : 0
    }
  }, [records, dateRange])

  // Export controls removed per request

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


      {/* Summary cards: This Month, This Week, Outstanding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue - This Month */}
        <Card className="bg-orange-50 border-orange-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-orange-800 mb-1">{formatINR(monthlyReceived)}</p>
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
                <p className="text-3xl font-bold text-rose-800 mb-1">{formatINR(weeklyReceived)}</p>
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
                <p className="text-3xl font-bold text-green-800 mb-1">{formatINR(localAnalytics.outstandingAmount)}</p>
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

      {/* Charts Section after removal of cohort charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Students by Course (revenue) */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Revenue by Course (Top 3)
            </CardTitle>
          </CardHeader>
          <CardContent className="chart-container">
            {localAnalytics.courseBreakdown.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No data available</div>
                <div className="empty-state-description">No revenue recorded for this period.</div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={localAnalytics.courseBreakdown.slice(0,3)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="course"
                  angle={-35}
                  textAnchor="end"
                  height={90}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(value) => `INR ${(value / 1000).toFixed(1)}K`}
                  width={70}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `INR ${Number(value).toLocaleString('en-IN')}`,
                    "Amount"
                  ]}
                  labelFormatter={(label) => `Course: ${label}`}
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[4,4,0,0]}>
                  <LabelList dataKey="amount" position="top" formatter={(v: any) => `INR ${Number(v).toLocaleString('en-IN')}`} className="text-[10px] fill-[#374151]" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        

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
</div>
   
    </div>
  )
}