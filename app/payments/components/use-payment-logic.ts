"use client"
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
  // Cache of courses to allow dynamic recomputation of fallback finalPayment values
  const [coursesCache, setCoursesCache] = useState<any[]>([])

  // Column visibility configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'id', label: 'Student ID', visible: true },
    { key: 'name', label: 'Student Name', visible: true },
    { key: 'program', label: 'Student Program', visible: true },
    { key: 'course', label: 'Student Course ID', visible: false },
    { key: 'category', label: 'Student Category', visible: true },
    { key: 'courseType', label: 'Course Type', visible: true },
    { key: 'courseRegFee', label: 'Course Reg Fee', visible: false },
    { key: 'studentRegFee', label: 'Student Reg Fee', visible: false},
    { key: 'finalPayment', label: 'Course Fee (INR)', visible: true },
    { key: 'totalPaid', label: 'Total Paid (INR)', visible: true },
    { key: 'balance', label: 'Balance (INR)', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'paidDate', label: 'Paid Date', visible: true },
    { key: 'nextDue', label: 'Next Due', visible: true },
    { key: 'courseStartDate', label: 'Start Date', visible: true },
    { key: 'reminder', label: 'Reminder', visible: true },
    { key: 'mode', label: 'Mode', visible: false },
    { key: 'communication', label: 'Communication', visible: false },
    { key: 'paymentDetails', label: 'Payment Details', visible: false },
    { key: 'manualPayment', label: 'Manual Payment', visible: true },
    { key: 'payslip', label: 'Payslip', visible: true },
    { key: 'actions', label: 'Send Reminder', visible: true }
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

  // POLLING & CHANGE DETECTION STRATEGY (User requirement):
  // - Students collection: poll every 1-2 minutes for category changes (as categories can be modified anytime)
  // - Payments & Courses: ONLY trigger refresh when their data actually changes
  //   (hash comparison, no timestamp field to avoid false positives)
  // - Frequent checking needed because student categories affect course matching dynamically
  useEffect(() => {
    let studentInterval: any;
    let monitorInterval: any;
    let lastStudentHash = '';
    let lastPaymentsCoursesHash = '';

    const computeStudentHash = (students: any[]) =>
      JSON.stringify(
        students.map(s => ({ 
          id: s.studentId, 
          category: s.category, 
          program: s.program, 
          activity: s.activity,
          updated: s.updatedAt || s.createdAt 
        }))
      );

    const computePaymentsCoursesHash = (payments: any[], courses: any[]) =>
      JSON.stringify({
        payments: payments.map(p => ({ id: p.id || p._id, updated: p.updatedAt || p.createdAt })),
        courses: courses.map(c => ({ id: c.id || c._id, price: c.priceINR, updated: c.updatedAt || c.createdAt }))
      });

    // 1. Students polling every 1 minute (category changes affect course matching immediately)
    const pollStudents = async () => {
      try {
        const res = await fetch('/api/students', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        const hash = computeStudentHash(data);
        if (lastStudentHash && hash !== lastStudentHash) {
          // Students changed -> full refresh (which prefers sync endpoint)
          refreshPaymentData();
        }
        lastStudentHash = hash;
      } catch (_) { /* silent */ }
    };

    // 2. Payments + Courses change detection every 2 minutes (no unconditional refresh)
    const monitorPaymentsAndCourses = async () => {
      try {
        const [paymentsRes, coursesRes] = await Promise.all([
          fetch('/api/payments/sync', { cache: 'no-store' }).catch(() => ({ ok: false })),
          fetch('/api/courses', { cache: 'no-store' }).catch(() => ({ ok: false }))
        ]);
        if (!paymentsRes.ok && !coursesRes.ok) return; // nothing reachable
        let payments: any[] = [];
        let courses: any[] = [];
        if ('ok' in paymentsRes && paymentsRes.ok && 'json' in paymentsRes) {
          try { const p: any = await (paymentsRes as Response).json(); payments = Array.isArray(p.data) ? p.data : []; } catch { /* ignore */ }
        }
        if ('ok' in coursesRes && coursesRes.ok && 'json' in coursesRes) {
          try { const c: any = await (coursesRes as Response).json(); courses = Array.isArray(c.data) ? c.data : []; } catch { /* ignore */ }
        }
        const hash = computePaymentsCoursesHash(payments, courses);
        if (lastPaymentsCoursesHash && hash !== lastPaymentsCoursesHash) {
          refreshPaymentData();
          // Update local cache for dynamic recomputation
          if (courses.length) setCoursesCache(courses);
        }
        lastPaymentsCoursesHash = hash;
      } catch (_) { /* silent */ }
    };

    // Prime initial hashes (avoid immediate refresh storm)
    pollStudents();
    monitorPaymentsAndCourses();

    studentInterval = setInterval(pollStudents, 60000); // 1 minute - check for student category changes
    monitorInterval = setInterval(monitorPaymentsAndCourses, 120000); // 2 minutes - check payments/courses changes

    return () => {
      clearInterval(studentInterval);
      clearInterval(monitorInterval);
    };
  }, []);

  // Dynamic recomputation of finalPayment for derived (fallback) records when courses change
  useEffect(() => {
    if (!coursesCache.length) return;
    setRecords(prev => {
      let changed = false;
  const nowISO = new Date().toISOString();
  const updated = prev.map(r => {
        // Only adjust records that were previously derived OR have 0 finalPayment (and not from sync)
        if (!r || (!r.derivedFinalPayment && r.finalPayment > 0)) return r;
        // We only stored one field for course in record.activity; we can't always know original student.course vs activity.
        // So dynamic recompute limited: match by course id OR name + category/level.
        const courseObj = coursesCache.find(c => (
          (r.activity === c.id || r.activity === c.name) && r.category === c.level
        ));
        if (courseObj && courseObj.priceINR && courseObj.priceINR !== r.finalPayment) {
          changed = true;
          return { ...r, finalPayment: courseObj.priceINR, balancePayment: Math.max(0, courseObj.priceINR - r.totalPaidAmount), derivedFinalPayment: true, finalPaymentUpdatedAt: nowISO };
        }
        return r;
      });
      return changed ? updated : prev;
    });
  }, [coursesCache]);

  // Fetch students from database with synchronized payment data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        
        // NEW: Fast path -> payments list endpoint (lightweight)
        let response: Response | null = null;
        let result: any = {};
        try {
          response = await fetch('/api/payments/list?limit=200');
          result = await response.json();
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            setRecords(result.data);
            setError(null);
            setLoading(false);
            return; // Done (fast path)
          }
        } catch (e) {
          console.warn('⚠️ payments/list failed, falling back to sync:', e);
        }

        // Fallback: synchronized full reconstruction
        response = await fetch('/api/payments/sync')
        result = await response.json()
        
        if (result.success) {
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
              const studentLevel = student.level || student.category
              if (student.activity && student.course && studentLevel && courses.length) {
                matchedCourse = courses.find(c => (
                  student.activity === c.id &&
                  student.course === c.name &&
                  studentLevel === c.level
                )) || null
              }

              const finalPayment = matchedCourse?.priceINR || 0
              const totalPaid = student.totalPaidAmount || 0
              const balance = Math.max(0, finalPayment - totalPaid)
              const courseName = student.course || student.activity || 'General Course'

              // Dates - preserve original format from students collection
              const courseStartDateObj = student.courseStartDate ? new Date(student.courseStartDate) : new Date()
              const paidDate = student.paidDate ? new Date(student.paidDate) : courseStartDateObj
              
              // Status
              let paymentStatus = 'Paid'
              if (balance > 0) paymentStatus = 'Pending'
              
              // Next payment date - only if there's a balance, based on course start date
              const nextPaymentDate = balance > 0 ? (() => {
                if (student.nextPaymentDate) {
                  return new Date(student.nextPaymentDate);
                }
                
                // Calculate next due based on course start date
                const now = new Date();
                const nextDue = new Date(courseStartDateObj);
                
                // If course start date is in the future, next due is 30 days after start
                if (courseStartDateObj > now) {
                  nextDue.setDate(nextDue.getDate() + 30);
                } else {
                  // Course has started, calculate next monthly payment cycle
                  const daysDifference = Math.floor((now.getTime() - courseStartDateObj.getTime()) / (24 * 60 * 60 * 1000));
                  const monthsPassed = Math.floor(daysDifference / 30);
                  const nextMonth = monthsPassed + 1;
                  nextDue.setDate(courseStartDateObj.getDate() + (nextMonth * 30));
                }
                
                return nextDue;
              })() : null

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
                ? `Payment reminder for ${courseName}. Amount due: ₹${balance}.${nextPaymentDate ? ` Due date: ${nextPaymentDate.toLocaleDateString()}.` : ''} Please complete your payment.`
                : `Payment for ${courseName} is complete. Thank you!`

              return {
                id: student.studentId || student._id || `STU${Date.now()}`,
                name: student.name || 'Unknown Student',
                activity: courseName,
                program: student.program || student.course || courseName,
                category: student.category || '-',
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
                nextPaymentDate: nextPaymentDate ? nextPaymentDate.toISOString() : null,
                courseStartDate: student.courseStartDate || courseStartDateObj.toISOString(),
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
      // Safe number conversion to avoid NaN
      const totalPaid = Number(record.totalPaidAmount) || 0
      return sum + totalPaid
    }, 0),
    
    outstandingPayment: records.reduce((sum: number, record: PaymentRecord) => {
      // Safe number conversion to avoid NaN
      const balance = Number(record.balancePayment) || 0
      return sum + balance
    }, 0),
    
    totalPayment: records.reduce((sum: number, record: PaymentRecord) => {
      // Safe number conversion to avoid NaN
      const finalPayment = Number(record.finalPayment) || 0
      return sum + finalPayment
    }, 0),
    
    profit: records.reduce((sum: number, record: PaymentRecord) => {
      // Safe number conversion and profit calculation (30% of received payments)
      const totalPaid = Number(record.totalPaidAmount) || 0
      return sum + (totalPaid * 0.3)
    }, 0),
  }

  const handleUpdateRecord = async (id: string, updates: Partial<PaymentRecord>) => {
    console.log('🔄 Updating record:', id, updates); // Debug log
    
    try {
      // Update local state immediately for responsiveness
      const updatedRecords = records.map((record: PaymentRecord) => (record.id === id ? { ...record, ...updates } : record))
      setRecords(updatedRecords)
      
      // Persist changes to the database
      const response = await fetch('/api/payments/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          updates: updates
        })
      });
      
      if (!response.ok) {
        console.error('❌ Failed to update record in database');
        // Revert local state on failure
        setRecords(records);
        throw new Error('Failed to update record');
      }
      
      console.log('✅ Record updated successfully in database');
      
    } catch (error) {
      console.error('❌ Error updating record:', error);
      // Revert local state on error
      setRecords(records);
    }
  }

  const refreshPaymentData = async () => {
    try {
      console.log('🔄 refreshPaymentData called - fetching updated payment data...');
      const previousCount = records.length;

      // 1. Try list endpoint (fast)
      let response = await fetch('/api/payments/list?limit=250&sortBy=studentId&sortOrder=asc', { cache: 'no-store' });
      let result: any = {};
      try { result = await response.json(); } catch {}
      if (result.success && result.data?.length) {
        setRecords(result.data);
        if (result.data.length > previousCount) {
          console.log(`➕ ${result.data.length - previousCount} new payment rows`);
        }
        return;
      }

      // 2. Fallback to sync endpoint
      response = await fetch('/api/payments/sync', { cache: 'no-store' });
      result = await response.json();
      if (result.success && result.data?.length) {
        setRecords(result.data);
        return;
      }

      // 3. Final fallback: students API legacy path
      response = await fetch('/api/students');
      result = await response.json();
      if (result.success) {
        // Keep legacy fallback minimal (no recomputation duplication) -> just map base fields
        const mapped = (result.data || []).map((s: any) => ({
          id: s.studentId,
          name: s.name,
            activity: s.course || s.activity || 'General Course',
            program: s.program || s.course || 'General Course',
            category: s.category || '-',
            courseType: s.courseType || '-',
            finalPayment: s.finalPayment || 0,
            totalPaidAmount: s.totalPaidAmount || 0,
            balancePayment: s.balancePayment || 0,
            paymentStatus: s.paymentStatus || 'Pending',
            paidDate: s.paidDate || null,
            nextPaymentDate: s.nextPaymentDate || null,
            courseStartDate: s.courseStartDate || null,
            paymentReminder: s.paymentReminder !== false,
            communicationText: s.communicationText || '',
            registrationFees: s.registrationFees,
            paymentDetails: {
              upiId: s.upiId || 'uniqbrio@upi',
              paymentLink: s.paymentLink || 'https://pay.uniqbrio.com',
              qrCode: 'QR_CODE_PLACEHOLDER'
            }
        }));
        setRecords(mapped);
      } else {
        throw new Error('Failed to refresh from all sources');
      }
    } catch (err) {
      console.error('❌ refreshPaymentData error:', err)
      // Don't set error state for auto-refresh to avoid disturbing UI
      // setError('Failed to refresh payment data')
      
      // Re-throw the error so it can be caught by the caller
      throw err;
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