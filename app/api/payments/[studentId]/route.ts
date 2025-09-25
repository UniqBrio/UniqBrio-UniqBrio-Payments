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
    if (!student || Array.isArray(student)) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }
    
    // Get payment document for this student
    const paymentDoc = await Payment.findOne({ studentId }).lean();
    
    if (!paymentDoc) {
      return NextResponse.json({
        success: true,
        data: {
          student: {
            id: studentId,
            name: student.name,
            course: student.course || student.activity,
            cohort: student.cohort,
            batch: student.batch
          },
          financial: {
            totalCourseFee: (student as any).finalPayment || 0,
            totalPaid: 0,
            balance: (student as any).finalPayment || 0,
            paymentStatus: 'Pending',
            currency: student.currency || 'INR'
          },
          analytics: {
            totalTransactions: 0,
            paymentByMethod: {},
            monthlyPayments: {},
            averagePaymentAmount: 0,
            firstPaymentDate: null,
            lastPaymentDate: null
          },
          recentPayments: [],
          paymentRecords: []
        },
        message: "No payment records found for this student"
      });
    }
    
    // Filter completed payments for analytics
    const completedPayments = paymentDoc.paymentRecords.filter(record => record.paymentStatus === 'Completed');
    
    // Payment method breakdown
    const paymentByMethod = completedPayments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Monthly payment trends
    const monthlyPayments = completedPayments.reduce((acc, payment) => {
      const monthYear = new Date(payment.paymentDate).toISOString().slice(0, 7); // YYYY-MM
      acc[monthYear] = (acc[monthYear] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort payment records by date (newest first)
    const sortedPayments = [...paymentDoc.paymentRecords].sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
    
    const summary = {
      student: {
        id: studentId,
        name: paymentDoc.studentName,
        course: paymentDoc.courseName,
        cohort: paymentDoc.cohort,
        batch: paymentDoc.batch
      },
      financial: {
        totalCourseFee: paymentDoc.totalCourseFee,
        totalPaid: paymentDoc.totalPaidAmount,
        balance: paymentDoc.currentBalance,
        paymentStatus: paymentDoc.paymentStatus,
        currency: paymentDoc.currency
      },
      analytics: {
        totalTransactions: paymentDoc.paymentRecords.length,
        completedTransactions: completedPayments.length,
        paymentByMethod,
        monthlyPayments,
        averagePaymentAmount: completedPayments.length > 0 ? paymentDoc.totalPaidAmount / completedPayments.length : 0,
        firstPaymentDate: completedPayments.length > 0 ? completedPayments[completedPayments.length - 1].paymentDate : null,
        lastPaymentDate: paymentDoc.lastPaymentDate
      },
      recentPayments: sortedPayments.slice(0, 5), // Last 5 payments
      paymentRecords: sortedPayments, // All payment records
      documentInfo: {
        createdAt: paymentDoc.createdAt,
        updatedAt: paymentDoc.updatedAt,
        lastUpdatedBy: paymentDoc.lastUpdatedBy
      }
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