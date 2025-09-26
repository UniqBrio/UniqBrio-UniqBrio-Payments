import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import Course from "@/models/course";
import { NextRequest, NextResponse } from "next/server";

// Disable caching for Vercel
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    let students = await Student.find({}).lean();
    
    // Limit to first 50 students for performance if there are too many
    if (students.length > 50) {
      students = students.slice(0, 50);
    }
    
    // No pre-fetching needed - we'll fetch courses per student for accurate matching
    
    const updatedStudents = await Promise.all(students.map(async (student, index) => {
      
      const paymentDoc = await Payment.findOne({ studentId: student.studentId }).lean();
      const paymentRecords = paymentDoc?.paymentRecords?.filter((record: any) => record.paymentStatus === 'Completed') || [];
      let totalPaidAmount = 0;
      if (paymentDoc && typeof paymentDoc.totalPaidAmount === 'number') {
        totalPaidAmount = paymentDoc.totalPaidAmount;
      } else {
        totalPaidAmount = paymentRecords.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
      }
      
      // FINAL PAYMENT MATCHING LOGIC - THREE RULE VALIDATION
      let totalCourseFee = 0;
      
      // Get student matching fields based on your rules
      const studentActivity = student.activity; // Rule 1: Must match courses.courseId (courses.id)
      const studentProgram = student.course; // Rule 2: Must match courses.name (using 'course' field as program)
      const studentCategory = student.category; // Rule 3: Must match courses.level
      
      // Only proceed if all required student fields exist
      if (studentActivity && studentProgram && studentCategory) {
        let matchingCourse = null;
        
        // Fetch all courses and search for exact triple match
        try {
          const allCourses = await Course.find({ status: 'Active' }).lean();
          
          for (const course of allCourses) {
            // Apply the three matching rules exactly as specified:
            const rule1Match = studentActivity === course.id; // students.activity === courses.courseId (courses.id)
            const rule2Match = studentProgram === course.name; // students.program === courses.name (using course field)
            const rule3Match = studentCategory === course.level; // students.category === courses.level
            
            // ALL THREE rules must match exactly for a valid match
            if (rule1Match && rule2Match && rule3Match) {
              matchingCourse = course;
              break; // Stop at first exact match
            }
          }
          
          // Set final payment only if exact match found
          if (matchingCourse && matchingCourse.priceINR) {
            totalCourseFee = matchingCourse.priceINR;
          } else {
            totalCourseFee = 0; // No match found, set to 0
          }
        } catch (error) {
          console.error('Error fetching courses for matching:', error);
          totalCourseFee = 0;
        }
      } else {
        // Missing required fields, set to 0
        totalCourseFee = 0;
      }
      const balancePayment = Math.max(0, totalCourseFee - totalPaidAmount);
      let paymentStatus = 'Paid';
      if (balancePayment > 0) {
        paymentStatus = 'Pending';
      }
      const latestPayment = paymentRecords.length > 0 ? 
        paymentRecords.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0] : null;

      return {
        id: student.studentId,
        name: student.name,
        activity: student.activity || student.course,
        category: student.category,
        courseType: student.courseType,
        cohort: student.cohort,
        batch: student.batch,
        instructor: student.instructor,
        classSchedule: student.classSchedule,
        currency: student.currency,
        finalPayment: totalCourseFee,
        totalPaidAmount: totalPaidAmount,
        balancePayment,
        paymentStatus,
        paymentFrequency: student.paymentFrequency,
        paidDate: latestPayment ? latestPayment.paymentDate.toISOString() : 
          (student.paidDate ? (student.paidDate instanceof Date ? student.paidDate.toISOString() : new Date(student.paidDate).toISOString()) : null),
        nextPaymentDate: student.nextPaymentDate ? 
          (student.nextPaymentDate instanceof Date ? student.nextPaymentDate.toISOString() : new Date(student.nextPaymentDate).toISOString()) : null,
        courseStartDate: student.courseStartDate ? 
          (student.courseStartDate instanceof Date ? student.courseStartDate.toISOString() : new Date(student.courseStartDate).toISOString()) : null,
        paymentReminder: student.paymentReminder,
        reminderMode: student.modeOfCommunication || student.reminderMode,
        communicationText: student.communicationText,
        reminderDays: student.reminderDays,
        registrationFees: paymentDoc?.registrationFees,
        paymentDetails: student.paymentDetails,
        paymentModes: student.paymentModes,
        studentType: student.studentType,
        emiSplit: student.emiSplit,
        totalTransactions: paymentRecords.length,
        lastPaymentDate: latestPayment ? latestPayment.paymentDate : null,
        lastPaymentAmount: latestPayment ? latestPayment.amount : 0,
        paymentHistory: paymentRecords.slice(0, 1).map((p: any) => ({
          id: p.transactionId,
          amount: p.amount,
          date: p.paymentDate,
          method: p.paymentMethod,
          notes: p.notes
        }))
      };
    }));
    
    return NextResponse.json({
      success: true,
      data: updatedStudents,
      message: `Synchronized payment data for ${updatedStudents.length} students`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to sync payment data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await GET(request);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to manually sync payment data" },
      { status: 500 }
    );
  }
}
