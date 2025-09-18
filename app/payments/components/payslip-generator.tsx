"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PaymentRecord } from './payment-types'
import { FileText, Download, Print } from "lucide-react"

interface PayslipGeneratorProps {
  record: PaymentRecord
}

export function PayslipGenerator({ record }: PayslipGeneratorProps) {
  const [open, setOpen] = useState(false)

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: "$", INR: "₹", GBP: "£", EUR: "€"
    }
    return symbols[currency] || "₹"
  }

  const generatePayslip = () => {
    const payslipContent = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0;">UNIQBRIO</h1>
          <p style="margin: 5px 0; color: #666;">Payment Receipt</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Student Details</h3>
            <p><strong>Name:</strong> ${record.name}</p>
            <p><strong>ID:</strong> ${record.id}</p>
            <p><strong>Course:</strong> ${record.activity}</p>
            <p><strong>Category:</strong> ${record.category}</p>
          </div>
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Details</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${record.paymentStatus}</p>
            <p><strong>Payment Mode:</strong> ${record.reminderMode}</p>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #333; margin-top: 0;">Payment Summary</h3>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Total Course Fee:</span>
            <span>${getCurrencySymbol(record.currency)}${record.finalPayment.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #16a34a;">
            <span>Amount Paid:</span>
            <span>${getCurrencySymbol(record.currency)}${record.totalPaidAmount.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #dc2626; border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold;">
            <span>Balance Due:</span>
            <span>${getCurrencySymbol(record.currency)}${record.balancePayment.toLocaleString()}</span>
          </div>
        </div>

        <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>This is a computer generated receipt. No signature required.</p>
          <p>For queries, contact: support@uniqbrio.com</p>
        </div>
      </div>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Payment Receipt - ${record.name}</title></head>
          <body>${payslipContent}</body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const downloadPayslip = () => {
    const element = document.createElement('a')
    const file = new Blob([`Payment Receipt - ${record.name}\n\nStudent: ${record.name}\nCourse: ${record.activity}\nTotal Fee: ${getCurrencySymbol(record.currency)}${record.finalPayment}\nPaid: ${getCurrencySymbol(record.currency)}${record.totalPaidAmount}\nBalance: ${getCurrencySymbol(record.currency)}${record.balancePayment}`], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `payslip-${record.name}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-purple-200 h-7 w-7 p-0"
          title="Generate Payslip"
        >
          <FileText className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <FileText className="h-5 w-5" />
            Generate Payslip
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate payment receipt for <strong>{record.name}</strong>
          </p>
          <div className="flex gap-2">
            <Button onClick={generatePayslip} className="flex-1 bg-purple-600 hover:bg-purple-700">
              <Print className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button onClick={downloadPayslip} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}