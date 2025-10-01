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
import { PaymentTable } from './components/payment-table'
import { PaymentGrid } from './components/payment-grid'
import { usePaymentLogic } from './components/use-payment-logic'
import CourseMatchingComponent from '@/components/course-matching'

// PaymentStatusPage: Main payment management page
export default function PaymentStatusPage() {
  const {
    searchTerm,
    setSearchTerm,
    statusFilters,
    setStatusFilters,
    categoryFilters,
    setCategoryFilters,
    paymentCategoryFilters,
    setPaymentCategoryFilters,
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
    refreshPaymentData,
    handleColumnToggle,
    isColumnVisible,
    handleExport,
    loading,
    error,
    lastAutoRefresh,
    autoRefreshIntervalMs
  } = usePaymentLogic()

  const [showCourseWisePopup, setShowCourseWisePopup] = useState(false)
  const [showCourseMatching, setShowCourseMatching] = useState(false)

  // Selected rows state lifted up
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Auto-refresh handled centrally inside usePaymentLogic now

  // Export logic using selectedRows and filteredRecords
  // escapeCSV: Escapes values for CSV export
  function escapeCSV(val: any, key?: string) {
    if (val == null) return '';
    
    // Handle special case for registration fees
    if (key === 'registration' && typeof val === 'object' && val.registrationFees) {
      const regFees = val.registrationFees;
      const studentReg = regFees.studentRegistration ? `Student: ₹${regFees.studentRegistration.amount}${regFees.studentRegistration.paid ? ' (Paid)' : ''}` : '';
      const courseReg = regFees.courseRegistration ? `Course: ₹${regFees.courseRegistration.amount}${regFees.courseRegistration.paid ? ' (Paid)' : ''}` : '';
      const confirmation = regFees.confirmationFee ? `Confirmation: ₹${regFees.confirmationFee.amount}${regFees.confirmationFee.paid ? ' (Paid)' : ''}` : '';
      return [studentReg, courseReg, confirmation].filter(Boolean).join('; ');
    }
    
    if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
  // handleExportSelectedRows: Exports selected payment records as CSV
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
      visibleKeys.map(key => {
        const value = key === 'registration' ? row : (row as any)[key];
        return escapeCSV(value, key);
      }).join(',')
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

  console.log("Filtered Records:", filteredRecords);

  return (
    <MainLayout>
      <div className="space-y-6 payments-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">Track student payments, send reminders, and manage financial records</p>
          </div>
          <div className="flex gap-2">
            <div className="tooltip-container">
              <Button
                onClick={() => setShowCourseWisePopup(true)}
                className="bg-[#9234ea] hover:bg-[#9234ea]/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                Course-wise Summary
              </Button>
              <div className="tooltip">Course-wise Summary</div>
            </div>
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
          paymentCategoryFilters={paymentCategoryFilters}
          setPaymentCategoryFilters={setPaymentCategoryFilters}
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
          filteredRecords={filteredRecords}
          totalRecords={records}
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

        {/* Course Matching Section
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Course-Student Matching System
              <Button 
                variant="outline" 
                onClick={() => setShowCourseMatching(!showCourseMatching)}
              >
                {showCourseMatching ? 'Hide' : 'Show'} Course Matching
              </Button>
            </CardTitle>
          </CardHeader>
          {showCourseMatching && (
            <CardContent>
              <CourseMatchingComponent />
            </CardContent>
          )}
        </Card> */}

        {/* Payment View - Grid or Table */}
        {!loading && !error && (
          <div className="w-full bg-white shadow-md rounded-lg p-4" data-payment-container>
            {filteredRecords.length === 0 ? (
              <Card className="w-full">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">No student payment records found in the database.</p>
                  <p className="text-sm text-gray-500 mt-2">Add student data to the "Students" collection to see payment records here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full">
                {viewMode === "grid" ? (
                  <div className="w-full">
                    <PaymentGrid
                      filteredRecords={filteredRecords}
                      onUpdateRecord={handleUpdateRecord}
                    />
                  </div>
                ) : (
                  <div className="w-full">
                    <PaymentTable
                      filteredRecords={filteredRecords}
                      isColumnVisible={isColumnVisible}
                      onUpdateRecord={handleUpdateRecord}
                      refreshPaymentData={refreshPaymentData}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
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