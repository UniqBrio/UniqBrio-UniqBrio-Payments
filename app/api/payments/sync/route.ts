import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import Payment from "@/models/payment";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const connection = await connectDB();
    
    if (!connection) {
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable during build",
        data: []
      }, { status: 503 });
    }
    
    const url = new URL(request.url);
    const studentIdParam = url.searchParams.get('studentId');
    
    // Fetch students
    let students;
    if (studentIdParam) {
      students = await Student.find({ studentId: studentIdParam });
    } else {
      students = await Student.find({}).limit(50);
    }
    
    // Fetch ALL courses regardless of status (Active and non-Active)
    const courses = await Course.find({});    // Fetch all payments for these students to calculate accurate balances
    const studentIds = students.map(s => s.studentId);
    const allPayments = await Payment.find({ 
      studentId: { $in: studentIds } 
    }).lean();
    
    // Group payments by student ID for efficient lookup
    const paymentsByStudent = allPayments.reduce((acc, payment) => {
      if (!acc[payment.studentId]) {
        acc[payment.studentId] = [];
      }
      acc[payment.studentId].push(payment);
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log(`Found ${students.length} students, ${courses.length} courses (ALL statuses), and ${allPayments.length} payments`);
    
    // Debug: Log available courses for matching
    console.log('📚 Available courses for matching:');
    courses.forEach(course => {
      const courseData = course as any;
      console.log(`  Course ${courseData.courseId}: "${courseData.name}" (Level: ${courseData.level}, Status: ${courseData.status}, Price: ₹${courseData.priceINR})`);
    });
    
    // Debug: Log all students for matching analysis
    console.log('\n👥 Students to match:');
    students.forEach(student => {
      console.log(`  Student ${student.studentId} (${(student as any).name}): Activity="${(student as any).activity}", Program="${(student as any).program || (student as any).course}", Category="${(student as any).category || (student as any).level}"`);
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
      
      // Get exact category for display (no normalization)
      const studentCategory = (student as any).category || '-';
      
      // Get normalized category for matching logic only
      const normalizedCategory = normalize((student as any).category || (student as any).level);

      let matchedCoursePrice = 0;
      let matchedCourseId: string | null = null;
      let matchedCourseType = '-'; // Store course type from matched course
      let matchType = 'no-match';
      
      // Level 1: EXACT TRIPLE MATCH (all 3 rules match)
      if (studentActivity && studentProgram && normalizedCategory && normalizedCategory !== '-') {
        for (const course of courses) {
          const courseData = course as any;
          const courseCode = courseData.courseId;
          const courseName = courseData.name;
          const courseLevel = courseData.level;
          
          if (!courseCode || !courseName || !courseLevel) continue;
          
          const rule1Match = normLower(studentActivity) === normLower(courseCode);
          const rule2Match = normLower(studentProgram) === normLower(courseName);
          const rule3Match = normLower(normalizedCategory) === normLower(courseLevel);
          
          if (rule1Match && rule2Match && rule3Match) {
            matchedCoursePrice = Number(courseData.priceINR) || 0;
            matchedCourseId = courseCode;
            matchedCourseType = courseData.type || '-'; // Capture course type from matched course
            matchType = 'exact-triple-match';
            break;
          }
        }
      }

      // Level 2: PARTIAL MATCH (if no exact triple match found)
      if (!matchedCourseId && (studentActivity || studentProgram)) {
        for (const course of courses) {
          const courseData = course as any;
          const courseCode = courseData.courseId;
          const courseName = courseData.name;
          const courseLevel = courseData.level;
          
          if (!courseCode || !courseName) continue;
          
          const rule1Match = studentActivity && normLower(studentActivity) === normLower(courseCode);
          const rule2Match = studentProgram && normLower(studentProgram) === normLower(courseName);
          const rule3Match = normalizedCategory && normLower(normalizedCategory) === normLower(courseLevel);
          
          // Match if at least 2 rules match, or if activity+program match
          const matchCount = (rule1Match ? 1 : 0) + (rule2Match ? 1 : 0) + (rule3Match ? 1 : 0);
          
          if (matchCount >= 2 || (rule1Match && rule2Match)) {
            matchedCoursePrice = Number(courseData.priceINR) || 0;
            matchedCourseId = courseCode;
            matchedCourseType = courseData.type || '-';
            matchType = matchCount === 3 ? 'exact-triple-match' : 
                       (rule1Match && rule2Match) ? 'activity-program-match' : 'partial-match';
            break;
          }
        }
      }

      // Level 3: SINGLE RULE MATCH (if still no match and we want to show more students)
      if (!matchedCourseId && (studentActivity || studentProgram)) {
        for (const course of courses) {
          const courseData = course as any;
          const courseCode = courseData.courseId;
          const courseName = courseData.name;
          
          if (!courseCode || !courseName) continue;
          
          const rule1Match = studentActivity && normLower(studentActivity) === normLower(courseCode);
          const rule2Match = studentProgram && normLower(studentProgram) === normLower(courseName);
          
          if (rule1Match || rule2Match) {
            matchedCoursePrice = Number(courseData.priceINR) || 0;
            matchedCourseId = courseCode;
            matchedCourseType = courseData.type || '-';
            matchType = rule1Match ? 'activity-match' : 'program-match';
            break;
          }
        }
      }

      // Level 4: NO DB MODIFICATION - Just log unmatched students for manual review
      if (!matchedCourseId && studentActivity && studentProgram) {
        console.log(`⚠️ UNMATCHED STUDENT ${student.studentId}: Activity="${studentActivity}", Program="${studentProgram}", Category="${normalizedCategory || 'N/A'}" - Needs manual course setup`);
      }

      const finalPaymentAmount = matchedCourseId ? Number(matchedCoursePrice) || 0 : 0;
      
      // Calculate actual balance using payments from database
      const studentPayments = paymentsByStudent[student.studentId] || [];
      const coursePaidAmount = studentPayments
        .filter(p => ['Course Payment', 'Course Registration'].includes(p.paymentCategory))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      // Calculate current balance
      const calculatedBalance = Math.max(0, finalPaymentAmount - coursePaidAmount);
      
      // Use the most accurate balance: database-calculated vs student record
      const studentBalance = Number((student as any).balancePayment);
      const balanceAmount = !isNaN(studentBalance) && studentBalance >= 0 
        ? studentBalance 
        : calculatedBalance;
        
      const hasBalance = balanceAmount > 0;
      
      // Debug log for matching and balance calculation
      if (matchedCourseId) {
        const matchTypeIcon = matchType === 'exact-triple-match' ? '✅' : 
                             matchType.includes('partial') ? '🔗' : 
                             matchType.includes('activity') || matchType.includes('program') ? '�' : '�';
        console.log(`${matchTypeIcon} Student ${student.studentId}: MATCHED with course ${matchedCourseId} (${matchType}) - Fee: ₹${finalPaymentAmount}, Paid: ₹${coursePaidAmount}, Balance: ₹${balanceAmount}`);
      } else {
        console.log(`❌ Student ${student.studentId}: NO MATCH - Activity="${studentActivity}", Program="${studentProgram}", Category="${normalizedCategory}"`);
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
        courseType: matchedCourseType, // Course type from matched course collection
        finalPayment: finalPaymentAmount,
        balancePayment: balanceAmount,
        totalPaidAmount: coursePaidAmount,
        paymentStatus: balanceAmount > 0 ? 'Pending' : 'Paid',
        paymentReminder: hasBalance, // Reminder on if balance > 0
        communicationPreferences: commPreferences, // Student's preferred communication channels
        communicationText: (student as any).communicationText || `Make a payment quickly - Balance: ₹${balanceAmount.toLocaleString()}${paymentOptionsText}`, // Default message with balance and payment options
        paymentDetails: {
          qrCode: (student as any).paymentDetails?.qrCode || (student as any).qrCode || 'QR_CODE_AVAILABLE',
          upiId: (student as any).paymentDetails?.upiId || (student as any).upiId || 'uniqbrio@upi',
          paymentLink: (student as any).paymentDetails?.paymentLink || (student as any).paymentLink || 'https://pay.uniqbrio.com'
        },
        matchedCourseId: matchedCourseId,
        tripleRuleMatched: matchType === 'exact-triple-match',
        matchType: matchType,
        // Manual payment fields
        manualPayment: {
          enabled: hasBalance, // Enable manual payment if there's a balance
          showDialog: false, // Controls dialog visibility
          receivedByName: '', // Input field for who received the payment
          receivedByRole: '', // Dropdown: instructor, non-instructor, admin, superadmin
          paymentAmount: balanceAmount, // Default to full balance amount
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
        }
      };
      
      processedStudents.push(studentResult);
    }
    
    // Count matches and unmatched students
    const totalMatches = processedStudents.filter(s => s.matchedCourseId).length;
    const unmatchedStudents = processedStudents.filter(s => !s.matchedCourseId).length;
    
    console.log(`📊 SUMMARY: ${totalMatches}/${processedStudents.length} students matched, ${unmatchedStudents} unmatched (need manual course setup)`);
    
    return NextResponse.json({
      success: true,
      data: processedStudents,
      message: `Processed ${processedStudents.length} students with ${courses.length} courses`,
      totalMatches: totalMatches,
      unmatchedStudents: unmatchedStudents
    });
    
  } catch (error: any) {
    console.error('SYNC_ROUTE_ERROR', error);
    return NextResponse.json(
      { success: false, error: "Failed to sync payment data", details: error.message },
      { status: 500 }
    );
  }
}
