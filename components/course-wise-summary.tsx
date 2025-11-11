"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react"

interface CohortPayment {
  cohort: string
  cohortId?: string
  students: number
  amount: number
  received: number
  outstanding: number
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
}

export function CourseWiseSummary({ coursePayments }: CourseWiseSummaryProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

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

  return (
    <Card className="border-purple-200">
      <CardHeader className="bg-purple-50 py-3">
        <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
          <BookOpen className="h-5 w-5" />
          Course-wise Payment Summary
        </CardTitle>
        <CardDescription className="text-purple-600 text-sm">Payment collection status by course</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{backgroundColor: '#f3f4f6'}}>
                <TableHead className="font-semibold text-xs p-3 text-left" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>CourseID</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-left" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Course Name</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Students</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Total Amount (INR)</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Received (INR)</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Outstanding (INR)</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Collection Rate</TableHead>
                <TableHead className="font-semibold text-xs p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Status</TableHead>
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
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-purple-25 ${hasCohorts ? 'cursor-pointer' : ''}`}
                      onClick={() => hasCohorts && toggleCourse(course.course)}
                    >
                      <TableCell className="font-medium text-xs p-3 text-left">
                        <div className="flex items-center gap-2">
                          {hasCohorts && (
                            <button className="p-0 hover:bg-purple-100 rounded">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-purple-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-purple-600" />
                              )}
                            </button>
                          )}
                          <BookOpen className="h-4 w-4 text-purple-500" />
                          {course.courseId}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-left">
                        <div className="flex items-center gap-2">
                          {course.program || course.course}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          {course.students}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(course.amount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <span className="font-medium text-green-600">{formatCurrency(course.received)}</span>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <span className={`font-medium ${course.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(course.outstanding)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        <div className="space-y-1">
                          <div className="flex justify-center text-xs">
                            <span>{collectionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={collectionRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-3 text-center">
                        {course.amount === 0 && course.received === 0 && course.outstanding === 0 ? (
                          <span className="text-gray-400 italic">-</span>
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
                          <div className="px-8 py-4">
                            <div className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Cohort-wise Breakdown
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b bg-purple-100/50">
                                  <TableHead className="font-semibold text-xs p-2 text-left text-purple-700">Cohort ID</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-left text-purple-700">Cohort</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-700">Students</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-700">Total Amount (INR)</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-700">Received (INR)</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-700">Outstanding (INR)</TableHead>
                                  <TableHead className="font-semibold text-xs p-2 text-center text-purple-700">Collection Rate</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {course.cohorts!.map((cohort, cohortIndex) => {
                                  const cohortCollectionRate = cohort.amount > 0 ? (cohort.received / cohort.amount) * 100 : 0
                                  return (
                                    <TableRow 
                                      key={cohort.cohort}
                                      className={`${cohortIndex % 2 === 0 ? "bg-white" : "bg-purple-50/30"}`}
                                    >
                                      <TableCell className="text-xs p-2 text-left font-medium text-purple-600">
                                        {cohort.cohortId || '-'}
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-left font-medium text-purple-900">
                                        {cohort.cohort || 'Unassigned'}
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Users className="h-3 w-3 text-gray-500" />
                                          {cohort.students}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-center">
                                        {formatCurrency(cohort.amount)}
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
                                            <span>{cohortCollectionRate.toFixed(1)}%</span>
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
  )
}
