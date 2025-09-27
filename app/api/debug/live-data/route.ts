import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting direct comparison of students and courses...');
    await connectDB();
    
    // Get sample data to show what exists
    const students = await Student.find({}).limit(5);
    const courses = await Course.find({ status: 'Active' }).limit(5);
    
    console.log('\n📚 SAMPLE STUDENTS FROM DATABASE:');
    students.forEach((student: any, index) => {
      console.log(`Student ${index + 1}:`, {
        studentId: student.studentId,
        name: student.name,
        activity: student.activity,
        program: student.program || student.course,
        category: student.category || student.level
      });
    });
    
    console.log('\n🎓 SAMPLE COURSES FROM DATABASE:');
    courses.forEach((course: any, index) => {
      console.log(`Course ${index + 1}:`, {
        courseId: course.courseId || course.id,
        name: course.name,
        level: course.level,
        priceINR: course.priceINR
      });
    });
    
    console.log('\n🔄 TESTING MATCHING LOGIC:');
    
    const matchResults = [];
    for (const student of students) {
      const s = student as any;
      let matched = false;
      let matchDetails = null;
      
      for (const course of courses) {
        const c = course as any;
        const rule1 = (s.activity || '').toLowerCase() === (c.courseId || c.id || '').toLowerCase();
        const rule2 = (s.program || s.course || '').toLowerCase() === (c.name || '').toLowerCase();  
        const rule3 = (s.category || s.level || '').toLowerCase() === (c.level || '').toLowerCase();
        
        if (rule1 && rule2 && rule3) {
          matched = true;
          matchDetails = {
            courseId: c.courseId || c.id,
            courseName: c.name,
            courseLevel: c.level,
            fee: c.priceINR
          };
          console.log(`✅ MATCH FOUND: ${s.studentId} -> ${c.courseId || c.id} (₹${c.priceINR})`);
          break;
        }
      }
      
      if (!matched) {
        console.log(`❌ NO MATCH: ${s.studentId} (Activity: ${s.activity}, Program: ${s.program || s.course}, Category: ${s.category || s.level})`);
      }
      
      matchResults.push({
        studentId: s.studentId,
        studentName: s.name,
        studentData: {
          activity: s.activity,
          program: s.program || s.course,
          category: s.category || s.level
        },
        matched,
        matchDetails,
        finalPayment: matched ? (matchDetails?.fee || 0) : 0
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Direct comparison completed - NOT STORED anywhere',
      sampleData: {
        students: students.map((s: any) => ({
          studentId: s.studentId,
          name: s.name,
          activity: s.activity,
          program: s.program || s.course,
          category: s.category || s.level
        })),
        courses: courses.map((c: any) => ({
          courseId: c.courseId || c.id,
          name: c.name,
          level: c.level,
          priceINR: c.priceINR
        }))
      },
      matchResults,
      summary: {
        totalTested: matchResults.length,
        matched: matchResults.filter(r => r.matched).length,
        notMatched: matchResults.filter(r => !r.matched).length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Direct comparison error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}