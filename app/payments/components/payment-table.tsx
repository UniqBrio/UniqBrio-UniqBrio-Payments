"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaymentRecord } from './payment-types'
import { PaymentTableRow } from './payment-table-row'

interface PaymentTableProps {
  filteredRecords: PaymentRecord[]
  isColumnVisible: (key: string) => boolean
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
}

export function PaymentTable({ filteredRecords, isColumnVisible, onUpdateRecord }: PaymentTableProps) {
  return (
    <Card className="border-[#9234ea]/30">
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#9234ea]/5 border-[#9234ea]/10">
                {isColumnVisible('id') && <TableHead className="text-sm p-3 font-semibold">ID</TableHead>}
                {isColumnVisible('name') && <TableHead className="text-sm p-3 font-semibold">Name</TableHead>}
                {isColumnVisible('course') && <TableHead className="text-sm p-3 font-semibold">Course</TableHead>}
                {isColumnVisible('category') && <TableHead className="text-sm p-3 font-semibold">Category</TableHead>}
                {isColumnVisible('courseType') && <TableHead className="text-sm p-3 font-semibold">Type</TableHead>}
                {isColumnVisible('registration') && <TableHead className="text-sm p-3 font-semibold">Registration</TableHead>}
                {isColumnVisible('finalPayment') && <TableHead className="text-sm p-3 font-semibold">Final Payment</TableHead>}
                {isColumnVisible('totalPaid') && <TableHead className="text-sm p-3 font-semibold">Total Paid</TableHead>}
                {isColumnVisible('balance') && <TableHead className="text-sm p-3 font-semibold">Balance</TableHead>}
                {isColumnVisible('status') && <TableHead className="text-sm p-3 font-semibold">Status</TableHead>}
                {isColumnVisible('frequency') && <TableHead className="text-sm p-3 font-semibold">Frequency</TableHead>}
                {isColumnVisible('paidDate') && <TableHead className="text-sm p-3 font-semibold">Paid Date</TableHead>}
                {isColumnVisible('nextDue') && <TableHead className="text-sm p-3 font-semibold">Next Due</TableHead>}
                {isColumnVisible('reminder') && <TableHead className="text-sm p-3 font-semibold">Reminder</TableHead>}
                {isColumnVisible('mode') && <TableHead className="text-sm p-3 font-semibold">Mode</TableHead>}
                {isColumnVisible('communication') && <TableHead className="text-sm p-3 font-semibold">Communication</TableHead>}
                {isColumnVisible('paymentDetails') && <TableHead className="text-sm p-3 font-semibold">Payment Details</TableHead>}
                {isColumnVisible('actions') && <TableHead className="text-sm p-3 font-semibold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <PaymentTableRow
                  key={record.id}
                  record={record}
                  isColumnVisible={isColumnVisible}
                  onUpdateRecord={onUpdateRecord}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}