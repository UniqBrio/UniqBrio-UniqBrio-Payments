import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Payment from "@/models/payment";
import Course from "@/models/course";
import { NextRequest, NextResponse } from "next/server";

// POST: Create payment records automatically when a student registers
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Auto-payment creation triggered for student:', body);
    
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Fetch student details
    const student = await Student.findOne({ studentId });
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if payments already exist for this student
    const existingPayments = await Payment.find({ studentId });
    if (existingPayments.length > 0) {
      console.log(`Payments already exist for student ${studentId}, skipping auto-creation`);
      return NextResponse.json({
        success: true,
        message: "Payment records already exist for this student",
        data: { existingPayments: existingPayments.length }
      });
    }

    // Get course details for accurate pricing
    const courseName = student.course || student.activity;
    let courseDetails = null;
    let finalPayment = student.finalPayment || 0;
    
    if (courseName) {
      courseDetails = await Course.findOne({
        $or: [
          { name: { $regex: new RegExp(courseName, 'i') } },
          { id: courseName }
        ]
      });
      
      if (courseDetails) {
        finalPayment = courseDetails.priceINR || finalPayment;
      }
    }

    // Use default pricing if no course found
    if (finalPayment === 0) {
      const defaultPricing: { [key: string]: number } = {
        'art': 15000,
        'photography': 12000,
        'music': 10000,
        'dance': 8000,
        'craft': 6000,
        'drama': 7000,
        'digital art': 18000,
        'singing': 9000,
        'guitar': 11000,
        'piano': 13000,
        'painting': 14000,
        'drawing': 8000,
        'sculpture': 16000
      };
      
      const courseNameLower = (courseName || '').toLowerCase();
      finalPayment = 10000; // Default base price
      
      for (const [courseKey, price] of Object.entries(defaultPricing)) {
        if (courseNameLower.includes(courseKey)) {
          finalPayment = price;
          break;
        }
      }
    }

    // Calculate registration fees
    const registrationFees = student.registrationFees || {
      studentRegistration: 500,
      courseRegistration: 1000,
      confirmationFee: 250,
      paid: false,
      status: "Pending"
    };

    const registrationTotal = registrationFees.studentRegistration + 
                              registrationFees.courseRegistration + 
                              registrationFees.confirmationFee;

    // Set payment due dates
    const registrationDueDate = new Date(Date.now() + 7*24*60*60*1000); // 7 days
    const courseStartDate = student.courseStartDate ? new Date(student.courseStartDate) : new Date();
    const firstCourseDueDate = new Date(courseStartDate.getTime() + 30*24*60*60*1000); // 30 days from course start

    const createdPayments = [];

    // 1. Create registration fee payment record (always pending initially)
    const registrationPayment = new Payment({
      studentId,
      studentName: student.name,
      courseId: courseName || "GENERAL",
      courseName: courseName || "General Course",
      cohort: student.cohort || `${courseName}_${new Date().getFullYear()}_Batch01`,
      batch: student.batch || "Morning Batch",
      amount: registrationTotal,
      currency: "INR",
      paymentType: "Registration Fee",
      paymentCategory: "Student Registration",
      paymentMethod: "Pending",
      paymentStatus: "Pending",
      paymentDate: new Date(),
      dueDate: registrationDueDate,
      receiverName: "UniqBrio Academy",
      receiverId: "UNIQBRIO_REG",
      notes: `Registration fees for ${courseName}:\n- Student Registration: ₹${registrationFees.studentRegistration}\n- Course Registration: ₹${registrationFees.courseRegistration}\n- Confirmation Fee: ₹${registrationFees.confirmationFee}\n\nDue Date: ${registrationDueDate.toLocaleDateString()}`,
      previousBalance: registrationTotal,
      newBalance: registrationTotal,
      totalCourseFee: finalPayment,
      isManualPayment: false,
      recordedBy: "System - Auto Registration",
      ipAddress: request.headers.get('x-forwarded-for') || 'localhost',
      userAgent: "UniqBrio Payment System v1.0"
    });

    const savedRegistrationPayment = await registrationPayment.save();
    createdPayments.push(savedRegistrationPayment);
    console.log('Created registration payment:', savedRegistrationPayment.transactionId);

    // 2. Create course fee payment record(s) based on payment frequency
    const paymentFrequency = student.paymentFrequency || "Monthly";
    let installments = 1;
    let installmentPeriod = "month";
    
    switch (paymentFrequency) {
      case "Monthly":
        installments = 3;
        installmentPeriod = "month";
        break;
      case "Quarterly":
        installments = 4;
        installmentPeriod = "quarter";
        break;
      case "Weekly":
        installments = 12;
        installmentPeriod = "week";
        break;
      case "Semi-annual":
        installments = 2;
        installmentPeriod = "semester";
        break;
      case "Yearly":
      case "One-time":
      default:
        installments = 1;
        installmentPeriod = "full";
        break;
    }

    const installmentAmount = Math.round(finalPayment / installments);
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(firstCourseDueDate);
      
      // Calculate due date based on frequency
      switch (paymentFrequency) {
        case "Monthly":
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          break;
        case "Quarterly":
          dueDate.setMonth(dueDate.getMonth() + (i - 1) * 3);
          break;
        case "Weekly":
          dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
          break;
        case "Semi-annual":
          dueDate.setMonth(dueDate.getMonth() + (i - 1) * 6);
          break;
      }

      // Adjust last installment to cover any rounding differences
      const amount = (i === installments) ? 
        finalPayment - (installmentAmount * (installments - 1)) : 
        installmentAmount;

      const paymentLabel = installments > 1 ? 
        `Installment ${i} of ${installments}` : 
        "Full Payment";

      const coursePayment = new Payment({
        studentId,
        studentName: student.name,
        courseId: courseName || "GENERAL",
        courseName: courseName || "General Course",
        cohort: student.cohort || `${courseName}_${new Date().getFullYear()}_Batch01`,
        batch: student.batch || "Morning Batch",
        amount,
        currency: "INR",
        paymentType: "Course Fee",
        paymentCategory: "Course Payment",
        paymentMethod: "Pending",
        paymentStatus: "Pending",
        paymentDate: new Date(),
        dueDate,
        receiverName: "UniqBrio Academy",
        receiverId: "UNIQBRIO_COURSE",
        notes: `${paymentLabel} for ${courseName} course.\nAmount: ₹${amount.toLocaleString()}\nDue Date: ${dueDate.toLocaleDateString()}\nPayment Frequency: ${paymentFrequency}`,
        previousBalance: finalPayment,
        newBalance: finalPayment - (installmentAmount * (i - 1)),
        totalCourseFee: finalPayment,
        isManualPayment: false,
        recordedBy: "System - Auto Registration",
        ipAddress: request.headers.get('x-forwarded-for') || 'localhost',
        userAgent: "UniqBrio Payment System v1.0",
        installmentNumber: i,
        totalInstallments: installments,
        isEMI: installments > 1
      });

      const savedCoursePayment = await coursePayment.save();
      createdPayments.push(savedCoursePayment);
      console.log(`Created course payment ${i}/${installments}:`, savedCoursePayment.transactionId);
    }

    // ONLY create payment records - DO NOT update students collection
    console.log(`Successfully created ${createdPayments.length} payment records for student ${studentId} - no other collections modified`);

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        studentName: student.name,
        courseName: courseName || "General Course",
        paymentRecords: createdPayments.length,
        details: {
          registrationFee: registrationTotal,
          courseFee: finalPayment,
          totalAmount: registrationTotal + finalPayment,
          installments,
          paymentFrequency,
          registrationDueDate: registrationDueDate.toLocaleDateString(),
          firstCourseDueDate: firstCourseDueDate.toLocaleDateString()
        },
        createdPayments: createdPayments.map(p => ({
          transactionId: p.transactionId,
          type: p.paymentType,
          category: p.paymentCategory,
          amount: p.amount,
          dueDate: p.dueDate,
          status: p.paymentStatus
        }))
      },
      message: `Payment system activated for ${student.name}. Created ${createdPayments.length} payment records (1 registration + ${installments} course payment${installments > 1 ? 's' : ''})`
    }, { status: 201 });

  } catch (error) {
    console.error('Auto-payment creation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create payment records" },
      { status: 500 }
    );
  }
}