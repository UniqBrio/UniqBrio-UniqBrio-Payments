import { NextRequest, NextResponse } from "next/server";
import { mockStudentsData, mockCoursesData } from "@/lib/test-data";

// Test endpoint to verify Final Payment matching logic without database issues
export async function GET(request: NextRequest) {
  try {
    console.log("=== FINAL PAYMENT MATCHING TEST ===");
    console.log("Students:", mockStudentsData.length);
    console.log("Courses:", mockCoursesData.length);
    
    const processedStudents = mockStudentsData.map((student) => {
      console.log(`\nProcessing student: ${student.name}`);
      console.log(`  Activity: ${student.activity}`);
      console.log(`  Course: ${student.course}`); 
      console.log(`  Category: ${student.category}`);
      
      // Apply the three matching rules
      let finalPayment = 0;
      let matchingCourse = null;
      
      // Get student matching fields
      const studentActivity = student.activity; // Rule 1: Must match courses.id
      const studentProgram = student.course;    // Rule 2: Must match courses.name  
      const studentCategory = student.category; // Rule 3: Must match courses.level
      
      // Search for exact triple match
      for (const course of mockCoursesData) {
        const rule1Match = studentActivity === course.id;     // students.activity === courses.id
        const rule2Match = studentProgram === course.name;    // students.course === courses.name
        const rule3Match = studentCategory === course.level;  // students.category === courses.level
        
        console.log(`  Checking course ${course.name}:`);
        console.log(`    Rule 1 (activity=${studentActivity} === id=${course.id}): ${rule1Match}`);
        console.log(`    Rule 2 (course=${studentProgram} === name=${course.name}): ${rule2Match}`);
        console.log(`    Rule 3 (category=${studentCategory} === level=${course.level}): ${rule3Match}`);
        
        // ALL THREE rules must match exactly
        if (rule1Match && rule2Match && rule3Match) {
          matchingCourse = course;
          finalPayment = course.priceINR;
          console.log(`  ✅ EXACT MATCH FOUND! Final Payment: ₹${finalPayment}`);
          break;
        }
      }
      
      if (!matchingCourse) {
        console.log(`  ❌ No exact match found. Final Payment: ₹0`);
      }
      
      // Calculate balance
      const balancePayment = Math.max(0, finalPayment - student.totalPaidAmount);
      let paymentStatus = 'Paid';
      if (balancePayment > 0) {
        paymentStatus = 'Pending';
      }
      
      return {
        id: student.studentId,
        name: student.name,
        activity: student.activity,
        category: student.category,
        finalPayment: finalPayment,
        totalPaidAmount: student.totalPaidAmount,
        balancePayment: balancePayment,
        paymentStatus: paymentStatus,
        matchingCourse: matchingCourse?.name || 'No Match',
        // Additional fields for completeness
        courseType: 'Regular',
        cohort: 'Batch 2024',
        batch: 'Morning',
        instructor: matchingCourse?.instructor || 'TBD',
        currency: 'INR',
        paymentFrequency: 'Monthly',
        paidDate: new Date().toISOString(),
        nextPaymentDate: null,
        courseStartDate: new Date().toISOString(),
        paymentReminder: true,
        reminderMode: 'Email',
        communicationText: '',
        reminderDays: [7, 3, 1],
        registrationFees: null,
        paymentDetails: {
          upiId: 'test@upi',
          qrCode: 'test-qr-code',
          paymentLink: 'test-payment-link'
        },
        paymentModes: ['UPI', 'Bank Transfer'],
        studentType: 'New',
        emiSplit: 1,
        totalTransactions: 1,
        lastPaymentDate: new Date(),
        lastPaymentAmount: student.totalPaidAmount,
        paymentHistory: [{
          id: 'TXN001',
          amount: student.totalPaidAmount,
          date: new Date(),
          method: 'UPI',
          notes: 'Test payment'
        }]
      };
    });
    
    console.log("\n=== FINAL RESULTS ===");
    processedStudents.forEach(student => {
      console.log(`${student.name}: Final Payment ₹${student.finalPayment} (${student.matchingCourse})`);
    });
    
    return NextResponse.json({
      success: true,
      data: processedStudents,
      message: `Final Payment matching test completed for ${processedStudents.length} students`,
      testMode: true,
      matchingRules: {
        rule1: "students.activity must match courses.id",
        rule2: "students.course must match courses.name", 
        rule3: "students.category must match courses.level",
        note: "ALL THREE rules must match exactly for final payment assignment"
      }
    });
    
  } catch (error) {
    console.error("Test API Error:", error);
    return NextResponse.json(
      { success: false, error: "Test API failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return await GET(request);
}