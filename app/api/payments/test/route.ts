import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Test API to verify payment creation works
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Testing payment creation...');
    
    // Create a test payment
    const testPayment = {
      studentId: "TEST001",
      amount: 1000,
      paymentMethod: "Cash",
      paymentType: "Course Fee",
      paymentCategory: "Course Payment",
      receiverName: "Test Receiver",
      receiverId: "TEST_REC",
      notes: "Test payment for debugging"
    };
    
    console.log('Test payment data:', testPayment);
    
    // Check if student exists, if not create a mock one for testing
    let student = await Student.findOne({ studentId: testPayment.studentId });
    
    if (!student) {
      console.log('Student not found, creating test student...');
      // For testing, we'll just use mock student data
      student = {
        studentId: testPayment.studentId,
        name: "Test Student",
        course: "Test Course",
        finalPayment: 25000,
        currency: "INR"
      };
    }
    
    console.log('Student info:', student.name);
    
    // Generate transaction ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const transactionId = `PAY_${timestamp}_${random}`.toUpperCase();
    
    console.log('Generated transaction ID:', transactionId);
    
    // Find or create payment document for this student
    let paymentDoc = await Payment.findOne({ studentId: testPayment.studentId });
    
    if (!paymentDoc) {
      console.log('Creating new payment document...');
      
      paymentDoc = new Payment({
        studentId: testPayment.studentId,
        studentName: student.name,
        courseId: student.course || "TEST_COURSE",
        courseName: student.course || "Test Course",
        cohort: `TEST_${new Date().getFullYear()}_Batch01`,
        batch: "Test Batch",
        totalCourseFee: student.finalPayment || 25000,
        currentBalance: student.finalPayment || 25000,
        currency: student.currency || "INR",
        paymentRecords: []
      });
    } else {
      console.log('Found existing payment document with', paymentDoc.paymentRecords.length, 'records');
    }
    
    // Calculate balances
    const previousBalance = paymentDoc.currentBalance;
    const newBalance = Math.max(0, previousBalance - testPayment.amount);
    
    console.log('Balance calculation:', { previousBalance, amount: testPayment.amount, newBalance });
    
    // Create new payment record
    const newPaymentRecord = {
      transactionId,
      amount: testPayment.amount,
      currency: paymentDoc.currency,
      paymentType: testPayment.paymentType,
      paymentCategory: testPayment.paymentCategory,
      paymentMethod: testPayment.paymentMethod,
      paymentDate: new Date(),
      receiverName: testPayment.receiverName,
      receiverId: testPayment.receiverId,
      notes: testPayment.notes,
      previousBalance,
      newBalance,
      isManualPayment: true,
      recordedBy: "Test API",
      paymentStatus: 'Completed'
    };
    
    console.log('New payment record:', newPaymentRecord);
    
    // Add the payment record
    paymentDoc.paymentRecords.push(newPaymentRecord);
    paymentDoc.lastUpdatedBy = "Test API";
    
    console.log('Saving payment document...');
    
    // Save the document
    const savedPayment = await paymentDoc.save();
    
    console.log('Payment saved successfully!');
    console.log('Document summary:', {
      studentId: savedPayment.studentId,
      totalRecords: savedPayment.paymentRecords.length,
      totalPaid: savedPayment.totalPaidAmount,
      balance: savedPayment.currentBalance,
      status: savedPayment.paymentStatus
    });
    
    return NextResponse.json({
      success: true,
      message: "Test payment created successfully",
      data: {
        studentId: savedPayment.studentId,
        transactionId,
        paymentRecord: newPaymentRecord,
        summary: {
          totalCourseFee: savedPayment.totalCourseFee,
          totalPaidAmount: savedPayment.totalPaidAmount,
          currentBalance: savedPayment.currentBalance,
          paymentStatus: savedPayment.paymentStatus,
          totalRecords: savedPayment.paymentRecords.length
        }
      }
    });
    
  } catch (error) {
    console.error('Test payment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Test failed",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    // Get all payment documents
    const payments = await Payment.find({}).lean();
    
    return NextResponse.json({
      success: true,
      data: {
        totalDocuments: payments.length,
        documents: payments.map((doc: any) => ({
          studentId: doc.studentId,
          studentName: doc.studentName,
          totalRecords: doc.paymentRecords?.length || 0,
          totalPaid: doc.totalPaidAmount || 0,
          balance: doc.currentBalance || 0,
          status: doc.paymentStatus
        }))
      }
    });
    
  } catch (error) {
    console.error('Test fetch error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Test fetch failed" },
      { status: 500 }
    );
  }
}