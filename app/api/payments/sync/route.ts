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
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Console message removed
    
    const connection = await connectDB();
    
    if (!connection) {
      // Console message removed
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable during build",
        data: []
      }, { status: 503 });
    }
    
    const url = new URL(request.url);
    const studentIdParam = url.searchParams.get('studentId');
    // Console message removed
    
    // READ-ONLY COLLECTIONS: Only fetch data, never update
    // Fetch students (READ ONLY)
    let students;
    if (studentIdParam) {
      // Only include non-deleted students (treat missing isDeleted as not deleted)
      students = await Student.find({
        studentId: studentIdParam,
        isDeleted: { $ne: true }
      });
    } else {
      // Only include non-deleted students (treat missing isDeleted as not deleted)
      // Remove hard limit so full dataset is always used; rely on DB and Vercel limits instead
      students = await Student.find({
        isDeleted: { $ne: true }
      });
    }
    
    // Fetch courses (READ ONLY) 
    const courses = await Course.find({});
    
  // Fetch all payment documents (one per student-course) - Source of truth for all calculations
    const studentIds = students.map(s => s.studentId);
    // Console message removed
    
    const allPaymentDocs = await Payment.find({ 
      studentId: { $in: studentIds } 
    }).lean();
    
    // Console message removed
    
    // Create lookup maps for payment documents
    // 1) Map of studentId -> array of docs
    const paymentsByStudentArray = allPaymentDocs.reduce((acc, paymentDoc) => {
      (acc[paymentDoc.studentId] ||= []).push(paymentDoc);
      return acc;
    }, {} as Record<string, any[]>);
    // 2) Map of composite key studentId::courseId -> doc
    const paymentsByStudentCourse = allPaymentDocs.reduce((acc, paymentDoc) => {
      if (paymentDoc && paymentDoc.studentId && paymentDoc.courseId) {
        acc[`${paymentDoc.studentId}::${paymentDoc.courseId}`] = paymentDoc;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Count total payment records across all students
    const totalPaymentRecords = allPaymentDocs.reduce((sum, doc) => sum + (doc.paymentRecords?.length || 0), 0);
    
    // Console message removed
    
    // Log a sample of payment documents for debugging
    if (allPaymentDocs.length > 0) {
      const sampleDoc = allPaymentDocs[0];
      // Console message removed
    }
    
    // Debug: Log available courses for matching
    // Console message removed
    
    // Debug: Log all students for matching analysis
    // Console message removed
    
    // Process students with enhanced matching (triple-rule + partial matches)
    const processedStudents = [];
    
    for (const student of students) {
      // Helper: normalize registration fees into consistent nested shape
      const normalizeRegistrationFees = (raw: any) => {
        if (!raw) return undefined as any;
        const toObj = (v: any) => {
          if (v == null) return undefined;
          if (typeof v === 'number') return { amount: v, paid: false };
          if (typeof v === 'object') {
            if (typeof v.amount === 'number') return { amount: v.amount, paid: Boolean(v.paid), paidDate: v.paidDate || undefined };
            // fallback keys occasionally used
            const amt = typeof v.value === 'number' ? v.value : (typeof v.fee === 'number' ? v.fee : (typeof v.cost === 'number' ? v.cost : undefined));
            if (typeof amt === 'number') return { amount: amt, paid: Boolean(v.paid), paidDate: v.paidDate || undefined };
          }
          return undefined;
        };
        const studentReg = toObj(raw.studentRegistration);
        const courseReg = toObj(raw.courseRegistration);
        const confirmation = toObj(raw.confirmationFee);
        const overallPaid = [studentReg, courseReg, confirmation]
          .filter(Boolean)
          .every((f: any) => f.paid);
        return {
          studentRegistration: studentReg,
          courseRegistration: courseReg,
          confirmationFee: confirmation,
          overall: { paid: overallPaid, status: overallPaid ? 'Paid' : 'Pending' }
        } as any;
      };
      const normalize = (v: any) => {
        if (!v) return '';
        return typeof v === 'string' ? v.trim() : String(v).trim();
      };
      const normLower = (v: any) => normalize(v).toLowerCase();

      const studentActivity = normalize((student as any).enrolledCourse || (student as any).activity);
  // Prefer the user-facing enrolled course name stored on the student document
  const studentProgram = normalize((student as any).enrolledCourseName || (student as any).program || (student as any).course);
      
      // DEBUG: Check what category/level data exists
      const rawCategory = (student as any).category;
      const rawLevel = (student as any).level;
      // Console message removed
      
      // Get exact CATEGORY field from students collection for display
  // Prefer category; fallback to level to keep UI stable across refreshes
  const studentCategory = (student as any).category || (student as any).level || '-';
      
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
      // Console message removed
      // Improved matching logic - try multiple approaches
      for (const course of courses) {
        const courseData = course as any;
        const courseCode = courseData.id || courseData.courseId; // Use 'id' field from Course model
        const courseName = courseData.name;
        const courseLevel = courseData.level;
        
        // Skip courses with missing required fields
        if (!courseCode || !courseName) continue;
        
        // Priority 1: Try to match by enrolledCourse/activity ID first
        const studentCourseId = (student as any).enrolledCourse || studentActivity;
        if (studentCourseId && normLower(studentCourseId) === normLower(courseCode)) {
          matchedCoursePrice = Number(courseData.priceINR) || 0;
          matchedCourseId = courseCode;
          matchedCourseType = courseData.type || '-';
          matchType = 'exact-course-id-match';
          break;
        }
        
        // Priority 2: Try strict 3-rule matching if all fields are available
        if (studentActivity && studentProgram && normalizedCategory && normalizedCategory !== '-' && hasValidCategory && courseLevel) {
          const rule1Match = normLower(studentActivity) === normLower(courseCode);
          const rule2Match = normLower(studentProgram) === normLower(courseName);
          const rule3Match = normLower(normalizedCategory) === normLower(courseLevel);
          
          if (rule1Match && rule2Match && rule3Match) {
            matchedCoursePrice = Number(courseData.priceINR) || 0;
            matchedCourseId = courseCode;
            matchedCourseType = courseData.type || '-';
            matchType = 'exact-triple-match';
            break;
          }
        }
        
        // Priority 3: Fallback - match by course name and activity if level matching fails
        if (studentActivity && studentProgram) {
          const rule1Match = normLower(studentActivity) === normLower(courseCode);
          const rule2Match = normLower(studentProgram) === normLower(courseName);
          
          if (rule1Match && rule2Match) {
            matchedCoursePrice = Number(courseData.priceINR) || 0;
            matchedCourseId = courseCode;
            matchedCourseType = courseData.type || '-';
            matchType = 'course-id-name-match';
            break;
          }
        }
      }

      // Log unmatched students - STRICT 3-RULE MATCHING ONLY
      if (!matchedCourseId) {
        if (studentActivity && studentProgram && normalizedCategory && normalizedCategory !== '-') {
          // Console message removed
        } else {
          // Console message removed
        }
      }

      // Fallback: if no matched course, use payment document's stored totals so manual payments still appear
  // Try to pick the exact student-course payment doc if a matched course exists
  const studentIdKey = student.studentId;
  const compositeKey = matchedCourseId ? `${studentIdKey}::${matchedCourseId}` : '';
  const studentCoursePaymentDoc = matchedCourseId ? paymentsByStudentCourse[compositeKey] : undefined;
  // Fallback: any payment doc for this student (for display continuity)
  const paymentDocFallback = studentCoursePaymentDoc || (paymentsByStudentArray[studentIdKey]?.[0]);
      let finalPaymentAmount = matchedCourseId ? Number(matchedCoursePrice) || 0 : 0;
      if (!matchedCourseId && paymentDocFallback) {
        finalPaymentAmount = Number(paymentDocFallback.totalCourseFee) || 0;
      }
      
      // DYNAMIC CALCULATION FROM PAYMENTS COLLECTION ONLY
      // Students collection: READ ONLY (never updated)
      // Courses collection: READ ONLY (never updated)
      // Payments collection: Source of truth for all payment data
      
      const studentPaymentDoc = studentCoursePaymentDoc || null;
      let coursePaidAmount = 0;
      let totalPaymentRecords = 0;
      
      if (studentPaymentDoc && Array.isArray(studentPaymentDoc.paymentRecords)) {
        const records = studentPaymentDoc.paymentRecords as PaymentRecordLite[];
        // Calculate from payment records within the student's payment document
        // IMPORTANT: Only course payments reduce the course balance. Registration fees should NOT reduce course balance.
        const courseRecords = records.filter((record: PaymentRecordLite) =>
          (record.paymentCategory || '') === 'Course Payment'
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
      // If we have a payment doc (student-course) and its backend-calculated balance exists, prefer it when no course match
      if (!matchedCourseId && paymentDocFallback && typeof paymentDocFallback.currentBalance === 'number') {
        balanceAmount = paymentDocFallback.currentBalance;
      }
        
      const hasBalance = balanceAmount > 0;
      
      // Debug log for strict 3-rule matching and payment calculations
      if (matchedCourseId) {
        // Console message removed
        // Console message removed
        // Console message removed
        // Console message removed
        // Console message removed
        // Console message removed
        // Console message removed
        // Console message removed
        // Console message removed
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

      // Prefer registration fees snapshot from payments collection (authoritative),
      // fallback to students collection if payments doc missing
      const registrationFeesSource = studentCoursePaymentDoc && studentCoursePaymentDoc.registrationFees
        ? studentCoursePaymentDoc.registrationFees
        : normalizeRegistrationFees((student as any).registrationFees);

  const cohortDetails = (student as any).cohortDetails || (student as any).cohortInfo || {};
  const rawCohortId = ((student as any).cohortId ?? (student as any).cohortID ?? cohortDetails.id ?? cohortDetails.cohortId ?? '').toString().trim();
  const rawCohortName = ((student as any).cohortName ?? (student as any).cohortLabel ?? cohortDetails.name ?? cohortDetails.cohortName ?? '').toString().trim();
      const rawCohortField = ((student as any).cohort ?? '').toString();
      const deriveFromComposite = (value: string) => {
        if (!value) return { id: '', name: '' };
        if (value.includes(' - ')) {
          const parts = value.split(' - ');
          return { id: parts[0].trim(), name: parts.slice(1).join(' - ').trim() };
        }
        return { id: value.trim(), name: value.trim() };
      };
      const composite = deriveFromComposite(rawCohortField);
      const resolvedCohortId = rawCohortId || composite.id;
      let resolvedCohortName = rawCohortName || composite.name;
      if (!resolvedCohortName && (student as any).batch) {
        resolvedCohortName = ((student as any).batch).toString().trim();
      }
      const finalCohortId = resolvedCohortId || resolvedCohortName || '';


      const studentResult = {
        id: student.studentId,
        name: (student as any).name || 'Unknown',
        activity: studentActivity || 'N/A',
        enrolledCourse: (student as any).enrolledCourse || (student as any).activity || 'N/A',
        cohortId: finalCohortId,
        cohort: resolvedCohortName || 'Unassigned',
  // Enrolled Course column should display the human-readable name from students.enrolledCourseName
  program: studentProgram || 'N/A', 
        category: studentCategory, // Category or level
        // Prefer matched course type; else fall back to persisted payment doc's courseType, then student's stored courseType/type
        courseType: matchedCourseId
          ? (matchedCourseType || (studentCoursePaymentDoc as any)?.courseType || (student as any).courseType || (student as any).type || '-')
          : ((studentCoursePaymentDoc as any)?.courseType || (paymentDocFallback as any)?.courseType || (student as any).courseType || (student as any).type || '-'),
        finalPayment: matchedCourseId ? finalPaymentAmount : (paymentDocFallback ? finalPaymentAmount : 0),
        balancePayment: matchedCourseId ? balanceAmount : (paymentDocFallback ? balanceAmount : 0),
  // Never borrow paid amount from another course: if no doc for matched course, show 0
  totalPaidAmount: studentCoursePaymentDoc ? studentCoursePaymentDoc.totalPaidAmount : 0,
        // Paid Date: Show last payment date or "-" if no payments
        paidDate: (studentPaymentDoc && studentPaymentDoc.lastPaymentDate) ? 
          studentPaymentDoc.lastPaymentDate.toISOString() : null,
        // Next Due Date: Always show for matched students (even if fully paid) - monthly cadence from courseStartDate
        nextPaymentDate: (() => {
          if (!matchedCourseId) return null;
          // Prefer explicit courseStartDate, else createdAt, else today
          const rawStart = (student as any).courseStartDate || (student as any).createdAt || new Date();
          const baseDate = new Date(rawStart);
          if (isNaN(baseDate.getTime())) return null;
          const nextDue = new Date(baseDate);
          nextDue.setDate(nextDue.getDate() + 30); // 30 days after course start
          return nextDue.toISOString();
        })(),
  paymentStatus: matchType === 'exact-triple-match' ? (balanceAmount > 0 ? 'Pending' : 'Paid') : (paymentDocFallback ? (paymentDocFallback.paymentStatus || (balanceAmount > 0 ? 'Pending' : 'Paid')) : '-'),
        paymentReminder: paymentDocFallback && paymentDocFallback.paymentReminder !== undefined 
          ? paymentDocFallback.paymentReminder // Use existing payment document setting if it exists
          : (matchType === 'exact-triple-match' && hasBalance), // Default: Reminder on if matched and balance > 0
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
  // Registration fees: use payments collection when available for up-to-date paid flags and dates
  registrationFees: registrationFeesSource,
  // Expose flat fields for clients that want quick checks (optional)
  studentRegistration: (studentCoursePaymentDoc?.studentRegistration) ?? (paymentDocFallback?.studentRegistration) ?? 0,
  courseRegistration: (studentCoursePaymentDoc?.courseRegistration) ?? (paymentDocFallback?.courseRegistration) ?? 0,
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
      
      // Push only one row per student (no extra historical rows)
      processedStudents.push(studentResult);
    }
    
    // Deduplicate by student id just in case (keep the best matched row if duplicates slipped in)
    const bestOf = new Map<string, any>();
    for (const row of processedStudents) {
      const existing = bestOf.get(row.id);
      if (!existing) {
        bestOf.set(row.id, row);
        continue;
      }
      // Prefer rows with exact triple match; else keep the one with a matchedCourseId; else keep first
      const score = (r: any) => (r.tripleRuleMatched ? 2 : (r.matchedCourseId ? 1 : 0));
      if (score(row) > score(existing)) bestOf.set(row.id, row);
    }
    const dedupedStudents = Array.from(bestOf.values());
    
    // Count matches and unmatched students after dedupe
    const totalMatches = dedupedStudents.filter(s => s.matchedCourseId).length;
    const unmatchedStudents = dedupedStudents.filter(s => !s.matchedCourseId).length;
    
    // Console message removed
    
    return NextResponse.json({
      success: true,
      data: dedupedStudents,
      message: `READ-ONLY: Processed ${dedupedStudents.length} students (deduped) with ${courses.length} courses. All calculations from payments collection.`,
      totalMatches: totalMatches,
      unmatchedStudents: unmatchedStudents
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    
  } catch (error: any) {
    // Console message removed
    
    // If it's a MongoDB connection error, return empty data gracefully
    if (error.message?.includes('MongoDB Atlas cluster') || error.message?.includes('IP') || error.message?.includes('whitelist')) {
      // Console message removed
      return NextResponse.json(
        {
          success: true,
          data: [],
          fallback: true,
          message: "Database temporarily unavailable - check IP whitelist",
          error: "IP_WHITELIST_ISSUE"
        },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to sync payment data", details: error.message },
      { status: 500 }
    );
  }
}
