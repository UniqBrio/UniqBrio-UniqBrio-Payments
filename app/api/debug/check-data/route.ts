import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check if STU00015 exists
    const stu00015 = await Student.findOne({ studentId: 'STU00015' });
    
    // Get all students to see available IDs
    const allStudents = await Student.find({}, 'studentId name activity program category').limit(10);
    
    // Get all courses to see available courses
    const allCourses = await Course.find({ status: 'Active' }, 'courseId name level priceINR').limit(10);
    
    return NextResponse.json({
      success: true,
      stu00015Exists: !!stu00015,
      stu00015Data: stu00015,
      sampleStudents: allStudents,
      sampleCourses: allCourses,
      totalStudents: await Student.countDocuments(),
      totalCourses: await Course.countDocuments({ status: 'Active' })
    });
    
  } catch (error: any) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}