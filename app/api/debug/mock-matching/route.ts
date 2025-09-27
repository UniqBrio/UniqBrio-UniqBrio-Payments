import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration without database connection
const mockStudents = [
  {
    id: "STU00015",
    activity: "MOBILE_APP_DEVELOPMENT",  // Should match exactly
    program: "React Native Course",      // Should match exactly
    category: "Intermediate"             // Should match exactly
  },
  {
    id: "STU00016", 
    activity: "MOBILE_APP_DEVELOPMENT",  // Matches activity
    program: "Different Program",        // Doesn't match program
    category: "Intermediate"             // Matches category
  },
  {
    id: "STU00017",
    activity: "WEB_DEVELOPMENT",         // Matches activity  
    program: "React Native Course",      // Matches program
    category: "Advanced"                 // Doesn't match category
  },
  {
    id: "STU00018",
    activity: "BLOCKCHAIN_DEVELOPMENT",  // No matches at all
    program: "Cryptocurrency Course",    // No matches at all
    category: "Expert"                   // No matches at all
  }
];

const mockCourses = [
  {
    courseId: "MOBILE_APP_DEVELOPMENT",  // For exact triple match
    name: "React Native Course",         // For exact triple match
    level: "Intermediate",               // For exact triple match
    fee: 15000,
    title: "Complete React Native Development"
  },
  {
    courseId: "WEB_DEVELOPMENT", 
    name: "React Native Course",         // For program matches
    level: "Beginner",                   
    fee: 12000,
    title: "Basic Web Development"
  },
  {
    courseId: "MOBILE_APP_DEVELOPMENT",  // For activity matches
    name: "Flutter Course",              
    level: "Advanced",                   
    fee: 18000,
    title: "Advanced Mobile Development"
  },
  {
    courseId: "DATA_SCIENCE",
    name: "Python for Data Science",
    level: "Intermediate",               // For level-only matches
    fee: 8000,
    title: "Data Science Fundamentals"
  },
  {
    courseId: "WEB_DEVELOPMENT",
    name: "HTML CSS Course",
    level: "Beginner",
    fee: 5000,
    title: "Basic Web Development"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    // If specific studentId requested, find that one, otherwise test all
    let studentsToTest = mockStudents;
    if (studentId) {
      const student = mockStudents.find(s => s.id === studentId);
      if (!student) {
        return NextResponse.json({ 
          error: `Student ${studentId} not found`,
          availableStudents: mockStudents.map(s => s.id) 
        });
      }
      studentsToTest = [student];
    }

    const allResults: any[] = [];

    for (const student of studentsToTest) {
      console.log(`\n=== ${student.id} DEBUGGING WITH MOCK DATA ===`);
      console.log('Student Details:', {
        id: student.id,
        activity: student.activity,
        program: student.program,
        category: student.category
      });

      // Test all matching levels
      const matchingResults = {
        exactTripleMatch: null as any,
        activityLevelMatch: null as any,
        programLevelMatch: null as any,
        activityOnlyMatch: null as any,
        programOnlyMatch: null as any,
        levelCheapestMatch: null as any,
        finalResult: null as any,
        matchType: ''
      };

    // Level 1: Exact Triple Match (activity + program + category)
    const exactMatch = mockCourses.find(course => 
      course.courseId === student.activity &&
      course.name === student.program &&
      course.level === student.category
    );
    
    if (exactMatch) {
      matchingResults.exactTripleMatch = exactMatch;
      matchingResults.finalResult = exactMatch;
      matchingResults.matchType = 'EXACT_TRIPLE_MATCH';
      console.log('✅ EXACT TRIPLE MATCH FOUND:', exactMatch);
    } else {
      console.log('❌ No exact triple match found');
      
      // Level 2: Activity + Level Match
      const activityLevelMatch = mockCourses.find(course => 
        course.courseId === student.activity && 
        course.level === student.category
      );
      
      if (activityLevelMatch) {
        matchingResults.activityLevelMatch = activityLevelMatch;
        matchingResults.finalResult = activityLevelMatch;
        matchingResults.matchType = 'ACTIVITY_LEVEL_MATCH';
        console.log('✅ Activity + Level match found:', activityLevelMatch);
      } else {
        console.log('❌ No activity + level match found');
        
        // Level 3: Program + Level Match
        const programLevelMatch = mockCourses.find(course => 
          course.name === student.program && 
          course.level === student.category
        );
        
        if (programLevelMatch) {
          matchingResults.programLevelMatch = programLevelMatch;
          matchingResults.finalResult = programLevelMatch;
          matchingResults.matchType = 'PROGRAM_LEVEL_MATCH';
          console.log('✅ Program + Level match found:', programLevelMatch);
        } else {
          console.log('❌ No program + level match found');
          
          // Level 4: Activity Only Match
          const activityMatch = mockCourses.find(course => 
            course.courseId === student.activity
          );
          
          if (activityMatch) {
            matchingResults.activityOnlyMatch = activityMatch;
            matchingResults.finalResult = activityMatch;
            matchingResults.matchType = 'ACTIVITY_ONLY_MATCH';
            console.log('✅ Activity only match found:', activityMatch);
          } else {
            console.log('❌ No activity only match found');
            
            // Level 5: Program Only Match
            const programMatch = mockCourses.find(course => 
              course.name === student.program
            );
            
            if (programMatch) {
              matchingResults.programOnlyMatch = programMatch;
              matchingResults.finalResult = programMatch;
              matchingResults.matchType = 'PROGRAM_ONLY_MATCH';
              console.log('✅ Program only match found:', programMatch);
            } else {
              console.log('❌ No program only match found');
              
              // Level 6: NO FALLBACK - Return null instead of dummy data
              console.log('❌ No matches found - NO COURSE ASSIGNED (NO FALLBACK DUMMY DATA)');
              matchingResults.finalResult = null;
              matchingResults.matchType = 'NO_MATCH_FOUND';
            }
          }
        }
      }
    }

    console.log('\n=== FINAL RESULT ===');
    console.log('Match Type:', matchingResults.matchType);
    console.log('Selected Course:', matchingResults.finalResult);
    console.log('Final Payment (No Dummy Fallback):', matchingResults.finalResult?.fee || 0);
    
    if (matchingResults.matchType !== 'EXACT_TRIPLE_MATCH') {
      console.log('\n🔍 WHY NO EXACT MATCH:');
      console.log('Student needs:', {
        activity: student.activity,
        program: student.program, 
        category: student.category
      });
      
      console.log('\nAvailable courses analysis:');
      mockCourses.forEach((course, index) => {
        const activityMatch = course.courseId === student.activity ? '✅' : '❌';
        const programMatch = course.name === student.program ? '✅' : '❌';
        const categoryMatch = course.level === student.category ? '✅' : '❌';
        
        console.log(`Course ${index + 1}: ${activityMatch} Activity | ${programMatch} Program | ${categoryMatch} Category`);
        console.log(`  courseId: "${course.courseId}" vs "${student.activity}"`);
        console.log(`  name: "${course.name}" vs "${student.program}"`);
        console.log(`  level: "${course.level}" vs "${student.category}"`);
      });
    }

    // Store result for this student
      const studentResult = {
        studentId: student.id,
        studentData: student,
        matchingResults,
        finalPayment: matchingResults.finalResult?.fee || 0,
        recommendation: matchingResults.matchType === 'EXACT_TRIPLE_MATCH' ? 
          'Perfect match found!' : 
          matchingResults.matchType === 'NO_MATCH_FOUND' ?
          'NO MATCH FOUND - No dummy fallback data stored (finalPayment = 0)' :
          'Check console for detailed analysis of why exact match failed'
      };
      allResults.push(studentResult);
    } // End of for loop

    return NextResponse.json({
      success: true,
      analysisType: 'MOCK_DATA_ANALYSIS',
      totalStudentsTested: studentsToTest.length,
      results: allResults,
      summary: {
        exactMatches: allResults.filter(r => r.matchingResults.matchType === 'EXACT_TRIPLE_MATCH').length,
        partialMatches: allResults.filter(r => r.matchingResults.matchType.includes('MATCH') && r.matchingResults.matchType !== 'EXACT_TRIPLE_MATCH' && r.matchingResults.matchType !== 'NO_MATCH_FOUND').length,
        noMatches: allResults.filter(r => r.matchingResults.matchType === 'NO_MATCH_FOUND').length
      }
    });

  } catch (error) {
    console.error('Mock matching error:', error);
    return NextResponse.json(
      { error: 'Mock matching analysis failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}