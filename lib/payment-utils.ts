/**
 * Utility functions for fetching payment information
 */

/**
 * Fetches the latest payment method for a student from payment records
 * @param studentId - The student ID to fetch payment method for
 * @returns Promise<string> - The latest payment method or 'Not Specified'
 */
export async function fetchLatestPaymentMethod(studentId: string): Promise<string> {
  try {
    const response = await fetch(`/api/payments?studentId=${encodeURIComponent(studentId)}`);
    if (response.ok) {
      const paymentData = await response.json();
      if (paymentData.success && paymentData.data.paymentRecords && paymentData.data.paymentRecords.length > 0) {
        // Get the most recent payment record's payment method
        return paymentData.data.paymentRecords[0].paymentMethod || 'Not Specified';
      }
    }
  } catch (error) {
    console.error('Error fetching payment method:', error);
  }
  return 'Not Specified';
}

/**
 * Fetches payment method on server-side (for API routes)
 * @param studentId - The student ID to fetch payment method for  
 * @param PaymentModel - The Payment mongoose model
 * @returns Promise<string> - The latest payment method or 'Not Specified'
 */
export async function fetchLatestPaymentMethodServer(studentId: string, PaymentModel: any): Promise<string> {
  try {
    const paymentDoc = await PaymentModel.findOne({ studentId });
    
    if (paymentDoc && paymentDoc.paymentRecords && paymentDoc.paymentRecords.length > 0) {
      // Sort by date to get the most recent payment
      const sortedRecords = paymentDoc.paymentRecords.sort(
        (a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );
      return sortedRecords[0].paymentMethod || 'Not Specified';
    }
  } catch (error) {
    console.error('Error fetching payment method from payment records:', error);
  }
  return 'Not Specified';
}