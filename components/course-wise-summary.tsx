"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { BookOpen, Users, AlertTriangle, ChevronDown, ChevronRight, User, Hash, Tag, GraduationCap, CreditCard, DollarSign, Calendar, Bell, Smartphone, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react"
import RecordDetailsDialog, { RecordDetailsSection } from './payments/components/record-details-dialog'
import { PaymentRecord } from './payments/components/payment-types'
import { formatDateToDisplay } from '@/lib/date-utils'
import { getRegistrationSummary } from './payments/components/registration-fees-display'

interface CohortPayment {
  cohort: string
  cohortId?: string
  students: number
  amount: number
  received: number
  outstanding: number
  studentIds?: string[] // Add student IDs for looking up records
}

interface CoursePayment {
  courseId: string
  course: string
  program: string
  amount: number
  students: number
  received: number
  outstanding: number
  cohorts?: CohortPayment[]
}

interface CourseWiseSummaryProps {
  coursePayments: CoursePayment[]
  allRecords?: PaymentRecord[] // All payment records to find student details
}

export function CourseWiseSummary({ coursePayments, allRecords = [] }: CourseWiseSummaryProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null)
  const [dialogPaymentMethods, setDialogPaymentMethods] = useState<string[]>([])
  const [currentCohortStudentIds, setCurrentCohortStudentIds] = useState<string[]>([])
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [currentCourseId, setCurrentCourseId] = useState<string>('')

  const openStudentDetails = async (studentId: string, courseId: string) => {
    // Find the student record
    const record = allRecords.find(r => r.id === studentId && (r.activity === courseId || r.enrolledCourse === courseId))
    if (!record) {
      console.warn('Student record not found for', studentId, courseId)
      return
    }
    
    setSelectedRecord(record)
    setDetailsOpen(true)
    
    // Fetch payment methods from backend
    try {
      const matchedCourseId = (record as any).matchedCourseId || record.activity || record.enrolledCourse
      const resp = await fetch(`/api/payments?studentId=${encodeURIComponent(record.id)}${matchedCourseId ? `&courseId=${encodeURIComponent(matchedCourseId)}` : ''}`, { cache: 'no-store' })
      if (resp.ok) {
        const json = await resp.json()
        const doc: any = json.data || json
        const records = Array.isArray(doc?.paymentRecords) ? doc.paymentRecords : []
        const methods: string[] = Array.from(new Set(records
          .map((r: any) => r?.paymentMethod)
          .filter((m: any) => m && typeof m === 'string')))
        setDialogPaymentMethods(methods)
      }
    } catch (err) {
      console.error('Failed to fetch payment methods:', err)
    }
  }

  const openCohortDetails = (cohort: CohortPayment, courseId: string) => {
    if (!cohort.studentIds || cohort.studentIds.length === 0) {
      toast({
        title: "No students found",
        description: "This cohort has no enrolled students.",
        variant: "default"
      })
      return
    }
    
    // Store all student IDs in the cohort for navigation
    setCurrentCohortStudentIds(cohort.studentIds)
    setCurrentStudentIndex(0)
    setCurrentCourseId(courseId)
    
    // Open details for the first student in the cohort
    openStudentDetails(cohort.studentIds[0], courseId)
  }

  const navigateToStudent = (direction: 'prev' | 'next') => {
    if (currentCohortStudentIds.length === 0) return
    
    let newIndex = currentStudentIndex
    if (direction === 'next') {
      newIndex = (currentStudentIndex + 1) % currentCohortStudentIds.length
    } else {
      newIndex = (currentStudentIndex - 1 + currentCohortStudentIds.length) % currentCohortStudentIds.length
    }
    
    setCurrentStudentIndex(newIndex)
    openStudentDetails(currentCohortStudentIds[newIndex], currentCourseId)
  }

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    // Format with Indian number formatting - just return the number without currency
    return new Intl.NumberFormat("en-IN").format(amount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Dialog sections for RecordDetailsDialog
  const sections: RecordDetailsSection[] = useMemo(() => {
    if (!selectedRecord) return []
    const r = selectedRecord as any

    // Extract payment methods
    let paymentMethods: string[] = dialogPaymentMethods.length > 0 ? dialogPaymentMethods
      : Array.isArray(r.paymentRecords)
      ? Array.from(new Set(r.paymentRecords
          .map((pr: any) => pr?.paymentMethod)
          .filter((pm: any) => typeof pm === 'string' && pm.trim().length > 0)))
      : []
    
    if (paymentMethods.length === 0 && Array.isArray(r.paymentModes)) {
      paymentMethods = Array.from(new Set(r.paymentModes.filter((pm: any) => typeof pm === 'string' && pm.trim().length > 0)))
    }

    // Compute payment summary
    const regSummary = getRegistrationSummary(r.registrationFees)
    const totalRegAmount = regSummary?.totalAmount || 0
    const totalPaid = r.totalPaidAmount || 0
    const overallDue = (r.finalPayment || 0) + totalRegAmount
    const overallBalance = Math.max(overallDue - totalPaid, 0)
    const statusLabel = overallDue <= 0 ? '-' : overallBalance === 0 ? 'Paid' : 'Pending'

    return [
      {
        title: 'Student Information',
        fields: [
          { icon: <Hash className="h-4 w-4" />, label: 'Student ID', value: r.id || '-' },
          { icon: <User className="h-4 w-4" />, label: 'Name', value: r.name || '-' },
          { icon: <Tag className="h-4 w-4" />, label: 'Category', value: r.category || '-' }
        ]
      },
      {
        title: 'Course Details',
        fields: [
          { icon: <BookOpen className="h-4 w-4" />, label: 'Course', value: r.activity || r.enrolledCourse || '-' },
          { icon: <Tag className="h-4 w-4" />, label: 'Course Type', value: r.courseType || '-' }
        ]
      },
      {
        title: 'Payment Summary',
        fields: [
          { icon: <DollarSign className="h-4 w-4" />, label: 'Registration Fee', value: `INR ${new Intl.NumberFormat('en-IN').format(totalRegAmount)}` },
          { icon: <DollarSign className="h-4 w-4" />, label: 'Final Payment', value: `INR ${new Intl.NumberFormat('en-IN').format(r.finalPayment || 0)}` },
          { icon: <DollarSign className="h-4 w-4" />, label: 'Total Paid', value: `INR ${new Intl.NumberFormat('en-IN').format(totalPaid)}` },
          { icon: <DollarSign className="h-4 w-4" />, label: 'Balance', value: `INR ${new Intl.NumberFormat('en-IN').format(overallBalance)}` },
          { icon: <Tag className="h-4 w-4" />, label: 'Status', value: statusLabel }
        ]
      },
      {
        title: 'Important Dates',
        fields: [
          { icon: <Calendar className="h-4 w-4" />, label: 'Paid Date', value: r.paidDate ? formatDateToDisplay(r.paidDate) : '-' },
          { icon: <Calendar className="h-4 w-4" />, label: 'Next Due', value: r.nextDueDate ? formatDateToDisplay(r.nextDueDate) : '-' },
          { icon: <Calendar className="h-4 w-4" />, label: 'Course Start', value: r.courseStartDate ? formatDateToDisplay(r.courseStartDate) : '-' }
        ]
      },
      {
        title: 'Communication',
        fields: [
          { icon: <Bell className="h-4 w-4" />, label: 'Reminder Sent', value: r.reminderSent ? 'Yes' : 'No' },
          { icon: <Smartphone className="h-4 w-4" />, label: 'Communication Mode', value: r.communicationMode || '-' },
          ...(paymentMethods.length > 0 ? [{ icon: <CreditCard className="h-4 w-4" />, label: 'Payment Modes', value: paymentMethods.join(', ') }] : [])
        ]
      }
    ]
  }, [selectedRecord, dialogPaymentMethods])

  return (
    <>
    <Card className="border-orange-200">
      <CardHeader className="bg-orange-50 py-3">
        <CardTitle className="flex items-center gap-2 text-black text-lg">
          <BookOpen className="h-5 w-5" />
          Course-wise Payment Summary
        </CardTitle>
        <CardDescription className="text-black text-sm">Payment collection status by course</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-white">
                <TableHead className="font-semibold text-xs p-3 text-left text-orange-700">CourseID</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-left text-orange-700">Course Name</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center text-orange-700">Students</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center text-orange-700">Total Amount (INR)</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center text-orange-700">Received (INR)</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center text-orange-700">Outstanding (INR)</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center text-orange-700">Collection Rate</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center text-orange-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coursePayments.map((course, index) => {
                const collectionRate = (course.received / course.amount) * 100
                const isExpanded = expandedCourses.has(course.course)
                const hasCohorts = course.cohorts && course.cohorts.length > 0
                
                return (
                  <>
                    <TableRow
                      key={course.course}
                      className={`${index % 2 === 0 ? "bg-orange-50/30" : "bg-orange-100/40"} hover:bg-orange-100/60 ${hasCohorts ? 'cursor-pointer' : ''} border-l-4 border-orange-500`}
                      onClick={() => hasCohorts && toggleCourse(course.course)}
                    >
                      <TableCell className="font-medium text-xs p-3 text-left">
                        <div className="flex items-center gap-2">
                          {hasCohorts && (
                            <button className="p-0 hover:bg-orange-200 rounded">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-orange-700" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-orange-700" />
                              )}
                            </button>
                          )}
                          <BookOpen className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-900">{course.courseId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-orange-900">{course.program || course.course}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-orange-600" />
                          <span className="font-semibold text-orange-900">{course.students}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-semibold text-orange-900">{formatCurrency(course.amount)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <span className="font-semibold text-green-600">{formatCurrency(course.received)}</span>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <span className={`font-semibold ${course.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(course.outstanding)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <div className="space-y-1">
                          <div className="flex justify-center text-xs">
                            <span className="font-semibold text-orange-900">{collectionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={collectionRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        {course.amount === 0 && course.received === 0 && course.outstanding === 0 ? (
                          <span className="text-orange-400 italic">-</span>
                        ) : course.outstanding === 0 ? (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {/* Cohort Details Row */}
                    {isExpanded && hasCohorts && (
                      <TableRow key={`${course.course}-cohorts`} className="bg-purple-50/50">
                        <TableCell colSpan={8} className="p-0">
                          <div className="mx-8 my-4 border-2 border-purple-300 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50">
                            <div className="px-6 py-3 text-xs font-semibold text-purple-700 flex items-center gap-2 border-b border-purple-200">
                              <Users className="h-4 w-4" />
                              Cohort-wise Breakdown for {course.program || course.course}
                            </div>
                            <div className="p-4">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b bg-purple-200/50">
                                  <TableHead className="font-semibold text-xs p-2 text-left text-purple-800">Cohort ID</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-left text-purple-800">Cohort</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-800">Students</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-800">Total Amount (INR)</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-800">Received (INR)</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-800">Outstanding (INR)</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-800">Collection Rate</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {course.cohorts!.map((cohort, cohortIndex) => {
                                  const cohortCollectionRate = cohort.amount > 0 ? (cohort.received / cohort.amount) * 100 : 0
                                  const hasStudents = cohort.studentIds && cohort.studentIds.length > 0
                                  return (
                                    <TableRow 
                                      key={cohort.cohort}
                                      className={`bg-white ${hasStudents ? 'cursor-pointer' : ''} border-l-4 border-purple-400`}
                                      onClick={() => hasStudents && openCohortDetails(cohort, course.courseId)}
                                    >
                                      <TableCell className="text-xs p-2 text-left font-medium text-purple-700">
                                        {cohort.cohortId || '-'}
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-left font-medium text-purple-900">
                                        {cohort.cohort || 'Unassigned'}
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Users className="h-3 w-3 text-purple-600" />
                                          <span className="font-medium text-purple-900">{cohort.students}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-center">
                                        <span className="font-medium text-purple-900">{formatCurrency(cohort.amount)}</span>
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-center">
                                        <span className="font-medium text-green-600">
                                          {formatCurrency(cohort.received)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-center">
                                        <span className={`font-medium ${cohort.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                                          {formatCurrency(cohort.outstanding)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-center">
                                        <div className="space-y-1">
                                          <div className="flex justify-center text-xs">
                                            <span className="font-medium text-purple-900">{cohortCollectionRate.toFixed(1)}%</span>
                                          </div>
                                          <Progress value={cohortCollectionRate} className="h-2" />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    
    {/* Student Details Dialog */}
    {selectedRecord && (
      <RecordDetailsDialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setCurrentCohortStudentIds([])
          setCurrentStudentIndex(0)
        }}
        title={selectedRecord.name}
        subtitle={selectedRecord.id}
        avatarFallback={selectedRecord?.name ? selectedRecord.name.split(' ').map((p: string) => p[0]).join('').slice(0,2) : '👤'}
        status={{
          label: (() => {
            const rs = getRegistrationSummary(selectedRecord.registrationFees)
            const totalReg = rs?.totalAmount || 0
            const totalPaid = selectedRecord.totalPaidAmount || 0
            const overallDue = (selectedRecord.finalPayment || 0) + totalReg
            const overallBalance = Math.max(overallDue - totalPaid, 0)
            return overallDue <= 0 ? '-' : (overallBalance === 0 ? 'Paid' : 'Pending')
          })(),
          tone: (() => {
            const rs = getRegistrationSummary(selectedRecord.registrationFees)
            const totalReg = rs?.totalAmount || 0
            const totalPaid = selectedRecord.totalPaidAmount || 0
            const overallDue = (selectedRecord.finalPayment || 0) + totalReg
            const overallBalance = Math.max(overallDue - totalPaid, 0)
            const label = overallDue <= 0 ? '-' : (overallBalance === 0 ? 'Paid' : 'Pending')
            return label === 'Paid' ? 'success' : (label === '-' ? 'default' : 'warning')
          })() as "default" | "success" | "warning" | "danger" | "info"
        }}
        sections={sections}
        actions={
          currentCohortStudentIds.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigateToStudent('prev')
                }}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-orange-700 font-medium">
                Student {currentStudentIndex + 1} of {currentCohortStudentIds.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigateToStudent('next')
                }}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      />
    )}
  </>
  )
}
