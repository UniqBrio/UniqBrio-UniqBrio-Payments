import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    
    // Default course pricing based on activity/course
    const coursePricing: { [key: string]: number } = {
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
    
    // Get all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students to update`);
    
    let updateCount = 0;
    const updates = [];
    
    for (const student of students) {
      let finalPayment = student.finalPayment || 0;
      
      // If finalPayment is 0 or not set, calculate from course/activity
      if (finalPayment === 0) {
        const courseName = (student.course || student.activity || '').toLowerCase();
        
        // Find matching course price
        let price = 10000; // Default base price
        for (const [course, coursePrice] of Object.entries(coursePricing)) {
          if (courseName.includes(course)) {
            price = coursePrice;
            break;
          }
        }
        
        finalPayment = price;
      }
      
      // Calculate proper balance
      const totalPaid = student.totalPaidAmount || 0;
      const balance = Math.max(0, finalPayment - totalPaid);
      const status = balance === 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Pending');
      
      // Update student record
      const updateResult = await Student.updateOne(
        { studentId: student.studentId },
        {
          $set: {
            finalPayment,
            balancePayment: balance,
            paymentStatus: status
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        updateCount++;
        updates.push({
          studentId: student.studentId,
          name: student.name,
          course: student.course || student.activity,
          oldFinalPayment: student.finalPayment || 0,
          newFinalPayment: finalPayment,
          newBalance: balance,
          newStatus: status
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updateCount} student records with proper payment amounts`,
      data: { 
        updatedCount: updateCount,
        totalStudents: students.length,
        updates: updates.slice(0, 10) // Show first 10 updates
      }
    });

  } catch (error) {
    console.error('Fix payments error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}