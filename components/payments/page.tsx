"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText, LayoutDashboard, CreditCard } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// Payment components
import { PaymentFilters } from './components/payment-filters'
import { TooltipButton } from './components/tooltip-button'
import { PaymentSummaryCards } from './components/payment-summary-cards'
import { CourseWisePaymentPopup } from './components/course-wise-payment-popup'
import { PaymentTable } from './components/payment-table'
import { PaymentGrid } from './components/payment-grid'
import { usePaymentLogic } from './components/use-payment-logic'
import { PaymentsAnalytics } from './components/payments-analytics'
import CourseMatchingComponent from '@/components/course-matching'
import { CourseWiseSummary } from '@/components/course-wise-summary'
import { generateCourseWiseSummaryWithCohorts } from '@/lib/course-cohort-utils'

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
  // Default to Analytics tab on initial load so analytics is shown first
  const [activeTab, setActiveTab] = useState<'Analytics' | 'Payments' | 'CourseCohort'>('Analytics')

  // Selected rows state lifted up
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Course & Cohort tab filters
  const [courseSearch, setCourseSearch] = useState('')
  const [courseSortBy, setCourseSortBy] = useState<'name' | 'students' | 'amount' | 'received' | 'outstanding' | 'rate'>('name')
  const [courseSortOrder, setCourseSortOrder] = useState<'asc' | 'desc'>('asc')

  // Generate course summary with cohort breakdown
  const courseSummaryWithCohorts = useMemo(
    () => generateCourseWiseSummaryWithCohorts(records),
    [records]
  )

  // Filtered and sorted course summary
  const filteredCourseSummary = useMemo(() => {
    let filtered = [...courseSummaryWithCohorts]

    // Apply search filter
    if (courseSearch.trim()) {
      const searchLower = courseSearch.toLowerCase()
      filtered = filtered.filter(course => 
        course.course.toLowerCase().includes(searchLower) ||
        course.program.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (courseSortBy) {
        case 'name':
          aVal = a.course.toLowerCase()
          bVal = b.course.toLowerCase()
          break
        case 'students':
          aVal = a.students
          bVal = b.students
          break
        case 'amount':
          aVal = a.amount
          bVal = b.amount
          break
        case 'received':
          aVal = a.received
          bVal = b.received
          break
        case 'outstanding':
          aVal = a.outstanding
          bVal = b.outstanding
          break
        case 'rate':
          aVal = a.amount > 0 ? (a.received / a.amount) * 100 : 0
          bVal = b.amount > 0 ? (b.received / b.amount) * 100 : 0
          break
        default:
          return 0
      }

      if (typeof aVal === 'string') {
        return courseSortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }
      
      return courseSortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return filtered
  }, [courseSummaryWithCohorts, courseSearch, courseSortBy, courseSortOrder])

  // Export course summary to CSV
  const handleExportCourseSummary = () => {
    try {
      const headers = [
        'Course ID',
        'Course Name',
        'Program',
        'Students',
        'Total Amount (INR)',
        'Received (INR)',
        'Outstanding (INR)',
        'Collection Rate (%)',
        'Status',
        'Cohort',
        'Cohort Students',
        'Cohort Amount (INR)',
        'Cohort Received (INR)',
        'Cohort Outstanding (INR)',
        'Cohort Rate (%)'
      ]

      const rows: string[] = []
      
      filteredCourseSummary.forEach(course => {
        const collectionRate = course.amount > 0 ? ((course.received / course.amount) * 100).toFixed(2) : '0.00'
        const status = course.outstanding === 0 ? 'Complete' : 
                      collectionRate >= '50' ? 'Partial' : 'Pending'
        
        const courseId = course.course.replace(/\s+/g, '').substring(0, 8).toUpperCase()
        
        if (course.cohorts && course.cohorts.length > 0) {
          // Export with cohort breakdown
          course.cohorts.forEach(cohort => {
            const cohortRate = cohort.amount > 0 ? ((cohort.received / cohort.amount) * 100).toFixed(2) : '0.00'
            rows.push([
              escapeCSV(courseId),
              escapeCSV(course.course),
              escapeCSV(course.program),
              course.students,
              course.amount,
              course.received,
              course.outstanding,
              collectionRate,
              status,
              escapeCSV(cohort.cohort),
              cohort.students,
              cohort.amount,
              cohort.received,
              cohort.outstanding,
              cohortRate
            ].join(','))
          })
        } else {
          // Export without cohort breakdown
          rows.push([
            escapeCSV(courseId),
            escapeCSV(course.course),
            escapeCSV(course.program),
            course.students,
            course.amount,
            course.received,
            course.outstanding,
            collectionRate,
            status,
            '', '', '', '', '', ''
          ].join(','))
        }
      })

      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `course-cohort-summary-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast({
        title: "Export Successful",
        description: `Exported ${filteredCourseSummary.length} courses with cohort details`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export course summary",
        variant: "destructive"
      })
    }
  }

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
        ? filteredRecords.filter(r => selectedRows.includes(`${r.id}::${r.matchedCourseId || r.activity || r.enrolledCourse || 'NA'}`))
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
        </div>

        {/* Tabs before content (shared UI tabs with pill styling) */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'Analytics' | 'Payments' | 'CourseCohort')}>
          <TabsList className="mb-2 grid grid-cols-3 gap-4 w-full">
            <TabsTrigger value="Analytics" className="w-full">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="Payments" className="w-full">
              <CreditCard className="h-5 w-5 mr-2" />
              Student-wise
            </TabsTrigger>
            <TabsTrigger value="CourseCohort" className="w-full">
              <FileText className="h-5 w-5 mr-2" />
              Course & Cohort
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Analytics tab: comprehensive analytics dashboard */}
        {activeTab === 'Analytics' && (
          <PaymentsAnalytics records={records} />
        )}

        {/* Course & Cohort tab: course-wise summary with cohort breakdown */}
        {activeTab === 'CourseCohort' && (
          <div className="space-y-4">
            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Total Courses</p>
                      <p className="text-2xl font-bold text-purple-900">{filteredCourseSummary.length}</p>
                    </div>
                    <div className="bg-purple-200 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Students</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {filteredCourseSummary.reduce((sum, c) => sum + c.students, 0)}
                      </p>
                    </div>
                    <div className="bg-blue-200 p-3 rounded-full">
                      <svg className="h-6 w-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Received</p>
                      <p className="text-2xl font-bold text-green-900">
                        ₹{new Intl.NumberFormat('en-IN').format(filteredCourseSummary.reduce((sum, c) => sum + c.received, 0))}
                      </p>
                    </div>
                    <div className="bg-green-200 p-3 rounded-full">
                      <svg className="h-6 w-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Outstanding</p>
                      <p className="text-2xl font-bold text-red-900">
                        ₹{new Intl.NumberFormat('en-IN').format(filteredCourseSummary.reduce((sum, c) => sum + c.outstanding, 0))}
                      </p>
                    </div>
                    <div className="bg-red-200 p-3 rounded-full">
                      <svg className="h-6 w-6 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search, Filter, Sort, and Export Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="flex-1 w-full md:w-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by course name or program..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      {courseSearch && (
                        <button
                          onClick={() => setCourseSearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Clear search"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
                    <select
                      value={courseSortBy}
                      onChange={(e) => setCourseSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="name">Course Name</option>
                      <option value="students">Students</option>
                      <option value="amount">Total Amount</option>
                      <option value="received">Received</option>
                      <option value="outstanding">Outstanding</option>
                      <option value="rate">Collection Rate</option>
                    </select>

                    <button
                      onClick={() => setCourseSortOrder(courseSortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={courseSortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                    >
                      {courseSortOrder === 'asc' ? (
                        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* Export Button */}
                    <Button
                      onClick={handleExportCourseSummary}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      title="Export to CSV"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </Button>
                  </div>
                </div>

                {/* Results count */}
                <div className="mt-3 text-sm text-gray-600">
                  Showing {filteredCourseSummary.length} of {courseSummaryWithCohorts.length} courses
                  {courseSearch && ` (filtered by "${courseSearch}")`}
                </div>
              </CardContent>
            </Card>

            {/* Course Summary Table */}
            <CourseWiseSummary coursePayments={filteredCourseSummary} />
          </div>
        )}

        {/* Payments tab: filters will be rendered inside the same section as table below */}

        {/* Loading and Error States */}
        {activeTab === 'Payments' && loading && !hasLoadedOnce && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[#9234ea] rounded-full" />
              <p className="mt-2 text-gray-600">Loading student payment data from database...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'Payments' && error && !loading && !hasLoadedOnce && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-2">⚠️ {error}</p>
              <p className="text-gray-600">Please check your database connection and ensure the Students collection exists.</p>
            </CardContent>
          </Card>
        )}
        {activeTab === 'Payments' && error && hasLoadedOnce && (
          <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded">
            Background refresh failed; showing last good data. Try again later.
          </div>
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
        {activeTab === 'Payments' && (hasLoadedOnce || !loading) && (
          <div className="w-full bg-white shadow-md rounded-lg p-4" data-payment-container>
            {/* Embedded Filters + Toolbar inside same section */}
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
              selectedCount={selectedRows.length}
              columns={columns}
              onColumnToggle={handleColumnToggle}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              records={records}
              filteredRecords={filteredRecords}
              totalRecords={records}
              embedded
            />
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