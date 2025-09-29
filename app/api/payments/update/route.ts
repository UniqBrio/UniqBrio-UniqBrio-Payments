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
      console.log('⚠️ Payment record not found, creating new entry for student:', id);
      
      // If payment record doesn't exist, create a basic one
      const newPayment = new PaymentModel({
        studentId: id,
        paymentRecords: [],
        totalPaidAmount: 0,
        currentBalance: 0,
        lastPaymentDate: null,
        paymentReminder: updates.paymentReminder || false,
        communicationText: updates.communicationText || '',
        paymentStatus: updates.paymentStatus || 'Pending'
      });
      
      const savedPayment = await newPayment.save();
      console.log('✅ Created new payment record:', savedPayment.studentId);
      
      return NextResponse.json({
        success: true,
        message: 'Payment record created successfully',
        data: savedPayment
      });
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