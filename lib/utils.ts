import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Payment-related utilities
export function calculateTotalFinalPayment(record: any): number {
  const courseFee = record.finalPayment || 0;
  const registrationTotal = (record.registrationFees?.studentRegistration?.amount || 0) + 
                          (record.registrationFees?.courseRegistration?.amount || 0) + 
                          (record.registrationFees?.confirmationFee?.amount || 0);
  return courseFee + registrationTotal;
}
