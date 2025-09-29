import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing payment creation...');
    
    const connection = await connectDB();
    
    if (!connection) {
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable"
      }, { status: 503 });
    }

    console.log('✅ Database connected');

    // Find a test student
    const student = await Student.findOne({ studentId: "STU0005" });
    
    if (!student) {
      return NextResponse.json({
        success: false,
        error: "Test student STU0005 not found"
      }, { status: 404 });
    }

    console.log('✅ Student found:', student.name);

    // Try to find existing payment document
    let paymentDoc = await Payment.findOne({ studentId: "STU0005" });
    
    if (!paymentDoc) {
      console.log('📝 Creating new payment document...');
      paymentDoc = new Payment({
        studentId: "STU0005",
        studentName: student.name,
        studentEmail: student.email || '',
        program: student.program || '',
        level: student.level || '',
        batch: student.batch || '',
        totalCourseFee: 25000,
        totalPaidAmount: 0,
        coursePaidAmount: 0,
        currentBalance: 25000,
        paymentRecords: []
      });
    }

    console.log('📝 Existing payment document found:', paymentDoc.studentName);

    // Create test payment record
    const testPaymentRecord = {
      amount: 1000,
      paymentMethod: "Cash",
      paymentType: "Course Fee",
      paymentCategory: "Course Payment",
      notes: "Test payment from API",
      paymentDate: new Date(),
      receiverName: student.name,
      receiverId: "STU0005",
      previousBalance: paymentDoc.currentBalance,
      newBalance: Math.max(0, paymentDoc.currentBalance - 1000),
      isManualPayment: true,
      recordedBy: "Test System",
      receivedByName: "Test Admin",
      receivedByRole: "admin"
    };

    console.log('💰 Adding payment record:', testPaymentRecord);

    // Add the payment record
    paymentDoc.paymentRecords.push(testPaymentRecord);

    console.log('💾 Saving payment document...');
    
    // Save the document
    await paymentDoc.save();

    console.log('✅ Payment document saved successfully!');

    // Verify it was saved
    const savedDoc = await Payment.findOne({ studentId: "STU0005" });
    
    return NextResponse.json({
      success: true,
      message: "Test payment created successfully",
      data: {
        studentId: savedDoc?.studentId,
        studentName: savedDoc?.studentName,
        totalRecords: savedDoc?.paymentRecords.length,
        currentBalance: savedDoc?.currentBalance,
        paymentStatus: savedDoc?.paymentStatus,
        lastPaymentRecord: savedDoc?.paymentRecords[savedDoc.paymentRecords.length - 1]
      }
    });

  } catch (error) {
    console.error('❌ Test Payment API Error:', error);
    return NextResponse.json({
      success: false,
      error: "Test payment failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}