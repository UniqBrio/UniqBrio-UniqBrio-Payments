import { useState, useEffect } from "react"
import { PaymentRecord, PaymentSummary } from './payment-types'
import { ColumnConfig } from './column-visibility'
import { getCoursePricing } from './course-pricing-helper'

export function usePaymentLogic() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [paymentCategoryFilters, setPaymentCategoryFilters] = useState<string[]>([])
  const [courseFilters, setCourseFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("id")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("asc")
  const [filteredRecords, setFilteredRecords] = useState<PaymentRecord[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Column visibility configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'id', label: 'ID', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'course', label: 'Course', visible: true },
    { key: 'category', label: 'Category', visible: true },
    { key: 'courseType', label: 'Course Type', visible: true },
    { key: 'courseRegFee', label: 'Course Reg Fee', visible: true },
    { key: 'studentRegFee', label: 'Student Reg Fee', visible: true },
    { key: 'finalPayment', label: 'Final Payment', visible: true },
    { key: 'totalPaid', label: 'Total Paid', visible: true },
    { key: 'balance', label: 'Balance', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'frequency', label: 'Frequency', visible: false },
    { key: 'paidDate', label: 'Paid Date', visible: true },
    { key: 'nextDue', label: 'Next Due', visible: true },
    { key: 'courseStartDate', label: 'Start Date', visible: false },
    { key: 'reminder', label: 'Reminder', visible: true },
    { key: 'mode', label: 'Mode', visible: false },
    { key: 'communication', label: 'Communication Text', visible: false },
    { key: 'paymentDetails', label: 'Payment Details', visible: false },
    { key: 'manualPayment', label: 'Manual Payment', visible: true },
    { key: 'payslip', label: 'Payslip', visible: true },
    { key: 'actions', label: 'Actions', visible: true }
  ])

  const handleFilter = () => {
    let filtered = records

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(
        (record: PaymentRecord) =>
          record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilters.length > 0) {
      filtered = filtered.filter((record: PaymentRecord) => 
        statusFilters.some(status => record.paymentStatus.toLowerCase() === status.toLowerCase())
      )
    }

    if (categoryFilters.length > 0) {
      filtered = filtered.filter((record: PaymentRecord) => 
        categoryFilters.some(category => record.category.toLowerCase() === category.toLowerCase())
      )
    }

    if (paymentCategoryFilters.length > 0) {
      filtered = filtered.filter((record: PaymentRecord) => 
        paymentCategoryFilters.some(category => record.paymentStatus.toLowerCase() === category.toLowerCase())
      )
    }

    if (courseFilters.length > 0) {
      filtered = filtered.filter((record: PaymentRecord) => 
        courseFilters.some(course => record.activity.toLowerCase() === course.toLowerCase())
      )
    }

    // Robust sorting logic
    filtered = filtered.slice().sort((a, b) => {
      let aValue: any, bValue: any, comparison = 0;
      switch (sortBy) {
        case 'id':
          // Natural sort for IDs like ART001, ART002
          aValue = a.id;
          bValue = b.id;
          comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          comparison = aValue.localeCompare(bValue);
          break;
        case 'type':
        case 'courseType':
          aValue = (a.courseType || '').toLowerCase();
          bValue = (b.courseType || '').toLowerCase();
          comparison = aValue.localeCompare(bValue);
          break;
        case 'amount':
        case 'finalPayment':
          aValue = a.finalPayment;
          bValue = b.finalPayment;
          comparison = aValue - bValue;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredRecords(filtered);
  }

  // Smart refresh - only refresh when new data is detected in collections
  useEffect(() => {
    let lastDataHash = '';
    
    const checkForNewData = async () => {
      try {
        // Get current data counts and latest records to create a hash
        const [studentsRes, paymentsRes] = await Promise.all([
          fetch('/api/students', { cache: 'no-store' }),
          fetch('/api/payments/sync', { cache: 'no-store' })
        ]);
        
        if (studentsRes.ok && paymentsRes.ok) {
          const studentsData = await studentsRes.json();
          const paymentsData = await paymentsRes.json();
          
          // Create a simple hash of the data to detect changes
          const currentHash = JSON.stringify({
            studentCount: studentsData.data?.length || 0,
            paymentCount: paymentsData.data?.length || 0,
            lastStudent: studentsData.data?.[0]?.studentId || '',
            lastPayment: paymentsData.data?.[0]?.id || ''
          });
          
          // Only refresh if data has actually changed
          if (lastDataHash && currentHash !== lastDataHash) {
            refreshPaymentData();
          }
          
          lastDataHash = currentHash;
        }
      } catch (error) {
        // Silently handle data check errors
      }
    };
    
    // Check for changes every 10 seconds (lightweight check)
    const interval = setInterval(checkForNewData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Enhanced change detection for courses and detailed data changes
  useEffect(() => {
    let lastDetailedHash = '';
    
    const checkForDetailedChanges = async () => {
      try {
        // Check for changes in courses, students, and payments with more detail
        const [studentsRes, coursesRes] = await Promise.all([
          fetch('/api/students', { cache: 'no-store' }),
          fetch('/api/courses', { cache: 'no-store' }).catch(() => ({ ok: false }))
        ]);
        
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          let coursesData = { data: [] };
          
          if (coursesRes.ok) {
            try {
              coursesData = await (coursesRes as Response).json();
            } catch (error) {
              // Silently handle parse errors
            }
          }
          
          // Create detailed hash including course pricing changes
          const detailedHash = JSON.stringify({
            students: studentsData.data?.map((s: any) => ({
              id: s.studentId,
              activity: s.activity,
              course: s.course,
              updatedAt: s.updatedAt || s.createdAt
            })) || [],
            courses: coursesData.data?.map((c: any) => ({
              name: c.name,
              priceINR: c.priceINR,
              updatedAt: c.updatedAt || c.createdAt
            })) || [],
            timestamp: Date.now()
          });
          
          // Refresh only if there are meaningful changes
          if (lastDetailedHash && detailedHash !== lastDetailedHash) {
            refreshPaymentData();
          }
          
          lastDetailedHash = detailedHash;
        }
      } catch (error) {
        // Silently handle detailed check errors
      }
    };
    
    // Check every 5 seconds for detailed changes
    const interval = setInterval(checkForDetailedChanges, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch students from database with synchronized payment data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        
        // First try to get synchronized payment data
        let response = await fetch('/api/payments/sync')
        let result = await response.json()
        
        if (result.success) {
          // Use synchronized data from payments collection
          setRecords(result.data)
          setError(null)
        } else {
          // Fallback to legacy student data
          response = await fetch('/api/students')
          result = await response.json()
          
          if (result.success) {
            // Fetch courses once for triple-rule matching (activity, course, category)
            let courses: any[] = []
            try {
              const coursesResp = await fetch('/api/courses', { cache: 'no-store' })
              if (coursesResp.ok) {
                const cJson = await coursesResp.json()
                courses = Array.isArray(cJson.data) ? cJson.data : []
              }
            } catch (_) {
              // silently ignore
            }

            const paymentRecords = await Promise.all(result.data.map(async (student: any) => {
              // Triple rule logic (frontend fallback ONLY when sync API failed):
              // Rule 1: student.activity === course.id
              // Rule 2: student.course === course.name
              // Rule 3: student.category === course.level
              let matchedCourse = null as any
              if (student.activity && student.course && student.category && courses.length) {
                matchedCourse = courses.find(c => 
                  student.activity === c.id &&
                  student.course === c.name &&
                  student.category === c.level
                ) || null
              }

              const finalPayment = matchedCourse?.priceINR || 0
              const totalPaid = student.totalPaidAmount || 0
              const balance = Math.max(0, finalPayment - totalPaid)
              const courseName = student.course || student.activity || 'General Course'

              // Dates
              const courseStartDate = student.courseStartDate ? new Date(student.courseStartDate) : new Date()
              const paidDate = student.paidDate ? new Date(student.paidDate) : courseStartDate
              const nextPaymentDate = student.nextPaymentDate ? new Date(student.nextPaymentDate) : new Date(courseStartDate.getTime() + 30*24*60*60*1000)

              // Status
              let paymentStatus = 'Paid'
              if (balance > 0) paymentStatus = 'Pending'

              // Registration fees (preserve existing structure)
              const registrationFees = student.registrationFees || {
                studentRegistration: 500,
                courseRegistration: 1000,
                confirmationFee: 250,
                paid: false
              }
              if (!registrationFees.paid) {
                registrationFees.status = 'Pending'
              }

              const defaultCommunicationText = paymentStatus === 'Pending'
                ? `Payment reminder for ${courseName}. Amount due: ₹${balance}. Due date: ${nextPaymentDate.toLocaleDateString()}. Please complete your payment.`
                : `Payment for ${courseName} is complete. Thank you!`

              return {
                id: student.studentId || student._id || `STU${Date.now()}`,
                name: student.name || 'Unknown Student',
                activity: courseName,
                category: student.category || 'Regular',
                courseType: student.courseType || 'Individual',
                cohort: student.cohort || `${courseName.replace(/\s+/g, '')}_${new Date().getFullYear()}_Batch01`,
                batch: student.batch || 'Morning Batch',
                instructor: student.instructor || matchedCourse?.instructor || 'TBD',
                classSchedule: student.classSchedule || 'Mon-Wed-Fri 10:00-12:00',
                currency: student.currency || 'INR',
                finalPayment,
                totalPaidAmount: totalPaid,
                balancePayment: balance,
                paymentStatus: student.paymentStatus || paymentStatus,
                paymentFrequency: student.paymentFrequency || 'Monthly',
                paidDate: paidDate.toISOString(),
                nextPaymentDate: nextPaymentDate.toISOString(),
                courseStartDate: courseStartDate.toISOString(),
                paymentReminder: paymentStatus === 'Paid' ? false : (student.paymentReminder !== false),
                reminderMode: student.modeOfCommunication || student.reminderMode || 'Email',
                communicationText: student.communicationText || defaultCommunicationText,
                reminderDays: student.reminderDays || [7, 3, 1],
                registrationFees,
                paymentDetails: student.paymentDetails || {
                  upiId: student.upiId || 'payment@uniqbrio.com',
                  paymentLink: student.paymentLink || 'https://pay.uniqbrio.com',
                  qrCode: student.qrCode || 'QR_CODE_PLACEHOLDER'
                },
                paymentModes: student.paymentModes || ['UPI', 'Card', 'Bank Transfer'],
                studentType: student.studentType || 'New',
                emiSplit: student.emiSplit || 1,
                derivedFinalPayment: !!matchedCourse // mark if computed
              }
            }))
            setRecords(paymentRecords)
            setError(null)
          } else {
            setError('Failed to fetch students')
          }
        }
      } catch (err) {
        console.error('Data fetch error:', err)
        setError('Database connection failed')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Automatically filter and sort when any parameter changes
  useEffect(() => {
    handleFilter()
  }, [searchTerm, statusFilters, categoryFilters, paymentCategoryFilters, courseFilters, sortBy, sortOrder, records])

  const paymentSummary: PaymentSummary = {
    receivedPayment: records.reduce((sum: number, record: PaymentRecord) => {
      // Calculate total registration fees
      const registrationTotal = (record.registrationFees?.studentRegistration?.amount || 0) + 
                               (record.registrationFees?.courseRegistration?.amount || 0) + 
                               (record.registrationFees?.confirmationFee?.amount || 0)
      
      // Add registration fees to received payment if registration is paid
      const registrationReceived = record.registrationFees?.overall?.paid ? registrationTotal : 0
      
      return sum + record.totalPaidAmount + registrationReceived
    }, 0),
    
    outstandingPayment: records.reduce((sum: number, record: PaymentRecord) => {
      // Calculate total registration fees
      const registrationTotal = (record.registrationFees?.studentRegistration?.amount || 0) + 
                               (record.registrationFees?.courseRegistration?.amount || 0) + 
                               (record.registrationFees?.confirmationFee?.amount || 0)
      
      // Add registration fees to outstanding if not paid
      const registrationOutstanding = !record.registrationFees?.overall?.paid ? registrationTotal : 0
      
      return sum + record.balancePayment + registrationOutstanding
    }, 0),
    
    totalPayment: records.reduce((sum: number, record: PaymentRecord) => {
      // Calculate total registration fees
      const registrationTotal = (record.registrationFees?.studentRegistration?.amount || 0) + 
                               (record.registrationFees?.courseRegistration?.amount || 0) + 
                               (record.registrationFees?.confirmationFee?.amount || 0)
      
      return sum + record.finalPayment + registrationTotal
    }, 0),
    
    profit: records.reduce((sum: number, record: PaymentRecord) => {
      // Calculate total registration fees
      const registrationTotal = (record.registrationFees?.studentRegistration?.amount || 0) + 
                               (record.registrationFees?.courseRegistration?.amount || 0) + 
                               (record.registrationFees?.confirmationFee?.amount || 0)
      
      // Add registration fees to profit calculation if paid
      const registrationReceived = record.registrationFees?.overall?.paid ? registrationTotal : 0
      
      return sum + (record.totalPaidAmount + registrationReceived) * 0.3
    }, 0),
  }

  const handleUpdateRecord = (id: string, updates: Partial<PaymentRecord>) => {
    console.log('Updating record:', id, updates); // Debug log
    const updatedRecords = records.map((record: PaymentRecord) => (record.id === id ? { ...record, ...updates } : record))
    setRecords(updatedRecords)
  }

  const refreshPaymentData = async () => {
    try {
      // Don't show loading for auto-refresh to avoid UI flickering
      // setLoading(true)
      
      // Store current count for comparison
      const previousCount = records.length;
      
      // Try to fetch updated data from sync endpoint first
      let response = await fetch('/api/payments/sync', {
        cache: 'no-store', // Force fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      let result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('Payment data refreshed from sync:', result.data.length, 'records'); // Debug log
        
        // Check if new students were added
        if (result.data.length > previousCount) {
          const newStudentCount = result.data.length - previousCount;
          console.log(`New students detected: ${newStudentCount} students added`);
          
          // Show toast notification for new students
          if (typeof window !== 'undefined') {
            console.log(`✅ ${newStudentCount} new student${newStudentCount > 1 ? 's' : ''} added to payment system`);
          }
        }
        
        setRecords(result.data)
        setError(null)
      } else {
        // Fallback to students API if sync fails
        // Sync failed, falling back to students API
        response = await fetch('/api/students')
        result = await response.json()
        
        if (result.success) {
          // Fetch courses for triple-rule matching fallback
          let courses: any[] = []
          try {
            const coursesResp = await fetch('/api/courses', { cache: 'no-store' })
            if (coursesResp.ok) {
              const cJson = await coursesResp.json()
              courses = Array.isArray(cJson.data) ? cJson.data : []
            }
          } catch (_) {}

          const paymentRecords = await Promise.all(result.data.map(async (student: any) => {
            let matchedCourse = null as any
            if (student.activity && student.course && student.category && courses.length) {
              matchedCourse = courses.find(c => 
                student.activity === c.id &&
                student.course === c.name &&
                student.category === c.level
              ) || null
            }
            const finalPayment = matchedCourse?.priceINR || 0
            const totalPaid = student.totalPaidAmount || 0
            const balance = Math.max(0, finalPayment - totalPaid)
            let paymentStatus: 'Paid' | 'Pending' = balance > 0 ? 'Pending' : 'Paid'
            return {
              id: student.studentId,
              name: student.name,
              activity: student.course || student.activity || 'General Course',
              category: student.category || 'Regular',
              courseType: student.courseType || 'Individual',
              cohort: student.cohort || `${student.course}_${new Date().getFullYear()}_Batch01`,
              paymentStatus,
              totalPaidAmount: totalPaid,
              finalPayment,
              balancePayment: balance,
              paidDate: student.paidDate || null,
              nextDue: student.nextPaymentDate || null,
              courseStartDate: student.courseStartDate || null,
              paymentReminder: student.paymentReminder !== false,
              reminderMode: student.reminderMode || 'Email',
              communicationText: student.communicationText || 'Payment reminder sent.',
              paymentDetails: {
                upiId: student.upiId || 'payments@uniqbrio.com',
                phoneNumber: student.phoneNumber || '+91 98765 43210'
              },
              currency: student.currency || 'INR',
              paymentFrequency: student.paymentFrequency || 'One-time',
              nextPaymentDate: student.nextPaymentDate || null,
              reminderDays: student.reminderDays || 3,
              paymentModes: student.paymentModes || ['UPI', 'Cash'],
              studentType: student.studentType || 'Regular',
              derivedFinalPayment: !!matchedCourse
            } as PaymentRecord
          }))
          console.log('Payment data refreshed from students API (with fallback match):', paymentRecords.length, 'records')
          setRecords(paymentRecords)
          setError(null)
        } else {
          throw new Error('Failed to fetch data from both sync and students API');
        }
      }
    } catch (err) {
      console.error('Auto-refresh error:', err)
      // Don't set error state for auto-refresh to avoid disturbing UI
      // setError('Failed to refresh payment data')
    } finally {
      // Don't set loading false for auto-refresh
      // setLoading(false)
    }
  }

  const handleColumnToggle = (key: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((column) => (column.key === key ? { ...column, visible } : column))
    )
  }

  const isColumnVisible = (key: string) => {
    const column = columns.find((c) => c.key === key)
    return column ? column.visible : false
  }

  const handleExport = () => {
    console.log("Exporting payment data...")
  }

  return {
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
    error
  }
}