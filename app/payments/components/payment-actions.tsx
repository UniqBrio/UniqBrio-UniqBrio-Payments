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
      
      // Store course payment response for accurate balance calculation
      let coursePaymentResponse: any = null;
      
      // Pre-calculate amounts to avoid double counting when multiple types selected
      const selectedTypes = payload.paymentTypes;
      const registrationComponents = selectedTypes.filter(t => t === 'studentRegistration' || t === 'courseRegistration');
      const studentRegFee = record.registrationFees?.studentRegistration?.amount || 500;
      const courseRegFee = record.registrationFees?.courseRegistration?.amount || 1000;
      const totalSelectedRegistration = registrationComponents.reduce((sum, t) => {
        if (t === 'studentRegistration') return sum + (record.registrationFees?.studentRegistration?.amount || 500);
        if (t === 'courseRegistration') return sum + (record.registrationFees?.courseRegistration?.amount || 1000);
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
        // Never exceed current balance
        derivedCoursePortion = Math.min(derivedCoursePortion, record.balancePayment);
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
          // Use generic "Registration Fee" to satisfy enum; category provides specificity
          paymentTypeLabel = "Registration Fee";
          paymentCategory = "Student Registration";
          paymentAmount = record.registrationFees?.studentRegistration?.amount || 500;
        } else if (paymentType === "courseRegistration") {
          paymentTypeLabel = "Registration Fee";
          paymentCategory = "Course Registration";
          paymentAmount = record.registrationFees?.courseRegistration?.amount || 1000;
        } else if (paymentType === "course") {
          paymentTypeLabel = "Course Fee";
          paymentCategory = "Course Payment";
          paymentAmount = derivedCoursePortion;
        } else {
          continue; // skip any other types (advance/confirmation)
        }

        // Skip zero or negative amounts defensively
        if (paymentAmount <= 0) {
          console.log(`⚠️ Skipping ${paymentType} payment with non-positive amount:`, paymentAmount);
          continue;
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

        const resultText = await response.text();
        let result: any = {};
        try { result = JSON.parse(resultText); } catch { /* leave as text */ }
        if (!response.ok) {
          console.error('❌ API error body:', result);
          throw new Error(`HTTP ${response.status} while recording ${paymentType}: ${JSON.stringify(result)}`);
        }
        if (!result.success) {
          console.error('❌ API logical failure:', result);
          throw new Error(`Backend rejected ${paymentType}: ${result.error || 'Unknown error'}`);
        }
        if (paymentType === "course" || paymentType === "courseRegistration") {
          coursePaymentResponse = result;
        }
      }

      // Inspect backend authoritative state after processing payments
      try {
        const inspectResp = await fetch(`/api/payments/inspect?studentId=${encodeURIComponent(record.id)}`, { cache: 'no-store' });
        if (inspectResp.ok) {
          const inspectJson = await inspectResp.json();
          console.log('🧪 Inspect after payment:', inspectJson);
        } else {
          console.warn('⚠️ Inspect endpoint returned status', inspectResp.status);
        }
      } catch (inspErr) {
        console.warn('⚠️ Inspect fetch failed:', inspErr);
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