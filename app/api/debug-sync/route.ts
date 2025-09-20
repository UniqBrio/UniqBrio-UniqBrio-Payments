import { NextResponse } from "next/server";

// Simple debug endpoint to test the sync API response
export async function GET() {
  try {
    // Call the sync API internally
    const response = await fetch('http://localhost:3002/api/payments/sync');
    const result = await response.json();
    
    // Return a summary of the first few records
    const summary = {
      success: result.success,
      dataCount: result.data ? result.data.length : 0,
      sampleRecords: result.data ? result.data.slice(0, 3).map((record: any) => ({
        id: record.id,
        name: record.name,
        activity: record.activity,
        finalPayment: record.finalPayment,
        totalPaidAmount: record.totalPaidAmount,
        balancePayment: record.balancePayment,
        paymentStatus: record.paymentStatus
      })) : [],
      error: result.error || null
    };
    
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}