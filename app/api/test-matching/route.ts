import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get sample data to test matching
    const students = await Student.find({}).limit(5).lean();
    const courses = await Course.find({}).limit(10).lean();
    
    console.log("=== MATCHING TEST ===");
    console.log(`Found ${students.length} students and ${courses.length} courses`);
    
    const testResults = [];
    
    for (const student of students) {
      console.log(`\n🔍 Testing student: ${student.name}`);
      console.log(`   Activity: "${student.activity}"`);
      console.log(`   Name: "${student.name}"`);
      console.log(`   Level: "${student.level}"`);
      
      // Test exact matching
      let exactMatch = null;
      for (const course of courses) {
        const rule1 = student.activity === course.courseId;
        const rule2 = student.name === course.program;
        const rule3 = student.level === course.category;
        
        console.log(`   📚 Course: ${course.name || course.id}`);
        console.log(`      Rule 1: "${student.activity}" === "${course.courseId}" → ${rule1}`);
        console.log(`      Rule 2: "${student.name}" === "${course.program}" → ${rule2}`);
        console.log(`      Rule 3: "${student.level}" === "${course.category}" → ${rule3}`);
        
        if (rule1 && rule2 && rule3) {
          exactMatch = course;
          console.log(`   ✅ EXACT MATCH FOUND! Price: ₹${course.priceINR || 0}`);
          break;
        }
      }
      
      testResults.push({
        student: {
          id: student.studentId,
          name: student.name,
          activity: student.activity,
          level: student.level
        },
        exactMatch: exactMatch ? {
          courseId: exactMatch.courseId,
          name: exactMatch.name,
          program: exactMatch.program,
          category: exactMatch.category,
          priceINR: exactMatch.priceINR
        } : null,
        hasMatch: !!exactMatch
      });
      
      if (!exactMatch) {
        console.log(`   ❌ No exact match - Final Payment would remain 0`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Tested ${students.length} students against ${courses.length} courses`,
      testResults,
      summary: {
        totalStudents: students.length,
        totalCourses: courses.length,
        exactMatches: testResults.filter(r => r.hasMatch).length,
        unmatchedStudents: testResults.filter(r => !r.hasMatch).length
      }
    });
    
  } catch (error) {
    console.error('Test matching error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to test matching logic" },
      { status: 500 }
    );
  }
}