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
    
    console.log('=== STUDENTS DATA ===');
    students.forEach(student => {
      console.log(`Student ${student.studentId}:`, {
        name: student.name,
        activity: student.activity,
        program: student.program || student.course,
        category: student.category || student.level
      });
    });
    
    console.log('\n=== COURSES DATA ===');
    courses.forEach(course => {
      console.log(`Course ${course.courseId}:`, {
        name: course.name,
        level: course.level,
        price: course.priceINR
      });
    });
    
    console.log('\n=== MATCHING ANALYSIS ===');
    students.forEach(student => {
      const studentActivity = (student.activity || '').trim();
      const studentProgram = (student.program || student.course || '').trim();
      const studentCategory = (student.category || student.level || '').trim();
      
      console.log(`\nStudent ${student.studentId} (${student.name}):`);
      console.log(`  Activity: "${studentActivity}"`);
      console.log(`  Program: "${studentProgram}"`);
      console.log(`  Category: "${studentCategory}"`);
      
      let hasMatch = false;
      courses.forEach(course => {
        const courseCode = (course.courseId || '').trim();
        const courseName = (course.name || '').trim();
        const courseLevel = (course.level || '').trim();
        
        const rule1Match = studentActivity.toLowerCase() === courseCode.toLowerCase();
        const rule2Match = studentProgram.toLowerCase() === courseName.toLowerCase();
        const rule3Match = studentCategory.toLowerCase() === courseLevel.toLowerCase();
        
        if (rule1Match || rule2Match || rule3Match) {
          console.log(`  -> Partial match with ${course.courseId}:`);
          console.log(`     Rule 1 (Activity=${studentActivity} vs CourseId=${courseCode}): ${rule1Match}`);
          console.log(`     Rule 2 (Program=${studentProgram} vs CourseName=${courseName}): ${rule2Match}`);
          console.log(`     Rule 3 (Category=${studentCategory} vs CourseLevel=${courseLevel}): ${rule3Match}`);
          
          if (rule1Match && rule2Match && rule3Match) {
            console.log(`     ✅ FULL MATCH! Price: ₹${course.priceINR}`);
            hasMatch = true;
          }
        }
      });
      
      if (!hasMatch) {
        console.log(`  ❌ No matches found`);
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
    console.error('DEBUG_ERROR', error);
    return NextResponse.json(
      { success: false, error: "Debug failed", details: error.message },
      { status: 500 }
    );
  }
}