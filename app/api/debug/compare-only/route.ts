import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Fetch all students from database
    const students = await Student.find({}).limit(20);
    // Console message removed
    
    // Fetch all active courses from database
    const courses = await Course.find({ status: 'Active' });
    // Console message removed
    
    const results = [];
    
    // For each student, try to match with courses
    for (const student of students) {
      const studentData = student as any;
      
      // Console message removed
      // Console message removed
      
      const normalize = (v: any) => (typeof v === 'string' ? v.trim() : v);
      const normLower = (v: any) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

      const studentActivity = normalize(studentData.activity);
      const studentProgram = normalize(studentData.program || studentData.course);
      const studentCategory = normalize(studentData.category || studentData.level);
      
      let matchedCourse = null;
      let matchType = 'NO_MATCH';
      let finalPayment = 0;
      
      // Console message removed
      
      // Try exact triple match first
      if (studentActivity && studentProgram && studentCategory) {
        for (const course of courses) {
          const courseData = course as any;
          const courseCode = courseData.courseId || courseData.id;
          
          // Rule 1: students.activity must match courses.courseId
          // Rule 2: students.program must match courses.name  
          // Rule 3: students.category must match courses.level
          const rule1Match = normLower(studentActivity) === normLower(courseCode);
          const rule2Match = normLower(studentProgram) === normLower(courseData.name);
          const rule3Match = normLower(studentCategory) === normLower(courseData.level);
          
          // Console message removed
          
          if (rule1Match && rule2Match && rule3Match) {
            matchedCourse = courseData;
            matchType = 'EXACT_TRIPLE_MATCH';
            finalPayment = courseData.priceINR || 0;
            // Console message removed
            break;
          }
        }
      }
      
      // If no exact match, try fallback matching
      if (!matchedCourse && studentActivity && studentCategory) {
        // Console message removed
        for (const course of courses) {
          const courseData = course as any;
          const courseCode = courseData.courseId || courseData.id;
          
          const activityMatch = normLower(courseCode) === normLower(studentActivity);
          const levelMatch = normLower(studentCategory) === normLower(courseData.level);
          
          if (activityMatch && levelMatch) {
            matchedCourse = courseData;
            matchType = 'ACTIVITY_LEVEL_MATCH';
            finalPayment = courseData.priceINR || 0;
            // Console message removed
            break;
          }
        }
      }
      
      if (!matchedCourse) {
        // Console message removed
      }
      
      // Add result for this student
      results.push({
        studentId: studentData.studentId,
        studentName: studentData.name,
        activity: studentActivity,
        program: studentProgram,
        category: studentCategory,
        matchedCourse: matchedCourse ? {
          courseId: matchedCourse.courseId || matchedCourse.id,
          name: matchedCourse.name,
          level: matchedCourse.level,
          fee: matchedCourse.priceINR
        } : null,
        matchType,
        finalPayment,
        tripleRuleMatched: matchType === 'EXACT_TRIPLE_MATCH'
      });
    }
    
    // Console message removed
    // Console message removed
    // Console message removed
    // Console message removed
    // Console message removed
    
    return NextResponse.json({
      success: true,
      message: 'Student-Course comparison completed (NOT STORED anywhere)',
      totalStudents: students.length,
      totalCourses: courses.length,
      results,
      summary: {
        exactMatches: results.filter(r => r.matchType === 'EXACT_TRIPLE_MATCH').length,
        fallbackMatches: results.filter(r => r.matchType === 'ACTIVITY_LEVEL_MATCH').length,
        noMatches: results.filter(r => r.matchType === 'NO_MATCH').length
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