"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Info, DollarSign, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react"

interface FeeMatchingDetails {
  studentDetails: {
    id: string
    name: string
    activity: string | null
    program: string | null
    category: string | null
    courseStartDate: string | null
  }
  matchedCourse: {
    courseId: string
    name: string
    level: string
    type: string
    priceINR: number
    schedulePeriod: string
    sessionDetails: string
  } | null
  feeResult: number
  matchStatus: string
  levelAlignment: string
  commonFactors: string[]
  feeLog: string[]
  logSummary: string
}

interface FeeMatchingDisplayProps {
  feeMatching: FeeMatchingDetails
  finalPayment: number
}

export function FeeMatchingDisplay({ feeMatching, finalPayment }: FeeMatchingDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case 'EXACT_COURSE_ID':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Exact Course ID Match</Badge>
      case 'EXACT_NAME':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Exact Name Match</Badge>
      case 'PARTIAL_NAME':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Partial Name Match</Badge>
      case 'NAME_LEVEL_COMBO':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Name + Level Match</Badge>
      case 'NO_MATCH':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">No Match Found</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Unknown</Badge>
    }
  }

  const getLevelAlignmentBadge = (alignment: string) => {
    switch (alignment) {
      case 'EXACT_MATCH':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle className="w-3 h-3 mr-1" />Perfect Match</Badge>
      case 'PARTIAL_MATCH':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Partial Match</Badge>
      case 'MISMATCH':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><XCircle className="w-3 h-3 mr-1" />Mismatch</Badge>
      case 'MISSING_DATA':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200"><Info className="w-3 h-3 mr-1" />Missing Data</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Eye className="h-4 w-4" />
          <span className="sr-only">View fee matching details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Matching Analysis: {feeMatching.studentDetails.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Student Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🎓 Student Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Student ID:</strong> {feeMatching.studentDetails.id}
                  </div>
                  <div>
                    <strong>Name:</strong> {feeMatching.studentDetails.name}
                  </div>
                  <div>
                    <strong>Activity/Course:</strong> {feeMatching.studentDetails.activity || 'Not specified'}
                  </div>
                  <div>
                    <strong>Program:</strong> {feeMatching.studentDetails.program || 'Not specified'}
                  </div>
                  <div>
                    <strong>Category/Level:</strong> {feeMatching.studentDetails.category || 'Not specified'}
                  </div>
                  <div>
                    <strong>Course Start Date:</strong> {feeMatching.studentDetails.courseStartDate ? new Date(feeMatching.studentDetails.courseStartDate).toLocaleDateString() : 'Not specified'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🔍 Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <span><strong>Match Status:</strong></span>
                  {getMatchStatusBadge(feeMatching.matchStatus)}
                </div>
                <div className="flex items-center gap-4">
                  <span><strong>Level Alignment:</strong></span>
                  {getLevelAlignmentBadge(feeMatching.levelAlignment)}
                </div>
              </CardContent>
            </Card>

            {/* Matched Course Details */}
            {feeMatching.matchedCourse ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📚 Matched Course Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Course ID:</strong> {feeMatching.matchedCourse.courseId}
                    </div>
                    <div>
                      <strong>Course Name:</strong> {feeMatching.matchedCourse.name}
                    </div>
                    <div>
                      <strong>Level:</strong> {feeMatching.matchedCourse.level || 'Not specified'}
                    </div>
                    <div>
                      <strong>Type:</strong> {feeMatching.matchedCourse.type || 'Not specified'}
                    </div>
                    <div>
                      <strong>Price:</strong> <span className="text-lg font-semibold text-green-600">{formatCurrency(feeMatching.matchedCourse.priceINR || 0)}</span>
                    </div>
                    <div>
                      <strong>Schedule Period:</strong> {feeMatching.matchedCourse.schedulePeriod || 'Not specified'}
                    </div>
                  </div>
                  {feeMatching.matchedCourse.sessionDetails && (
                    <div className="mt-4">
                      <strong>Session Details:</strong>
                      <p className="text-sm text-gray-600 mt-1">{feeMatching.matchedCourse.sessionDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                    ❌ No Course Match Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    No matching course could be found for the student's activity: "{feeMatching.studentDetails.activity}"
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Common Factors */}
            {feeMatching.commonFactors && feeMatching.commonFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔗 Common Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {feeMatching.commonFactors.map((factor, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Fee Result */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💰 Fee Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-green-600">
                    {feeMatching.feeResult > 0 ? formatCurrency(feeMatching.feeResult) : '-'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Final Payment Amount
                  </div>
                  {feeMatching.feeResult !== finalPayment && (
                    <Badge variant="secondary" className="mt-2">
                      Note: Display shows {formatCurrency(finalPayment)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fee Finding Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📋 Fee Finding Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-1 font-mono text-sm">
                    {feeMatching.feeLog.map((logEntry, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded border-l-2 border-gray-200">
                        {logEntry}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}