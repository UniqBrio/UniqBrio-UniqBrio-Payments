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
    
    // Debug payment flow
    console.log(`💳 PAYMENT RECORDED for Student ${studentId}:`);
    console.log(`   Payment Amount: ₹${amount} (${paymentMethod})`);
    console.log(`   Final Payment (Course Fee): ₹${finalPayment || 0}`);
    console.log(`   Total Paid Amount: ₹${coursePaidAmount} (from ${allPayments.length} payments)`);
    console.log(`   New Balance: ₹${currentBalance} = ₹${finalPayment || 0} - ₹${coursePaidAmount}`);
    console.log(`   Payment Status: ${paymentStatus}`);

    // NO STUDENT COLLECTION UPDATES - READ ONLY APPROACH
    // Students and courses collections are only used for reading
    // All payment tracking happens through payments collection only
    
    console.log(`� PAYMENT ONLY UPDATE: Payment recorded in payments collection - Balance: ₹${currentBalance}`);

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully - calculated from payments collection only",
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