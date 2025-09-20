import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    await connectDB();
    
    const { studentId } = params;
    
    // Get student details
    const student = await Student.findOne({ studentId }).lean();
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }
    
    // Get all payments for this student
    const payments = await Payment.find({ studentId })
      .sort({ paymentDate: -1 })
      .lean();
    
    // Calculate payment summary
    const totalPaid = payments.reduce((sum, payment) => {
      return payment.paymentStatus === 'Completed' ? sum + payment.amount : sum;
    }, 0);
    
    const totalCourseFee = student.finalPayment || 0;
    const balance = Math.max(0, totalCourseFee - totalPaid);
    
    // Payment method breakdown
    const paymentByMethod = payments.reduce((acc, payment) => {
      if (payment.paymentStatus === 'Completed') {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Monthly payment trends
    const monthlyPayments = payments.reduce((acc, payment) => {
      if (payment.paymentStatus === 'Completed') {
        const monthYear = new Date(payment.paymentDate).toISOString().slice(0, 7); // YYYY-MM
        acc[monthYear] = (acc[monthYear] || 0) + payment.amount;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const summary = {
      student: {
        id: studentId,
        name: student.name,
        course: student.course || student.activity,
        cohort: student.cohort,
        batch: student.batch
      },
      financial: {
        totalCourseFee,
        totalPaid,
        balance,
        paymentStatus: balance === 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Pending'),
        currency: student.currency || 'INR'
      },
      analytics: {
        totalTransactions: payments.filter(p => p.paymentStatus === 'Completed').length,
        paymentByMethod,
        monthlyPayments,
        averagePaymentAmount: totalPaid > 0 ? totalPaid / payments.filter(p => p.paymentStatus === 'Completed').length : 0,
        firstPaymentDate: payments.length > 0 ? payments[payments.length - 1].paymentDate : null,
        lastPaymentDate: payments.length > 0 ? payments[0].paymentDate : null
      },
      recentPayments: payments.slice(0, 5) // Last 5 payments
    };
    
    return NextResponse.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Payment summary error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment summary" },
      { status: 500 }
    );
  }
}