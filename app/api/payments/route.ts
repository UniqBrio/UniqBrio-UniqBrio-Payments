import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const connection = await connectDB();
    
    if (!connection) {
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable"
      }, { status: 503 });
    }
    
    const body = await request.json();
    const {
      studentId,
      amount,
      paymentMethod,
      paymentType,
      paymentCategory,
      notes,
      paymentDate,
      isManualPayment,
      recordedBy,
      registrationPaymentType,
      finalPayment,
      receivedByName,
      receivedByRole
    } = body;

    // Validate required fields
    if (!studentId || !amount || !paymentMethod || !paymentDate) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: studentId, amount, paymentMethod, paymentDate"
      }, { status: 400 });
    }

    // Validate receivedBy fields for manual payments
    if (isManualPayment && (!receivedByName || !receivedByRole)) {
      return NextResponse.json({
        success: false,
        error: "Payment received by name and role are required for manual payments"
      }, { status: 400 });
    }

    // Find the student
    const student = await Student.findOne({ studentId });
    if (!student) {
      return NextResponse.json({
        success: false,
        error: "Student not found"
      }, { status: 404 });
    }

    // Create payment record
    const paymentData = {
      studentId: student.studentId,
      studentName: student.name,
      amount: Number(amount),
      paymentMethod,
      paymentType: paymentType || 'Course Fee',
      paymentCategory: paymentCategory || 'Course Payment',
      notes: notes || '',
      paymentDate: new Date(paymentDate),
      isManualPayment: Boolean(isManualPayment),
      recordedBy: recordedBy || 'System',
      registrationPaymentType,
      finalPayment: Number(finalPayment) || 0,
      ...(isManualPayment && receivedByName && receivedByRole && {
        receivedByName: receivedByName.trim(),
        receivedByRole: receivedByRole
      })
    };

    const payment = new Payment(paymentData);
    await payment.save();

    // Calculate updated payment summary
    const allPayments = await Payment.find({ studentId: student.studentId });
    const coursePaidAmount = allPayments
      .filter(p => ['Course Payment', 'Course Registration'].includes(p.paymentCategory))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const currentBalance = Math.max(0, (finalPayment || 0) - coursePaidAmount);
    const paymentStatus = currentBalance <= 0 ? 'Paid' : 'Pending';

    // Update student's payment status
    await Student.findOneAndUpdate(
      { studentId },
      {
        $inc: { totalPaidAmount: registrationPaymentType === 'course' ? amount : 0 },
        $set: {
          balancePayment: registrationPaymentType === 'course' ? currentBalance : student.balancePayment,
          paymentStatus: registrationPaymentType === 'course' ? paymentStatus : student.paymentStatus,
          ...(registrationPaymentType === 'studentRegistration' && {
            'registrationFees.studentRegistration.paid': true,
            'registrationFees.studentRegistration.paidDate': new Date()
          }),
          ...(registrationPaymentType === 'courseRegistration' && {
            'registrationFees.courseRegistration.paid': true,
            'registrationFees.courseRegistration.paidDate': new Date()
          })
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment: payment.toObject(),
        summary: {
          coursePaidAmount,
          totalPaidAmount: coursePaidAmount,
          currentBalance,
          paymentStatus
        }
      }
    });

  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const connection = await connectDB();
    
    if (!connection) {
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable"
      }, { status: 503 });
    }
    
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: "Student ID is required"
      }, { status: 400 });
    }
    
    const payments = await Payment.find({ studentId }).sort({ paymentDate: -1 });
    
    return NextResponse.json({
      success: true,
      data: payments
    });
    
  } catch (error) {
    console.error('Get Payments API Error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}