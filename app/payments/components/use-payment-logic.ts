import { useState, useEffect } from "react"
import { PaymentRecord, PaymentSummary } from './payment-types'
import { ColumnConfig } from './column-visibility'

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
    { key: 'paidDate', label: 'Paid Date', visible: false },
    { key: 'nextDue', label: 'Next Due', visible: true },
    { key: 'reminder', label: 'Reminder', visible: false },
    { key: 'mode', label: 'Mode', visible: false },
    { key: 'communication', label: 'Communication Text', visible: false },
    { key: 'paymentDetails', label: 'Payment Details', visible: false },
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

  // Fetch students from database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/students')
        const result = await response.json()
        
        if (result.success) {
          const paymentRecords = result.data.map((student: any) => ({
            id: student.studentId || student._id || 'N/A', // Ensure ID is always populated
            name: student.name || 'Unknown',
            activity: student.activity || 'No Course Assigned', // Default value for course
            category: student.category || 'Regular',
            courseType: 'Individual',
            currency: 'INR',
            finalPayment: student.finalPayment || 0, // Default to 0 if missing
            totalPaidAmount: student.totalPaidAmount || 0,
            balancePayment: student.balancePayment || (student.finalPayment || 0) - (student.totalPaidAmount || 0),
            paymentStatus: student.paymentStatus || (student.totalPaidAmount > 0 ? (student.balancePayment === 0 ? 'Paid' : 'Partial') : 'Pending'),
            paymentFrequency: student.paymentFrequency || 'Monthly',
            paidDate: student.paidDate || '',
            nextPaymentDate: student.nextPaymentDate || '',
            paymentReminder: student.paymentReminder !== false,
            reminderMode: student.reminderMode || 'Email',
            communicationText: student.communicationText || `Payment reminder for ${student.activity || 'course'}`,
            registrationFees: student.registrationFees || {
              studentRegistration: 500,
              courseRegistration: 1000,
              confirmationFee: 250,
              paid: false
            },
            paymentDetails: student.paymentDetails || {
              upiId: 'student@upi',
              paymentLink: 'https://pay.example.com',
              qrCode: 'QR123'
            }
          }))
          setRecords(paymentRecords)
          setError(null)
        } else {
          setError('Failed to fetch students')
        }
      } catch (err) {
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
    const updatedRecords = records.map((record: PaymentRecord) => (record.id === id ? { ...record, ...updates } : record))
    setRecords(updatedRecords)
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
    handleColumnToggle,
    isColumnVisible,
    handleExport,
    loading,
    error
  }
}