"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { PaymentRecord } from './payment-types'
import { StudentManualPaymentPayload } from "./student-manual-payment"
import { generatePayslipPDF } from "./generate-payslip-pdf"
import { fetchLatestPaymentMethod } from '@/lib/payment-utils'

// Utility function for formatting currency
const formatCurrency = (amount: number, currency: string = "INR") => {
  const numericAmount = isNaN(amount) ? 0 : amount
  const formattedNumber = new Intl.NumberFormat('en-IN').format(numericAmount)
  return `${formattedNumber} ${currency}`
}

export interface PaymentActionsProps {
  record: PaymentRecord
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
  refreshPaymentData?: (() => Promise<void>) | (() => void)
}

export function usePaymentActions({ record, onUpdateRecord, refreshPaymentData }: PaymentActionsProps) {
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false)
  const [alreadyPaidAlertOpen, setAlreadyPaidAlertOpen] = useState(false)

  const isRegistrationPaid = record.registrationFees?.overall?.paid || false;
  const hasRegistrationFees = !!(record.registrationFees && (
  record.registrationFees?.studentRegistration ||
  record.registrationFees.courseRegistration
  ));
  const isFullyPaid = record.paymentStatus === 'Paid' && record.balancePayment === 0 && (!hasRegistrationFees || isRegistrationPaid);

  const handlePaymentButtonClick = () => {
    if (isFullyPaid) {
      setAlreadyPaidAlertOpen(true)
    } else {
      setManualPaymentOpen(true)
    }
  }

  const handleManualPayment = async (payload: StudentManualPaymentPayload) => {
    try {
      // Console message removed
      
      // Store course payment response for accurate balance calculation
      let coursePaymentResponse: any = null;
      
      // Pre-calculate amounts to avoid double counting when multiple types selected
      const selectedTypes = payload.paymentTypes;
      const registrationComponents = selectedTypes.filter(t => t === 'studentRegistration' || t === 'courseRegistration');
      const studentRegFee = typeof record.registrationFees?.studentRegistration?.amount === 'number' ? record.registrationFees?.studentRegistration?.amount : 0;
      const courseRegFee = typeof record.registrationFees?.courseRegistration?.amount === 'number' ? record.registrationFees?.courseRegistration?.amount : 0;
      const totalSelectedRegistration = registrationComponents.reduce((sum, t) => {
        if (t === 'studentRegistration') return sum + (typeof record.registrationFees?.studentRegistration?.amount === 'number' ? record.registrationFees?.studentRegistration?.amount : 0);
        if (t === 'courseRegistration') return sum + (typeof record.registrationFees?.courseRegistration?.amount === 'number' ? record.registrationFees?.courseRegistration?.amount : 0);
        return sum;
      }, 0);

      // User-entered amount represents FULL amount they intend to pay now (could be auto-filled)
      const userEnteredTotal = payload.amount;
      // Derive the course-only portion if course is included
      let derivedCoursePortion = userEnteredTotal;
      if (selectedTypes.includes('course')) {
        if (registrationComponents.length > 0) {
          // Subtract registration fees from total so course portion is isolated
            derivedCoursePortion = Math.max(0, userEnteredTotal - totalSelectedRegistration);
        }
        // Allow partial payments - don't force full balance amount
        // Only ensure the payment doesn't exceed the balance
        if (derivedCoursePortion > record.balancePayment) {
          derivedCoursePortion = record.balancePayment;
        }
      }

      // Process each payment type individually
      for (const paymentType of selectedTypes) {
        // Only handle course, studentRegistration, courseRegistration
        // paymentType must match enum in PaymentRecordSchema: ["Course Fee", "Registration Fee", ...]
        // We use paymentCategory to distinguish specific registration fee types.
        let paymentTypeLabel = "Course Fee"; // default valid enum value
        let paymentCategory = "Course Payment";
        let paymentAmount = 0;
        if (paymentType === "studentRegistration") {
          paymentTypeLabel = "Registration Fee";
          paymentCategory = "Student Registration";
          paymentAmount = typeof record.registrationFees?.studentRegistration?.amount === 'number' ? record.registrationFees?.studentRegistration?.amount : 0;
        } else if (paymentType === "courseRegistration") {
          paymentTypeLabel = "Registration Fee";
          paymentCategory = "Course Registration";
          paymentAmount = typeof record.registrationFees?.courseRegistration?.amount === 'number' ? record.registrationFees?.courseRegistration?.amount : 0;
        } else if (paymentType === "course") {
          paymentTypeLabel = "Course Fee";
          paymentCategory = "Course Payment";
          paymentAmount = derivedCoursePortion;
        } else {
          continue; // skip any other types (advance/confirmation)
        }

        // Skip zero or negative amounts defensively
        if (paymentAmount <= 0) {
          // Console message removed
          continue;
        }

        // Debug the payment data being sent
        const paymentData = {
          studentId: record.id,
          courseId: record.matchedCourseId || record.activity || record.enrolledCourse,
          amount: paymentAmount,
          paymentMethod: payload.mode,
          paymentType: paymentTypeLabel,
          paymentCategory: paymentCategory,
          notes: payload.notes || "",
          paymentDate: payload.date,
          isManualPayment: true,
          recordedBy: "Admin Dashboard",
          registrationPaymentType: paymentType,
          finalPayment: record.finalPayment,
          receivedByName: payload.receivedByName,
          receivedByRole: payload.receivedByRole
        };
        
        // Console message removed
        
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        const resultText = await response.text();
        let result: any = {};
        try { result = JSON.parse(resultText); } catch { /* leave as text */ }
        if (!response.ok) {
          // Console message removed
          throw new Error(`HTTP ${response.status} while recording ${paymentType}: ${JSON.stringify(result)}`);
        }
        if (!result.success) {
          // Console message removed
          throw new Error(`Backend rejected ${paymentType}: ${result.error || 'Unknown error'}`);
        }
        if (paymentType === "course" || paymentType === "courseRegistration") {
          coursePaymentResponse = result;
        }
      }

      // Inspect backend authoritative state after processing payments
      try {
  const inspectResp = await fetch(`/api/payments/inspect?studentId=${encodeURIComponent(record.id)}&courseId=${encodeURIComponent(record.matchedCourseId || record.activity || '')}`.replace(/\&courseId=$/, ''), { cache: 'no-store' });
        if (!inspectResp.ok) {
          // Console message removed - only log HTTP status if needed
        }
      } catch (inspErr) {
        // Console message removed
      }

      // Now update the record based on what payment types were processed
      let updatedRecord: Partial<PaymentRecord> = {};
      let successMessage: string = "";
      
      if (payload.paymentTypes.includes("course")) {
        // Use ONLY payments collection calculated totals (students collection not updated)
        if (coursePaymentResponse?.data?.summary) {
          const backendSummary = coursePaymentResponse.data.summary;
          updatedRecord = {
            totalPaidAmount: backendSummary.coursePaidAmount || backendSummary.totalPaidAmount,
            balancePayment: backendSummary.currentBalance,
            paymentStatus: backendSummary.paymentStatus as "Paid" | "Pending",
            paidDate: new Date().toISOString(),
            paymentReminder: backendSummary.currentBalance > 0
          };
          
          successMessage = `Payment recorded in payments collection. New balance: ${formatCurrency(backendSummary.currentBalance, record.currency)} (calculated dynamically)`;
        } else {
          // Force refresh to get updated calculations from payments collection
          updatedRecord = {
            paidDate: new Date().toISOString()
          };
          successMessage = `Payment recorded. Balance will be calculated from payments collection...`;
        }
      } 
      
      // Handle registration fee payments
      if (payload.paymentTypes.some(type => ["studentRegistration", "courseRegistration"].includes(type))) {
        // Build registration fees object with explicit type structure (numeric amounts, typed paidDate)
        const studentReg: NonNullable<PaymentRecord["registrationFees"]>["studentRegistration"] =
          record.registrationFees?.studentRegistration ?? { amount: 0, paid: false, paidDate: undefined };
        const courseReg: NonNullable<PaymentRecord["registrationFees"]>["courseRegistration"] =
          record.registrationFees?.courseRegistration ?? { amount: 0, paid: false, paidDate: undefined };
        const updatedRegistrationFees = {
          studentRegistration: {
            amount: typeof studentReg.amount === 'number' ? studentReg.amount : 0,
            paid: payload.paymentTypes.includes("studentRegistration") ? true : studentReg.paid,
            paidDate: payload.paymentTypes.includes("studentRegistration") ? new Date().toISOString() : studentReg.paidDate
          },
          courseRegistration: {
            amount: typeof courseReg.amount === 'number' ? courseReg.amount : 0,
            paid: payload.paymentTypes.includes("courseRegistration") ? true : courseReg.paid,
            paidDate: payload.paymentTypes.includes("courseRegistration") ? new Date().toISOString() : courseReg.paidDate
          },
          overall: {
            paid: false, // Will be calculated below
            status: "Pending" as "Paid" | "Pending" // Will be calculated below
          }
        };
        // Check if both registration fees are now paid
        const allPaid = updatedRegistrationFees.studentRegistration.paid && updatedRegistrationFees.courseRegistration.paid;
        updatedRegistrationFees.overall.paid = allPaid;
        updatedRegistrationFees.overall.status = allPaid ? "Paid" : "Pending";
        if (payload.paymentTypes.includes("course")) {
          updatedRecord = {
            ...updatedRecord,
            registrationFees: updatedRegistrationFees
          };
          successMessage += ` and registration fees paid.`;
        } else {
          updatedRecord = {
            registrationFees: updatedRegistrationFees
          };
          const paidTypes = payload.paymentTypes.filter(type => type !== "course").map(type => {
            switch(type) {
              case "studentRegistration": return "Student Registration";
              case "courseRegistration": return "Course Registration";
              default: return type;
            }
          });
          successMessage = `${paidTypes.join(", ")} fees paid for ${record.name}`;
        }
      }

      // Console message removed
        
        // Update the record in the parent component immediately for responsive UI
  const cid = record.matchedCourseId || record.activity || record.enrolledCourse || 'NA';
  onUpdateRecord(`${record.id}::${cid}`, updatedRecord);
        
        // Show success message
        toast({
          title: "✔ Payment Recorded Successfully",
          description: successMessage,
        });
        
        // Console message removed

        // Force refresh the payment data from database after a short delay
        if (refreshPaymentData) {
          // Try multiple refresh attempts to ensure data is updated
          const attemptRefresh = async (attempt: number = 1) => {
            try {
              // Console message removed
              await Promise.resolve(refreshPaymentData());
              // Console message removed
            } catch (refreshError) {
              // Console message removed
              
              // Try again after a longer delay if first attempt fails
              if (attempt < 2) {
                setTimeout(() => attemptRefresh(attempt + 1), 2000);
              } else {
                // Show error toast if all refresh attempts fail
                toast({
                  title: "⚠️ Refresh Warning",
                  description: "Payment was recorded but display may not be updated. Please refresh the page.",
                  variant: "destructive"
                });
              }
            }
          };
          
          setTimeout(() => attemptRefresh(), 1500); // Increased delay to 1.5 seconds
        }
      
    } catch (error) {
      // Console message removed
      
      toast({
        title: "❌ Payment Recording Failed",
        description: error instanceof Error ? error.message : "Failed to record payment in database",
        variant: "destructive"
      });
    }
    
    setManualPaymentOpen(false);
  }

  const generatePayslip = async () => {
    // Fetch latest payment method from payment records
    const paymentMethod = await fetchLatestPaymentMethod(record.id);

    // Use the same HTML as in payslip-button.tsx for PDF content
    const payslipContent = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 24px; margin-bottom: 36px;">
          <img src="/logo.png" alt="Logo" style="max-width: 220px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" onerror="this.src='/uniqbrio-logo.svg'">
          <p style="margin: 0; color: #222; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Payment Receipt</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Student Details</h3>
            <p><strong>ID:</strong> ${record.id}</p>
            <p><strong>Name:</strong> ${record.name}</p>
            <p><strong>Course ID:</strong> ${record.activity}</p>
            <p><strong>Course Name:</strong> ${record.program}</p>
            <p><strong>Category:</strong> ${record.category}</p>
          </div>
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Details</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${record.paymentStatus}</p>
            <p><strong>Payment Mode:</strong> ${paymentMethod}</p>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #333; margin-top: 0;">Payment Summary</h3>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Total Course Fee:</span>
            <span>${(() => {
              const courseFee = record.finalPayment || 0;
              const registrationTotal = (record.registrationFees?.studentRegistration?.amount || 0) + 
                                      (record.registrationFees?.courseRegistration?.amount || 0);
              return formatCurrency(courseFee + registrationTotal, record.currency);
            })()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #16a34a;">
            <span>Amount Paid:</span>
            <span>${formatCurrency(record.totalPaidAmount, record.currency)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #dc2626; border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold;">
            <span>Balance Due:</span>
            <span>${formatCurrency(record.balancePayment, record.currency)}</span>
          </div>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>This is a computer generated receipt. No signature required.</p>
          <p>For queries, contact: support@uniqbrio.com</p>
        </div>
      </div>
    `;
    await generatePayslipPDF(record, payslipContent);
  }

  return {
    manualPaymentOpen,
    setManualPaymentOpen,
    alreadyPaidAlertOpen,
    setAlreadyPaidAlertOpen,
    isFullyPaid,
    handlePaymentButtonClick,
    handleManualPayment,
    generatePayslip
  }
}