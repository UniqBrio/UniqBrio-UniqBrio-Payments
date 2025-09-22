"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { PaymentRecord } from './payment-types'
import { Edit, Save, X } from "lucide-react"
import { PaymentActions } from "./payment-actions"
import { formatCurrency, formatDate, getStatusColor, getCurrencyName } from "./payment-utils"

interface PaymentTableRowProps {
  record: PaymentRecord
  isColumnVisible: (key: string) => boolean
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
  refreshPaymentData?: () => void
  selectable?: boolean
  selected?: boolean
  onSelectRow?: () => void
}

export function PaymentTableRow({ record, isColumnVisible, onUpdateRecord, refreshPaymentData, selectable, selected, onSelectRow }: PaymentTableRowProps) {
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null)

  const handleEdit = (field: string, value: string) => {
    setEditingText({ id: field, text: value })
  }

  const handleSave = (field: string) => {
    if (editingText) {
      onUpdateRecord(record.id, { [field]: editingText.text })
      setEditingText(null)
      toast({
        title: "Updated",
        description: `${field} has been updated successfully.`,
      })
    }
  }

  const handleCancel = () => {
    setEditingText(null)
  }

  return (
    <TableRow className="hover:bg-gray-50">
      {/* Selection Checkbox */}
      {selectable && isColumnVisible('select') && (
        <TableCell className="w-12">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelectRow}
            className="rounded border-gray-300"
          />
        </TableCell>
      )}

      {/* Student Name */}
      {isColumnVisible('name') && (
        <TableCell className="font-medium text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xs text-purple-600 font-semibold">
                {record.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{record.name}</p>
              <p className="text-xs text-gray-500">{record.id}</p>
            </div>
          </div>
        </TableCell>
      )}

      {/* Course Activity */}
      {isColumnVisible('activity') && (
        <TableCell className="text-sm">{record.activity}</TableCell>
      )}

      {/* Category */}
      {isColumnVisible('category') && (
        <TableCell className="text-sm">
          <Badge variant="outline" className="text-xs">
            {record.category}
          </Badge>
        </TableCell>
      )}

      {/* Course Type */}
      {isColumnVisible('courseType') && (
        <TableCell className="text-sm">
          <Badge 
            variant={record.courseType === 'Special' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {record.courseType}
          </Badge>
        </TableCell>
      )}

      {/* Final Payment */}
      {isColumnVisible('finalPayment') && (
        <TableCell className="text-sm font-medium">
          {formatCurrency(record.finalPayment, record.currency)}
        </TableCell>
      )}

      {/* Total Paid Amount */}
      {isColumnVisible('totalPaidAmount') && (
        <TableCell className="text-sm text-green-600 font-medium">
          {formatCurrency(record.totalPaidAmount, record.currency)}
        </TableCell>
      )}

      {/* Balance Payment */}
      {isColumnVisible('balancePayment') && (
        <TableCell className={`text-sm font-medium ${record.balancePayment === 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(record.balancePayment, record.currency)}
        </TableCell>
      )}

      {/* Registration Fees */}
      {isColumnVisible('registrationFees') && (
        <TableCell className="text-sm">
          {record.registrationFees ? (
            <div className="space-y-1">
              {record.registrationFees.studentRegistration > 0 && (
                <div className="text-xs text-blue-600">
                  Student: {formatCurrency(record.registrationFees.studentRegistration, record.currency)}
                </div>
              )}
              {record.registrationFees.courseRegistration > 0 && (
                <div className="text-xs text-blue-600">
                  Course: {formatCurrency(record.registrationFees.courseRegistration, record.currency)}
                </div>
              )}
              {record.registrationFees.confirmationFee > 0 && (
                <div className="text-xs text-blue-600">
                  Confirmation: {formatCurrency(record.registrationFees.confirmationFee, record.currency)}
                </div>
              )}
              <Badge 
                variant={record.registrationFees.paid ? "default" : "destructive"} 
                className="text-xs"
              >
                {record.registrationFees.paid ? "Paid" : "Pending"}
              </Badge>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </TableCell>
      )}

      {/* Payment Status */}
      {isColumnVisible('paymentStatus') && (
        <TableCell className="text-sm">
          <Badge className={`${getStatusColor(record.paymentStatus)} text-xs`}>
            {record.paymentStatus}
          </Badge>
        </TableCell>
      )}

      {/* Payment Frequency */}
      {isColumnVisible('paymentFrequency') && (
        <TableCell className="text-sm">{record.paymentFrequency}</TableCell>
      )}

      {/* Next Payment Date */}
      {isColumnVisible('nextPaymentDate') && (
        <TableCell className="text-sm">{formatDate(record.nextPaymentDate)}</TableCell>
      )}

      {/* Paid Date */}
      {isColumnVisible('paidDate') && (
        <TableCell className="text-sm">{formatDate(record.paidDate)}</TableCell>
      )}

      {/* Payment Reminder */}
      {isColumnVisible('paymentReminder') && (
        <TableCell className="text-sm">
          <Badge variant={record.paymentReminder ? "default" : "secondary"} className="text-xs">
            {record.paymentReminder ? "Enabled" : "Disabled"}
          </Badge>
        </TableCell>
      )}

      {/* Reminder Mode */}
      {isColumnVisible('reminderMode') && (
        <TableCell className="text-sm">{record.reminderMode}</TableCell>
      )}

      {/* Communication Text */}
      {isColumnVisible('communicationText') && (
        <TableCell className="text-sm max-w-xs">
          {editingText?.id === 'communicationText' ? (
            <div className="flex items-center gap-1">
              <Textarea
                value={editingText.text}
                onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                className="text-xs p-1 h-16 resize-none"
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => handleSave('communicationText')}
                  className="h-6 w-6 p-0"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs truncate">{record.communicationText}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit('communicationText', record.communicationText)}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </TableCell>
      )}

      {/* Currency */}
      {isColumnVisible('currency') && (
        <TableCell className="text-sm">
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs">{record.currency}</span>
            <span className="text-xs text-gray-500">({getCurrencyName(record.currency)})</span>
          </div>
        </TableCell>
      )}

      {/* EMI Split */}
      {isColumnVisible('emiSplit') && (
        <TableCell className="text-sm">{record.emiSplit || '-'}</TableCell>
      )}

      {/* Payment Modes */}
      {isColumnVisible('paymentModes') && (
        <TableCell className="text-sm">
          <div className="flex flex-wrap gap-1">
            {record.paymentModes.map((mode, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {mode}
              </Badge>
            ))}
          </div>
        </TableCell>
      )}

      {/* Student Type */}
      {isColumnVisible('studentType') && (
        <TableCell className="text-sm">
          <Badge 
            variant={record.studentType === 'New' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {record.studentType}
          </Badge>
        </TableCell>
      )}

      {/* Course Start Date */}
      {isColumnVisible('courseStartDate') && (
        <TableCell className="text-sm">{formatDate(record.courseStartDate || null)}</TableCell>
      )}

      {/* Actions */}
      {isColumnVisible('actions') && (
        <TableCell>
          <PaymentActions
            record={record}
            onUpdateRecord={onUpdateRecord}
            refreshPaymentData={refreshPaymentData}
          />
        </TableCell>
      )}
    </TableRow>
  )
}