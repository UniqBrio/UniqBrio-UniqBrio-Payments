"use client"
import { useState, useEffect, useRef } from "react"
import type { ColumnConfig } from './column-visibility'
import { PaymentRecord, PaymentSummary } from './payment-types'
import { getCoursePricing } from './course-pricing-helper'

export function usePaymentLogic() {
  // Slow down auto-refresh to avoid visible flicker and unnecessary re-renders
  const AUTO_REFRESH_MS = 30000; // 30 seconds
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [paymentCategoryFilters, setPaymentCategoryFilters] = useState<string[]>([])
  const [courseFilters, setCourseFilters] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 })
  const [sortBy, setSortBy] = useState<string>("id")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("asc")
  const [filteredRecords, setFilteredRecords] = useState<PaymentRecord[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastAutoRefresh, setLastAutoRefresh] = useState<Date | null>(null)
  // Persist content on screen after first successful data load to avoid first-load flicker on Vercel
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  // Cache of courses to allow dynamic recomputation of fallback finalPayment values
  const [coursesCache, setCoursesCache] = useState<any[]>([])

  // Heuristic guard: avoid replacing good data with degraded refresh payloads
  const isLikelyDegraded = (incoming: PaymentRecord[], prev: PaymentRecord[]) => {
    if (!incoming || incoming.length === 0) return true; // empty is always degraded
    if (!prev || prev.length === 0) return false; // first load: accept
    let flatZero = 0;
    for (const r of incoming) {
      const fp = Number((r as any)?.finalPayment || 0);
      const tp = Number((r as any)?.totalPaidAmount || 0);
      const bal = Number((r as any)?.balancePayment || 0);
      const cat = (r as any)?.category;
      const ctype = (r as any)?.courseType as any;
      if ((fp === 0 && tp === 0 && bal === 0) || ((cat === '-' || !cat) && (ctype === '-' || !ctype))) flatZero++;
    }
    const ratio = flatZero / incoming.length;
    return ratio > 0.6; // if >60% rows look empty, treat as degraded
  }

  // Merge incoming data with previous to keep stable values when backend is temporarily incomplete
  const reconcileStableData = (incoming: PaymentRecord[], prev: PaymentRecord[]) => {
    if (!prev || prev.length === 0) return incoming;
    const kf = (x: any) => `${x.id}::${x.matchedCourseId || x.activity || x.enrolledCourse || 'NA'}`;
    const map = new Map(prev.map(r => [kf(r), r]));
    return incoming.map(r => {
      const p = map.get(kf(r));
      if (!p) return r;
      const suspiciousZeroFinal = (Number(r.finalPayment || 0) === 0) && Number(p.finalPayment || 0) > 0;
      const suspiciousDashCategory = (!r.category || r.category === '-') && (p.category && p.category !== '-');
      const suspiciousCourseType = (!r.courseType || (r.courseType as any) === '-') && (p.courseType && (p.courseType as any) !== '-');
      const merged: PaymentRecord = { ...p, ...r };
      if (suspiciousZeroFinal) {
        merged.finalPayment = p.finalPayment;
        const newPaid = Number(r.totalPaidAmount || p.totalPaidAmount || 0);
        merged.totalPaidAmount = newPaid;
        merged.balancePayment = Math.max(0, (p.finalPayment || 0) - newPaid);
      }
      if (suspiciousDashCategory) merged.category = p.category;
      if (suspiciousCourseType) merged.courseType = p.courseType;
      if (!r.registrationFees && p.registrationFees) merged.registrationFees = p.registrationFees;
      return merged;
    });
  }

  // Default / initial column visibility configuration
  const DEFAULT_COLUMNS: ColumnConfig[] = [
    { key: 'id', label: 'Student ID', visible: true },
    { key: 'name', label: 'Student Name', visible: true },
    { key: 'program', label: 'Enrolled Course', visible: true },
    { key: 'cohort', label: 'Cohort', visible: true },
    { key: 'category', label: 'Student Category', visible: true },
    { key: 'courseType', label: 'Course Type', visible: true },
    { key: 'courseRegFee', label: 'Course Reg Fee', visible: true },
    { key: 'studentRegFee', label: 'Student Reg Fee', visible: true },
    { key: 'finalPayment', label: 'Course Fee (INR)', visible: true },
    { key: 'totalPaid', label: 'Total Paid (INR)', visible: true },
    { key: 'balance', label: 'Balance (INR)', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'paidDate', label: 'Paid Date', visible: true },
    // { key: 'nextDue', label: 'Next Due', visible: true },
    // { key: 'courseStartDate', label: 'Start Date', visible: true },
    { key: 'reminder', label: 'Reminder', visible: true },
    // { key: 'mode', label: 'Mode', visible: false },
    // { key: 'communication', label: 'Communication', visible: false },
    // { key: 'paymentDetails', label: 'Payment Details', visible: false },
    { key: 'manualPayment', label: 'Manual Payment', visible: true },
    { key: 'payslip', label: 'Payslip', visible: true },
    { key: 'actions', label: 'Send Reminder', visible: true }
  ]

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLUMNS;
    try {
      const saved = window.localStorage.getItem('paymentColumns');
      if (saved) {
        const parsed: ColumnConfig[] = JSON.parse(saved);
        // Merge with defaults to avoid missing new columns
        const merged = DEFAULT_COLUMNS.map(def => {
          const existing = parsed.find(p => p.key === def.key);
            return existing ? { ...def, visible: existing.visible } : def;
        });
        return merged;
      }
    } catch(_) {}
    return DEFAULT_COLUMNS;
  })

  // Persist column visibility changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('paymentColumns', JSON.stringify(columns));
    } catch(_) {}
  }, [columns]);

  const handleFilter = () => {
    let filtered = records

    // Apply filters
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (record: PaymentRecord) => {
          // Search by student name
          const nameMatch = record.name.toLowerCase().includes(searchLower)
          
          // Search by student ID
          const idMatch = record.id.toLowerCase().includes(searchLower)
          
          // Search by course/activity (multiple possible fields)
          const courseMatch = (record.activity && record.activity.toLowerCase().includes(searchLower)) ||
                             (record.program && record.program.toLowerCase().includes(searchLower)) ||
                             (record.enrolledCourse && record.enrolledCourse.toLowerCase().includes(searchLower))
          
          // Search by instructor (if available)
          const instructorMatch = record.instructor && record.instructor.toLowerCase().includes(searchLower)
          
          // Search by category
          const categoryMatch = record.category && record.category.toLowerCase().includes(searchLower)
          
          // Search by course type
          const typeMatch = record.courseType && record.courseType.toLowerCase().includes(searchLower)
          
          // Search by cohort and batch
          const cohortMatch = record.cohort && record.cohort.toLowerCase().includes(searchLower)
          const batchMatch = record.batch && record.batch.toLowerCase().includes(searchLower)
          
          // Search by class schedule
          const scheduleMatch = record.classSchedule && record.classSchedule.toLowerCase().includes(searchLower)
          
          return nameMatch || idMatch || courseMatch || instructorMatch || categoryMatch || typeMatch || cohortMatch || batchMatch || scheduleMatch
        }
      )
    }

    if (statusFilters.length > 0) {
      filtered = filtered.filter((record: PaymentRecord) => {
        // Calculate dynamic status for N/A filtering
        let dynamicStatus: string;
        if ((record.finalPayment || 0) === 0) {
          dynamicStatus = "N/A";
        } else if ((record.balancePayment || 0) === 0) {
          dynamicStatus = "Paid";
        } else {
          dynamicStatus = "Pending";
        }
        
        return statusFilters.some(status => {
          if (status === "N/A") {
            return dynamicStatus === "N/A";
          }
          return record.paymentStatus.toLowerCase() === status.toLowerCase() || 
                 dynamicStatus.toLowerCase() === status.toLowerCase();
        });
      })
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

    // Price range filter
    if (priceRange.min > 0 || priceRange.max < 100000) {
      filtered = filtered.filter((record: PaymentRecord) => {
        const courseFee = record.finalPayment || 0;
        return courseFee >= priceRange.min && courseFee <= priceRange.max;
      })
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
        
        // First try to get synchronized payment data
        let response = await fetch('/api/payments/sync', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
        let result = await response.json()
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0 && !result.fallback) {
          // Enrich payment data with parsed cohort information
          // Communication preferences are already in the payment records from sync API
          const enrichedData = result.data.map((record: any) => {
            // Parse cohort field (format: "COHORTID - Name")
            const cohortField = record.cohort || ''
            let cohortId = ''
            let cohortName = ''
            
            if (cohortField && cohortField.includes(' - ')) {
              const parts = cohortField.split(' - ')
              cohortId = parts[0].trim()
              cohortName = parts.slice(1).join(' - ').trim()
            } else if (cohortField) {
              // If no separator, use the whole string as both ID and name
              cohortId = cohortField
              cohortName = cohortField
            }
            
            return {
              ...record,
              cohort: cohortName,
              cohortId: cohortId,
              // Preserve communication preferences from sync API
              communicationChannels: record.communicationPreferences?.enabled && record.communicationPreferences?.channels 
                ? record.communicationPreferences.channels 
                : []
            }
          })

          // Use synchronized data from payments collection when we have real data
          const stable = isLikelyDegraded(enrichedData, records) ? records : reconcileStableData(enrichedData, records)
          setRecords(stable)
          setError(null)
          setHasLoadedOnce(true)
        } else {
          // Fallback to legacy student data
          response = await fetch('/api/students', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
          result = await response.json()
          
          // If API explicitly signals fallback or returns empty, don't clear existing UI data
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            // Fetch courses once for triple-rule matching (activity, course, category)
            let courses: any[] = []
            let cohorts: any[] = []
            try {
              const [coursesResp, cohortsResp] = await Promise.all([
                fetch('/api/courses', { cache: 'no-store' }),
                fetch('/api/cohorts', { cache: 'no-store' })
              ])
              if (coursesResp.ok) {
                const cJson = await coursesResp.json()
                courses = Array.isArray(cJson.data) ? cJson.data : []
              }
              if (cohortsResp.ok) {
                const cohJson = await cohortsResp.json()
                cohorts = Array.isArray(cohJson.data) ? cohJson.data : []
              }
            } catch (_) {
              // silently ignore
            }

            const paymentRecords = await Promise.all(result.data.map(async (student: any) => {
              // Improved course matching (frontend fallback ONLY when sync API failed)
              let matchedCourse = null as any
              const studentLevel = student.level || student.category
              const courseId = student.enrolledCourse || student.activity
              
              if (courses.length) {
                // Priority 1: Match by course ID
                if (courseId) {
                  matchedCourse = courses.find(c => c.id === courseId) || null
                }
                
                // Priority 2: Try strict matching if Priority 1 failed
                if (!matchedCourse && courseId && student.course && studentLevel) {
                  matchedCourse = courses.find(c => (
                    courseId === c.id &&
                    student.course === c.name &&
                    studentLevel === c.level
                  )) || null
                }
                
                // Priority 3: Match by course ID and name only
                if (!matchedCourse && courseId && student.course) {
                  matchedCourse = courses.find(c => (
                    courseId === c.id &&
                    student.course === c.name
                  )) || null
                }
              }

              const finalPayment = matchedCourse?.priceINR || 0
              const totalPaid = student.totalPaidAmount || 0
              const balance = Math.max(0, finalPayment - totalPaid)
              const courseName = student.course || courseId || 'General Course'

              // Dates - preserve original format from students collection
              const courseStartDateObj = student.courseStartDate ? new Date(student.courseStartDate) : new Date()
              const paidDate = student.paidDate ? new Date(student.paidDate) : courseStartDateObj
              
              // Status
              let paymentStatus = 'Paid'
              if (balance > 0) paymentStatus = 'Pending'
              
              // Next payment date - ALWAYS compute from courseStartDate (+30 days) even if fully paid
              const nextPaymentDate = (() => {
                if (student.nextPaymentDate) {
                  const d = new Date(student.nextPaymentDate)
                  if (!isNaN(d.getTime())) return d
                }
                const base = courseStartDateObj
                if (isNaN(base.getTime())) return null
                const next = new Date(base)
                next.setDate(next.getDate() + 30)
                return next
              })()

              // Registration fees (normalize to nested shape used by UI)
              const normalizeFees = (raw: any) => {
                if (!raw) return undefined as any
                const toObj = (v: any) => {
                  if (v == null) return undefined
                  if (typeof v === 'number') return { amount: v, paid: false }
                  if (typeof v === 'object') {
                    if (typeof v.amount === 'number') return { amount: v.amount, paid: Boolean(v.paid), paidDate: v.paidDate || undefined }
                    const alt = typeof v.value === 'number' ? v.value : (typeof v.fee === 'number' ? v.fee : (typeof v.cost === 'number' ? v.cost : undefined))
                    if (typeof alt === 'number') return { amount: alt, paid: Boolean(v.paid), paidDate: v.paidDate || undefined }
                  }
                  return undefined
                }
                const s = toObj(raw.studentRegistration)
                const c = toObj(raw.courseRegistration)
                const conf = toObj(raw.confirmationFee)
                const overallPaid = [s, c, conf].filter(Boolean).every((f: any) => f.paid)
                return {
                  studentRegistration: s,
                  courseRegistration: c,
                  confirmationFee: conf,
                  overall: { paid: overallPaid, status: overallPaid ? 'Paid' : 'Pending' }
                }
              }
              const registrationFees = normalizeFees(student.registrationFees) || undefined

              const defaultCommunicationText = paymentStatus === 'Pending'
                ? `Payment reminder for ${courseName}. Amount due: ₹${balance}.${nextPaymentDate ? ` Due date: ${nextPaymentDate.toLocaleDateString()}.` : ''} Please complete your payment.`
                : `Payment for ${courseName} is complete. Thank you!`

              // Get cohort ID directly from student record
              const cohortId = student.cohortId || ''
              
              // Get cohort name from cohorts collection using cohortId
              let cohortName = ''
              if (cohortId) {
                const cohortFromDB = cohorts.find((c: any) => c.cohortId === cohortId)
                cohortName = cohortFromDB?.name || ''
              }

              return {
                id: student.studentId || student._id || `STU${Date.now()}`,
                name: student.name || 'Unknown Student',
                activity: courseId,
                enrolledCourse: student.enrolledCourse || student.activity,
                program: student.program || student.course || courseName,
                category: student.category || '-',
                courseType: matchedCourse?.type || student.courseType || '-',
                cohort: cohortName,
                cohortId: cohortId,
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
            // Only update records when we have a meaningful dataset (non-empty)
            if (paymentRecords.length > 0) {
              setRecords(paymentRecords)
              setError(null)
              setHasLoadedOnce(true)
            } else {
              // Keep previous data to prevent disappearing table on transient empty responses
              setError(prev => prev || 'No student data returned; keeping previous data')
            }
          } else {
            setError('Failed to fetch students')
          }
        }
      } catch (err) {
  console.error('Data fetch error. Status: unknown')
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
  }, [searchTerm, statusFilters, categoryFilters, paymentCategoryFilters, courseFilters, priceRange, sortBy, sortOrder, records])

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
  // Only log status code if needed; removed verbose console log
    
    // Store original state before making any changes
    const originalRecords = [...records];
    // Helper to parse composite key
    const parseKey = (key: string): { studentId: string, courseId?: string } => {
      if (!key) return { studentId: key } as any;
      const parts = key.split('::');
      if (parts.length >= 2) return { studentId: parts[0], courseId: parts.slice(1).join('::') } as any;
      return { studentId: key } as any;
    };
    const { studentId, courseId } = parseKey(id);
    const matchesRecord = (r: PaymentRecord) => {
      if (r.id !== studentId) return false;
      if (!courseId) return true;
      const rcid = r.matchedCourseId || (r as any).activity || (r as any).enrolledCourse || 'NA';
      return rcid === courseId;
    };
    
    try {
      // Update local state immediately for responsiveness
      const updatedRecords = records.map((record: PaymentRecord) => (matchesRecord(record) ? { ...record, ...updates } : record))
      setRecords(updatedRecords)
      
      // Persist changes to the database
      // Resolve courseId for per-course updates
      const recForUpdate = records.find((r: PaymentRecord) => matchesRecord(r));
      const resolvedCourseId = courseId || recForUpdate?.matchedCourseId || (recForUpdate as any)?.activity || (recForUpdate as any)?.enrolledCourse;

      const response = await fetch('/api/payments/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: studentId,
          courseId: resolvedCourseId,
          updates: updates
        })
      });
      
      if (!response.ok) {
  console.error('❌ Failed to update record in database. Status: unknown');
        // Revert local state on failure using original state
        setRecords(originalRecords);
        throw new Error('Failed to update record');
      }
      
  // Only log status code if needed; removed verbose console log
      
    } catch (error) {
  console.error('❌ Error updating record. Status: unknown');
      // Revert local state on error using original state
      setRecords(originalRecords);
    }
  }

  const refreshPaymentData = async () => {
    try {
  // Only log status code if needed; removed verbose console log
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
      
  // Only log status code if needed; removed verbose console log
      
  if (result.success && result.data && result.data.length > 0 && !result.fallback) {
  // Check if new students were added
        if (result.data.length > previousCount) {
          const newStudentCount = result.data.length - previousCount;
          // Only log status code if needed; removed verbose console log
          
          // Show toast notification for new students
          if (typeof window !== 'undefined') {
            // Only log status code if needed; removed verbose console log
          }
        }
        
  const stable = isLikelyDegraded(result.data, records) ? records : reconcileStableData(result.data, records)
  setRecords(stable)
  setError(null)
  if (result.data.length > 0) setHasLoadedOnce(true)
  // Only log status code if needed; removed verbose console log
      } else {
        // Fallback to students API if sync fails
        // Sync failed, falling back to students API
  response = await fetch('/api/students', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
        result = await response.json()
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          // Fetch courses for triple-rule matching fallback
          let courses: any[] = []
          try {
            const coursesResp = await fetch('/api/courses', { cache: 'no-store' })
            if (coursesResp.ok) {
              const cJson = await coursesResp.json()
              courses = Array.isArray(cJson.data) ? cJson.data : []
            }
          } catch (_) {}

          // Fetch payment documents to respect manual reminder settings
          let paymentDocs: any[] = []
          try {
            const paymentResp = await fetch('/api/payments', { cache: 'no-store' })
            if (paymentResp.ok) {
              const pJson = await paymentResp.json()
              paymentDocs = Array.isArray(pJson.data) ? pJson.data : []
            }
          } catch (_) {}

          // Batch fetch communication preferences for all students
          const commPrefsMap = new Map<string, string[]>()
          try {
            const studentIds = result.data.map((s: any) => s.studentId).filter(Boolean)
            if (studentIds.length > 0) {
              // Fetch communication preferences for all students in parallel
              const commPrefsResults = await Promise.all(
                studentIds.map(async (studentId: string) => {
                  try {
                    const resp = await fetch(`/api/students/communication-preferences?studentId=${studentId}`, { cache: 'no-store' })
                    if (resp.ok) {
                      const data = await resp.json()
                      return { studentId, channels: data.channels || [] }
                    }
                  } catch (_) {}
                  return { studentId, channels: [] }
                })
              )
              // Build map for quick lookup
              commPrefsResults.forEach(({ studentId, channels }) => {
                commPrefsMap.set(studentId, channels)
              })
            }
          } catch (_) {
            // If batch fetch fails, continue without communication preferences
          }

          const paymentRecords = await Promise.all(result.data.map(async (student: any) => {
            // Find payment document for this student to respect manual settings
            const paymentDoc = paymentDocs.find(p => p.studentId === student.studentId)
            
            let matchedCourse = null as any
            const studentLevel = student.level || student.category
            const courseId = student.enrolledCourse || student.activity
            
            if (courses.length) {
              // Priority 1: Match by course ID first
              if (courseId) {
                matchedCourse = courses.find(c => c.id === courseId) || null
              }
              
              // Priority 2: Try strict matching if Priority 1 failed
              if (!matchedCourse && courseId && student.course && studentLevel) {
                matchedCourse = courses.find(c => (
                  courseId === c.id &&
                  student.course === c.name &&
                  studentLevel === c.level
                )) || null
              }
              
              // Priority 3: Match by course ID and name only
              if (!matchedCourse && courseId && student.course) {
                matchedCourse = courses.find(c => (
                  courseId === c.id &&
                  student.course === c.name
                )) || null
              }
            }
            const finalPayment = matchedCourse?.priceINR || 0
            const totalPaid = student.totalPaidAmount || 0
            const balance = Math.max(0, finalPayment - totalPaid)
            let paymentStatus: 'Paid' | 'Pending' = balance > 0 ? 'Pending' : 'Paid'
            // Compute a next payment date always (even if fully paid) for schedule visibility
            const computedNext = (() => {
              if (student.nextPaymentDate) return student.nextPaymentDate;
              const base = student.courseStartDate || student.paidDate || new Date().toISOString();
              try {
                const d = new Date(base);
                if (!isNaN(d.getTime())) {
                  d.setDate(d.getDate() + 30);
                  return d.toISOString();
                }
              } catch {}
              return null;
            })();

            // Normalize registration fees to nested shape
            const normalizeFees = (raw: any) => {
              if (!raw) return undefined as any
              const toObj = (v: any) => {
                if (v == null) return undefined
                if (typeof v === 'number') return { amount: v, paid: false }
                if (typeof v === 'object') {
                  if (typeof v.amount === 'number') return { amount: v.amount, paid: Boolean(v.paid), paidDate: v.paidDate || undefined }
                  const alt = typeof v.value === 'number' ? v.value : (typeof v.fee === 'number' ? v.fee : (typeof v.cost === 'number' ? v.cost : undefined))
                  if (typeof alt === 'number') return { amount: alt, paid: Boolean(v.paid), paidDate: v.paidDate || undefined }
                }
                return undefined
              }
              const s = toObj(student.registrationFees?.studentRegistration)
              const c = toObj(student.registrationFees?.courseRegistration)
              const conf = toObj(student.registrationFees?.confirmationFee)
              const overallPaid = [s, c, conf].filter(Boolean).every((f: any) => f.paid)
              return {
                studentRegistration: s,
                courseRegistration: c,
                confirmationFee: conf,
                overall: { paid: overallPaid, status: overallPaid ? 'Paid' : 'Pending' }
              }
            }

            // Get cohort data from student.cohort field (format: "COHORTID - Name")
            const cohortField = student.cohort || ''
            let cohortId = ''
            let cohortName = ''
            
            if (cohortField && cohortField.includes(' - ')) {
              const parts = cohortField.split(' - ')
              cohortId = parts[0].trim()
              cohortName = parts.slice(1).join(' - ').trim()
            } else if (cohortField) {
              // If no separator, use the whole string as both ID and name
              cohortId = cohortField
              cohortName = cohortField
            }

            // Get communication preferences from batch fetch
            const communicationChannels = commPrefsMap.get(student.studentId) || []

            return {
              id: student.studentId,
              name: student.name,
              activity: courseId,
              enrolledCourse: student.enrolledCourse || student.activity,
              program: student.program || student.course || 'General Course',
              category: student.category || student.level || '-',
              courseType: matchedCourse?.type || student.courseType || student.type || '-',
              cohort: cohortName,
              cohortId: cohortId,
              paymentStatus,
              totalPaidAmount: totalPaid,
              finalPayment,
              balancePayment: balance,
              paidDate: student.paidDate || null,
              nextDue: computedNext,
              courseStartDate: student.courseStartDate || new Date().toISOString(),
              paymentReminder: paymentDoc && paymentDoc.paymentReminder !== undefined 
                ? paymentDoc.paymentReminder // Use existing payment document setting if it exists
                : (balance > 0), // Default: Reminder on if balance > 0
              communicationText: student.communicationText || 'Payment reminder sent.',
              communicationPreferences: {
                enabled: communicationChannels.length > 0,
                channels: communicationChannels.length > 0 ? communicationChannels : ['Email']
              },
              communicationChannels: communicationChannels,
              paymentDetails: {
                upiId: student.upiId || 'payments@uniqbrio.com',
                phoneNumber: student.phoneNumber || '+91 98765 43210'
              },
              currency: student.currency || 'INR',
              paymentFrequency: student.paymentFrequency || 'One-time',
              nextPaymentDate: computedNext,
              reminderDays: student.reminderDays || 3,
              paymentModes: student.paymentModes || ['UPI', 'Cash'],
              studentType: student.studentType || 'Regular',
              registrationFees: normalizeFees(student.registrationFees) || undefined,
              derivedFinalPayment: !!matchedCourse
            } as PaymentRecord
          }))
          // Only update when we actually have data to show; keep previous state on empty responses
          if (paymentRecords.length > 0) {
            setRecords(paymentRecords)
            setError(null)
            setHasLoadedOnce(true)
          }
        } else {
          throw new Error('Failed to fetch data from both sync and students API');
        }
      }
    } catch (err) {
  console.error('❌ refreshPaymentData error. Status: unknown')
      // Don't set error state for auto-refresh to avoid disturbing UI
      // setError('Failed to refresh payment data')
      
      // Re-throw the error so it can be caught by the caller
      throw err;
    } finally {
      // Don't set loading false for auto-refresh
      // setLoading(false)
    }
  }

  // Central 30-second auto-refresh (in addition to selective polling below)
  // Placed AFTER refreshPaymentData definition so it can be referenced
  const refreshRef = useRef(refreshPaymentData)
  useEffect(() => { refreshRef.current = refreshPaymentData }, [refreshPaymentData])
  useEffect(() => {
    // Avoid multiple intervals if component re-renders
    const id = setInterval(async () => {
      try {
        await refreshRef.current?.();
        setLastAutoRefresh(new Date());
      } catch (e) {
        // silent
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id)
  }, [])

  const handleColumnToggle = (key: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((column) => (column.key === key ? { ...column, visible } : column))
    )
  }

  const restoreDefaultColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem('paymentColumns'); } catch(_) {}
    }
  }

  const isColumnVisible = (key: string) => {
    const column = columns.find((c) => c.key === key)
    return column ? column.visible : false
  }

  const handleExport = () => {
    // This function can be used for additional export logic if needed
    // The main export functionality is handled in the parent component
    console.log('Export triggered from usePaymentLogic');
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
    autoRefreshIntervalMs: AUTO_REFRESH_MS,
    defaultColumns: DEFAULT_COLUMNS,
    restoreDefaultColumns
  }
}