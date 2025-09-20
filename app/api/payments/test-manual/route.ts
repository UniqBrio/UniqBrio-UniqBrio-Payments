import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Test endpoint to verify manual payment functionality
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: "studentId is required"
      }, { status: 400 });
    }

    // Get student record
    const student = await Student.findOne({ studentId });
    if (!student) {
      return NextResponse.json({
        success: false,
        error: "Student not found"
      }, { status: 404 });
    }

    // Get all payments for this student
    const payments = await Payment.find({ studentId }).sort({ paymentDate: -1 });
    
    // Calculate totals
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = Math.max(0, (student.finalPayment || 0) - totalPaid);
    
    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.studentId,
          name: student.name,
          finalPayment: student.finalPayment || 0,
          totalPaidAmount: student.totalPaidAmount || 0,
          balancePayment: student.balancePayment || 0,
          paymentStatus: student.paymentStatus || 'Pending',
          lastUpdated: student.updatedAt
        },
        payments: payments.map(p => ({
          id: p._id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          paymentStatus: p.paymentStatus,
          receiverName: p.receiverName,
          notes: p.notes
        })),
        calculated: {
          totalPaidFromPayments: totalPaid,
          calculatedBalance: balance,
          paymentsCount: payments.length
        }
      }
    });

  } catch (error) {
    console.error('Test manual payment error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}