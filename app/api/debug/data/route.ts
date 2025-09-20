import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Debug endpoint to check student data
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get first 5 students to check their data
    const students = await Student.find({}).limit(5).lean();
    
    // Also get raw course data
    let courseCount = 0;
    try {
      const mongoose = require('mongoose');
      const CourseSchema = new mongoose.Schema({}, { strict: false });
      const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema, "courses");
      const courses = await Course.find({});
      courseCount = courses.length;
    } catch (err) {
      console.error('Course fetch error:', err);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        studentsCount: students.length,
        courseCount,
        sampleStudents: students.map(s => ({
          studentId: s.studentId,
          name: s.name,
          course: s.course,
          activity: s.activity,
          finalPayment: s.finalPayment,
          totalPaidAmount: s.totalPaidAmount,
          balancePayment: s.balancePayment,
          paymentStatus: s.paymentStatus
        }))
      }
    });

  } catch (error) {
    console.error('Debug data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}