import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student"; // still needed for existence check, but will not be mutated
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/payments - Manual payment request received');
    // --- Diagnostic block start ---
    console.log('🧪 Environment diagnostics:', {
      NODE_ENV: process.env.NODE_ENV,
      HAS_MONGODB_URI: Boolean(process.env.MONGODB_URI),
      MONGODB_URI_PREFIX: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'undefined'
    });
    // --- Diagnostic block end ---
    
    const connection = await connectDB();
    
    if (!connection) {
      console.log('❌ Database connection unavailable');
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable"
      }, { status: 503 });
    }
    
    let body: any = {};
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('❌ Failed to parse JSON body:', parseErr);
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
    console.log('📝 Payment request body (raw):', body);
    
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
    if (!studentId || amount === undefined || amount === null || !paymentMethod || !paymentDate) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: studentId, amount, paymentMethod, paymentDate"
      }, { status: 400 });
    }
    if (isNaN(Number(amount))) {
      return NextResponse.json({ success: false, error: 'Amount must be a valid number' }, { status: 400 });
    }
    if (Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // Extra diagnostic: ensure studentId format
    console.log('🔎 Incoming studentId format check:', { studentId, length: studentId.length });

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

    // Guard against accidental mismatch where UI sends internal _id instead of studentId
    if (student.studentId !== studentId) {
      console.warn('⚠️ StudentId mismatch after lookup', { requested: studentId, stored: student.studentId });
    }

    // Find or create the student's payment document
    console.log('🔍 Looking for payment document for student:', student.studentId);
    let paymentDoc = await Payment.findOne({ studentId: student.studentId });
    
    if (!paymentDoc) {
      console.log('📄 Creating new payment document for student:', student.studentId);
      
      // Use provided finalPayment or calculate from student's finalPayment field
      const courseFee = Number(finalPayment) || Number(student.finalPayment) || 25000; // Default fallback
      
      console.log(`💰 Setting course fee: ₹${courseFee} (finalPayment: ${finalPayment}, student.finalPayment: ${student.finalPayment})`);
      
      // Create new payment document for this student with validated course data
      paymentDoc = new Payment({
        studentId: student.studentId,
        studentName: student.name,
        courseId: student.activity || 'MANUAL_PAYMENT',
        courseName: student.program || 'Manual Payment Course',
        cohort: student.cohort || '',
        batch: student.batch || '',
        totalCourseFee: courseFee,
        totalPaidAmount: 0,
        coursePaidAmount: 0,
        currentBalance: courseFee,
        paymentRecords: []
      });
      
      console.log(`📄 Payment document created with course fee: ₹${courseFee}`);
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
    console.log('➕ Adding payment record (pre-push):', newPaymentRecord);
    paymentDoc.paymentRecords.push(newPaymentRecord);
    console.log('🧮 Totals BEFORE save (pre-hook):', {
      paymentRecordsLen: paymentDoc.paymentRecords.length,
      totalPaidAmount: paymentDoc.totalPaidAmount,
      coursePaidAmount: paymentDoc.coursePaidAmount,
      currentBalance: paymentDoc.currentBalance
    });
    
    // Update the total course fee if provided
    if (finalPayment && Number(finalPayment) > 0) {
      console.log('💰 Updating total course fee to:', finalPayment);
      paymentDoc.totalCourseFee = Number(finalPayment);
    }

    // Save the document (pre-save hooks will calculate balances automatically)
    console.log('💾 Saving payment document...');
    console.log('📊 Pre-save state:', {
      totalRecords: paymentDoc.paymentRecords.length,
      totalCourseFee: paymentDoc.totalCourseFee,
      currentBalance: paymentDoc.currentBalance
    });
    
    try {
      await paymentDoc.save();
      console.log('✅ Payment document saved successfully');
      console.log('📊 Post-save state:', {
        totalPaidAmount: paymentDoc.totalPaidAmount,
        coursePaidAmount: paymentDoc.coursePaidAmount,
        currentBalance: paymentDoc.currentBalance,
        paymentStatus: paymentDoc.paymentStatus
      });
    if (!paymentDoc.paymentRecords || paymentDoc.paymentRecords.length === 0) {
      console.error('❌ Post-save anomaly: paymentRecords array empty after supposed push + save');
    }
    } catch (saveError) {
      console.error('❌ Error saving payment document:', saveError);
      const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown error';
      throw new Error(`Failed to save payment: ${errorMessage}`);
    }

    // ✂ Removed propagation: per updated requirement, ONLY payments collection is authoritative.
    // The students collection remains read-only and is NOT mutated here.
    // If UI still depends on student summary fields, ensure it reads from /api/payments/sync instead.

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

    // ✂ Removed paymentModes mutation to keep students collection immutable from payments API.
    
    console.log(`💰 PAYMENT DOCUMENT UPDATE: Payment added to student's payment record - Balance: ₹${currentBalance}`);

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully in student's payment document",
      debug: {
        savedRecords: paymentDoc.paymentRecords.length,
        lastRecord: paymentDoc.paymentRecords[paymentDoc.paymentRecords.length - 1]?.transactionId
      },
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