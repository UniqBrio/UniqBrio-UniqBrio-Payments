import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PaymentModel from '@/models/payment';

export async function POST(request: Request) {
  try {
    console.log('📝 POST /api/payments/update - Update payment record');
    
    await connectDB();
    
    const body = await request.json();
    const { id, updates } = body;
    
    console.log('🔄 Updating payment record:', { id, updates });
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    // Find and update the payment record
    const updatedPayment = await PaymentModel.findOneAndUpdate(
      { studentId: id }, // Match by studentId
      { 
        $set: {
          // Update the specific fields
          ...(updates.paymentReminder !== undefined && { paymentReminder: updates.paymentReminder }),
          ...(updates.communicationText !== undefined && { communicationText: updates.communicationText }),
          ...(updates.paymentStatus !== undefined && { paymentStatus: updates.paymentStatus }),
          // Add other updatable fields as needed
        }
      },
      { 
        new: true, // Return the updated document
        upsert: false // Don't create new document if not found
      }
    );
    
    if (!updatedPayment) {
      console.log('⚠️ Payment record not found for student:', id);
      
      // For simple updates like paymentReminder, fetch student data and create proper record
      if (updates.paymentReminder !== undefined) {
        console.log('✅ Fetching student data to create payment record for reminder setting');
        
        try {
          // Import Student and Course models
          const Student = (await import('@/models/student')).default;
          const Course = (await import('@/models/course')).default;
          
          // Get student data
          const student = await Student.findOne({ studentId: id });
          if (!student) {
            return NextResponse.json({
              success: false,
              error: 'Student not found',
              message: `Cannot update payment reminder for non-existent student: ${id}`
            }, { status: 404 });
          }
          
          // Get course data  
          const courseId = student.enrolledCourse || student.activity || 'unknown';
          const course = await Course.findOne({ id: courseId });
          
          const minimalPayment = new PaymentModel({
            studentId: id,
            studentName: student.name || 'Unknown Student',
            courseId: courseId,
            courseName: course?.name || student.program || student.course || 'Unknown Course',
            totalCourseFee: course?.priceINR || 0,
            paymentRecords: [],
            totalPaidAmount: student.totalPaidAmount || 0,
            coursePaidAmount: 0,
            currentBalance: Math.max(0, (course?.priceINR || 0) - (student.totalPaidAmount || 0)),
            paymentReminder: updates.paymentReminder,
            paymentStatus: 'Pending'
          });
          
          const savedPayment = await minimalPayment.save();
          console.log('✅ Payment record created for reminder setting:', savedPayment.studentId);
          
          return NextResponse.json({
            success: true,
            message: 'Payment reminder setting saved successfully',
            data: savedPayment
          });
        } catch (studentFetchError) {
          console.error('❌ Error fetching student/course data:', studentFetchError);
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch required data',
            message: 'Could not retrieve student or course information to save reminder setting'
          }, { status: 500 });
        }
      }
      
      // For other updates that require a full payment record, return an error
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment record not found',
          message: 'Cannot update payment record that does not exist. Payment records are created when payments are made.'
        },
        { status: 404 }
      );
    }
    
    console.log('✅ Payment record updated successfully:', updatedPayment.studentId);
    
    return NextResponse.json({
      success: true,
      message: 'Payment record updated successfully',
      data: updatedPayment
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/payments/update:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}