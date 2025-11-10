"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table"
import { useMemo, useState, useEffect } from "react"
// CSV export helper (no external dependency)
import { PaymentRecord } from './payment-types'
import { PaymentTableRow } from './payment-table-row'
import RecordDetailsDialog, { RecordDetailsSection } from './record-details-dialog'
import { Hash, User, Tag, BookOpen, Users, GraduationCap, CreditCard, DollarSign, Calendar, Bell, Smartphone } from "lucide-react"
import { getRegistrationSummary } from './registration-fees-display'

interface PaymentTableProps {
  filteredRecords: PaymentRecord[];
  isColumnVisible: (key: string) => boolean;
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void;
   refreshPaymentData?: () => void;
  selectedRows: string[];
  setSelectedRows: (rows: string[]) => void;
}

export function PaymentTable({ filteredRecords, isColumnVisible, onUpdateRecord, refreshPaymentData, selectedRows, setSelectedRows }: PaymentTableProps) {
  // Composite row key to disambiguate same-student across multiple courses
  const rowKey = (r: any) => `${r.id}::${r.matchedCourseId || r.activity || r.enrolledCourse || 'NA'}`;
  // Selection logic
  const allSelected = filteredRecords.length > 0 && selectedRows.length === filteredRecords.length && filteredRecords.every(r => selectedRows.includes(rowKey(r)));
  const toggleAll = () => {
    setSelectedRows(allSelected ? [] : filteredRecords.map(r => rowKey(r)));
  };
  const toggleRow = (id: string) => {
    setSelectedRows(selectedRows.includes(id)
      ? selectedRows.filter((rowId: string) => rowId !== id)
      : [...selectedRows, id]
    );
  };

  // Count visible columns (excluding the checkbox column)
  const visibleColumns = [
    'id', 'name', 'course', 'category', 'courseType', 'registration',
    'courseRegFee', 'studentRegFee',
    'finalPayment', 'totalPaid', 'balance', 'status',
    'paidDate', 'nextDue', 'courseStartDate', 'reminder', 'mode', 'communication', 'paymentDetails', 'manualPayment', 'payslip', 'actions'
  ].filter(isColumnVisible);

  // Always use min-w-max for the table
  const tableClass = 'min-w-max';

  // Details dialog state
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null)
  const [dialogPaymentMethods, setDialogPaymentMethods] = useState<string[]>([])

  const openDetails = (record: PaymentRecord) => {
    setSelectedRecord(record)
    setDetailsOpen(true)
  }

  // When dialog opens, fetch paymentRecords from backend to populate Modes reliably
  useEffect(() => {
    const fetchMethods = async () => {
      if (!detailsOpen || !selectedRecord) return
      try {
        const courseId = (selectedRecord as any).matchedCourseId || (selectedRecord as any).activity || (selectedRecord as any).enrolledCourse
        const resp = await fetch(`/api/payments?studentId=${encodeURIComponent(selectedRecord.id)}${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ''}`, { cache: 'no-store' })
        if (!resp.ok) return
        const json = await resp.json()
        const doc: any = json.data || json
        const records = Array.isArray(doc?.paymentRecords) ? doc.paymentRecords : []
        const methods: string[] = Array.from(new Set(records
          .map((r: any) => r?.paymentMethod)
          .filter((m: any) => typeof m === 'string' && m.trim().length > 0)))
        setDialogPaymentMethods(methods)
      } catch { /* ignore network errors for dialog extras */ }
    }
    fetchMethods()
  }, [detailsOpen, selectedRecord])

  const sections: RecordDetailsSection[] = useMemo(() => {
    if (!selectedRecord) return []
    const r = selectedRecord as any
    // Extract payment methods from backend paymentRecords (unique list)
    // Prefer payment methods fetched from backend when available
    let paymentMethods: string[] = dialogPaymentMethods.length > 0 ? dialogPaymentMethods
      : Array.isArray((r as any).paymentRecords)
      ? Array.from(new Set((r as any).paymentRecords
          .map((pr: any) => pr?.paymentMethod)
          .filter((pm: any) => typeof pm === 'string' && pm.trim().length > 0)))
      : []
    // Fallback to legacy paymentModes field when backend didn't include embedded paymentRecords
    if (paymentMethods.length === 0 && Array.isArray((r as any).paymentModes)) {
      paymentMethods = Array.from(new Set((r as any).paymentModes.filter((pm: any) => typeof pm === 'string' && pm.trim().length > 0)))
    }
    // Compute a consistent payment summary (matches table logic)
    const regSummary = getRegistrationSummary(r.registrationFees)
    const totalRegAmount = regSummary?.totalAmount || 0
    const totalPaid = r.totalPaidAmount || 0
    const overallDue = (r.finalPayment || 0) + totalRegAmount
    const overallBalance = Math.max(overallDue - totalPaid, 0)
    const statusLabel = overallDue <= 0
      ? '-'
      : (overallBalance === 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Pending'))
    const effectiveStatus = (r.paymentStatus && r.paymentStatus !== '-') ? r.paymentStatus : statusLabel
    return [
      {
        title: 'Student',
        fields: [
          { label: 'Student ID', value: r.id, icon: <Hash size={16} /> },
          { label: 'Student Name', value: r.name, icon: <User size={16} /> },
          { label: 'Category', value: r.category, icon: <Tag size={16} /> },
        ],
      },
      {
        title: 'Course',
        fields: [
          { label: 'Enrolled Course', value: r.program || r.enrolledCourse || r.activity || 'N/A', icon: <BookOpen size={16} /> },
          { label: 'Enrolled Course ID', value: (r as any).matchedCourseId || r.enrolledCourse || r.activity || '-', icon: <Hash size={16} /> },
          { label: 'Cohort', value: r.cohort || 'Unassigned', icon: <Users size={16} /> },
          { label: 'Cohort ID', value: (r as any).cohortId || '-', icon: <Hash size={16} /> },
          { label: 'Course Type', value: r.courseType || '-', icon: <GraduationCap size={16} /> },
        ],
      },
      {
        title: 'Payment Summary',
        fields: [
          { label: 'Course Fee', value: `₹${(r.finalPayment || 0).toLocaleString()}` , icon: <DollarSign size={16} /> },
          { label: 'Student Registration', value: r?.registrationFees?.studentRegistration?.amount ? `₹${r.registrationFees.studentRegistration.amount.toLocaleString()}` : '-', icon: <CreditCard size={16} /> },
          { label: 'Course Registration', value: r?.registrationFees?.courseRegistration?.amount ? `₹${r.registrationFees.courseRegistration.amount.toLocaleString()}` : '-', icon: <CreditCard size={16} /> },
          { label: 'Total Paid', value: `₹${(totalPaid).toLocaleString()}` , icon: <DollarSign size={16} /> },
          { label: 'Balance', value: `₹${(overallBalance).toLocaleString()}` , icon: <DollarSign size={16} /> },
          { label: 'Status', value: effectiveStatus, icon: <Tag size={16} /> },
          { label: 'Paid Date', value: r.paidDate ? new Date(r.paidDate).toLocaleDateString() : '-', icon: <Calendar size={16} /> },
        ],
      },
      {
        title: 'Payment Details',
        fields: [
          { label: 'Modes', value: paymentMethods.length ? paymentMethods.join(', ') : '-', icon: <CreditCard size={16} /> },
          { label: 'Reminder', value: r.paymentReminder ? 'On' : 'Off', icon: <Bell size={16} /> },
        ],
      },
    ]
  }, [selectedRecord, dialogPaymentMethods])

  return (
    <Card className="border-[#9234ea]/30">
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[80vh] relative" data-payment-table>
          <Table className="min-w-[1500px] relative" style={{ tableLayout: 'fixed' }}>
            <TableHeader className="sticky top-0 z-30">
              <TableRow className="bg-gray-100 border-[#9234ea]/20">
                <TableHead className="p-3 w-[50px] sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
                {isColumnVisible('id') && (
                  <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[120px] text-center">Student ID</TableHead>
                )}
                {isColumnVisible('name') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[180px] text-center">Student Name</TableHead>}
                {isColumnVisible('category') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[140px] text-center">Student Category</TableHead>}
                {isColumnVisible('program') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[220px] text-center">Enrolled Course</TableHead>}
                {isColumnVisible('cohort') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[220px] text-center">Cohort</TableHead>}
                {isColumnVisible('courseType') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[140px] text-center">Course Type</TableHead>}
                {isColumnVisible('courseRegFee') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[150px] text-center">Course Reg Fee</TableHead>}
                {isColumnVisible('studentRegFee') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[160px] text-center">Student Reg Fee</TableHead>}
                {isColumnVisible('finalPayment') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[150px] text-center">Course Fee (INR)</TableHead>}
                {isColumnVisible('totalPaid') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[150px] text-center">Total Paid (INR)</TableHead>}
                {isColumnVisible('balance') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[150px] text-center">Balance (INR)</TableHead>}
                {isColumnVisible('status') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[120px] text-center">Status</TableHead>}
                {isColumnVisible('paidDate') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center w-[140px]">Paid Date</TableHead>}
                {/* {isColumnVisible('nextDue') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Next Due</TableHead>}
                {isColumnVisible('courseStartDate') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Start Date</TableHead>} */}
                {isColumnVisible('reminder') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[120px] text-center">Reminder</TableHead>}
                {/* {isColumnVisible('mode') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Mode</TableHead>} */}
                {/* {isColumnVisible('communication') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Communication</TableHead>} */}
                {/* {isColumnVisible('paymentDetails') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Payment Details</TableHead>} */}
                {isColumnVisible('manualPayment') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[160px] text-center">Manual Payment</TableHead>}
                {isColumnVisible('payslip') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap w-[120px] text-center">Invoice</TableHead>}
                {isColumnVisible('actions') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center w-[160px]">Send Reminder</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record: any) => (
                <PaymentTableRow
                  key={rowKey(record)}
                  record={record}
                  isColumnVisible={isColumnVisible}
                  onUpdateRecord={onUpdateRecord}
                  refreshPaymentData={refreshPaymentData}
                  selectable={true}
                  selected={selectedRows.includes(rowKey(record))}
                  onSelectRow={() => toggleRow(rowKey(record))}
                  onViewDetails={() => openDetails(record)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Details Dialog */}
        {selectedRecord && (
          <RecordDetailsDialog
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            title={selectedRecord.name}
            subtitle={selectedRecord.id}
            avatarFallback={selectedRecord?.name ? selectedRecord.name.split(' ').map((p: string) => p[0]).join('').slice(0,2) : '👤'}
            {
              ...(() => {
                // Derive a consistent status for the header badge (treat '-' as missing)
                const rs = getRegistrationSummary(selectedRecord.registrationFees)
                const totalReg = rs?.totalAmount || 0
                const totalPaid = selectedRecord.totalPaidAmount || 0
                const overallDue = (selectedRecord.finalPayment || 0) + totalReg
                const overallBalance = Math.max(overallDue - totalPaid, 0)
                const computed = overallDue <= 0
                  ? '-'
                  : (overallBalance === 0
                      ? 'Paid'
                      : (totalPaid > 0 ? 'Partial' : 'Pending'))
                const label = (selectedRecord.paymentStatus && selectedRecord.paymentStatus !== '-') ? selectedRecord.paymentStatus : computed
                const tone = label === 'Paid' ? 'success' : (label === '-' ? 'default' : 'warning')
                return { status: { label, tone } }
              })()
            }
            headerChips={
              <>
                {selectedRecord.category && (
                  <span className="rdd-chip">{selectedRecord.category}</span>
                )}
              </>
            }
            sections={sections}
            actions={
              <>
                <button className="rdd-btn" onClick={() => setDetailsOpen(false)}>Close</button>
              </>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

