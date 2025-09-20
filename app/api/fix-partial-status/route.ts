import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Starting to fix Partial status records...');
    
    // Update all Student records with "Partial" status to "Pending"
    const result = await Student.updateMany(
      { paymentStatus: 'Partial' },
      { $set: { paymentStatus: 'Pending' } }
    );
    
    console.log(`Updated ${result.modifiedCount} student records from Partial to Pending status`);
    
    // Get count of remaining records by status for verification
    const statusCounts = await Student.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} records from Partial to Pending`,
      modifiedCount: result.modifiedCount,
      currentStatusDistribution: statusCounts,
      details: "All 'Partial' payment statuses have been converted to 'Pending'"
    });

  } catch (error) {
    console.error('Error fixing partial status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fix partial status records" 
      },
      { status: 500 }
    );
  }
}