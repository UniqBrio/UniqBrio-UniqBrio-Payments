"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, DollarSign, AlertTriangle } from "lucide-react"

interface CoursePayment {
  course: string
  amount: number
  students: number
  received: number
  outstanding: number
}

interface CourseWiseSummaryProps {
  coursePayments: CoursePayment[]
}

export function CourseWiseSummary({ coursePayments }: CourseWiseSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
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
              <TableRow className="bg-white border-b">
                <TableHead className="text-black font-semibold text-xs p-3">Course</TableHead>
                <TableHead className="text-black font-semibold text-xs p-3">Students</TableHead>
                <TableHead className="text-black font-semibold text-xs p-3">Total Amount</TableHead>
                <TableHead className="text-black font-semibold text-xs p-3">Received</TableHead>
                <TableHead className="text-black font-semibold text-xs p-3">Outstanding</TableHead>
                <TableHead className="text-black font-semibold text-xs p-3">Collection Rate</TableHead>
                <TableHead className="text-black font-semibold text-xs p-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coursePayments.map((course, index) => {
                const collectionRate = (course.received / course.amount) * 100
                return (
                  <TableRow
                    key={course.course}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-purple-25`}
                  >
                    <TableCell className="font-medium text-xs p-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        {course.course}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs p-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        {course.students}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs p-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-500" />
                        {formatCurrency(course.amount)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs p-3">
                      <span className="font-medium text-green-600">{formatCurrency(course.received)}</span>
                    </TableCell>
                    <TableCell className="text-xs p-3">
                      <span className={`font-medium ${course.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(course.outstanding)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs p-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{collectionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={collectionRate} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs p-3">
                      {course.outstanding === 0 ? (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          Complete
                        </Badge>
                      ) : collectionRate >= 50 ? (
                        <Badge variant="secondary" className="text-xs">
                          Partial
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
