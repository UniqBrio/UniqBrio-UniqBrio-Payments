import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/payments - Manual payment request received');
    
    const connection = await connectDB();
    
    if (!connection) {
      console.log('❌ Database connection unavailable');
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable"
      }, { status: 503 });
    }
    
    const body = await request.json();
    console.log('📝 Payment request body:', JSON.stringify(body, null, 2));
    
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
    console.log('🔍 Looking for student with ID:', studentId);
    const student = await Student.findOne({ studentId });
    if (!student) {
      console.log('❌ Student not found:', studentId);
      return NextResponse.json({
        success: false,
        error: "Student not found"
      }, { status: 404 });
    }
    console.log('✅ Student found:', student.name);

    // Find or create the student's payment document
    console.log('🔍 Looking for payment document for student:', student.studentId);
    let paymentDoc = await Payment.findOne({ studentId: student.studentId });
    
    if (!paymentDoc) {
      console.log('📄 Creating new payment document for student:', student.studentId);
      // Create new payment document for this student
      paymentDoc = new Payment({
        studentId: student.studentId,
        studentName: student.name,
        courseId: student.activity || 'UNKNOWN',
        courseName: student.program || 'Unknown Course',
        cohort: student.cohort || '',
        batch: student.batch || '',
        totalCourseFee: Number(finalPayment) || 0,
        totalPaidAmount: 0,
        coursePaidAmount: 0,
        currentBalance: Number(finalPayment) || 0,
        paymentRecords: []
      });
    } else {
      console.log('📄 Found existing payment document with', paymentDoc.paymentRecords.length, 'records');
    }

    // Create new payment record to add to the paymentRecords array
    const newPaymentRecord = {
      amount: Number(amount),
      paymentMethod, // Payment mode (Cash, UPI, QR, Card, etc.)
      paymentType: paymentType || 'Course Fee',
      paymentCategory: paymentCategory || 'Course Payment',
      notes: notes || '',
      paymentDate: new Date(paymentDate), // Payment date
      receiverName: student.name,
      receiverId: student.studentId,
      previousBalance: paymentDoc.currentBalance,
      newBalance: Math.max(0, paymentDoc.currentBalance - Number(amount)),
      isManualPayment: Boolean(isManualPayment),
      recordedBy: recordedBy || 'System',
      // Always store received by information when available
      receivedByName: receivedByName ? receivedByName.trim() : (recordedBy || 'System'),
      receivedByRole: receivedByRole || (isManualPayment ? 'admin' : 'system')
    };

    // Add the new payment record to the array
    console.log('➕ Adding payment record:', newPaymentRecord);
    paymentDoc.paymentRecords.push(newPaymentRecord);
    
    // Update the total course fee if provided
    if (finalPayment && Number(finalPayment) > 0) {
      console.log('💰 Updating total course fee to:', finalPayment);
      paymentDoc.totalCourseFee = Number(finalPayment);
    }

    // Save the document (pre-save hooks will calculate balances automatically)
    console.log('💾 Saving payment document...');
    await paymentDoc.save();
    console.log('✅ Payment document saved successfully');

    const currentBalance = paymentDoc.currentBalance;
    const paymentStatus = paymentDoc.paymentStatus;
    
    // Debug payment flow
    console.log(`💳 PAYMENT RECORDED for Student ${studentId}:`);
    console.log(`   Payment Amount: ₹${amount} (${paymentMethod})`);
    console.log(`   Payment Date: ${new Date(paymentDate).toLocaleDateString()}`);
    console.log(`   Payment Method/Mode: ${paymentMethod}`);
    console.log(`   Received By: ${newPaymentRecord.receivedByName} (${newPaymentRecord.receivedByRole})`);
    console.log(`   Final Payment (Course Fee): ₹${paymentDoc.totalCourseFee}`);
    console.log(`   Total Paid Amount: ₹${paymentDoc.totalPaidAmount} (from ${paymentDoc.paymentRecords.length} payments)`);
    console.log(`   Course Paid Amount: ₹${paymentDoc.coursePaidAmount}`);
    console.log(`   New Balance: ₹${currentBalance}`);
    console.log(`   Payment Status: ${paymentStatus}`);

    // Update student's payment modes to include the latest payment method
    if (paymentMethod && !student.paymentModes?.includes(paymentMethod)) {
      if (!student.paymentModes) {
        student.paymentModes = [];
      }
      student.paymentModes.push(paymentMethod);
      await student.save();
      console.log(`📝 STUDENT UPDATE: Added '${paymentMethod}' to payment modes for ${student.name}`);
    }
    
    console.log(`💰 PAYMENT DOCUMENT UPDATE: Payment added to student's payment record - Balance: ₹${currentBalance}`);

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully in student's payment document",
      data: {
        paymentRecord: newPaymentRecord,
        paymentDocument: {
          studentId: paymentDoc.studentId,
          totalRecords: paymentDoc.paymentRecords.length,
          totalCourseFee: paymentDoc.totalCourseFee,
          totalPaidAmount: paymentDoc.totalPaidAmount,
          coursePaidAmount: paymentDoc.coursePaidAmount,
          currentBalance: paymentDoc.currentBalance,
          paymentStatus: paymentDoc.paymentStatus
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
    
    const paymentDoc = await Payment.findOne({ studentId });
    
    if (!paymentDoc) {
      return NextResponse.json({
        success: true,
        data: {
          studentId,
          paymentRecords: [],
          totalRecords: 0,
          message: "No payment document found for this student"
        }
      });
    }
    
    // Sort payment records by date (newest first)
    const sortedPaymentRecords = paymentDoc.paymentRecords.sort(
      (a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
    
    return NextResponse.json({
      success: true,
      data: {
        studentId: paymentDoc.studentId,
        studentName: paymentDoc.studentName,
        totalCourseFee: paymentDoc.totalCourseFee,
        totalPaidAmount: paymentDoc.totalPaidAmount,
        coursePaidAmount: paymentDoc.coursePaidAmount,
        currentBalance: paymentDoc.currentBalance,
        paymentStatus: paymentDoc.paymentStatus,
        totalRecords: paymentDoc.paymentRecords.length,
        paymentRecords: sortedPaymentRecords
      }
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