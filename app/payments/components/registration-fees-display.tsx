"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { PaymentRecord } from "./payment-types";

interface RegistrationFeesDisplayProps {
  record: PaymentRecord;
  className?: string;
}

export function RegistrationFeesDisplay({ record, className = "" }: RegistrationFeesDisplayProps) {
  const registrationFees = record.registrationFees;
  
  if (!registrationFees) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="text-xs text-gray-500">No registration fees</div>
      </div>
    );
  }

  // Helper function to safely display fee data from actual database values
  const getActualFeeData = (feeObj: any, label: string) => {
    if (!feeObj) {
      return null; // Don't show if no data exists
    }
    
    // If it's already in the correct format with amount property
    if (typeof feeObj === 'object' && feeObj.hasOwnProperty('amount')) {
      return {
        amount: feeObj.amount,
        paid: Boolean(feeObj.paid),
        paidDate: feeObj.paidDate || null
      };
    }
    
    // If it's a direct number (actual amount from database)
    if (typeof feeObj === 'number') {
      return { amount: feeObj, paid: false, paidDate: null };
    }
    
    // For other objects, try to extract meaningful data
    if (typeof feeObj === 'object') {
      // Look for common amount field names
      const amount = feeObj.value || feeObj.fee || feeObj.cost || null;
      if (amount && typeof amount === 'number') {
        return { amount: amount, paid: Boolean(feeObj.paid), paidDate: feeObj.paidDate || null };
      }
    }
    
    return null; // Don't display if we can't determine the structure
  };

  const feeTypes = [
    { key: 'studentRegistration' as const, label: "Student Reg Fee" },
    { key: 'courseRegistration' as const, label: "Course Reg Fee" },
    { key: 'confirmationFee' as const, label: "Confirmation Fee" },
  ];

  const fees = feeTypes
    .map(({ key, label }) => {
      const feeData = getActualFeeData(registrationFees[key], label);
      return feeData ? { label, ...feeData } : null;
    })
    .filter((fee): fee is NonNullable<typeof fee> => fee !== null); // Remove null entries with type guard

  return (
    <div className={`space-y-1 ${className}`}>
      {fees.map((fee, index) => (
        <div key={index} className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{fee.label}:</span>
          <Badge 
            variant={fee.paid ? "default" : "secondary"}
            className={`
              text-xs px-2 py-0.5 ml-2
              ${fee.paid 
                ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
              }
            `}
          >
            ₹{typeof fee.amount === 'number' ? fee.amount : 'N/A'}
            {fee.paid && (
              <span className="ml-1 text-green-600">✓</span>
            )}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// Helper function to calculate overall registration status from actual data
export function calculateRegistrationStatus(registrationFees?: PaymentRecord['registrationFees']): "Paid" | "Pending" {
  if (!registrationFees) return "Pending";
  
  // Helper function to safely extract paid status from actual database values
  const isPaid = (feeObj: any): boolean => {
    if (!feeObj) return false;
    
    // Check if it has a paid property
    if (typeof feeObj === 'object' && feeObj.hasOwnProperty('paid')) {
      return Boolean(feeObj.paid);
    }
    
    // For other object structures, check for status indicators
    if (typeof feeObj === 'object') {
      return Boolean(feeObj.status === 'paid' || feeObj.completed || feeObj.settled);
    }
    
    return false;
  };
  
  const studentRegPaid = isPaid(registrationFees.studentRegistration);
  const courseRegPaid = isPaid(registrationFees.courseRegistration);
  const confirmationPaid = isPaid(registrationFees.confirmationFee);
  
  // Check if all fees that exist are paid (not just any one fee)
  const hasAnyFees = registrationFees.studentRegistration || registrationFees.courseRegistration || registrationFees.confirmationFee;
  if (!hasAnyFees) return "Pending";
  
  // Only return "Paid" if ALL fees that exist are paid
  const allExistingFeesPaid = 
    (!registrationFees.studentRegistration || studentRegPaid) &&
    (!registrationFees.courseRegistration || courseRegPaid) &&
    (!registrationFees.confirmationFee || confirmationPaid);
  
  return allExistingFeesPaid ? "Paid" : "Pending";
}

// Helper function to get registration fee payment summary from actual data
export function getRegistrationSummary(registrationFees?: PaymentRecord['registrationFees']) {
  if (!registrationFees) {
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      allPaid: false
    };
  }

  // Helper function to safely extract fee data from actual database values
  const getActualFeeAmount = (feeObj: any) => {
    if (!feeObj) return { amount: 0, paid: false };
    
    // If it's already in the correct format with amount property
    if (typeof feeObj === 'object' && feeObj.hasOwnProperty('amount')) {
      return {
        amount: typeof feeObj.amount === 'number' ? feeObj.amount : 0,
        paid: Boolean(feeObj.paid)
      };
    }
    
    // If it's a direct number (actual amount from database)
    if (typeof feeObj === 'number') {
      return { amount: feeObj, paid: false };
    }
    
    // For other objects, try to extract meaningful data
    if (typeof feeObj === 'object') {
      const amount = feeObj.value || feeObj.fee || feeObj.cost || 0;
      if (typeof amount === 'number') {
        return { amount: amount, paid: Boolean(feeObj.paid) };
      }
    }
    
    return { amount: 0, paid: false };
  };

  const studentReg = getActualFeeAmount(registrationFees.studentRegistration);
  const courseReg = getActualFeeAmount(registrationFees.courseRegistration);
  const confirmation = getActualFeeAmount(registrationFees.confirmationFee);

  const totalAmount = studentReg.amount + courseReg.amount + confirmation.amount;
  const paidAmount = 
    (studentReg.paid ? studentReg.amount : 0) +
    (courseReg.paid ? courseReg.amount : 0) +
    (confirmation.paid ? confirmation.amount : 0);
  
  const pendingAmount = totalAmount - paidAmount;
  const allPaid = totalAmount > 0 && pendingAmount === 0;

  return {
    totalAmount,
    paidAmount, 
    pendingAmount,
    allPaid
  };
}