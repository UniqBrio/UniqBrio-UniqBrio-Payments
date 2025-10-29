"use client"

import { useState, useRef } from "react"
import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText, LayoutDashboard, CreditCard } from "lucide-react"

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
    priceRange,
    setPriceRange,
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
    hasLoadedOnce,
    lastAutoRefresh,
    autoRefreshIntervalMs
  } = usePaymentLogic()

  const [showCourseWisePopup, setShowCourseWisePopup] = useState(false)
  const [showCourseMatching, setShowCourseMatching] = useState(false)
  const [activeTab, setActiveTab] = useState<'Analytics' | 'Payments'>('Payments')

  // Selected rows state lifted up
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Auto-refresh handled centrally inside usePaymentLogic now

  // Export logic using selectedRows and filteredRecords
  // escapeCSV: Escapes values for CSV export
  function escapeCSV(val: any) {
    if (val == null) return '';
    
    if (typeof val === 'object') {
      return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
    }
    
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
  // handleExportSelectedRows: Exports selected payment records as CSV
  function handleExportSelectedRows() {
    try {
      const filteredRecords = filteredRecordsRef.current || [];
      const selected = selectedRows.length > 0 
        ? filteredRecords.filter(r => selectedRows.includes(r.id))
        : filteredRecords; // Export all if none selected
      
      console.log('Export triggered - Records:', selected.length, 'Selected rows:', selectedRows.length);
      
      // Debug: Log sample data to identify corruption
      if (selected.length > 0) {
        console.log('Sample record for debugging:', {
          id: selected[0].id,
          name: selected[0].name,
          finalPayment: selected[0].finalPayment,
          totalPaidAmount: selected[0].totalPaidAmount,
          balancePayment: selected[0].balancePayment,
          category: selected[0].category,
          courseType: selected[0].courseType
        });
      }
      
      if (selected.length === 0) {
        toast({
          title: "No Data to Export",
          description: "No records found to export. Please ensure there are payment records available.",
          variant: "destructive",
        });
        return;
      }

    // Map column keys to actual PaymentRecord field names and human-readable headers
    const columnMapping = [
      { key: 'id', field: 'id', header: 'Student ID' },
      { key: 'name', field: 'name', header: 'Student Name' },
      { key: 'program', field: 'program', header: 'Program' },
      { key: 'course', field: 'activity', header: 'Course' },
      { key: 'category', field: 'category', header: 'Category' },
      { key: 'courseType', field: 'courseType', header: 'Course Type' },
      { key: 'courseRegFee', field: 'registrationFees.courseRegistration', header: 'Course Registration Fee' },
      { key: 'studentRegFee', field: 'registrationFees.studentRegistration', header: 'Student Registration Fee' },
      { key: 'finalPayment', field: 'finalPayment', header: 'Course Fee' },
      { key: 'totalPaid', field: 'totalPaidAmount', header: 'Total Paid' },
      { key: 'balance', field: 'balancePayment', header: 'Balance' },
      { key: 'status', field: 'paymentStatus', header: 'Status' },
      { key: 'paidDate', field: 'paidDate', header: 'Paid Date' },
      { key: 'reminder', field: 'paymentReminder', header: 'Reminder' },
      { key: 'batch', field: 'batch', header: 'Batch' },
      { key: 'instructor', field: 'instructor', header: 'Instructor' },
      { key: 'cohort', field: 'cohort', header: 'Cohort' },
      { key: 'nextPaymentDate', field: 'nextPaymentDate', header: 'Next Payment Date' },
      { key: 'paymentFrequency', field: 'paymentFrequency', header: 'Payment Frequency' },
      { key: 'currency', field: 'currency', header: 'Currency' },
      { key: 'communicationText', field: 'communicationText', header: 'Communication Text' },
      { key: 'courseStartDate', field: 'courseStartDate', header: 'Course Start Date' },
      { key: 'studentType', field: 'studentType', header: 'Student Type' },
      { key: 'paymentCategory', field: 'paymentCategory', header: 'Payment Category' },
      { key: 'classSchedule', field: 'classSchedule', header: 'Class Schedule' },
      { key: 'enrolledCourse', field: 'enrolledCourse', header: 'Enrolled Course' },
      { key: 'emiSplit', field: 'emiSplit', header: 'EMI Split' },
      { key: 'paymentModes', field: 'paymentModes', header: 'Payment Modes' }
    ];

    // Get only visible columns based on column configuration
    const visibleColumns = columnMapping.filter(col => isColumnVisible(col.key));
    
    // Create CSV header - ensure clean headers
    const header = visibleColumns.map(col => escapeCSV(col.header)).join(',');
    
    // Create CSV rows
    const rows = selected.map(row => 
      visibleColumns.map(col => {
        let value;
        
        // Handle nested fields (like registrationFees)
        if (col.field.includes('.')) {
          const [parent, child] = col.field.split('.');
          if (parent === 'registrationFees' && row.registrationFees) {
            const regData = (row.registrationFees as any)[child];
            if (regData && regData.amount !== undefined) {
              // Clean only the amount value, preserve status text
              let amountValue = regData.amount;
              if (typeof amountValue === 'string') {
                amountValue = amountValue.replace(/^[a-zA-Z,]+\s*/, ''); // Remove unwanted prefixes
                amountValue = amountValue.replace(/[₹$€£¥]/g, ''); // Remove currency symbols
              }
              const amount = typeof amountValue === 'number' ? amountValue : parseFloat(String(amountValue).replace(/[^\d.-]/g, '')) || 0;
              value = `${amount}${regData.paid ? ' (Paid)' : ' (Pending)'}`;
            } else {
              value = 'N/A';
            }
          } else {
            value = 'N/A';
          }
        } else {
          // Handle direct fields
          let fieldValue = (row as any)[col.field];
          
          // Format specific field types
          if (col.field === 'finalPayment' || col.field === 'totalPaidAmount' || col.field === 'balancePayment') {
            // Only clean financial fields - remove unwanted prefixes and currency symbols
            if (typeof fieldValue === 'string') {
              fieldValue = fieldValue.replace(/^[a-zA-Z,]+\s*/, ''); // Remove unwanted prefixes like "a,"
              fieldValue = fieldValue.replace(/[₹$€£¥]/g, ''); // Remove currency symbols
            }
            const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(String(fieldValue).replace(/[^\d.-]/g, '')) || 0;
            value = numValue.toString();
          } else if (col.field === 'paymentReminder') {
            value = fieldValue ? 'Yes' : 'No';
          } else if (col.field === 'paidDate' || col.field === 'nextPaymentDate' || col.field === 'courseStartDate') {
            value = fieldValue ? new Date(fieldValue).toLocaleDateString() : '';
          } else if (col.field === 'paymentModes') {
            value = Array.isArray(fieldValue) ? fieldValue.join(', ') : (fieldValue || '');
          } else if (col.field === 'emiSplit') {
            value = fieldValue ? fieldValue.toString() : '';
          } else {
            // For non-financial fields, preserve original data
            value = fieldValue !== null && fieldValue !== undefined ? String(fieldValue).trim() : '';
          }
        }
        
        return escapeCSV(value);
      }).join(',')
    );

    const csv = [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `${selected.length} records exported to CSV file.`,
    });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Keep a ref to filteredRecords for export
  const filteredRecordsRef = useRef(filteredRecords);
  filteredRecordsRef.current = filteredRecords;

  // Only show status code if needed; removed verbose console log

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

        {/* Tabs before content */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'Analytics' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('Analytics')}
            type="button"
            aria-pressed={activeTab === 'Analytics'}
          >
            <span className="tab__icon"><LayoutDashboard className="h-5 w-5" /></span>
            <span>Analytics</span>
          </button>
          <button
            className={`tab ${activeTab === 'Payments' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('Payments')}
            type="button"
            aria-pressed={activeTab === 'Payments'}
          >
            <span className="tab__icon"><CreditCard className="h-5 w-5" /></span>
            <span>Payments</span>
          </button>
        </div>

        {/* Analytics tab: show only the three summary cards */}
        {activeTab === 'Analytics' && (
          <PaymentSummaryCards summary={paymentSummary} />
        )}

        {/* Payments tab: filters and the rest of the features */}
        {activeTab === 'Payments' && (
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
            priceRange={priceRange}
            setPriceRange={setPriceRange}
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
        )}

        {/* Loading and Error States */}
        {activeTab === 'Payments' && loading && !hasLoadedOnce && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-600 rounded-full" />
              <p className="mt-2 text-gray-600">Loading student payment data from database...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'Payments' && error && !loading && (
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
        {activeTab === 'Payments' && (hasLoadedOnce || !loading) && !error && (
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
                      refreshPaymentData={refreshPaymentData}
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