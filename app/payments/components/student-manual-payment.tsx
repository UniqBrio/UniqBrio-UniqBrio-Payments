"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Search, User, CreditCard, Calendar, DollarSign, CheckCircle } from "lucide-react"
import { PaymentRecord } from './payment-types'

export type StudentManualPaymentPayload = {
  studentId: string
  amount: number
  date: string // ISO date
  mode: "Cash" | "UPI" | "Card" | "QR"
  notes?: string
}

interface StudentManualPaymentProps {
  students: PaymentRecord[]
  onSubmit: (payload: StudentManualPaymentPayload) => void
}

export function StudentManualPayment({ students, onSubmit }: StudentManualPaymentProps) {
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<StudentManualPaymentPayload["mode"]>("Cash")
  const [notes, setNotes] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<PaymentRecord | null>(null)

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: "$",
      INR: "₹",
      GBP: "£",
      EUR: "€",
    }
    return symbols[currency] || "$"
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default"
      case "Partial":
        return "secondary"
      case "Pending":
        return "outline"
      case "Overdue":
        return "destructive"
      default:
        return "outline"
    }
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
        title: "Student Found",
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

  const handleSubmit = () => {
    if (!selectedStudent) {
      toast({
        title: "No Student Selected",
        description: "Please search and select a student first.",
        variant: "destructive",
      })
      return
    }

    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      })
      return
    }

    if (value > selectedStudent.balancePayment) {
      toast({
        title: "Amount Exceeds Balance",
        description: `Payment amount cannot exceed balance of ${getCurrencySymbol(selectedStudent.currency)}${selectedStudent.balancePayment}`,
        variant: "destructive",
      })
      return
    }

    onSubmit({
      studentId: selectedStudent.id,
      amount: value,
      date,
      mode,
      notes: notes.trim() || undefined,
    })

    toast({
      title: "Payment Recorded",
      description: `Manual payment of ${getCurrencySymbol(selectedStudent.currency)}${value} recorded for ${selectedStudent.name}`,
    })

    // Reset form
    setStudentId("")
    setAmount("")
    setNotes("")
    setSelectedStudent(null)
    setOpen(false)
  }

  const resetForm = () => {
    setStudentId("")
    setAmount("")
    setNotes("")
    setSelectedStudent(null)
    setDate(new Date().toISOString().slice(0, 10))
    setMode("Cash")
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white ">
          <CreditCard className="h-4 w-4 mr-2" />
          Manual Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <CreditCard className="h-5 w-5" />
            Record Manual Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Student Search Section */}
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4" />
                Find Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="student-id">Student ID</Label>
                  <Input
                    id="student-id"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student ID (e.g., ART00X)"
                    onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                  />
                </div>
                <Button onClick={handleStudentSearch} className="mt-6 bg-purple-600 hover:bg-purple-700">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student Details Section */}
          {selectedStudent && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <User className="h-4 w-4" />
                  Student Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Name</Label>
                    <p className="font-medium">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Course</Label>
                    <p className="font-medium">{selectedStudent.activity}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Category</Label>
                    <p className="font-medium">{selectedStudent.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Status</Label>
                    <Badge variant={getStatusVariant(selectedStudent.paymentStatus)} className="mt-1">
                      {selectedStudent.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Total Amount</Label>
                    <p className="font-medium text-blue-600">
                      {getCurrencySymbol(selectedStudent.currency)}{selectedStudent.finalPayment.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Paid Amount</Label>
                    <p className="font-medium text-green-600">
                      {getCurrencySymbol(selectedStudent.currency)}{selectedStudent.totalPaidAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Balance Amount</Label>
                    <p className={`font-medium ${selectedStudent.balancePayment > 0 ? "text-red-600" : "text-green-600"}`}>
                      {getCurrencySymbol(selectedStudent.currency)}{selectedStudent.balancePayment.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Next Due Date</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {selectedStudent.nextPaymentDate}
                    </p>
                  </div>
                </div>
                {selectedStudent.balancePayment === 0 && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      This student has no outstanding balance.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Entry Section */}
          {selectedStudent && selectedStudent.balancePayment > 0 && (
            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Maximum amount: {getCurrencySymbol(selectedStudent.currency)}{selectedStudent.balancePayment.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-amount">Payment Amount</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      min="0"
                      max={selectedStudent.balancePayment}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-date">Payment Date</Label>
                    <Input id="payment-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as StudentManualPaymentPayload["mode"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="QR">QR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-notes">Notes (optional)</Label>
                  <Input 
                    id="payment-notes" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Reference, remarks, etc." 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
                    Record Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}