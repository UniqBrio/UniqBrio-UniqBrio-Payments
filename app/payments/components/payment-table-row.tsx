"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { PaymentRecord, currencySymbols } from './payment-types'
import { Send, QrCode, Smartphone, Link, Edit, Save, X } from "lucide-react"

interface PaymentTableRowProps {
  record: PaymentRecord
  isColumnVisible: (key: string) => boolean
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
}

export function PaymentTableRow({ record, isColumnVisible, onUpdateRecord }: PaymentTableRowProps) {
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const year = date.getFullYear().toString().slice(-2)
    return `${month}'${year}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCurrencyName = (currency: string) => {
    return currency || 'INR'
  }

  const sendReminder = (record: PaymentRecord) => {
    toast({
      title: "✔ Reminder Sent",
      description: `Payment reminder sent to ${record.name} via ${record.reminderMode}`,
    })
  }

  const startEditingText = (record: PaymentRecord) => {
    setEditingText({ id: record.id, text: record.communicationText })
  }

  const saveEditedText = () => {
    if (!editingText) return
    onUpdateRecord(editingText.id, { communicationText: editingText.text })
    setEditingText(null)
    toast({
      title: "✔ Communication Updated",
      description: "Communication text has been updated successfully.",
    })
  }

  return (
    <TableRow key={record.id} className="hover:bg-[#9234ea]/5 border-[#9234ea]/10">
      {isColumnVisible('id') && (
        <TableCell className="font-medium text-sm p-3">{record.id}</TableCell>
      )}
      {isColumnVisible('name') && (
        <TableCell className="text-sm p-3">{record.name}</TableCell>
      )}
      {isColumnVisible('course') && (
        <TableCell className="text-sm p-3">{record.activity}</TableCell>
      )}
      {isColumnVisible('category') && (
        <TableCell className="text-sm p-3">
          <Badge variant="outline" className="text-sm border-purple-200">
            {record.category}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('courseType') && (
        <TableCell className="text-sm p-3">
          <Badge variant="secondary" className="text-sm">
            {record.courseType}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('registration') && (
        <TableCell className="text-sm p-3">
          {record.registrationFees ? (
            <div className="space-y-1">
              {record.registrationFees.studentRegistration && (
                <div className="text-[11px]">
                  Student: {record.registrationFees.studentRegistration} {getCurrencyName(record.currency)}
                </div>
              )}
              {record.registrationFees.courseRegistration && (
                <div className="text-[11px]">
                  Course: {record.registrationFees.courseRegistration} {getCurrencyName(record.currency)}
                </div>
              )}
              {record.registrationFees.confirmationFee && (
                <div className="text-[11px]">
                  Confirmation: {record.registrationFees.confirmationFee} {getCurrencyName(record.currency)}
                </div>
              )}
              <Badge variant={record.registrationFees.paid ? "default" : "destructive"} className="text-[11px]">
                {record.registrationFees.paid ? "✔ Paid" : "Pending"}
              </Badge>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </TableCell>
      )}
      {isColumnVisible('finalPayment') && (
        <TableCell className="text-[11px] p-1 font-medium">
          {record.finalPayment.toLocaleString()} {getCurrencyName(record.currency)}
        </TableCell>
      )}
      {isColumnVisible('totalPaid') && (
        <TableCell className="text-[11px] p-1 text-green-600 font-medium">
          {record.totalPaidAmount.toLocaleString()} {getCurrencyName(record.currency)}
        </TableCell>
      )}
      {isColumnVisible('balance') && (
        <TableCell className="text-[11px] p-1">
          <span className={record.balancePayment > 0 ? "text-red-600 font-medium" : "text-green-600"}>
            {record.balancePayment.toLocaleString()} {getCurrencyName(record.currency)} <span className="text-red-500">*</span>
          </span>
        </TableCell>
      )}
      {isColumnVisible('status') && (
        <TableCell className="text-[11px] p-1">
          <Badge className={`text-[11px] ${getStatusColor(record.paymentStatus)}`}>
            {record.paymentStatus}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('frequency') && (
        <TableCell className="text-[11px] p-1">{record.paymentFrequency}</TableCell>
      )}
      {isColumnVisible('paidDate') && (
        <TableCell className="text-[11px] p-1">{formatDate(record.paidDate)}</TableCell>
      )}
      {isColumnVisible('nextDue') && (
        <TableCell className="text-[11px] p-1">{formatDate(record.nextPaymentDate)}</TableCell>
      )}
      {isColumnVisible('reminder') && (
        <TableCell className="text-[11px] p-1">
          <Badge variant={record.paymentReminder ? "default" : "secondary"} className="text-[11px]">
            {record.paymentReminder ? "On" : "Off"}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('mode') && (
        <TableCell className="text-[11px] p-1">
          <Badge variant="outline" className="text-[11px] border-purple-200">
            {record.reminderMode}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('communication') && (
        <TableCell className="text-[11px] p-1 max-w-xs">
          <div className="space-y-2">
            {editingText && editingText.id === record.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editingText.text}
                  onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                  className="text-[11px]"
                  rows={3}
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={saveEditedText}
                    className="bg-[#9234ea] hover:bg-[#9234ea]/90"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingText(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group">
                <p className="text-[11px] text-gray-600 truncate" title={record.communicationText}>
                  {record.communicationText}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditingText(record)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </TableCell>
      )}
      {isColumnVisible('paymentDetails') && (
        <TableCell className="text-[11px] p-1">
          <div className="flex flex-col gap-1">
            {record.reminderMode === "SMS" ? (
              <>
                {record.paymentDetails.upiId && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Smartphone className="h-3 w-3" />
                    <span>{record.paymentDetails.upiId}</span>
                  </div>
                )}
                {record.paymentDetails.paymentLink && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Link className="h-3 w-3" />
                    <span>Link</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {record.paymentDetails.qrCode && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <QrCode className="h-3 w-3" />
                    <span>QR</span>
                  </div>
                )}
                {record.paymentDetails.upiId && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Smartphone className="h-3 w-3" />
                    <span>{record.paymentDetails.upiId}</span>
                  </div>
                )}
                {record.paymentDetails.paymentLink && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Link className="h-3 w-3" />
                    <span>Link</span>
                  </div>
                )}
              </>
            )}
          </div>
        </TableCell>
      )}
      {isColumnVisible('actions') && (
        <TableCell className="text-sm p-3">
          <div className="flex gap-1">
            {record.paymentReminder && record.balancePayment > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendReminder(record)}
                className="border-[#9234ea]/30 h-7 w-7 p-0"
                title="Send Reminder"
              >
                <Send className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}