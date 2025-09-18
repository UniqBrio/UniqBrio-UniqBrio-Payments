"use client"

import { useState } from "react"
import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText } from "lucide-react"

// Payment components
import { PaymentFilters } from './components/payment-filters'
import { PaymentSummaryCards } from './components/payment-summary-cards'
import { CourseWisePaymentPopup } from './components/course-wise-payment-popup'
import { StudentManualPayment, StudentManualPaymentPayload } from './components/student-manual-payment'
import { PayslipButton } from './components/payslip-button'
import { PaymentTable } from './components/payment-table'
import { PaymentGrid } from './components/payment-grid'
import { usePaymentLogic } from './components/use-payment-logic'
import { courseWisePayments } from './components/payment-data'

export default function PaymentStatusPage() {
  const {
    searchTerm,
    setSearchTerm,
    statusFilters,
    setStatusFilters,
    categoryFilters,
    setCategoryFilters,
    courseFilters,
    setCourseFilters,
    filteredRecords,
    viewMode,
    setViewMode,
    records,
    columns,
    paymentSummary,
    handleFilter,
    handleUpdateRecord,
    handleColumnToggle,
    isColumnVisible,
    handleExport,
    loading,
    error
  } = usePaymentLogic()

  const [showCourseWisePopup, setShowCourseWisePopup] = useState(false)

  const handleStudentManualPayment = async (payload: StudentManualPaymentPayload) => {
    const target = records.find((r) => r.id === payload.studentId)
    if (!target) return

    try {
      // TODO: Future implementation - Save payment to separate payments collection
      // const response = await fetch('/api/payments', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     studentId: payload.studentId,
      //     amount: payload.amount,
      //     date: payload.date,
      //     mode: payload.mode,
      //     notes: payload.notes
      //   })
      // })

      // if (response.ok) {
        // Update local state for UI
        const newTotalPaid = (target.totalPaidAmount || 0) + payload.amount
        const newBalance = Math.max(0, target.finalPayment - newTotalPaid)
        const newStatus = newBalance === 0 ? "Paid" : newTotalPaid > 0 ? "Partial" : target.paymentStatus
        
        handleUpdateRecord(payload.studentId, {
          totalPaidAmount: newTotalPaid,
          balancePayment: newBalance,
          paidDate: payload.date,
          paymentStatus: newStatus,
        })

        toast({
          title: "Payment Recorded",
          description: `Payment of ${payload.amount} recorded for ${target.name}`,
        })
      // } else {
      //   throw new Error('Failed to save payment')
      // }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive"
      })
    }
  }


  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">Track student payments, send reminders, and manage financial records</p>
          </div>
          <div className="flex gap-2">
            <StudentManualPayment 
              students={records}
              onSubmit={handleStudentManualPayment}
            />
            <PayslipButton students={records} />
            <Button
              onClick={() => setShowCourseWisePopup(true)}
              className="bg-[#9234ea] hover:bg-[#9234ea]/90"
            >
              <FileText className="h-4 w-4 mr-2" />
              Course Summary
            </Button>
          </div>
        </div>

        {/* Payment Summary Cards */}
        <PaymentSummaryCards summary={paymentSummary} />

        {/* Filters */}
        <PaymentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilters={statusFilters}
          setStatusFilters={setStatusFilters}
          categoryFilters={categoryFilters}
          setCategoryFilters={setCategoryFilters}
          courseFilters={courseFilters}
          setCourseFilters={setCourseFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExport={handleExport}
          columns={columns}
          onColumnToggle={handleColumnToggle}
          records={records}
        />

        {/* Loading and Error States */}
        {loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-600 rounded-full" />
              <p className="mt-2 text-gray-600">Loading student payment data from database...</p>
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-2">⚠️ {error}</p>
              <p className="text-gray-600">Please check your database connection and ensure the Students collection exists.</p>
            </CardContent>
          </Card>
        )}

        {/* Payment View - Grid or Table */}
        {!loading && !error && (
          <>
            {filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">No student payment records found in the database.</p>
                  <p className="text-sm text-gray-500 mt-2">Add student data to the "Students" collection to see payment records here.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <PaymentGrid
                    filteredRecords={filteredRecords}
                    onUpdateRecord={handleUpdateRecord}
                  />
                ) : (
                  <PaymentTable
                    filteredRecords={filteredRecords}
                    isColumnVisible={isColumnVisible}
                    onUpdateRecord={handleUpdateRecord}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Course Wise Payment Popup */}
        <CourseWisePaymentPopup
          open={showCourseWisePopup}
          onClose={() => setShowCourseWisePopup(false)}
          courseData={records}
        />
      </div>
    </MainLayout>
  )
}