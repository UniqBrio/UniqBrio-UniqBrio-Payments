// Quick Manual Payment Test Script
// Run this in the browser console to test manual payments

console.log('🧪 Manual Payment Test Script');

// Test function to simulate a manual payment
async function testManualPayment(studentId, amount = 1000) {
  console.log(`\n🚀 Testing manual payment for student: ${studentId}`);
  
  const paymentData = {
    studentId: studentId,
    amount: amount,
    paymentMethod: 'Cash',
    paymentType: 'Course Fee',
    paymentCategory: 'Course Payment', 
    notes: 'Test payment via console',
    paymentDate: new Date().toISOString(),
    isManualPayment: true,
    recordedBy: 'Console Test',
    finalPayment: 5000,
    receivedByName: 'Test Admin',
    receivedByRole: 'admin'
  };

  console.log('📝 Sending payment data:', paymentData);

  try {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📄 Response data:', result);

    if (result.success) {
      console.log('✅ Payment recorded successfully!');
      
      // Test sync API to see if it picks up the change
      console.log('\n🔄 Testing sync API...');
      const syncResponse = await fetch('/api/payments/sync', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const syncResult = await syncResponse.json();
      console.log('📊 Sync API response:', {
        success: syncResult.success,
        dataLength: syncResult.data?.length,
        message: syncResult.message
      });
      
      // Find the student in sync results
      const studentRecord = syncResult.data?.find(r => r.id === studentId);
      if (studentRecord) {
        console.log('👤 Student record in sync:', {
          id: studentRecord.id,
          name: studentRecord.name,
          totalPaid: studentRecord.totalPaid,
          balance: studentRecord.balance,
          paymentStatus: studentRecord.paymentStatus
        });
      } else {
        console.log('❌ Student not found in sync results');
      }
      
    } else {
      console.log('❌ Payment failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Instructions
console.log(`
📋 To test manual payment:

1. Find a student ID from the payment table (look at the first column)
2. Run: testManualPayment('STUDENT_ID_HERE')
3. Example: testManualPayment('STU001')
4. Check the console logs for detailed results

The test will:
✅ Send a manual payment
✅ Check if payment API succeeds  
✅ Call sync API to verify data refresh
✅ Show before/after comparison
`);

// Make function globally available
window.testManualPayment = testManualPayment;