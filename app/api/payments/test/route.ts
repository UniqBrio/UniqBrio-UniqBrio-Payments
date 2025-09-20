import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get recent payments to verify database connectivity
    const recentPayments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
      
    const studentCount = await Student.countDocuments({});
    const paymentCount = await Payment.countDocuments({});
    
    return NextResponse.json({
      success: true,
      data: {
        databaseConnected: true,
        totalStudents: studentCount,
        totalPayments: paymentCount,
        recentPayments: recentPayments.map(p => ({
          id: p.transactionId,
          student: p.studentName,
          amount: p.amount,
          method: p.paymentMethod,
          date: p.paymentDate,
          status: p.paymentStatus
        }))
      },
      message: "Database connection and payment system status"
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Database connection failed" },
      { status: 500 }
    );
  }
}