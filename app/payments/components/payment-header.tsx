"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { StudentManualPayment, StudentManualPaymentPayload } from './student-manual-payment'
import { PayslipButton } from './payslip-button'

interface PaymentHeaderProps {
  records: any[]
  onManualPayment: (payload: StudentManualPaymentPayload) => void
  onShowCourseSummary: () => void
}

export function PaymentHeader({ records, onManualPayment, onShowCourseSummary }: PaymentHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-1">Track student payments, send reminders, and manage financial records</p>
      </div>
      <div className="flex gap-2">
        <StudentManualPayment 
          students={records}
          onSubmit={onManualPayment}
        />
        <PayslipButton students={records} />
        <Button
          onClick={onShowCourseSummary}
          className="bg-[#9234ea] hover:bg-[#9234ea]/90"
        >
          <FileText className="h-4 w-4 mr-2" />
          Course Summary
        </Button>
      </div>
    </div>
  )
}