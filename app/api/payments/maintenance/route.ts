import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payment from '@/models/payment';

/*
  Maintenance Endpoint: /api/payments/maintenance
  Actions:
    ?action=backfill-transaction-ids        -> Assign missing transactionIds to existing embedded paymentRecords
    ?action=inspect-indexes                 -> List all indexes on payments collection
    ?action=drop-root-transactionid-index   -> Drop unintended unique root-level transactionId index if present
    ?action=rebuild-embedded-transactionid-index -> Ensure non-unique index on paymentRecords.transactionId exists

  (Optional) Could extend with:
    ?action=scan -> Return counts/statistics only
*/

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (!action) {
      return NextResponse.json({
        success: true,
        message: 'Specify an action query param',
        actions: ['backfill-transaction-ids']
      });
    }

    if (action === 'inspect-indexes') {
      const indexes = await Payment.collection.indexes();
      return NextResponse.json({ success: true, action, indexes });
    }

    if (action === 'drop-root-transactionid-index') {
      const indexes = await Payment.collection.indexes();
      const target = indexes.find((idx: any) => idx.name === 'transactionId_1');
      if (!target) {
        return NextResponse.json({ success: true, message: 'No root transactionId_1 index found' });
      }
      try {
        await Payment.collection.dropIndex('transactionId_1');
        return NextResponse.json({ success: true, dropped: 'transactionId_1' });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    if (action === 'rebuild-embedded-transactionid-index') {
      // Create (or ensure) a non-unique index on embedded paymentRecords.transactionId for faster lookup (if needed)
      try {
        await Payment.collection.createIndex({ 'paymentRecords.transactionId': 1 }, { name: 'paymentRecords.transactionId_1', unique: false });
        return NextResponse.json({ success: true, action, created: 'paymentRecords.transactionId_1' });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    if (action === 'backfill-transaction-ids') {
      const docs = await Payment.find({});
      let updatedDocs = 0;
      let updatedRecords = 0;
      const generateId = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `PAY_${timestamp}_${random}`.toUpperCase();
      };

      for (const doc of docs) {
        let modified = false;
        doc.paymentRecords.forEach((rec: any) => {
          if (!rec.transactionId || rec.transactionId === 'null') {
            rec.transactionId = generateId();
            modified = true;
            updatedRecords++;
          }
        });
        if (modified) {
          // Save only this doc (will also trigger pre-save hooks for summary recalculation)
          await doc.save();
          updatedDocs++;
        }
      }

      return NextResponse.json({
        success: true,
        action,
        updatedDocs,
        updatedRecords,
        totalDocs: docs.length
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
