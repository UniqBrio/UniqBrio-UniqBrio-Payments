import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    
    // Get all students and courses to debug matching
    const students = await Student.find({}).limit(20).lean();
    const courses = await Course.find({ status: 'Active' }).lean();
    
    // Console message removed
    
    // Console message removed
    // Console message removed
    
    // Console message removed
    students.forEach(student => {
      const studentActivity = (student.activity || '').trim();
      const studentProgram = (student.program || student.course || '').trim();
      const studentCategory = (student.category || student.level || '').trim();
      
      // Console message removed
      // Console message removed
      // Console message removed
      // Console message removed
      
      let hasMatch = false;
      courses.forEach(course => {
        const courseCode = (course.courseId || '').trim();
        const courseName = (course.name || '').trim();
        const courseLevel = (course.level || '').trim();
        
        const rule1Match = studentActivity.toLowerCase() === courseCode.toLowerCase();
        const rule2Match = studentProgram.toLowerCase() === courseName.toLowerCase();
        const rule3Match = studentCategory.toLowerCase() === courseLevel.toLowerCase();
        
        if (rule1Match || rule2Match || rule3Match) {
          // Console message removed
          // Console message removed
          // Console message removed
          // Console message removed
          
          if (rule1Match && rule2Match && rule3Match) {
            // Console message removed
            hasMatch = true;
          }
        }
      });
      
      if (!hasMatch) {
        // Console message removed
      }
    });
    
    return NextResponse.json({
      success: true,
      students: students.length,
      courses: courses.length,
      studentsData: students,
      coursesData: courses
    });
    
  } catch (error: any) {
    // Console message removed
    return NextResponse.json(
      { success: false, error: "Debug failed", details: error.message },
      { status: 500 }
    );
  }
}