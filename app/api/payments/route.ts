import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch all payments for a student or all payments
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'paymentDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const query = studentId ? { studentId } : {};
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    const totalCount = await Payment.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
        limit
      }
    });
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST: Create a new payment record
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Received payment data:', body); // Debug log
    
    const {
      studentId,
      amount,
      paymentMethod = "Cash",
      paymentType = "Course Fee",
      paymentCategory = "Course Payment",
      receiverName,
      receiverId,
      notes = "",
      dueDate,
      paymentDate = new Date(),
      isManualPayment = true,
      recordedBy = "Admin"
    } = body;

    // Validate required fields
    if (!studentId || !amount || !receiverName || !receiverId) {
      console.log('Validation failed:', { studentId, amount, receiverName, receiverId });
      return NextResponse.json(
        { success: false, error: "Missing required fields: studentId, amount, receiverName, receiverId" },
        { status: 400 }
      );
    }

    // Fetch student details
    const student = await Student.findOne({ studentId });
    console.log('Found student:', student ? student.name : 'Not found');
    
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Calculate balances
    const totalCourseFee = student.finalPayment || 0;
    const previousBalance = student.balancePayment || totalCourseFee;
    const newBalance = Math.max(0, previousBalance - amount);
    
    console.log('Balance calculation:', { totalCourseFee, previousBalance, amount, newBalance });
    
    // Generate transaction ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const transactionId = `PAY_${timestamp}_${random}`.toUpperCase();
    
    console.log('Generated transaction ID:', transactionId);
    
    // Create payment record
    const payment = new Payment({
      studentId,
      studentName: student.name,
      courseId: student.course || student.activity || "GENERAL",
      courseName: student.course || student.activity || "General Course",
      cohort: student.cohort || `${(student.course || '').replace(/\s+/g, '')}_${new Date().getFullYear()}_Batch01`,
      batch: student.batch || "Morning Batch",
      transactionId, // Explicitly set transaction ID
      amount,
      currency: student.currency || "INR",
      paymentType,
      paymentCategory,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      receiverName,
      receiverId,
      notes,
      previousBalance,
      newBalance,
      totalCourseFee,
      isManualPayment,
      recordedBy,
      ipAddress: request.headers.get('x-forwarded-for') || 'localhost',
      userAgent: request.headers.get('user-agent') || 'Unknown'
    });

    console.log('Creating payment record:', payment.toObject());
    
    const savedPayment = await payment.save();
    console.log('Payment saved with ID:', savedPayment._id);

    // Update student record with the new payment information
    const newTotalPaid = (student.totalPaidAmount || 0) + amount;
    const newStatus = newBalance === 0 ? 'Paid' : 'Pending'; // No "Partial" status - only Pending or Paid
    
    const updateResult = await Student.updateOne(
      { studentId },
      {
        $set: {
          totalPaidAmount: newTotalPaid,
          balancePayment: newBalance,
          paymentStatus: newStatus,
          paidDate: new Date(),
          paymentReminder: newBalance > 0, // Turn off reminders if fully paid
          lastPaymentDate: new Date(),
          lastPaymentAmount: amount
        }
      }
    );

    console.log('Student update result:', updateResult);

    // Verify the student was updated
    if (updateResult.matchedCount === 0) {
      console.log('Warning: Student record not found for update');
    } else if (updateResult.modifiedCount === 0) {
      console.log('Warning: Student record was not modified');
    } else {
      console.log('Student record updated successfully');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...savedPayment.toObject(),
        newBalance,
        newTotalPaid,
        newStatus,
        studentUpdated: updateResult.modifiedCount > 0
      },
      message: `Payment of ₹${amount.toLocaleString()} recorded successfully. New balance: ₹${newBalance.toLocaleString()}`
    }, { status: 201 });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create payment record" },
      { status: 500 }
    );
  }
}