import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payment from '@/models/payment';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
    }
    await connectDB();
    const doc: any = await Payment.findOne({ studentId }).lean();
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
