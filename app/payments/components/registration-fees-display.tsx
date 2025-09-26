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
  const getActualFeeData = (feeObj: any) => {
    if (!feeObj) return null;
    if (typeof feeObj === 'object' && feeObj.hasOwnProperty('amount')) {
      return {
        amount: feeObj.amount,
        paid: Boolean(feeObj.paid),
        paidDate: feeObj.paidDate || null
      };
    }
    if (typeof feeObj === 'number') {
      return { amount: feeObj, paid: false, paidDate: null };
    }
    if (typeof feeObj === 'object') {
      const amount = feeObj.value || feeObj.fee || feeObj.cost || null;
      if (amount && typeof amount === 'number') {
        return { amount: amount, paid: Boolean(feeObj.paid), paidDate: feeObj.paidDate || null };
      }
    }
    return null;
  };

  // Only show Student Reg Fee and Course Reg Fee
  const studentReg = getActualFeeData(registrationFees.studentRegistration);
  const courseReg = getActualFeeData(registrationFees.courseRegistration);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Student Reg Fee:</span>
        <Badge
          variant={studentReg?.paid ? "default" : "secondary"}
          className={`text-xs px-2 py-0.5 ml-2 ${studentReg?.paid ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'}`}
        >
          ₹{typeof studentReg?.amount === 'number' ? studentReg.amount : 'N/A'}
          {studentReg?.paid && <span className="ml-1 text-green-600">✓</span>}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Course Reg Fee:</span>
        <Badge
          variant={courseReg?.paid ? "default" : "secondary"}
          className={`text-xs px-2 py-0.5 ml-2 ${courseReg?.paid ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'}`}
        >
          ₹{typeof courseReg?.amount === 'number' ? courseReg.amount : 'N/A'}
          {courseReg?.paid && <span className="ml-1 text-green-600">✓</span>}
        </Badge>
      </div>
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
  const hasAnyFees = registrationFees.studentRegistration || registrationFees.courseRegistration;
  if (!hasAnyFees) return "Pending";
  // Only return "Paid" if BOTH fees that exist are paid
  const allExistingFeesPaid =
    (!registrationFees.studentRegistration || studentRegPaid) &&
    (!registrationFees.courseRegistration || courseRegPaid);
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
    if (typeof feeObj === 'object' && feeObj.hasOwnProperty('amount')) {
      return {
        amount: typeof feeObj.amount === 'number' ? feeObj.amount : 0,
        paid: Boolean(feeObj.paid)
      };
    }
    if (typeof feeObj === 'number') {
      return { amount: feeObj, paid: false };
    }
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

  const totalAmount = studentReg.amount + courseReg.amount;
  const paidAmount =
    (studentReg.paid ? studentReg.amount : 0) +
    (courseReg.paid ? courseReg.amount : 0);
  const pendingAmount = totalAmount - paidAmount;
  const allPaid = totalAmount > 0 && pendingAmount === 0;

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    allPaid
  };
}