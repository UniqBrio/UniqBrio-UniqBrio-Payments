// Debug script to check courses and students data
const checkData = async () => {
  try {
    console.log('🔍 Checking courses data...\n');
    
    const coursesResponse = await fetch('http://localhost:3001/api/courses');
    const coursesData = await coursesResponse.json();
    
    if (coursesData.success && coursesData.data.length > 0) {
      console.log(`✅ Found ${coursesData.data.length} courses:`);
      coursesData.data.slice(0, 2).forEach((course, index) => {
        console.log(`  Course ${index + 1}:`);
        console.log(`    - ID: ${course.id || course._id}`);
        console.log(`    - Name: ${course.name}`);
        console.log(`    - Type: ${course.type}`);
        console.log(`    - Level: ${course.level}`);
        console.log(`    - PriceINR: ${course.priceINR}`);
        console.log('');
      });
    } else {
      console.log('❌ No courses found or API error');
      console.log('Response:', coursesData);
    }
    
    console.log('\n🔍 Checking students data...\n');
    
    const studentsResponse = await fetch('http://localhost:3001/api/students');
    const studentsData = await studentsResponse.json();
    
    if (studentsData.success && studentsData.data.length > 0) {
      console.log(`✅ Found ${studentsData.data.length} students:`);
      studentsData.data.slice(0, 2).forEach((student, index) => {
        console.log(`  Student ${index + 1}:`);
        console.log(`    - ID: ${student.studentId}`);
        console.log(`    - Name: ${student.name}`);
        console.log(`    - Activity: ${student.activity}`);
        console.log(`    - EnrolledCourse: ${student.enrolledCourse}`);
        console.log(`    - Course: ${student.course}`);
        console.log(`    - Program: ${student.program}`);
        console.log(`    - Category: ${student.category}`);
        console.log(`    - Level: ${student.level}`);
        console.log('');
      });
    } else {
      console.log('❌ No students found or API error');
    }
    
    console.log('\n🔍 Checking payments sync data...\n');
    
    const paymentsResponse = await fetch('http://localhost:3001/api/payments/sync');
    const paymentsData = await paymentsResponse.json();
    
    if (paymentsData.success && paymentsData.data.length > 0) {
      console.log(`✅ Found ${paymentsData.data.length} payment records:`);
      paymentsData.data.slice(0, 2).forEach((payment, index) => {
        console.log(`  Payment ${index + 1}:`);
        console.log(`    - ID: ${payment.id}`);
        console.log(`    - Name: ${payment.name}`);
        console.log(`    - Activity: ${payment.activity}`);
        console.log(`    - EnrolledCourse: ${payment.enrolledCourse}`);
        console.log(`    - Program: ${payment.program}`);
        console.log(`    - Category: ${payment.category}`);
        console.log(`    - CourseType: ${payment.courseType}`);
        console.log(`    - FinalPayment: ${payment.finalPayment}`);
        console.log('');
      });
    } else {
      console.log('❌ No payment data found or API error');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkData();