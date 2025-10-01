import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import Payment from "@/models/payment";
import { NextRequest, NextResponse } from "next/server";

// Minimal shape for payment records used in aggregation below
interface PaymentRecordLite {
  paymentCategory?: string;
  amount?: number | string;
}

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/payments/sync - Fetching updated payment data...');
    
    const connection = await connectDB();
    
    if (!connection) {
      console.log('❌ Database connection unavailable during sync');
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable during build",
        data: []
      }, { status: 503 });
    }
    
    const url = new URL(request.url);
    const studentIdParam = url.searchParams.get('studentId');
    console.log('📋 Sync request for studentId:', studentIdParam || 'ALL STUDENTS');
    
    // READ-ONLY COLLECTIONS: Only fetch data, never update
    // Fetch students (READ ONLY)
    let students;
    if (studentIdParam) {
      students = await Student.find({ studentId: studentIdParam });
    } else {
      students = await Student.find({}).limit(50);
    }
    
    // Fetch courses (READ ONLY) 
    const courses = await Course.find({});
    
    // Fetch all payment documents (one per student) - Source of truth for all calculations
    const studentIds = students.map(s => s.studentId);
    console.log(`🔍 Fetching payment documents for ${studentIds.length} students`);
    
    const allPaymentDocs = await Payment.find({ 
      studentId: { $in: studentIds } 
    }).lean();
    
    console.log(`📊 Found ${allPaymentDocs.length} payment documents in database`);
    
    // Create lookup map for payment documents by studentId
    const paymentsByStudent = allPaymentDocs.reduce((acc, paymentDoc) => {
      acc[paymentDoc.studentId] = paymentDoc;
      return acc;
    }, {} as Record<string, any>);
    
    // Count total payment records across all students
    const totalPaymentRecords = allPaymentDocs.reduce((sum, doc) => sum + (doc.paymentRecords?.length || 0), 0);
    
    console.log(`📋 Found ${students.length} students, ${courses.length} courses (ALL statuses), and ${totalPaymentRecords} payment records across ${allPaymentDocs.length} payment documents`);
    
    // Log a sample of payment documents for debugging
    if (allPaymentDocs.length > 0) {
      const sampleDoc = allPaymentDocs[0];
      console.log(`📝 Sample payment doc for ${sampleDoc.studentId}: ${sampleDoc.paymentRecords?.length || 0} records, balance: ${sampleDoc.currentBalance}`);
    }
    
    // Debug: Log available courses for matching
    console.log('📚 Available courses for matching:');
    courses.forEach(course => {
      const courseData = course as any;
      const courseCode = courseData.courseId || courseData.id; // ensure compatibility
      console.log(`  Course ${courseCode}: "${courseData.name}" (Level: ${courseData.level}, Status: ${courseData.status}, Price: ₹${courseData.priceINR})`);
    });
    
    // Debug: Log all students for matching analysis
    console.log('\n👥 Students to match:');
    students.forEach(student => {
      console.log(`  Student ${student.studentId} (${(student as any).name}): Activity="${(student as any).activity}", Program="${(student as any).program || (student as any).course}", Category="${(student as any).category}", Level="${(student as any).level}"`);
    });
    
    // Process students with enhanced matching (triple-rule + partial matches)
    const processedStudents = [];
    
    for (const student of students) {
      const normalize = (v: any) => {
        if (!v) return '';
        return typeof v === 'string' ? v.trim() : String(v).trim();
      };
      const normLower = (v: any) => normalize(v).toLowerCase();

      const studentActivity = normalize((student as any).activity);
      const studentProgram = normalize((student as any).program || (student as any).course);
      
      // DEBUG: Check what category/level data exists
      const rawCategory = (student as any).category;
      const rawLevel = (student as any).level;
      console.log(`🔍 Student ${student.studentId} fields: category="${rawCategory}" (for matching), level="${rawLevel}" (for display only)`);
      
      // Get exact CATEGORY field from students collection for display
      const studentCategory = (student as any).category || '-';
      
      // Get normalized CATEGORY for matching logic with courses (Rule 3: student.category === course.level)
      const normalizedCategory = normalize((student as any).category);

      let matchedCoursePrice = 0;
      let matchedCourseId: string | null = null;
      let matchedCourseType = '-'; // Store course type from matched course
      let matchType = 'no-match';
      
      // STRICT 3-RULE MATCHING ONLY - NO FALLBACK OR PARTIAL MATCHES
      // Rule 1: student.activity === course.courseId
      // Rule 2: student.program === course.name  
      // Rule 3: student.category === course.level (FIXED: Now using category field for matching)
      // ALL 3 RULES MUST MATCH EXACTLY - NO EXCEPTIONS
      // ADDITIONALLY: Students MUST have category field populated (not empty)
      const hasValidCategory = rawCategory && typeof rawCategory === 'string' && rawCategory.trim() !== '';
      console.log(`🔍 Category validation for ${student.studentId}: rawCategory="${rawCategory}", hasValidCategory=${hasValidCategory}`);
      if (studentActivity && studentProgram && normalizedCategory && normalizedCategory !== '-' && hasValidCategory) {
        for (const course of courses) {
          const courseData = course as any;
          const courseCode = courseData.courseId || courseData.id; // FIX: use existing id field
          const courseName = courseData.name;
          const courseLevel = courseData.level;
          
          // Skip courses with missing required fields
          if (!courseCode || !courseName || !courseLevel) continue;
          
          // Check all 3 rules strictly
          const rule1Match = normLower(studentActivity) === normLower(courseCode);
          const rule2Match = normLower(studentProgram) === normLower(courseName);
          const rule3Match = normLower(normalizedCategory) === normLower(courseLevel);
          
          // ONLY match if ALL 3 rules are satisfied
          if (rule1Match && rule2Match && rule3Match) {
            matchedCoursePrice = Number(courseData.priceINR) || 0;
            matchedCourseId = courseCode;
            matchedCourseType = courseData.type || '-';
            matchType = 'exact-triple-match';
            break; // Stop at first exact match
          }
        }
      }

      // Log unmatched students - STRICT 3-RULE MATCHING ONLY
      if (!matchedCourseId) {
        if (studentActivity && studentProgram && normalizedCategory && normalizedCategory !== '-') {
          console.log(`❌ UNMATCHED STUDENT ${student.studentId}: STRICT 3-RULE FAILED - Activity="${studentActivity}", Program="${studentProgram}", Category="${normalizedCategory}" - Needs exact course match`);
        } else {
          console.log(`⚠️ INCOMPLETE DATA ${student.studentId}: Missing required fields - Activity="${studentActivity || 'MISSING'}", Program="${studentProgram || 'MISSING'}", Category="${normalizedCategory || 'MISSING'}" - Cannot perform 3-rule matching`);
        }
      }

      // Fallback: if no matched course, use payment document's stored totals so manual payments still appear
      const paymentDocFallback = paymentsByStudent[student.studentId];
      let finalPaymentAmount = matchedCourseId ? Number(matchedCoursePrice) || 0 : 0;
      if (!matchedCourseId && paymentDocFallback) {
        finalPaymentAmount = Number(paymentDocFallback.totalCourseFee) || 0;
      }
      
      // DYNAMIC CALCULATION FROM PAYMENTS COLLECTION ONLY
      // Students collection: READ ONLY (never updated)
      // Courses collection: READ ONLY (never updated)
      // Payments collection: Source of truth for all payment data
      
      const studentPaymentDoc = paymentsByStudent[student.studentId];
      let coursePaidAmount = 0;
      let totalPaymentRecords = 0;
      
      if (studentPaymentDoc && Array.isArray(studentPaymentDoc.paymentRecords)) {
        const records = studentPaymentDoc.paymentRecords as PaymentRecordLite[];
        // Calculate from payment records within the student's payment document
        const courseRecords = records.filter((record: PaymentRecordLite) =>
          ['Course Payment', 'Course Registration'].includes(record.paymentCategory || '')
        );
        coursePaidAmount = courseRecords.reduce((sum: number, record: PaymentRecordLite) => {
          const amt = Number(record.amount) || 0;
            return sum + amt;
        }, 0);
        totalPaymentRecords = records.length;
      }
      
      // BALANCE CALCULATION (100% from payments collection):
      // Final Payment = Course fee (from matched course)
      // Total Paid = Sum from payment records in student's payment document
      // Balance = Final Payment - Total Paid (real-time calculation)
      let balanceAmount = Math.max(0, finalPaymentAmount - coursePaidAmount);
      // If we have a fallback doc and its currentBalance differs (because of registration fees etc.), trust backend doc
      if (paymentDocFallback && typeof paymentDocFallback.currentBalance === 'number' && !matchedCourseId) {
        balanceAmount = paymentDocFallback.currentBalance;
      }
        
      const hasBalance = balanceAmount > 0;
      
      // Debug log for strict 3-rule matching and payment calculations
      if (matchedCourseId) {
        console.log(`✅ Student ${student.studentId}: STRICT 3-RULE MATCH with course ${matchedCourseId}`);
        console.log(`   ✓ Rule 1: Activity "${studentActivity}" === CourseId "${matchedCourseId}"`);
        console.log(`   ✓ Rule 2: Program "${studentProgram}" === CourseName`);  
        console.log(`   ✓ Rule 3: Category "${normalizedCategory}" === CourseLevel`);
        console.log(`   💰 PAYMENT CALCULATION:`);
        console.log(`      Final Payment (Course Fee): ₹${finalPaymentAmount}`);
        console.log(`      Total Paid Amount: ₹${coursePaidAmount} (from ${totalPaymentRecords} payment records)`);
        console.log(`      Balance Remaining: ₹${balanceAmount} = ₹${finalPaymentAmount} - ₹${coursePaidAmount}`);
        console.log(`      Payment Status: ${balanceAmount > 0 ? 'PENDING' : 'PAID'}`);
      }
      
      // Extract communication preferences from student data
      const studentCommPrefs = (student as any).communicationPreferences;
      const commPreferences = studentCommPrefs ? {
        enabled: studentCommPrefs.enabled || true,
        channels: studentCommPrefs.channels || ["Email", "WhatsApp", "In App"]
      } : {
        enabled: true,
        channels: [(student as any).reminderMode || (student as any).modeOfCommunication || "Email"]
      };

      // Generate payment options text based on communication preferences
      const channels = commPreferences.channels;
      const isSMSOrWhatsApp = channels.includes('SMS') || channels.includes('WhatsApp');
      const isEmailOrInApp = channels.includes('Email') || channels.includes('In App');
      
      let paymentOptionsText = '';
      if (isSMSOrWhatsApp && !isEmailOrInApp) {
        paymentOptionsText = '\n💳 UPI: uniqbrio@upi\n🔗 Link: https://pay.uniqbrio.com';
      } else {
        paymentOptionsText = '\n📱 QR Code available\n💳 UPI: uniqbrio@upi\n🔗 Link: https://pay.uniqbrio.com';
      }

      const studentResult = {
        id: student.studentId,
        name: (student as any).name || 'Unknown',
        activity: studentActivity || 'N/A',
        program: studentProgram || 'N/A', 
        category: studentCategory, // Direct category from student collection
        courseType: matchType === 'exact-triple-match' ? matchedCourseType : '-', // Show type only if all 3 fields match
  finalPayment: matchType === 'exact-triple-match' ? finalPaymentAmount : (paymentDocFallback ? finalPaymentAmount : 0),
  balancePayment: matchType === 'exact-triple-match' ? balanceAmount : (paymentDocFallback ? balanceAmount : 0),
  totalPaidAmount: paymentDocFallback ? paymentDocFallback.totalPaidAmount : coursePaidAmount,
        // Paid Date: Show last payment date or "-" if no payments
        paidDate: studentPaymentDoc && studentPaymentDoc.lastPaymentDate ? 
          studentPaymentDoc.lastPaymentDate.toISOString() : null,
        // Next Due Date: Always show for matched students (even if fully paid) - monthly cadence from courseStartDate
        nextPaymentDate: (() => {
          if (matchType !== 'exact-triple-match') return null;
          // Prefer explicit courseStartDate, else createdAt, else today
          const rawStart = (student as any).courseStartDate || (student as any).createdAt || new Date();
          const baseDate = new Date(rawStart);
          if (isNaN(baseDate.getTime())) return null;
          const nextDue = new Date(baseDate);
          nextDue.setDate(nextDue.getDate() + 30); // 30 days after course start
          return nextDue.toISOString();
        })(),
  paymentStatus: matchType === 'exact-triple-match' ? (balanceAmount > 0 ? 'Pending' : 'Paid') : (paymentDocFallback ? paymentDocFallback.paymentStatus || (balanceAmount > 0 ? 'Pending' : 'Paid') : '-'),
        paymentReminder: matchType === 'exact-triple-match' && hasBalance, // Reminder on if matched and balance > 0
        communicationPreferences: commPreferences, // Student's preferred communication channels
        communicationText: matchType === 'exact-triple-match' ? 
          ((student as any).communicationText || `Make a payment quickly - Balance: ₹${balanceAmount.toLocaleString()}${paymentOptionsText}`) : 
          '-', // Default message with balance and payment options only if matched
        paymentDetails: matchType === 'exact-triple-match' ? {
          qrCode: (student as any).paymentDetails?.qrCode || (student as any).qrCode || 'QR_CODE_AVAILABLE',
          upiId: (student as any).paymentDetails?.upiId || (student as any).upiId || 'uniqbrio@upi',
          paymentLink: (student as any).paymentDetails?.paymentLink || (student as any).paymentLink || 'https://pay.uniqbrio.com'
        } : {
          qrCode: '-',
          upiId: '-', 
          paymentLink: '-'
        },
        matchedCourseId: matchedCourseId,
        tripleRuleMatched: matchType === 'exact-triple-match',
        matchType: matchType,
        // Manual payment fields - only enabled for matched students
        manualPayment: {
          enabled: matchType === 'exact-triple-match' && hasBalance, // Enable manual payment only if matched and has balance
          showDialog: false, // Controls dialog visibility
          receivedByName: '', // Input field for who received the payment
          receivedByRole: '', // Dropdown: instructor, non-instructor, admin, superadmin
          paymentAmount: matchType === 'exact-triple-match' ? balanceAmount : 0, // Default to full balance amount only if matched
          paymentDate: new Date().toISOString().split('T')[0], // Today's date
          paymentMethod: 'Cash', // Default payment method
          notes: '',
          // Dialog form structure
          dialogFields: {
            receivedByName: {
              type: 'text',
              label: 'Payment Received By (Name)',
              placeholder: 'Enter name of person who received payment',
              required: true
            },
            receivedByRole: {
              type: 'dropdown',
              label: 'Role',
              options: [
                { value: 'instructor', label: 'Instructor' },
                { value: 'non-instructor', label: 'Non-Instructor' },
                { value: 'admin', label: 'Admin' },
                { value: 'superadmin', label: 'Super Admin' }
              ],
              required: true
            },
            paymentAmount: {
              type: 'number',
              label: 'Payment Amount (₹)',
              min: 0,
              max: balanceAmount,
              required: true
            },
            paymentDate: {
              type: 'date',
              label: 'Payment Date',
              required: true
            },
            paymentMethod: {
              type: 'dropdown',
              label: 'Payment Method',
              options: [
                { value: 'Cash', label: 'Cash' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Card', label: 'Credit/Debit Card' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Online', label: 'Online Payment' }
              ],
              required: true
            },
            notes: {
              type: 'textarea',
              label: 'Notes (Optional)',
              placeholder: 'Additional notes about the payment...',
              required: false
            }
          }
        },
        courseStartDate: (() => {
          const startDate = (student as any).courseStartDate;
          if (startDate) {
            return new Date(startDate).toISOString();
          }
          // Fallback: use createdAt if available, otherwise current date
          const createdAt = (student as any).createdAt;
          if (createdAt) {
            return new Date(createdAt).toISOString();
          }
          return new Date().toISOString();
        })()
      };
      
      processedStudents.push(studentResult);
    }
    
    // Count matches and unmatched students
    const totalMatches = processedStudents.filter(s => s.matchedCourseId).length;
    const unmatchedStudents = processedStudents.filter(s => !s.matchedCourseId).length;
    
    console.log(`📊 STRICT 3-RULE SUMMARY: ${totalMatches}/${processedStudents.length} students matched with EXACT triple-rule matching, ${unmatchedStudents} unmatched (need exact course data)`);
    
    return NextResponse.json({
      success: true,
      data: processedStudents,
      message: `READ-ONLY: Processed ${processedStudents.length} students with ${courses.length} courses. All calculations from payments collection.`,
      totalMatches: totalMatches,
      unmatchedStudents: unmatchedStudents
    });
    
  } catch (error: any) {
    console.error('SYNC_ROUTE_ERROR', error);
    
    // If it's a MongoDB connection error, return empty data gracefully
    if (error.message?.includes('MongoDB Atlas cluster') || error.message?.includes('IP') || error.message?.includes('whitelist')) {
      console.log('❌ Database connection unavailable - IP whitelist issue');
      return NextResponse.json({
        success: true,
        data: [],
        fallback: true,
        message: "Database temporarily unavailable - check IP whitelist",
        error: "IP_WHITELIST_ISSUE"
      });
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to sync payment data", details: error.message },
      { status: 500 }
    );
  }
}
