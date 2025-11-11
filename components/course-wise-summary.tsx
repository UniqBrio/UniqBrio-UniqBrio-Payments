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
                      <TableRow key={`${course.course}-cohorts`} className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-400">
                        <TableCell colSpan={8} className="p-0">
                          <div className="px-8 py-4 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 rounded-lg m-2 border border-purple-200 shadow-sm">
                            <div className="text-sm font-bold text-purple-800 mb-4 flex items-center gap-2 pb-2 border-b-2 border-purple-300">
                              <Users className="h-5 w-5" />
                              <span>Cohort-wise Breakdown for {course.program}</span>
                            </div>
                            <div className="bg-white rounded-md border border-purple-200 overflow-hidden shadow-sm">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-b-2 border-purple-300 bg-gradient-to-r from-purple-100 to-indigo-100">
                                    <TableHead className="font-bold text-xs p-3 text-left text-purple-800 bg-purple-100/50">Cohort ID</TableHead>
                                    <TableHead className="font-bold text-xs p-3 text-left text-purple-800 bg-purple-100/50">Cohort Name</TableHead>
                                    <TableHead className="font-bold text-xs p-3 text-center text-purple-800 bg-purple-100/50">Students</TableHead>
                                    <TableHead className="font-bold text-xs p-3 text-center text-purple-800 bg-purple-100/50">Total Amount (INR)</TableHead>
                                    <TableHead className="font-bold text-xs p-3 text-center text-purple-800 bg-purple-100/50">Received (INR)</TableHead>
                                    <TableHead className="font-bold text-xs p-3 text-center text-purple-800 bg-purple-100/50">Outstanding (INR)</TableHead>
                                    <TableHead className="font-bold text-xs p-3 text-center text-purple-800 bg-purple-100/50">Collection Rate</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {course.cohorts!.map((cohort, cohortIndex) => {
                                    const cohortCollectionRate = cohort.amount > 0 ? (cohort.received / cohort.amount) * 100 : 0
                                    return (
                                      <TableRow 
                                        key={cohort.cohort}
                                        className={`${cohortIndex % 2 === 0 ? "bg-white hover:bg-purple-50/30" : "bg-purple-50/20 hover:bg-purple-50/40"} transition-colors border-l-2 ${cohortIndex % 2 === 0 ? 'border-purple-300' : 'border-indigo-300'}`}
                                      >
                                        <TableCell className="text-xs p-3 text-left font-semibold text-purple-700">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            {cohort.cohortId || '-'}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-xs p-3 text-left font-semibold text-gray-800">
                                          {cohort.cohort || 'Unassigned'}
                                        </TableCell>
                                        <TableCell className="text-xs p-3 text-center">
                                          <div className="flex items-center justify-center gap-1 bg-blue-50 rounded-full px-2 py-1 inline-flex">
                                            <Users className="h-3 w-3 text-blue-600" />
                                            <span className="font-medium text-blue-700">{cohort.students}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-xs p-3 text-center font-medium text-gray-700">
                                          {formatCurrency(cohort.amount)}
                                        </TableCell>
                                        <TableCell className="text-xs p-3 text-center">
                                          <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                            {formatCurrency(cohort.received)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-xs p-3 text-center">
                                          <span className={`font-bold px-2 py-1 rounded ${cohort.outstanding > 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>
                                            {formatCurrency(cohort.outstanding)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-xs p-3 text-center">
                                          <div className="space-y-1">
                                            <div className="flex justify-center text-xs font-bold text-purple-700">
                                              <span>{cohortCollectionRate.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={cohortCollectionRate} className="h-2 bg-purple-100" />
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
  )
}
