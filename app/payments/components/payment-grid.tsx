"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { PaymentRecord, currencySymbols } from './payment-types'
import { Send, QrCode, Smartphone, Link, Edit, Save, X } from "lucide-react"

interface PaymentGridProps {
  filteredRecords: PaymentRecord[]
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
}

export function PaymentGrid({ filteredRecords, onUpdateRecord }: PaymentGridProps) {
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null)

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

  const getCurrencySymbol = (currency: string) => {
    return currencySymbols?.[currency] || currency
  }

  const sendReminder = (record: PaymentRecord) => {
    toast({
      title: "Reminder Sent",
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
      title: "Communication Updated",
      description: "Communication text has been updated successfully.",
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredRecords.map((record) => (
        <Card key={record.id} className="border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-900">
                  {record.name}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">ID: {record.id}</p>
              </div>
              <Badge className={`text-xs ${getStatusColor(record.paymentStatus)}`}>
                {record.paymentStatus}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Course Information */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">{record.activity}</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs border-purple-200">
                  {record.category}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {record.courseType}
                </Badge>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Final Payment:</span>
                <span className="font-medium">
                  {getCurrencySymbol(record.currency)}{record.finalPayment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-medium text-green-600">
                  {getCurrencySymbol(record.currency)}{record.totalPaidAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Balance:</span>
                <span className={`font-medium ${record.balancePayment > 0 ? "text-red-600" : "text-green-600"}`}>
                  {getCurrencySymbol(record.currency)}{record.balancePayment.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Registration Fees */}
            {record.registrationFees && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Registration:</p>
                <div className="space-y-1">
                  {record.registrationFees.studentRegistration && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Student:</span>
                      <span>{getCurrencySymbol(record.currency)}{record.registrationFees.studentRegistration}</span>
                    </div>
                  )}
                  {record.registrationFees.courseRegistration && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Course:</span>
                      <span>{getCurrencySymbol(record.currency)}{record.registrationFees.courseRegistration}</span>
                    </div>
                  )}
                  <Badge variant={record.registrationFees.paid ? "default" : "destructive"} className="text-xs">
                    {record.registrationFees.paid ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Frequency:</span>
                <span>{record.paymentFrequency}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Next Due:</span>
                <span>{record.nextPaymentDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Reminder:</span>
                <Badge variant={record.paymentReminder ? "default" : "secondary"} className="text-xs">
                  {record.paymentReminder ? "On" : "Off"}
                </Badge>
              </div>
            </div>

            {/* Communication Text */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Communication:</p>
              {editingText && editingText.id === record.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingText.text}
                    onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                    className="text-xs"
                    rows={2}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={saveEditedText}
                      className="bg-purple-600 hover:bg-purple-700 h-6 text-xs"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingText(null)} className="h-6 text-xs">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <p className="text-xs text-gray-600 line-clamp-2" title={record.communicationText}>
                    {record.communicationText}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditingText(record)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 mt-1"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Payment Options:</p>
              <div className="flex flex-wrap gap-1">
                {record.paymentDetails.qrCode && (
                  <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                    <QrCode className="h-3 w-3" />
                    <span>QR</span>
                  </div>
                )}
                {record.paymentDetails.upiId && (
                  <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                    <Smartphone className="h-3 w-3" />
                    <span>UPI</span>
                  </div>
                )}
                {record.paymentDetails.paymentLink && (
                  <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                    <Link className="h-3 w-3" />
                    <span>Link</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {record.paymentReminder && record.balancePayment > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendReminder(record)}
                  className="w-full border-purple-200 text-xs h-7"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send Reminder
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}