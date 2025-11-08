"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table"
import { useMemo, useState } from "react"
// CSV export helper (no external dependency)
import { PaymentRecord } from './payment-types'
import { PaymentTableRow } from './payment-table-row'
import RecordDetailsDialog, { RecordDetailsSection } from './record-details-dialog'

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

  const openDetails = (record: PaymentRecord) => {
    setSelectedRecord(record)
    setDetailsOpen(true)
  }

  const sections: RecordDetailsSection[] = useMemo(() => {
    if (!selectedRecord) return []
    const r = selectedRecord as any
    return [
      {
        title: 'Student',
        fields: [
          { label: 'Student ID', value: r.id },
          { label: 'Student Name', value: r.name },
          { label: 'Category', value: r.category },
        ],
      },
      {
        title: 'Course',
        fields: [
          { label: 'Enrolled Course', value: r.program || r.enrolledCourse || r.activity || 'N/A' },
          { label: 'Enrolled Course ID', value: r.enrolledCourse || r.activity || r.matchedCourseId || '-' },
          { label: 'Course Type', value: r.courseType || '-' },
        ],
      },
      {
        title: 'Payment Summary',
        fields: [
          { label: 'Course Fee', value: (r.finalPayment || 0).toLocaleString() },
          { label: 'Student Registration', value: r?.registrationFees?.studentRegistration?.amount?.toLocaleString?.() ?? '-' },
          { label: 'Course Registration', value: r?.registrationFees?.courseRegistration?.amount?.toLocaleString?.() ?? '-' },
          { label: 'Total Paid', value: (r.totalPaidAmount || 0).toLocaleString() },
          { label: 'Balance', value: (r.balancePayment || 0).toLocaleString() },
          
          { label: 'Status', value: r.paymentStatus || '-' },
          { label: 'Paid Date', value: r.paidDate ? new Date(r.paidDate).toLocaleDateString() : '-' },
        ],
      },
      {
        title: 'Payment Details',
        fields: [
          { label: 'UPI ID', value: r?.paymentDetails?.upiId || '-' },
          { label: 'Modes', value: Array.isArray(r?.paymentModes) ? r.paymentModes.join(', ') : (r?.paymentModes || '-') },
          { label: 'Reminder', value: r.paymentReminder ? 'On' : 'Off' },
        ],
      },
    ]
  }, [selectedRecord])

  return (
    <Card className="border-[#9234ea]/30">
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[80vh] relative" data-payment-table>
          <Table className="min-w-[1500px] relative">
            <TableHeader className="sticky top-0 z-30">
              <TableRow className="bg-gray-100 border-[#9234ea]/20">
                <TableHead className="p-3 w-8 sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
                {isColumnVisible('id') && (
                  <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Student ID</TableHead>
                )}
                {isColumnVisible('name') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Student Name</TableHead>}
                {isColumnVisible('category') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Student Category</TableHead>}
                {isColumnVisible('program') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Enrolled Course</TableHead>}
                {isColumnVisible('course') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Enrolled CourseId</TableHead>}
                {isColumnVisible('courseType') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Course Type</TableHead>}
                {isColumnVisible('courseRegFee') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Course Reg Fee</TableHead>}
                {isColumnVisible('studentRegFee') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Student Reg Fee</TableHead>}
                {isColumnVisible('finalPayment') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Course Fee (INR)</TableHead>}
                {isColumnVisible('totalPaid') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Total Paid (INR)</TableHead>}
                {isColumnVisible('balance') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap min-w-[120px]">Balance (INR)</TableHead>}
                {isColumnVisible('status') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Status</TableHead>}
                {isColumnVisible('paidDate') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Paid Date</TableHead>}
                {/* {isColumnVisible('nextDue') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Next Due</TableHead>}
                {isColumnVisible('courseStartDate') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Start Date</TableHead>} */}
                {isColumnVisible('reminder') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Reminder</TableHead>}
                {/* {isColumnVisible('mode') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Mode</TableHead>} */}
                {/* {isColumnVisible('communication') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Communication</TableHead>} */}
                {/* {isColumnVisible('paymentDetails') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Payment Details</TableHead>} */}
                {isColumnVisible('manualPayment') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Manual Payment</TableHead>}
                {isColumnVisible('payslip') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Invoice</TableHead>}
                {isColumnVisible('actions') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Send Reminder</TableHead>}
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
            status={{ label: selectedRecord.paymentStatus || '-', tone: (selectedRecord.balancePayment ?? 0) === 0 ? 'success' : 'warning' }}
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


