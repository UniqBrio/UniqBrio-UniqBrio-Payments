"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, DollarSign, AlertTriangle, BarChart3 } from "lucide-react"

import { PaymentRecord } from './payment-types'

interface CoursePayment {
  course: string
  amount: number
  students: number
  received: number
  outstanding: number
}

interface CourseWisePaymentPopupProps {
  open: boolean
  onClose: () => void
  courseData: PaymentRecord[]
}

export function CourseWisePaymentPopup({ open, onClose, courseData }: CourseWisePaymentPopupProps) {
  // Generate course summary from student records
  const courseSummary = courseData.reduce((acc: CoursePayment[], record) => {
    const existingCourse = acc.find(c => c.course === record.activity)
    
    if (existingCourse) {
      existingCourse.students += 1
      existingCourse.amount += record.finalPayment
      existingCourse.received += record.totalPaidAmount
      existingCourse.outstanding += record.balancePayment
    } else {
      acc.push({
        course: record.activity,
        students: 1,
        amount: record.finalPayment,
        received: record.totalPaidAmount,
        outstanding: record.balancePayment
      })
    }
    
    return acc
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <BookOpen className="h-5 w-5" />
            Course-wise Payment Summary
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-y-auto">
          <div className="rounded-md border border-purple-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50 border-b">
                  <TableHead className="text-purple-700 font-semibold text-sm p-3">Course</TableHead>
                  <TableHead className="text-purple-700 font-semibold text-sm p-3">Students</TableHead>
                  <TableHead className="text-purple-700 font-semibold text-sm p-3">Total Amount</TableHead>
                  <TableHead className="text-purple-700 font-semibold text-sm p-3">Received</TableHead>
                  <TableHead className="text-purple-700 font-semibold text-sm p-3">Outstanding</TableHead>
                  <TableHead className="text-purple-700 font-semibold text-sm p-3">Collection Rate</TableHead>
                  <TableHead className="text-purple-700 font-semibold text-sm p-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseSummary.map((course, index) => {
                  const collectionRate = course.amount > 0 ? (course.received / course.amount) * 100 : 0
                  return (
                    <TableRow
                      key={course.course}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-purple-25`}
                    >
                      <TableCell className="font-medium text-sm p-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-purple-500" />
                          {course.course}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          {course.students}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-500" />
                          {formatCurrency(course.amount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3">
                        <span className="font-medium text-green-600">{formatCurrency(course.received)}</span>
                      </TableCell>
                      <TableCell className="text-sm p-3">
                        <span className={`font-medium ${course.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(course.outstanding)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm p-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{collectionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-orange-500 rounded-full h-2">
                            <div 
                              className="bg-[#9234ea] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(collectionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3">
                        {course.outstanding === 0 ? (
                          <Badge variant="default" className="bg-green-600 text-sm">
                            Complete
                          </Badge>
                        ) : collectionRate >= 50 ? (
                          <Badge variant="secondary" className="text-sm">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-sm">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}