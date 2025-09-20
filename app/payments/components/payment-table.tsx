"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table"
import { useState } from "react"
// CSV export helper (no external dependency)
import { PaymentRecord } from './payment-types'
import { PaymentTableRow } from './payment-table-row'

interface PaymentTableProps {
  filteredRecords: PaymentRecord[];
  isColumnVisible: (key: string) => boolean;
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void;
  refreshPaymentData?: () => void;
  selectedRows: string[];
  setSelectedRows: (rows: string[]) => void;
}

export function PaymentTable({ filteredRecords, isColumnVisible, onUpdateRecord, refreshPaymentData, selectedRows, setSelectedRows }: PaymentTableProps) {
  // Selection logic
  const allSelected = filteredRecords.length > 0 && selectedRows.length === filteredRecords.length;
  const toggleAll = () => {
    setSelectedRows(allSelected ? [] : filteredRecords.map(r => r.id));
  };
  const toggleRow = (id: string) => {
    setSelectedRows(selectedRows.includes(id)
      ? selectedRows.filter((rowId: string) => rowId !== id)
      : [...selectedRows, id]
    );
  };

  // Count visible columns (excluding the checkbox column)
  const visibleColumns = [
    'id', 'name', 'course', 'category', 'courseType', 'registration', 'finalPayment', 'totalPaid', 'balance', 'status',
    'frequency', 'paidDate', 'nextDue', 'courseStartDate', 'reminder', 'mode', 'communication', 'paymentDetails', 'manualPayment', 'payslip', 'actions'
  ].filter(isColumnVisible);

  // Always use min-w-max for the table
  const tableClass = 'min-w-max';

  return (
    <Card className="border-[#9234ea]/30">
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[80vh] relative">
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
                  <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">ID</TableHead>
                )}
                {isColumnVisible('name') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Name</TableHead>}
                {isColumnVisible('course') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Course</TableHead>}
                {isColumnVisible('category') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Category</TableHead>}
                {isColumnVisible('courseType') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Type</TableHead>}
                {isColumnVisible('registration') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Registration</TableHead>}
                {isColumnVisible('finalPayment') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Final Payment</TableHead>}
                {isColumnVisible('totalPaid') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Total Paid</TableHead>}
                {isColumnVisible('balance') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Balance</TableHead>}
                {isColumnVisible('status') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Status</TableHead>}
                {isColumnVisible('frequency') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Frequency</TableHead>}
                {isColumnVisible('paidDate') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Paid Date</TableHead>}
                {isColumnVisible('nextDue') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Next Due</TableHead>}
                {isColumnVisible('courseStartDate') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap text-center">Start Date</TableHead>}
                {isColumnVisible('reminder') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Reminder</TableHead>}
                {isColumnVisible('mode') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Mode</TableHead>}
                {isColumnVisible('communication') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Communication</TableHead>}
                {isColumnVisible('paymentDetails') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Payment Details</TableHead>}
                {isColumnVisible('manualPayment') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Manual Payment</TableHead>}
                {isColumnVisible('payslip') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Payslip</TableHead>}
                {isColumnVisible('actions') && <TableHead className="text-sm p-3 font-semibold sticky top-0 z-40 bg-gray-100 border-b-2 border-[#9234ea]/30 shadow-sm whitespace-nowrap">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record: any) => (
                <PaymentTableRow
                  key={record.id}
                  record={record}
                  isColumnVisible={isColumnVisible}
                  onUpdateRecord={onUpdateRecord}
                  refreshPaymentData={refreshPaymentData}
                  selectable={true}
                  selected={selectedRows.includes(record.id)}
                  onSelectRow={() => toggleRow(record.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


