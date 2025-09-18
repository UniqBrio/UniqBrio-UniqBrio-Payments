"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { PaymentHeader } from './payment-header'
import { PaymentSummaryCards } from './payment-summary-cards'
import { PaymentFilters } from './payment-filters'
import { PaymentLoadingState, PaymentErrorState } from './payment-states'
import { PaymentContent } from './payment-content'
import { CourseWisePaymentPopup } from './course-wise-payment-popup'
import { usePaymentLogic } from './use-payment-logic'
import { StudentManualPaymentPayload } from './student-manual-payment'

export function PaymentContainer() {
  const {
    searchTerm,
    setSearchTerm,
    statusFilters,
    setStatusFilters,
    categoryFilters,
    setCategoryFilters,
    courseFilters,
    setCourseFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredRecords,
    viewMode,
    setViewMode,
    records,
    columns,
    paymentSummary,
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <PaymentHeader
        records={records}
        onManualPayment={handleStudentManualPayment}
        onShowCourseSummary={() => setShowCourseWisePopup(true)}
      />

      {/* Summary Cards */}
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
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExport={handleExport}
        columns={columns}
        onColumnToggle={handleColumnToggle}
        records={records}
      />

      {/* Loading State */}
      {loading && <PaymentLoadingState />}

      {/* Error State */}
      {error && !loading && <PaymentErrorState error={error} />}

      {/* Payment Content */}
      {!loading && !error && (
        <PaymentContent
          filteredRecords={filteredRecords}
          viewMode={viewMode}
          isColumnVisible={isColumnVisible}
          onUpdateRecord={handleUpdateRecord}
        />
      )}

      {/* Course Summary Popup */}
      <CourseWisePaymentPopup
        open={showCourseWisePopup}
        onClose={() => setShowCourseWisePopup(false)}
        courseData={records}
      />
    </div>
  )
}