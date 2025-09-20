import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Endpoint to fix student final payment amounts
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Default course pricing based on activity/course
    const coursePricing: { [key: string]: number } = {
      'Art': 15000,
      'Photography': 12000,
      'Music': 10000,
      'Dance': 8000,
      'Craft': 6000,
      'Drama': 7000,
      'Digital Art': 18000,
      'Singing': 9000,
      'Guitar': 11000,
      'Piano': 13000,
      'default': 10000
    };
    
    // Get all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students to update`);
    
    let updateCount = 0;
    
    for (const student of students) {
      let finalPayment = student.finalPayment || 0;
      
      // If finalPayment is 0 or not set, calculate from course/activity
      if (finalPayment === 0) {
        const courseName = student.course || student.activity || '';
        
        // Find matching course price
        let price = coursePricing['default'];
        for (const [course, coursePrice] of Object.entries(coursePricing)) {
          if (courseName.toLowerCase().includes(course.toLowerCase())) {
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
      await Student.updateOne(
        { studentId: student.studentId },
        {
          $set: {
            finalPayment,
            balancePayment: balance,
            paymentStatus: status
          }
        }
      );
      
      updateCount++;
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updateCount} student records with proper payment amounts`,
      data: { updatedStudents: updateCount }
    });

  } catch (error) {
    console.error('Fix payments error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}