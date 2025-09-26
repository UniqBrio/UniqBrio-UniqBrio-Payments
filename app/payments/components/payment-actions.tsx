"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { PaymentRecord } from './payment-types'
import { StudentManualPaymentPayload } from "./student-manual-payment"
import { generatePayslipPDF } from "./generate-payslip-pdf"

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
  record.registrationFees.courseRegistration ||
  record.registrationFees.advanceFee
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
      
      // Process each payment type
      for (const paymentType of payload.paymentTypes) {
        // Determine payment type and category based on paymentType
        let paymentTypeLabel = "Course Fee";
        let paymentCategory = "Course Payment";
        let paymentAmount = 0;
        
        switch (paymentType) {
          case "studentRegistration":
            paymentTypeLabel = "Registration Fee";
            paymentCategory = "Student Registration";
            paymentAmount = record.registrationFees?.studentRegistration?.amount || 500;
            break;
          case "courseRegistration":
            paymentTypeLabel = "Registration Fee";
            paymentCategory = "Course Registration";
            paymentAmount = record.registrationFees?.courseRegistration?.amount || 1000;
            break;
          case "advanceFee":
            paymentTypeLabel = "Registration Fee";
            paymentCategory = "Advance Fee";
            paymentAmount = record.registrationFees?.advanceFee?.amount || 250;
            break;
          case "course":
          default:
            paymentTypeLabel = "Course Fee";
            paymentCategory = "Course Payment";
            paymentAmount = payload.amount; // For course payment, use the full amount
            break;
        }
        
        console.log(`💰 Processing ${paymentType} payment:`, {
          paymentAmount: paymentType === "course" ? payload.amount : paymentAmount,
          category: paymentCategory
        });

        // Call the payments API to record each payment type in the database
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: record.id,
            amount: paymentType === "course" ? payload.amount : paymentAmount,
            paymentMethod: payload.mode,
            paymentType: paymentTypeLabel,
            paymentCategory: paymentCategory,
            receiverName: payload.receiverName,
            receiverId: payload.receiverId,
            notes: payload.notes || "",
            paymentDate: payload.date,
            isManualPayment: true,
            recordedBy: "Admin Dashboard",
            registrationPaymentType: paymentType,
            finalPayment: record.finalPayment // Send course fee (registration fees handled separately)
          })
        });

        console.log(`API Response status for ${paymentType}:`, response.status);

        if (!response.ok) {
          throw new Error(`HTTP error for ${paymentType}! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`API Response data for ${paymentType}:`, result);

        if (!result.success) {
          throw new Error(`Failed to record ${paymentType} payment`);
        }
        
        // Store course payment response for accurate totals
        if (paymentType === "course") {
          coursePaymentResponse = result;
        }
      }

      // Now update the record based on what payment types were processed
      let updatedRecord: Partial<PaymentRecord> = {};
      let successMessage: string = "";
      
      if (payload.paymentTypes.includes("course")) {
        // Use backend-calculated totals from the course payment response
        if (coursePaymentResponse?.data?.summary) {
          const backendSummary = coursePaymentResponse.data.summary;
          updatedRecord = {
            totalPaidAmount: backendSummary.coursePaidAmount || backendSummary.totalPaidAmount, // Use course-only payments
            balancePayment: backendSummary.currentBalance,
            paymentStatus: backendSummary.paymentStatus as "Paid" | "Pending",
            paidDate: new Date().toISOString(),
            paymentReminder: backendSummary.currentBalance > 0
          };
          
          successMessage = `Course payment of ${formatCurrency(payload.amount, record.currency)} recorded for ${record.name}. New balance: ${formatCurrency(backendSummary.currentBalance, record.currency)}`;
        } else {
          // Fallback if no backend summary (shouldn't happen)
          updatedRecord = {
            paidDate: new Date().toISOString()
          };
          successMessage = `Course payment of ${formatCurrency(payload.amount, record.currency)} recorded for ${record.name}. Balance will refresh shortly...`;
        }
      } 
      
      // Handle registration fee payments
      if (payload.paymentTypes.some(type => ["studentRegistration", "courseRegistration", "advanceFee"].includes(type))) {
        // Build registration fees object with explicit type structure
        const studentReg = record.registrationFees?.studentRegistration || { amount: 500, paid: false };
        const courseReg = record.registrationFees?.courseRegistration || { amount: 1000, paid: false };
        const advanceReg = record.registrationFees?.advanceFee || { amount: 250, paid: false };

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
          advanceFee: {
            amount: advanceReg.amount,
            paid: payload.paymentTypes.includes("advanceFee") ? true : advanceReg.paid,
            paidDate: payload.paymentTypes.includes("advanceFee") ? new Date().toISOString() : advanceReg.paidDate
          },
          overall: {
            paid: false, // Will be calculated below
            status: "Pending" as "Paid" | "Pending" // Will be calculated below
          }
        };

        // Check if all registration fees are now paid
        const allPaid = updatedRegistrationFees.studentRegistration.paid && 
                       updatedRegistrationFees.courseRegistration.paid && 
                       updatedRegistrationFees.advanceFee.paid;

        // Update overall status
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
              case "advanceFee": return "Advance";
              default: return type;
            }
          });
          successMessage = `${paidTypes.join(", ")} fees paid for ${record.name}`;
        }
      }

      console.log('Updating record with:', updatedRecord); // Debug log
        
        // Update the record in the parent component immediately
        onUpdateRecord(record.id, updatedRecord);
        
        // Show success message
        toast({
          title: "✔ Payment Recorded Successfully",
          description: successMessage,
        });

        // Force refresh the payment data from database after a short delay
        if (refreshPaymentData) {
          console.log('Triggering payment data refresh...'); // Debug log
          setTimeout(async () => {
            try {
              await Promise.resolve(refreshPaymentData());
              console.log('Payment data refreshed successfully'); // Debug log
            } catch (refreshError) {
              console.error('Error refreshing payment data:', refreshError);
            }
          }, 500); // Reduced delay
        }
      
    } catch (error) {
      console.error('Payment recording error:', error);
      toast({
        title: "❌ Payment Recording Failed",
        description: error instanceof Error ? error.message : "Failed to record payment in database",
        variant: "destructive"
      });
    }
    
    setManualPaymentOpen(false);
  }

  const generatePayslip = async () => {
    // Use the same HTML as in payslip-button.tsx for PDF content
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
            <span>${(() => {
              const courseFee = record.finalPayment || 0;
              const registrationTotal = (record.registrationFees?.studentRegistration?.amount || 0) + 
                                      (record.registrationFees?.courseRegistration?.amount || 0) + 
                                      (record.registrationFees?.advanceFee?.amount || 0);
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