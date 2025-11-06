import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payment from '@/models/payment';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  const courseId = url.searchParams.get('courseId');
    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
    }
    await connectDB();
    let doc: any = null;
    if (courseId) {
      doc = await Payment.findOne({ studentId, courseId }).lean();
    } else {
      const docs = await Payment.find({ studentId }).sort({ updatedAt: -1 }).limit(1).lean();
      doc = docs && docs[0] ? docs[0] : null;
    }
    if (!doc) {
      return NextResponse.json({ success: false, error: 'No payment document found', studentId }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      studentId,
      totalRecords: doc.paymentRecords?.length || 0,
      paymentStatus: doc.paymentStatus,
      currentBalance: doc.currentBalance,
      totalPaidAmount: doc.totalPaidAmount,
      coursePaidAmount: doc.coursePaidAmount,
      lastPaymentDate: doc.lastPaymentDate,
      doc
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Inspect failed', details: e.message }, { status: 500 });
  }
}
