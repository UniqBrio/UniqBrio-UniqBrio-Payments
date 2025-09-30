"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { FileText, Search, Download, Printer } from "lucide-react"
import { PaymentRecord } from './payment-types'
import { fetchLatestPaymentMethod } from '@/lib/payment-utils'

interface PayslipButtonProps {
  students: PaymentRecord[]
}

export function PayslipButton({ students }: PayslipButtonProps) {
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<PaymentRecord | null>(null)

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: "$", INR: "₹", GBP: "£", EUR: "€"
    }
    return symbols[currency] || "₹"
  }

  const handleStudentSearch = () => {
    if (!studentId.trim()) {
      toast({
        title: "Student ID Required",
        description: "Please enter a valid student ID to search.",
        variant: "destructive",
      })
      return
    }

    const student = students.find((s) => s.id.toLowerCase() === studentId.toLowerCase())
    if (student) {
      setSelectedStudent(student)
      toast({
        title: "✔ Student Found",
        description: `Found ${student.name} - ${student.activity}`,
      })
    } else {
      setSelectedStudent(null)
      toast({
        title: "Student Not Found",
        description: `No student found with ID: ${studentId}`,
        variant: "destructive",
      })
    }
  }

  const generatePayslip = async () => {
    if (!selectedStudent) return

    // Fetch latest payment method from payment records
    const paymentMethod = await fetchLatestPaymentMethod(selectedStudent.id);

    const payslipContent = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 24px; margin-bottom: 36px;">
          <img src="/logo.png" alt="Logo" style="max-width: 220px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" onerror="this.src='/uniqbrio-logo.svg'">
          <p style="margin: 0; color: #222; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Payment Receipt</p>

        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Student Details</h3>
            <p><strong>ID:</strong> ${selectedStudent.id}</p>
            <p><strong>Name:</strong> ${selectedStudent.name}</p>
            <p><strong>Course ID:</strong> ${selectedStudent.activity}</p>
            <p><strong>Course Name:</strong> ${selectedStudent.program}</p>
            <p><strong>Category:</strong> ${selectedStudent.category}</p>
          </div>
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Details</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${selectedStudent.paymentStatus}</p>
            <p><strong>Payment Mode:</strong> ${paymentMethod}</p>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #333; margin-top: 0;">Payment Summary</h3>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Total Course Fee:</span>
            <span>${getCurrencySymbol(selectedStudent.currency)}${(() => {
              const courseFee = selectedStudent.finalPayment || 0;
              const registrationTotal = (selectedStudent.registrationFees?.studentRegistration?.amount || 0) + 
                                      (selectedStudent.registrationFees?.courseRegistration?.amount || 0) ;
              return (courseFee + registrationTotal).toLocaleString();
            })()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #16a34a;">
            <span>Amount Paid:</span>
            <span>${getCurrencySymbol(selectedStudent.currency)}${selectedStudent.totalPaidAmount.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #dc2626; border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold;">
            <span>Balance Due:</span>
            <span>${getCurrencySymbol(selectedStudent.currency)}${selectedStudent.balancePayment.toLocaleString()}</span>
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
          <head><title>Payment Receipt - ${selectedStudent.name}</title></head>
          <body>${payslipContent}</body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const downloadPayslip = () => {
    if (!selectedStudent) return

    const element = document.createElement('a')
    const totalFeeWithRegistration = selectedStudent.finalPayment + 
      (selectedStudent.registrationFees?.studentRegistration?.amount || 0) + 
      (selectedStudent.registrationFees?.courseRegistration?.amount || 0) + 
      (selectedStudent.registrationFees?.confirmationFee?.amount || 0);
    const file = new Blob([`Payment Receipt - ${selectedStudent.name}\n\nStudent: ${selectedStudent.name}\nCourse: ${selectedStudent.activity}\nTotal Fee: ${getCurrencySymbol(selectedStudent.currency)}${totalFeeWithRegistration}\nPaid: ${getCurrencySymbol(selectedStudent.currency)}${selectedStudent.totalPaidAmount}\nBalance: ${getCurrencySymbol(selectedStudent.currency)}${selectedStudent.balancePayment}`], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `payslip-${selectedStudent.name}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#9234ea] hover:bg-[#9234ea]/90 text-white">
          <FileText className="h-4 w-4 mr-2" />
          Generate Payslip
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#9234ea]">
            <FileText className="h-5 w-5" />
            Generate Payment Receipt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="student-search">Student ID</Label>
              <Input
                id="student-search"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID (e.g., ART001)"
                onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                className="h-8 text-sm px-2"
              />
            </div>
            <Button onClick={handleStudentSearch} className="mt-6 bg-[#9234ea] hover:bg-[#9234ea]/90">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {selectedStudent && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Student Found:</h4>
              <p><strong>Name:</strong> {selectedStudent.name}</p>
              <p><strong>CourseId:</strong> {selectedStudent.activity}</p>
              <p><strong>Course:</strong> {selectedStudent.program}</p>
              <p><strong>Total Fee:</strong> {getCurrencySymbol(selectedStudent.currency)}{(() => {
                const courseFee = selectedStudent.finalPayment || 0;
                const registrationTotal = (selectedStudent.registrationFees?.studentRegistration?.amount || 0) + 
                                        (selectedStudent.registrationFees?.courseRegistration?.amount || 0) + 
                                        (selectedStudent.registrationFees?.confirmationFee?.amount || 0);
                return (courseFee + registrationTotal).toLocaleString();
              })()}</p>
              <p><strong>Paid:</strong> {getCurrencySymbol(selectedStudent.currency)}{selectedStudent.totalPaidAmount.toLocaleString()}</p>
              <p><strong>Balance:</strong> {getCurrencySymbol(selectedStudent.currency)}{selectedStudent.balancePayment.toLocaleString()}</p>
            </div>
          )}

          {selectedStudent && (
            <div className="flex gap-2 pt-4">
              <Button onClick={generatePayslip} className="flex-1 bg-[#9234ea] hover:bg-[#9234ea]/90">
                  <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button onClick={downloadPayslip} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}