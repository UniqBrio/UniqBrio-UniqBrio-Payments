#!/usr/bin/env node
/**
 * Payments Collection Audit / Self-Heal Script
 *
 * Usage:
 *  pnpm exec node scripts/payments-audit.js
 *  or: npm run payments:audit
 */
import mongoose from 'mongoose';
import Payment from '../models/payment.js';
import { config as loadEnv } from 'dotenv';
loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri, { dbName: 'uniqbrio' });
    console.log('✅ Connected for audit');

    const coll = mongoose.connection.collection('payments');
    const indexes = await coll.indexes();
    console.log('\nCurrent Indexes:');
    indexes.forEach(i => console.log(' -', i.name, JSON.stringify(i.key), i.unique ? '(unique)' : ''));

    const hasRootTxn = indexes.find(i => i.name === 'transactionId_1');
    if (hasRootTxn) {
      console.log('\n🛠 Dropping unintended root transactionId_1 index...');
      try { await coll.dropIndex('transactionId_1'); console.log('✅ Dropped root index'); } catch (e) { console.warn('⚠️ Drop failed:', e.message); }
    }

    const hasEmbedded = indexes.find(i => i.name === 'paymentRecords.transactionId_1');
    if (!hasEmbedded) {
      console.log('\n🛠 Creating embedded non-unique index paymentRecords.transactionId_1 ...');
      try { await coll.createIndex({ 'paymentRecords.transactionId': 1 }, { name: 'paymentRecords.transactionId_1', unique: false }); console.log('✅ Created embedded index'); } catch (e) { console.warn('⚠️ Create embedded failed:', e.message); }
    }

    // Backfill missing transactionIds
    const docs = await Payment.find({});
    let changedDocs = 0; let changedRecs = 0;
    const genId = () => `PAY_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`.toUpperCase();
    for (const d of docs) {
      let modified = false;
      d.paymentRecords.forEach(r => { if (!r.transactionId) { r.transactionId = genId(); modified = true; changedRecs++; } });
      if (modified) { await d.save(); changedDocs++; }
    }
    console.log(`\n🧹 Backfill complete: ${changedRecs} records updated in ${changedDocs} documents.`);

    // Remove stray root transactionId fields
    const unsetResult = await coll.updateMany({ transactionId: { $in: [null, ''] } }, { $unset: { transactionId: '' } });
    if (unsetResult.modifiedCount) {
      console.log(`🧽 Removed stray root transactionId field from ${unsetResult.modifiedCount} docs`);
    }

    console.log('\n🔍 Final Indexes After Audit:');
    const finalIdx = await coll.indexes();
    finalIdx.forEach(i => console.log(' -', i.name, JSON.stringify(i.key), i.unique ? '(unique)' : ''));

    await mongoose.disconnect();
    console.log('\n✅ Audit finished.');
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
})();
