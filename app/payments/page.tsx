"use client"

import { useState, useRef } from "react"
import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText } from "lucide-react"

// Payment components
import { PaymentFilters } from './components/payment-filters'
import { TooltipButton } from './components/tooltip-button'
import { PaymentSummaryCards } from './components/payment-summary-cards'
import { CourseWisePaymentPopup } from './components/course-wise-payment-popup'
import { StudentManualPayment, StudentManualPaymentPayload } from './components/student-manual-payment'
import { PayslipButton } from './components/payslip-button'
import { PaymentTable } from './components/payment-table'
import { PaymentGrid } from './components/payment-grid'
import { usePaymentLogic } from './components/use-payment-logic'

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



  // Selected rows state lifted up
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Export logic using selectedRows and filteredRecords
  function escapeCSV(val: any) {
    if (val == null) return '';
    if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
  function handleExportSelectedRows() {
    const filteredRecords = filteredRecordsRef.current || [];
    const selected = filteredRecords.filter(r => selectedRows.includes(r.id));
    if (selected.length === 0) return;
    // Only export columns that are visible in the table, in the same order
    const allKeys = [
      'id','name','course','category','courseType','registration','finalPayment','totalPaid','balance','status','frequency','paidDate','nextDue','reminder','mode','communication','paymentDetails','actions'
    ];
    const visibleKeys = allKeys.filter(isColumnVisible);
    const header = visibleKeys.join(',');
    const rows = selected.map(row =>
      visibleKeys.map(key => escapeCSV((row as any)[key])).join(',')
    );
    const csv = [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Keep a ref to filteredRecords for export
  const filteredRecordsRef = useRef(filteredRecords);
  filteredRecordsRef.current = filteredRecords;

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
            <TooltipButton tooltip="Manual Payment">
              <span>
                <StudentManualPayment 
                  students={records}
                  onSubmit={handleStudentManualPayment}
                />
              </span>
            </TooltipButton>
            <TooltipButton tooltip="Generate Payslip">
              <span>
                <PayslipButton 
                  students={records} 
                />
              </span>
            </TooltipButton>
            <TooltipButton tooltip="Course Wise Summary">
              <span>
                <Button
                  onClick={() => setShowCourseWisePopup(true)}
                  className="bg-[#9234ea] hover:bg-[#9234ea]/90 border border-gray-300 rounded-md shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Course Summary
                </Button>
              </span>
            </TooltipButton>
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
          onExport={handleExportSelectedRows}
          columns={columns}
          onColumnToggle={handleColumnToggle}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
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
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
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