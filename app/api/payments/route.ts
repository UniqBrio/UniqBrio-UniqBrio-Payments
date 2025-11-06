import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// One-time cleanup flag for stray root transactionId fields (defensive hardening)
let ROOT_TXN_FIELD_CLEANED = false;

// Ensure dynamic (no caching) for all payment operations
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    // Console messages removed

    await connectDB();

    // One-time defensive cleanup: remove any accidental root-level transactionId fields and legacy unique indexes
    if (!ROOT_TXN_FIELD_CLEANED) {
      try {
        // Aggressive audit: drop any root-level transactionId index BEFORE operations
        try {
          const idxList = await Payment.collection.indexes();
          const rootTxnIdx = idxList.filter((i: any) => i.name === 'transactionId_1' || (i.key && i.key.transactionId === 1));
          for (const idx of rootTxnIdx) {
            if (!idx?.name) continue;
            try {
              // Console message removed
              await Payment.collection.dropIndex(idx.name as string);
              // Console message removed
            } catch (dErr: any) {
              // Console message removed
            }
          }
          // Drop legacy unique index on studentId (we now use compound unique {studentId, courseId})
          const legacyStudentIdx = idxList.filter((i: any) => i.name === 'studentId_1' || (i.key && Object.keys(i.key).length === 1 && i.key.studentId === 1));
          for (const idx of legacyStudentIdx) {
            try {
              await Payment.collection.dropIndex(idx.name as string);
            } catch (e:any) {
              // ignore if can't drop
            }
          }
        } catch (listErr: any) {
          // Console message removed
        }
        const unsetRes: any = await Payment.updateMany(
          { transactionId: { $exists: true } },
          { $unset: { transactionId: "" } }
        );
        if (unsetRes.modifiedCount) {
          // Console message removed
        }
      } catch (cleanErr: any) {
        // Console message removed
      }
      ROOT_TXN_FIELD_CLEANED = true;
    }

    const body = await request.json();
    // Console message removed

    const {
      studentId,
      courseId: providedCourseId,
      amount,
      paymentMethod,
      paymentType,
      paymentCategory,
      notes,
      paymentDate,
      isManualPayment,
      recordedBy,
      finalPayment,
      receivedByName,
      receivedByRole
    } = body;

    if (!studentId || !amount || !paymentMethod || !paymentDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (isManualPayment && (!receivedByName || !receivedByRole)) {
      return NextResponse.json({ success: false, error: 'receivedByName and receivedByRole required for manual payments' }, { status: 400 });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Determine courseId for this payment (prefer explicit body, else from student)
    const resolvedCourseId = providedCourseId || (student as any).enrolledCourse || (student as any).activity || 'UNKNOWN';

    let paymentDoc = await Payment.findOne({ studentId, courseId: resolvedCourseId });
    if (!paymentDoc) {
      paymentDoc = new Payment({
        studentId: student.studentId,
        studentName: student.name,
        courseId: resolvedCourseId,
        courseName: student.program || 'Unknown Course',
        cohort: student.cohort || '',
        batch: student.batch || '',
        totalCourseFee: Number(finalPayment) || 0,
        totalPaidAmount: 0,
        coursePaidAmount: 0,
        currentBalance: Number(finalPayment) || 0,
        paymentRecords: [],
        // Initialize registration fees snapshot from student document if available
        registrationFees: {
          studentRegistration: {
            amount: Number((student as any)?.registrationFees?.studentRegistration) || 500,
            paid: false,
            paidDate: null
          },
          courseRegistration: {
            amount: Number((student as any)?.registrationFees?.courseRegistration) || 1000,
            paid: false,
            paidDate: null
          },
          confirmationFee: {
            amount: Number((student as any)?.registrationFees?.confirmationFee) || 250,
            paid: false,
            paidDate: null
          },
          overall: { paid: false, status: 'Pending' }
        }
      });
    }

    const validPaymentTypes = ["Course Fee", "Registration Fee", "Installment", "Late Fee", "Refund"];
    let normalizedPaymentType = paymentType || 'Course Fee';
    if (!validPaymentTypes.includes(normalizedPaymentType)) {
      if (["Student Registration", "Course Registration", "Confirmation Fee"].includes(paymentCategory)) {
        normalizedPaymentType = 'Registration Fee';
      } else normalizedPaymentType = 'Course Fee';
    }

    // Helper to generate transaction IDs immediately (so we don't rely solely on pre-save hook)
    const generateTransactionId = () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      return `PAY_${timestamp}_${random}`.toUpperCase();
    };

    const newPaymentRecord: any = {
      transactionId: generateTransactionId(),
      amount: Number(amount),
      paymentMethod,
      paymentType: normalizedPaymentType,
      paymentCategory: paymentCategory || 'Course Payment',
      notes: notes || '',
      paymentDate: new Date(paymentDate),
      receiverName: student.name,
      receiverId: student.studentId,
      previousBalance: paymentDoc.currentBalance,
      newBalance: Math.max(0, paymentDoc.currentBalance - Number(amount)),
      isManualPayment: Boolean(isManualPayment),
      recordedBy: recordedBy || 'System',
      receivedByName: receivedByName ? receivedByName.trim() : (recordedBy || 'System'),
      receivedByRole: receivedByRole || (isManualPayment ? 'admin' : 'system')
    };

    // If this is a first manual course payment and no course fee stored yet, infer it from amount when user pays full (common case)
    if ((paymentCategory === 'Course Payment' || !paymentCategory) && !finalPayment && paymentDoc.totalCourseFee === 0) {
      // If previousBalance is 0 we assume this payment represents the full fee (paid-in-full scenario)
      paymentDoc.totalCourseFee = newPaymentRecord.previousBalance > 0 ? paymentDoc.totalCourseFee : Number(amount);
      // Ensure currentBalance reflects new inferred fee before subtraction logic re-runs in pre-save
      paymentDoc.currentBalance = Math.max(0, paymentDoc.totalCourseFee - Number(amount));
      // Console message removed
    }

    // If this is a registration fee payment, update registration fee flags on the document
    const isStudentReg = newPaymentRecord.paymentCategory === 'Student Registration';
    const isCourseReg = newPaymentRecord.paymentCategory === 'Course Registration';
    if (isStudentReg) {
      paymentDoc.registrationFees.studentRegistration.amount = paymentDoc.registrationFees.studentRegistration.amount || Number((student as any)?.registrationFees?.studentRegistration) || 500;
      paymentDoc.registrationFees.studentRegistration.paid = true;
      paymentDoc.registrationFees.studentRegistration.paidDate = newPaymentRecord.paymentDate;
      // Update flat field for quick access
      try { (paymentDoc as any).studentRegistration = Number(paymentDoc.registrationFees.studentRegistration.amount) || Number(amount) || 0; } catch {}
    }
    if (isCourseReg) {
      paymentDoc.registrationFees.courseRegistration.amount = paymentDoc.registrationFees.courseRegistration.amount || Number((student as any)?.registrationFees?.courseRegistration) || 1000;
      paymentDoc.registrationFees.courseRegistration.paid = true;
      paymentDoc.registrationFees.courseRegistration.paidDate = newPaymentRecord.paymentDate;
      // Update flat field for quick access
      try { (paymentDoc as any).courseRegistration = Number(paymentDoc.registrationFees.courseRegistration.amount) || Number(amount) || 0; } catch {}
    }
    if (isStudentReg || isCourseReg) {
      const srPaid = Boolean(paymentDoc.registrationFees.studentRegistration?.paid);
      const crPaid = Boolean(paymentDoc.registrationFees.courseRegistration?.paid);
      const allPaid = srPaid && crPaid;
      paymentDoc.registrationFees.overall.paid = allPaid;
      paymentDoc.registrationFees.overall.status = allPaid ? 'Paid' : 'Pending';
    }

    paymentDoc.paymentRecords.push(newPaymentRecord);

    // SANITATION: Ensure every payment record (including historical) has a transactionId to avoid duplicate null index errors
    try {
      let sanitizedCount = 0;
      paymentDoc.paymentRecords.forEach((r: any) => {
        if (!r.transactionId || r.transactionId === 'null') {
          r.transactionId = generateTransactionId();
          sanitizedCount++;
        }
      });
      if (sanitizedCount > 0) {
        console.log(`🧹 Sanitized ${sanitizedCount} paymentRecords missing transactionId before save`);
      }
    } catch (sanErr) {
      console.warn('Sanitation step failed (non-fatal):', (sanErr as any)?.message);
    }

    if (finalPayment && Number(finalPayment) > 0) {
      paymentDoc.totalCourseFee = Number(finalPayment);
    }

    let verifiedDoc: any = null;
    let primaryErrCaptured: any = null;
    // Helper to run fallback manual update
    const runFallback = async () => {
      if (!newPaymentRecord.transactionId) newPaymentRecord.transactionId = generateTransactionId();
      // Recompute summary from existing records + new
      const tempRecords = paymentDoc.paymentRecords.map((r: any) => ({ ...r }));
      const completed = tempRecords.filter((r: any) => (r.paymentStatus || 'Completed') === 'Completed');
      const coursePaidAmount = completed.filter((r: any) => r.paymentCategory === 'Course Payment')
        .reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      const totalPaidAmount = completed.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      const currentBalance = Math.max(0, paymentDoc.totalCourseFee - coursePaidAmount);
      let paymentStatus: any = 'Pending';
      if (coursePaidAmount > 0 && currentBalance > 0) paymentStatus = 'Partial';
      if (coursePaidAmount > 0 && currentBalance === 0) paymentStatus = 'Paid';

      // Prepare registration fee updates if the new record is a registration payment
      const regSet: any = {};
      if (isStudentReg) {
        regSet['registrationFees.studentRegistration.paid'] = true;
        regSet['registrationFees.studentRegistration.paidDate'] = newPaymentRecord.paymentDate;
        regSet['registrationFees.studentRegistration.amount'] = paymentDoc.registrationFees.studentRegistration?.amount || Number((student as any)?.registrationFees?.studentRegistration) || 500;
        regSet['studentRegistration'] = paymentDoc.registrationFees.studentRegistration?.amount || Number((student as any)?.registrationFees?.studentRegistration) || 500;
      }
      if (isCourseReg) {
        regSet['registrationFees.courseRegistration.paid'] = true;
        regSet['registrationFees.courseRegistration.paidDate'] = newPaymentRecord.paymentDate;
        regSet['registrationFees.courseRegistration.amount'] = paymentDoc.registrationFees.courseRegistration?.amount || Number((student as any)?.registrationFees?.courseRegistration) || 1000;
        regSet['courseRegistration'] = paymentDoc.registrationFees.courseRegistration?.amount || Number((student as any)?.registrationFees?.courseRegistration) || 1000;
      }
      if (isStudentReg || isCourseReg) {
        const srPaid = isStudentReg ? true : Boolean(paymentDoc.registrationFees.studentRegistration?.paid);
        const crPaid = isCourseReg ? true : Boolean(paymentDoc.registrationFees.courseRegistration?.paid);
        regSet['registrationFees.overall.paid'] = srPaid && crPaid;
        regSet['registrationFees.overall.status'] = (srPaid && crPaid) ? 'Paid' : 'Pending';
      }
      await Payment.updateOne(
        { studentId, courseId: resolvedCourseId },
        {
          $set: {
            totalPaidAmount,
            coursePaidAmount,
            currentBalance,
            paymentStatus,
            lastPaymentDate: newPaymentRecord.paymentDate,
            ...regSet
          },
          $push: { paymentRecords: newPaymentRecord }
        },
        { upsert: true }
      );
      console.log('🛠 Fallback update applied');
      verifiedDoc = await Payment.findOne({ studentId, courseId: resolvedCourseId }).lean();
    };

    // Attempt up to 3 tries with escalating cleanup
    for (let attempt = 1; attempt <= 3 && !verifiedDoc; attempt++) {
      try {
        // Ensure no root transactionId field on doc (defensive)
        if ((paymentDoc as any).transactionId !== undefined) delete (paymentDoc as any).transactionId;
        await paymentDoc.save();
        console.log(`✅ Payment document saved on attempt ${attempt}`);
        verifiedDoc = await Payment.findOne({ studentId, courseId: resolvedCourseId }).lean();
      } catch (err: any) {
        primaryErrCaptured = err;
        console.error(`❌ Save attempt ${attempt} failed:`, err.message);
        if (err?.code === 11000 && /transactionId/i.test(err.message)) {
          // Deep cleanup before next attempt
            try {
              const idxs = await Payment.collection.indexes();
              console.log('🧪 Indexes (attempt', attempt, '):', idxs);
              // Drop root index again if it reappeared
              for (const idx of idxs) {
                if (idx?.name === 'transactionId_1') {
                  try { await Payment.collection.dropIndex(idx.name as string); console.log('🛠 Dropped root index again'); } catch(e:any){ console.warn('⚠️ Drop root index retry failed:', e.message); }
                }
              }
            } catch (idxListErr:any) {
              console.warn('⚠️ Could not list/drop indexes during retry:', idxListErr.message);
            }
          // Global cleanup of stray root fields
          try {
            const resUnset = await Payment.updateMany({ transactionId: { $exists: true } }, { $unset: { transactionId: "" } });
            if (resUnset.modifiedCount) console.log(`🧽 Retry cleanup unset root transactionId in ${resUnset.modifiedCount} docs`);
          } catch (uErr:any) { console.warn('⚠️ Retry unset failed:', uErr.message); }
          // Regenerate latest record transactionId
          const lastRecord = (paymentDoc as any).paymentRecords[(paymentDoc as any).paymentRecords.length - 1];
          if (lastRecord) lastRecord.transactionId = generateTransactionId();
          // On final attempt, fallback to manual update path
          if (attempt === 3) {
            try {
              await runFallback();
            } catch(fallbackErr:any) {
              console.error('❌ Final fallback failed:', fallbackErr.message);
            }
          }
        } else {
          // Non duplicate error -> break to fallback
          if (attempt === 3 && !verifiedDoc) {
            try { await runFallback(); } catch(e:any){ console.error('❌ Fallback after non-dup error failed:', e.message); }
          }
        }
      }
    }
    if (!verifiedDoc) {
      // Provide rich diagnostics
      let indexes: any[] = [];
      try { indexes = await Payment.collection.indexes(); } catch(e:any){ indexes = [{ error: e.message }]; }
      return NextResponse.json({
        success: false,
        error: 'Save failed after retries',
        primaryError: primaryErrCaptured?.message,
        debug: {
          indexes,
          attemptedTransactionId: newPaymentRecord.transactionId,
          recordCountInRequest: (paymentDoc as any).paymentRecords.length
        }
      }, { status: 500 });
    }

    if (!verifiedDoc) {
      verifiedDoc = await Payment.findOne({ studentId, courseId: resolvedCourseId }).lean();
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded',
      data: {
        paymentRecord: newPaymentRecord,
        paymentDocument: verifiedDoc ? {
          studentId: verifiedDoc.studentId,
          courseId: verifiedDoc.courseId,
          totalRecords: verifiedDoc.paymentRecords?.length || 0,
          totalCourseFee: verifiedDoc.totalCourseFee,
          totalPaidAmount: verifiedDoc.totalPaidAmount,
          coursePaidAmount: verifiedDoc.coursePaidAmount,
          currentBalance: verifiedDoc.currentBalance,
          paymentStatus: verifiedDoc.paymentStatus,
          registrationFees: verifiedDoc.registrationFees,
          studentRegistration: (verifiedDoc as any).studentRegistration || 0,
          courseRegistration: (verifiedDoc as any).courseRegistration || 0
        } : null,
        summary: verifiedDoc ? {
          studentId: verifiedDoc.studentId,
          courseId: verifiedDoc.courseId,
          totalCourseFee: verifiedDoc.totalCourseFee,
          totalPaidAmount: verifiedDoc.totalPaidAmount,
          coursePaidAmount: verifiedDoc.coursePaidAmount,
          currentBalance: verifiedDoc.currentBalance,
          paymentStatus: verifiedDoc.paymentStatus,
          registrationFees: verifiedDoc.registrationFees,
          studentRegistration: (verifiedDoc as any).studentRegistration || 0,
          courseRegistration: (verifiedDoc as any).courseRegistration || 0
        } : null,
        paymentRecordsCount: verifiedDoc?.paymentRecords?.length || 0
      }
    });
  } catch (err: any) {
    console.error('Payment API Error (outer catch):', err?.message);
    // Attempt to gather diagnostic info
    let indexes: any[] = [];
    try { indexes = await Payment.collection.indexes(); } catch (e: any) { indexes = [{ error: e.message }]; }
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: err.message,
      debug: { indexes }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const connection = await connectDB();
    
    if (!connection) {
      return NextResponse.json({
        success: false,
        error: "Database connection unavailable"
      }, { status: 503 });
    }
    
  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  const courseId = url.searchParams.get('courseId');
    
    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: "Student ID is required"
      }, { status: 400 });
    }
    
  let paymentDoc = null as any;
  if (courseId) {
    paymentDoc = await Payment.findOne({ studentId, courseId });
  } else {
    // Backward compatible: if courseId not provided, return the first doc for the student
    const docs = await Payment.find({ studentId }).sort({ updatedAt: -1 }).limit(1);
    paymentDoc = docs && docs[0] ? docs[0] : null;
  }
    
    if (!paymentDoc) {
      return NextResponse.json({
        success: true,
        data: {
          studentId,
          paymentRecords: [],
          totalRecords: 0,
          message: "No payment document found for this student"
        }
      });
    }
    
    // Sort payment records by date (newest first)
    const sortedPaymentRecords = paymentDoc.paymentRecords.sort(
      (a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
    
    return NextResponse.json({
      success: true,
      data: {
        studentId: paymentDoc.studentId,
        studentName: paymentDoc.studentName,
        courseId: paymentDoc.courseId,
        courseName: paymentDoc.courseName,
        totalCourseFee: paymentDoc.totalCourseFee,
        totalPaidAmount: paymentDoc.totalPaidAmount,
        coursePaidAmount: paymentDoc.coursePaidAmount,
        currentBalance: paymentDoc.currentBalance,
        paymentStatus: paymentDoc.paymentStatus,
        registrationFees: paymentDoc.registrationFees,
        totalRecords: paymentDoc.paymentRecords.length,
        paymentRecords: sortedPaymentRecords
      }
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    
  } catch (error) {
    console.error('Get Payments API Error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }
}