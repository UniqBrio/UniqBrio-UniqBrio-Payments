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
      console.log('🔍 Recording payment:', {
        amount: payload.amount,
        paymentTypes: payload.paymentTypes,
        studentName: record.name
      }); // Debug log
      
      // We'll capture the last API response (course or registration) to read updated paymentDocument
      let lastPaymentResponse: any = null;

      // Determine actual individual amounts: dialog's payload.amount is the SUM of all selected unpaid fees
      const studentRegAmount = record.registrationFees?.studentRegistration?.amount || 0;
      const courseRegAmount = record.registrationFees?.courseRegistration?.amount || 0;
      const includesStudentReg = payload.paymentTypes.includes("studentRegistration");
      const includesCourseReg = payload.paymentTypes.includes("courseRegistration");
      const includesCourse = payload.paymentTypes.includes("course");
      const nonCourseSelectedTotal = (includesStudentReg ? studentRegAmount : 0) + (includesCourseReg ? courseRegAmount : 0);
      const calculatedCoursePortion = includesCourse ? Math.max(0, payload.amount - nonCourseSelectedTotal) : 0;
      if (includesCourse) {
        console.log('🧮 Manual payment breakdown:', {
          totalEntered: payload.amount,
          studentRegistration: includesStudentReg ? studentRegAmount : 0,
          courseRegistration: includesCourseReg ? courseRegAmount : 0,
          coursePortion: calculatedCoursePortion
        });
      }
      
      // Process each payment type
      for (const paymentType of payload.paymentTypes) {
        // Only handle course, studentRegistration, courseRegistration
        let paymentTypeLabel = "Course Fee";
        let paymentCategory = "Course Payment";
        let paymentAmount = 0;
        if (paymentType === "studentRegistration") {
          paymentTypeLabel = "Student Registration Fee";
          paymentCategory = "Student Registration";
          paymentAmount = record.registrationFees?.studentRegistration?.amount || 500;
        } else if (paymentType === "courseRegistration") {
          paymentTypeLabel = "Course Registration Fee";
          paymentCategory = "Course Registration";
          paymentAmount = record.registrationFees?.courseRegistration?.amount || 1000;
        } else if (paymentType === "course") {
          paymentTypeLabel = "Course Fee";
          paymentCategory = "Course Payment";
          // Only charge the course portion (total - selected registration fees)
          paymentAmount = calculatedCoursePortion || payload.amount; // fallback for legacy behavior
        } else {
          continue; // skip any other types (advance/confirmation)
        }

        // Debug the payment data being sent
        const paymentData = {
          studentId: record.id,
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
        
        console.log(`💳 MANUAL PAYMENT API CALL for ${paymentType}:`, paymentData);
        
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
          throw new Error(`HTTP error for ${paymentType}! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(`Failed to record ${paymentType} payment`);
        }
        lastPaymentResponse = result; // keep updating; final iteration holds latest document state
      }

      // Now update the record based on what payment types were processed
      let updatedRecord: Partial<PaymentRecord> = {};
      let successMessage: string = "";
      
      const paymentDoc = lastPaymentResponse?.data?.paymentDocument;
      if (includesCourse && paymentDoc) {
        updatedRecord = {
          totalPaidAmount: paymentDoc.totalPaidAmount, // ALL completed payments (course + registration)
          balancePayment: paymentDoc.currentBalance,
          paymentStatus: (paymentDoc.paymentStatus === 'Partial' ? 'Pending' : paymentDoc.paymentStatus) as 'Paid' | 'Pending',
          paidDate: new Date().toISOString(),
          paymentReminder: paymentDoc.currentBalance > 0
        };
        successMessage = `Payment recorded. New balance: ${formatCurrency(paymentDoc.currentBalance, record.currency)}`;
      } else if (!includesCourse && paymentDoc) {
        // Registration-only payment: update totals (balance unaffected by registration fees)
        updatedRecord = {
          totalPaidAmount: paymentDoc.totalPaidAmount,
          balancePayment: paymentDoc.currentBalance,
          paymentStatus: (paymentDoc.paymentStatus === 'Partial' ? 'Pending' : paymentDoc.paymentStatus) as 'Paid' | 'Pending'
        };
        successMessage = `Registration fee(s) recorded. Course balance: ${formatCurrency(paymentDoc.currentBalance, record.currency)}`;
      } else {
        // Fallback if API format changes
        updatedRecord = { paidDate: new Date().toISOString() };
        successMessage = `Payment recorded. Refreshing for updated balance...`;
      }
      
      // Handle registration fee payments
      if (payload.paymentTypes.some(type => ["studentRegistration", "courseRegistration"].includes(type))) {
        // Build registration fees object with explicit type structure (no advance)
        const studentReg = record.registrationFees?.studentRegistration || { amount: 500, paid: false };
        const courseReg = record.registrationFees?.courseRegistration || { amount: 1000, paid: false };
        const updatedRegistrationFees = {
          studentRegistration: {
            amount: studentReg.amount,
            paid: payload.paymentTypes.includes("studentRegistration") ? true : studentReg.paid,
            paidDate: payload.paymentTypes.includes("studentRegistration") ? new Date().toISOString() : studentReg.paidDate
          },
          courseRegistration: {
            amount: courseReg.amount,
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

      console.log('Updating record with:', updatedRecord); // Debug log
        
        // Update the record in the parent component immediately for responsive UI
        console.log('🔄 Updating local record state with:', updatedRecord);
        onUpdateRecord(record.id, updatedRecord);
        
        // Show success message
        toast({
          title: "✔ Payment Recorded Successfully",
          description: successMessage,
        });
        
        console.log('✅ Local state updated, initiating database refresh...');

        // Force refresh the payment data from database after a short delay
        if (refreshPaymentData) {
          // Try multiple refresh attempts to ensure data is updated
          const attemptRefresh = async (attempt: number = 1) => {
            try {
              console.log(`🔄 Refreshing payment data after manual payment... (attempt ${attempt})`);
              await Promise.resolve(refreshPaymentData());
              console.log('✅ Payment data refreshed successfully');
            } catch (refreshError) {
              console.error(`❌ Error refreshing payment data (attempt ${attempt}):`, refreshError);
              
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
      console.error('❌ Payment recording error:', error);
      
      // Log the full error details for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
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
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 30px; margin-bottom: 40px;">
          <img src="/logo.png" alt="UniqBrio Logo" style="max-width: 250px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" onerror="this.src='/uniqbrio-logo.svg'">
          <h1 style="color: #7c3aed; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;">UNIQBRIO</h1>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 18px; font-weight: 500;">Payment Receipt</p>
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