import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Console message removed
    
    // Get sample data to show what exists
    const students = await Student.find({}).limit(5);
    const courses = await Course.find({ status: 'Active' }).limit(5);
    
    // Sample display
    // Console message removed
    
    // Console message removed
    
    // Console message removed
    
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
          // Console message removed
          break;
        }
      }
      
      if (!matched) {
        // Console message removed
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
    // Console message removed
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}