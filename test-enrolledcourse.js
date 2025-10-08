// Test script to verify enrolledCourse functionality
const testEnrolledCourse = async () => {
  console.log('🧪 Testing enrolledCourse functionality...\n');
  
  try {
    // Test the students API
    console.log('1. Testing /api/students endpoint...');
    const studentsResponse = await fetch('http://localhost:3001/api/students');
    const studentsData = await studentsResponse.json();
    
    if (studentsData.success && studentsData.data.length > 0) {
      const sampleStudent = studentsData.data[0];
      console.log('✅ Students API works');
      console.log('Sample student data:');
      console.log(`  - ID: ${sampleStudent.studentId}`);
      console.log(`  - Name: ${sampleStudent.name}`);
      console.log(`  - Activity: ${sampleStudent.activity}`);
      console.log(`  - EnrolledCourse: ${sampleStudent.enrolledCourse || 'Not set'}`);
    } else {
      console.log('⚠️  No students found or API error');
    }
    
    console.log('\n2. Testing /api/payments/sync endpoint...');
    const paymentsResponse = await fetch('http://localhost:3001/api/payments/sync');
    const paymentsData = await paymentsResponse.json();
    
    if (paymentsData.success && paymentsData.data.length > 0) {
      const samplePayment = paymentsData.data[0];
      console.log('✅ Payments sync API works');
      console.log('Sample payment data:');
      console.log(`  - ID: ${samplePayment.id}`);
      console.log(`  - Name: ${samplePayment.name}`);
      console.log(`  - Activity: ${samplePayment.activity}`);
      console.log(`  - EnrolledCourse: ${samplePayment.enrolledCourse || 'Not set'}`);
    } else {
      console.log('⚠️  No payments found or API error');
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testEnrolledCourse();