import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch payment documents (one per student) or specific student's payment data
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'lastPaymentDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    if (studentId) {
      // Fetch specific student's payment document
      const paymentDoc = await Payment.findOne({ studentId }).lean();
      
      if (!paymentDoc) {
        return NextResponse.json({
          success: true,
          data: null,
          message: "No payment record found for this student"
        });
      }
      
      return NextResponse.json({
        success: true,
        data: paymentDoc,
        message: `Found ${(paymentDoc as any).paymentRecords?.length || 0} payment records for student ${studentId}`
      });
    } else {
      // Fetch all payment documents (one per student)
      const skip = (page - 1) * limit;
      
      const payments = await Payment.find({})
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit)
        .skip(skip)
        .lean();
      
      const totalCount = await Payment.countDocuments({});
      
      // Transform data to include summary information
      const transformedData = payments.map((doc: any) => ({
        studentId: doc.studentId,
        studentName: doc.studentName,
        courseName: doc.courseName,
        totalCourseFee: doc.totalCourseFee,
        totalPaidAmount: doc.totalPaidAmount,
        currentBalance: doc.currentBalance,
        paymentStatus: doc.paymentStatus,
        totalTransactions: doc.paymentRecords?.length || 0,
        completedTransactions: doc.paymentRecords?.filter((r: any) => r.paymentStatus === 'Completed').length || 0,
        lastPaymentDate: doc.lastPaymentDate,
        currency: doc.currency,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
      
      return NextResponse.json({
        success: true,
        data: transformedData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          limit
        }
      });
    }
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST: Add payment record ONLY to payments collection - no other collections modified
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    console.log('=== PAYMENT CREATION START ===');
    
    const body = await request.json();
    console.log('Received payment data:', body);

    
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
      recordedBy = "Admin",
      finalPayment, // Get finalPayment from request body
      registrationPaymentType // Track which registration fee was paid
    } = body;

    // Validate required fields
    if (!studentId || !amount || !receiverName || !receiverId) {
      console.log('❌ Validation failed:', { studentId, amount, receiverName, receiverId });
      return NextResponse.json(
        { success: false, error: "Missing required fields: studentId, amount, receiverName, receiverId" },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed');

    // Get student info for display purposes only (read-only)
    const student = await Student.findOne({ studentId }).lean() as any;
    console.log('📖 Student info (read-only):', student ? student.name : 'Not found');

    
    // Generate transaction ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const transactionId = `PAY_${timestamp}_${random}`.toUpperCase();
    console.log('🔢 Generated transaction ID:', transactionId);

    // ONLY WORK WITH PAYMENTS COLLECTION
    let paymentDoc = await Payment.findOne({ studentId });
    console.log('💾 Existing payment doc found:', !!paymentDoc);

    
    if (!paymentDoc) {
      // PAYMENT COLLECTION: Only for payment tracking, NO course fee calculation
      
      paymentDoc = new Payment({
        studentId,
        studentName: student?.name || 'Unknown Student',
        courseId: student?.course || student?.activity || "GENERAL",
        courseName: student?.course || student?.activity || "General Course",
        cohort: student?.cohort || `${new Date().getFullYear()}_Batch01`,
        batch: student?.batch || "Morning Batch",
        totalCourseFee: 0, // Will be calculated dynamically from courses collection
        currentBalance: 0, // Will be calculated dynamically from courses collection
        currency: student?.currency || "INR",
        paymentRecords: []
      });
    }

    // Update payment totals (balance will be calculated dynamically from courses collection)
    paymentDoc.totalPaidAmount = (paymentDoc.totalPaidAmount || 0) + amount;
    console.log('💰 Payment recorded:', { amount, newTotalPaid: paymentDoc.totalPaidAmount });

    // Create payment record
    const newPaymentRecord = {
      transactionId,
      amount: Number(amount),
      currency: paymentDoc.currency,
      paymentType,
      paymentCategory,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      receiverName: receiverName || 'System',
      receiverId: receiverId || 'AUTO',
      notes,
      isManualPayment,
      recordedBy,
      ipAddress: request.headers.get('x-forwarded-for') || 'localhost',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      paymentStatus: 'Completed'
    };

    // Handle registration fee payments
    if (registrationPaymentType && ['studentRegistration', 'courseRegistration', 'confirmationFee'].includes(registrationPaymentType)) {
      // Initialize registration fees if not exists
      if (!paymentDoc.registrationFees) {
        paymentDoc.registrationFees = {
          studentRegistration: { amount: 500, paid: false },
          courseRegistration: { amount: 1000, paid: false },
          confirmationFee: { amount: 250, paid: false },
          overall: { paid: false, status: 'Pending' }
        };
      }

      // Update the specific registration fee
      if (registrationPaymentType === 'studentRegistration') {
        paymentDoc.registrationFees.studentRegistration.paid = true;
        paymentDoc.registrationFees.studentRegistration.paidDate = new Date(paymentDate).toISOString();
      } else if (registrationPaymentType === 'courseRegistration') {
        paymentDoc.registrationFees.courseRegistration.paid = true;
        paymentDoc.registrationFees.courseRegistration.paidDate = new Date(paymentDate).toISOString();
      } else if (registrationPaymentType === 'confirmationFee') {
        paymentDoc.registrationFees.confirmationFee.paid = true;
        paymentDoc.registrationFees.confirmationFee.paidDate = new Date(paymentDate).toISOString();
      }

      // Update overall registration status
      const allRegFeesPaid = 
        paymentDoc.registrationFees.studentRegistration.paid &&
        paymentDoc.registrationFees.courseRegistration.paid &&
        paymentDoc.registrationFees.confirmationFee.paid;
      
      paymentDoc.registrationFees.overall.paid = allRegFeesPaid;
      paymentDoc.registrationFees.overall.status = allRegFeesPaid ? 'Paid' : 'Pending';

      console.log('✅ Updated registration fee:', registrationPaymentType, 'to paid status');
    }

    // Add payment record to array
    paymentDoc.paymentRecords.push(newPaymentRecord);
    paymentDoc.lastUpdatedBy = recordedBy;
    
    console.log('📝 Adding payment record:', {
      transactionId,
      amount,
      method: paymentMethod,
      recordsCount: paymentDoc.paymentRecords.length
    });

    
    // Save ONLY to payments collection
    const savedPayment = await paymentDoc.save();
    console.log('✅ Payment saved successfully to payments collection');
    console.log('📊 Payment collection summary:', {
      totalPaid: savedPayment.totalPaidAmount,
      totalRecords: savedPayment.paymentRecords.length,
      note: 'Balance calculated dynamically from courses collection'
    });


    // Get the newly added record
    const addedRecord = savedPayment.paymentRecords[savedPayment.paymentRecords.length - 1];

    console.log('=== PAYMENT CREATION END ===');

    return NextResponse.json({
      success: true,
      data: {
        studentId: savedPayment.studentId,
        studentName: savedPayment.studentName,
        transactionId,
        paymentRecord: addedRecord,
        summary: {
          totalPaidAmount: savedPayment.totalPaidAmount,
          totalTransactions: savedPayment.paymentRecords.length,
          note: "Course fees and balances calculated dynamically from courses collection"
        }
      },
      message: `✅ Payment of ₹${amount.toLocaleString()} recorded successfully in payments collection (course fees calculated dynamically)`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Payment creation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create payment record" },
      { status: 500 }
    );
  }
}