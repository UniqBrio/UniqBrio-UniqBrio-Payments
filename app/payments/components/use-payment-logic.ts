import { useState, useEffect } from "react"
import { PaymentRecord, PaymentSummary } from './payment-types'
import { ColumnConfig } from './column-visibility'
import { getCoursePricing } from './course-pricing-helper'

export function usePaymentLogic() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
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
    { key: 'registration', label: 'Registration', visible: false },
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
            // Process each student's payment record (legacy method)
            const paymentRecords = await Promise.all(result.data.map(async (student: any) => {
              // Get course pricing from multiple sources
              let finalPayment = student.finalPayment || 0;
              
              // If finalPayment is not set or is 0, try to calculate it
              if (finalPayment === 0) {
                const courseName = student.course || student.activity || 'General Course';
                
                // First try to get from course pricing API
                if (courseName) {
                  try {
                    const coursePrice = await getCoursePricing(
                      courseName,
                      student.level || 'Beginner',
                      student.type || 'Individual'
                    );
                    if (coursePrice && coursePrice.priceINR > 0) {
                      finalPayment = coursePrice.priceINR;
                    }
                  } catch (error) {
                    console.log('Course pricing fetch failed, using defaults');
                  }
                }
                
                // If still no pricing found, use smart defaults based on course type
                if (finalPayment === 0) {
                  const courseNameLower = courseName.toLowerCase();
                  const defaultPricing: { [key: string]: number } = {
                    'art': 15000,
                    'photography': 12000,
                    'music': 10000,
                    'dance': 8000,
                    'craft': 6000,
                    'drama': 7000,
                    'digital art': 18000,
                    'singing': 9000,
                    'guitar': 11000,
                    'piano': 13000,
                    'painting': 14000,
                    'drawing': 8000,
                    'sculpture': 16000
                  };
                  
                  // Find matching course price
                  finalPayment = 10000; // Default base price
                  for (const [course, price] of Object.entries(defaultPricing)) {
                    if (courseNameLower.includes(course)) {
                      finalPayment = price;
                      break;
                    }
                  }
                  
                  console.log(`Using default pricing for ${courseName}: ₹${finalPayment}`);
                }
              }
              
              const totalPaid = student.totalPaidAmount || 0;
              const balance = Math.max(0, finalPayment - totalPaid);
              
              const courseName = student.course || student.activity || 'General Course';
              
              // Set proper course start date and next payment date
              const courseStartDate = student.courseStartDate ? new Date(student.courseStartDate) : new Date();
              const paidDate = student.paidDate ? new Date(student.paidDate) : courseStartDate;
              const nextPaymentDate = student.nextPaymentDate ? new Date(student.nextPaymentDate) : 
                new Date(courseStartDate.getTime() + 30*24*60*60*1000); // 30 days from start
              
              // Calculate smart payment status based on balance and due date
              let paymentStatus = 'Paid';
              let reminderEnabled = true; // Default reminder setting
              
              if (balance > 0) {
                const today = new Date();
                const daysUntilDue = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                // Always show Pending if there's any balance remaining
                paymentStatus = 'Pending';
              } else {
                // If payment is fully paid, turn off reminders
                reminderEnabled = false;
              }
              
              // Apply same logic to registration fees
              let registrationStatus = 'Paid';
              const registrationFees = student.registrationFees || {
                studentRegistration: 500,
                courseRegistration: 1000,
                confirmationFee: 250,
                paid: false
              };
              
              if (!registrationFees.paid) {
                registrationStatus = 'Pending';
                registrationFees.paid = false;
                registrationFees.status = registrationStatus;
              }
              
              // Generate default communication text based on payment status
              let defaultCommunicationText = `Payment reminder for ${courseName}. Amount due: ₹${balance}. Please pay by ${nextPaymentDate.toLocaleDateString()}.`;
              
              if (paymentStatus === 'Pending') {
                defaultCommunicationText = `Payment reminder for ${courseName}. Amount due: ₹${balance}. Due date: ${nextPaymentDate.toLocaleDateString()}. Please complete your payment to continue.`;
              }
              
              return {
                id: student.studentId || student._id || `STU${Date.now()}`,
                name: student.name || 'Unknown Student',
                activity: courseName,
                category: student.category || 'Regular',
                courseType: student.courseType || 'Individual',
                cohort: student.cohort || `${courseName.replace(/\s+/g, '')}_${new Date().getFullYear()}_Batch01`,
                batch: student.batch || 'Morning Batch',
                instructor: student.instructor || 'TBD',
                classSchedule: student.classSchedule || 'Mon-Wed-Fri 10:00-12:00',
                currency: student.currency || 'INR',
                finalPayment: finalPayment,
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
                reminderDays: student.reminderDays || [7, 3, 1], // Default reminder days
                registrationFees: registrationFees,
                paymentDetails: student.paymentDetails || {
                  upiId: student.upiId || 'payment@uniqbrio.com',
                  paymentLink: student.paymentLink || 'https://pay.uniqbrio.com',
                  qrCode: student.qrCode || 'QR_CODE_PLACEHOLDER'
                },
                paymentModes: student.paymentModes || ['UPI', 'Card', 'Bank Transfer'],
                studentType: student.studentType || 'New',
                emiSplit: student.emiSplit || 1
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
  }, [searchTerm, statusFilters, categoryFilters, courseFilters, sortBy, sortOrder, records])

  const paymentSummary: PaymentSummary = {
    receivedPayment: records.reduce((sum: number, record: PaymentRecord) => sum + record.totalPaidAmount, 0),
    outstandingPayment: records.reduce((sum: number, record: PaymentRecord) => sum + record.balancePayment, 0),
    totalPayment: records.reduce((sum: number, record: PaymentRecord) => sum + record.finalPayment, 0),
    profit: records.reduce((sum: number, record: PaymentRecord) => sum + record.totalPaidAmount * 0.3, 0),
  }

  const handleUpdateRecord = (id: string, updates: Partial<PaymentRecord>) => {
    console.log('Updating record:', id, updates); // Debug log
    const updatedRecords = records.map((record: PaymentRecord) => (record.id === id ? { ...record, ...updates } : record))
    setRecords(updatedRecords)
  }

  const refreshPaymentData = async () => {
    console.log('Refreshing payment data...'); // Debug log
    try {
      setLoading(true)
      
      // Try to fetch updated data from sync endpoint first
      let response = await fetch('/api/payments/sync')
      let result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('Payment data refreshed from sync:', result.data.length, 'records'); // Debug log
        setRecords(result.data)
        setError(null)
      } else {
        // Fallback to students API if sync fails
        console.log('Sync failed, falling back to students API'); // Debug log
        response = await fetch('/api/students')
        result = await response.json()
        
        if (result.success) {
          // Process student data into payment records (existing logic)
          const paymentRecords = await Promise.all(result.data.map(async (student: any) => {
            // Get course pricing from DB only, using student.course || student.activity
            let finalPayment = 0;
            const courseName = student.course || student.activity || 'General Course';
            if (courseName) {
              const coursePrice = await getCoursePricing(
                courseName,
                student.level || 'Beginner',
                student.type || 'Individual'
              );
              if (coursePrice) {
                finalPayment = coursePrice.priceINR;
              } else {
                finalPayment = 5000; // Default course fee if pricing not found
              }
            }
            
            const totalPaid = student.totalPaidAmount || 0;
            const balance = Math.max(0, finalPayment - totalPaid);
            
            // Calculate payment status
            let paymentStatus = 'Paid';
            if (balance > 0) {
              const today = new Date();
              const nextPaymentDate = student.nextPaymentDate ? new Date(student.nextPaymentDate) : 
                new Date(Date.now() + 30*24*60*60*1000);
              const daysUntilDue = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              if (balance > 0) {
                // Always show Pending if there's any balance remaining
                paymentStatus = 'Pending';
              }
            }
            
            return {
              id: student.studentId,
              name: student.name,
              activity: student.course || student.activity || 'General Course',
              category: student.category || 'Regular',
              courseType: student.courseType || 'Individual',
              cohort: student.cohort || `${student.course}_${new Date().getFullYear()}_Batch01`,
              paymentStatus: paymentStatus as "Paid" | "Pending",
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
              // Additional required properties
              paymentFrequency: student.paymentFrequency || 'One-time',
              nextPaymentDate: student.nextPaymentDate || null,
              reminderDays: student.reminderDays || 3,
              paymentModes: student.paymentModes || ['UPI', 'Cash'],
              studentType: student.studentType || 'Regular'
            } as PaymentRecord;
          }));
          
          console.log('Payment data refreshed from students API:', paymentRecords.length, 'records');
          setRecords(paymentRecords);
          setError(null);
        } else {
          throw new Error('Failed to fetch data from both sync and students API');
        }
      }
    } catch (err) {
      console.error('Refresh error:', err)
      setError('Failed to refresh payment data')
    } finally {
      setLoading(false)
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