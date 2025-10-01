"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, AlertTriangle, BarChart3 } from "lucide-react"

import { PaymentRecord } from './payment-types'

interface CoursePayment {
  course: string
  batches: string[]  // Array of batch numbers
  amount: number
  students: number
  received: number
  outstanding: number
  registration: number
  currency: string
}

interface CourseWisePaymentPopupProps {
  open: boolean
  onClose: () => void
  courseData: PaymentRecord[]
}

export function CourseWisePaymentPopup({ open, onClose, courseData }: CourseWisePaymentPopupProps) {
  // Generate course summary from student records - group by course only
  const courseSummary = courseData.reduce((acc: CoursePayment[], record, index) => {
    // Generate dummy batch data if not present - cycle through Batch 1, 2, 3
    const batchNumber = record.batch?.replace('Batch ', '') || `${(index % 8) + 1}` // Generate batch numbers 1-8
    
    // Calculate total registration fees for this record
    const registrationTotal = (record.registrationFees?.studentRegistration || 0) + 
                             (record.registrationFees?.courseRegistration || 0) + 
                             (record.registrationFees?.confirmationFee || 0)
    
    // Calculate course fees and total amount (course fees + registration fees)
    const courseFees = Number(record.finalPayment) || 0
    const totalAmount = courseFees + registrationTotal
    const receivedAmount = Number(record.totalPaidAmount) || 0
    const outstandingAmount = totalAmount - receivedAmount
    
    const existingCourse = acc.find(c => c.course === record.activity)
    
    if (existingCourse) {
      // Add batch number if not already included
      if (!existingCourse.batches.includes(batchNumber)) {
        existingCourse.batches.push(batchNumber)
        existingCourse.batches.sort((a, b) => parseInt(a) - parseInt(b)) // Sort numerically
      }
      existingCourse.students += 1
      existingCourse.amount += totalAmount  // Now includes course fees + registration fees
      existingCourse.received += receivedAmount
      existingCourse.outstanding += outstandingAmount  // Calculated based on new total
      existingCourse.registration += registrationTotal
      // Keep existing currency or update to the first record's currency
      if (!existingCourse.currency) {
        existingCourse.currency = record.currency || "INR"
      }
    } else {
      acc.push({
        course: record.activity,
        batches: [batchNumber],
        students: 1,
        amount: totalAmount,  // Now includes course fees + registration fees
        received: receivedAmount,
        outstanding: outstandingAmount,  // Calculated based on new total
        registration: registrationTotal,
        currency: record.currency || "INR"
      })
    }
    
    return acc
  }, []).sort((a, b) => a.course.localeCompare(b.course))

  const formatCurrency = (amount: number, currency: string = "INR") => {
    // Ensure we have a valid number
    const numericAmount = isNaN(amount) ? 0 : amount
    
    // Format with thousand separators - just return the number without currency suffix
    const formattedNumber = new Intl.NumberFormat('en-IN').format(numericAmount)
    
    // Return format: "1,000" (currency indicated in column header)
    return formattedNumber
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <BookOpen className="h-5 w-5" />
            Course wise Payment Summary
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <div className="h-[60vh] overflow-y-auto rounded-md border border-purple-200">
            <Table>
              <TableHeader className="sticky top-0 z-10 shadow-sm" style={{backgroundColor: '#f3f4f6'}}>
                <TableRow className="border-b" style={{backgroundColor: '#f3f4f6'}}>
                  <TableHead className="font-semibold text-sm p-3 text-left" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Course</TableHead>
                  <TableHead className="font-semibold text-sm p-3 text-left" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Batch</TableHead>
                  <TableHead className="font-semibold text-sm p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Students</TableHead>
                  <TableHead className="font-semibold text-sm p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Total Amount (INR)</TableHead>
                  <TableHead className="font-semibold text-sm p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Received (INR)</TableHead>
                  <TableHead className="font-semibold text-sm p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Outstanding (INR)</TableHead>
                  <TableHead className="font-semibold text-sm p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Collection Rate</TableHead>
                  <TableHead className="font-semibold text-sm p-3 text-center" style={{color: '#828fa1', backgroundColor: '#f3f4f6'}}>Status</TableHead>
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
                      <TableCell className="font-medium text-sm p-3 text-left">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-purple-500" />
                          {course.course}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3 text-left">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Batch {course.batches.join(', ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          {course.students}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(course.amount, course.currency)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3 text-center">
                        <span className="font-medium text-green-600">
                          {formatCurrency(course.received, course.currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm p-3 text-center">
                        <span className={`font-medium ${course.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(course.outstanding, course.currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm p-3 text-center">
                        <div className="space-y-1">
                          <div className="flex justify-center text-sm">
                            <span>{collectionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-orange-500 rounded-full h-2 relative overflow-hidden">
                            <div 
                              className={`bg-[#9234ea] h-2 rounded-full transition-all duration-300 ${
                                collectionRate >= 100 ? 'w-full' :
                                collectionRate >= 90 ? 'w-[90%]' :
                                collectionRate >= 80 ? 'w-4/5' :
                                collectionRate >= 75 ? 'w-3/4' :
                                collectionRate >= 66 ? 'w-2/3' :
                                collectionRate >= 60 ? 'w-3/5' :
                                collectionRate >= 50 ? 'w-1/2' :
                                collectionRate >= 40 ? 'w-2/5' :
                                collectionRate >= 33 ? 'w-1/3' :
                                collectionRate >= 25 ? 'w-1/4' :
                                collectionRate >= 20 ? 'w-1/5' :
                                collectionRate >= 10 ? 'w-1/12' :
                                collectionRate > 0 ? 'w-1' : 'w-0'
                              }`}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm p-3 text-center">
                        {course.amount === 0 && course.received === 0 && course.outstanding === 0 ? (
                          <span className="text-gray-400 italic">-</span>
                        ) : course.outstanding === 0 ? (
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