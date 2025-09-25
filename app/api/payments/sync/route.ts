import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Fetching students for payment sync...');
    
    // Aggregate all payments and update student records with latest balances
    const students = await Student.find({}).lean();
    console.log(`Found ${students.length} students in database`);
    
    const updatedStudents = await Promise.all(students.map(async (student) => {
      // Get all completed payments for this student
      const payments = await Payment.find({ 
        studentId: student.studentId,
        paymentStatus: 'Completed'
      }).sort({ paymentDate: -1 });
      
      // Calculate totals with smart defaults for finalPayment
      const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Add registration fees to total received if paid
      let registrationFeesReceived = 0;
      if (student.registrationFees && student.registrationFees.paid) {
        const regFees = student.registrationFees;
        registrationFeesReceived = (regFees.studentRegistration || 0) + 
                                  (regFees.courseRegistration || 0) + 
                                  (regFees.confirmationFee || 0);
      }
      
      const totalReceivedAmount = totalPaidAmount + registrationFeesReceived;
      
      // Get final payment amount with intelligent defaults
      let totalCourseFee = student.finalPayment || 0;
      
      // If finalPayment is 0 or not set, calculate from course/activity
      if (totalCourseFee === 0) {
        const courseName = (student.course || student.activity || '').toLowerCase();
        
        // Default course pricing based on activity/course
        const coursePricing: { [key: string]: number } = {
          'art': 15000,
          'photography': 12000,
          'music': 10000,
          'dance': 8000,
          'craft': 6000,
          'drama': 7000,
          'digital art': 18000,
          'singing': 9000,
          'guitar': 11000,
          'piano': 13000,
          'painting': 14000,
          'drawing': 8000,
          'sculpture': 16000
        };
        
        // Find matching course price
        totalCourseFee = 10000; // Default base price
        for (const [course, price] of Object.entries(coursePricing)) {
          if (courseName.includes(course)) {
            totalCourseFee = price;
            break;
          }
        }
        
        console.log(`Using default pricing for ${student.name} (${student.course || student.activity}): ₹${totalCourseFee}`);
      }
      
      const balancePayment = Math.max(0, totalCourseFee - totalReceivedAmount);
      
      // Determine status
      let paymentStatus = 'Paid';
      if (balancePayment > 0) {
        // Always show Pending if there's any balance remaining
        paymentStatus = 'Pending';
      }
      
      // Get latest payment date
      const latestPayment = payments.length > 0 ? payments[0] : null;
      
      return {
        id: student.studentId,
        name: student.name,
        activity: student.course || student.activity || 'General Course',
        category: student.category || 'Regular',
        courseType: student.courseType || 'Individual',
        cohort: student.cohort || `${student.course}_${new Date().getFullYear()}_Batch01`,
        batch: student.batch || 'Morning Batch',
        instructor: student.instructor || 'TBD',
        classSchedule: student.classSchedule || 'Mon-Wed-Fri 10:00-12:00',
        currency: student.currency || 'INR',
        finalPayment: totalCourseFee, // Use calculated course fee
        totalPaidAmount: totalReceivedAmount, // Include registration fees in total
        balancePayment,
        paymentStatus,
        paymentFrequency: student.paymentFrequency || 'Monthly',
        paidDate: latestPayment ? latestPayment.paymentDate.toISOString() : 
          (student.paidDate ? (student.paidDate instanceof Date ? student.paidDate.toISOString() : new Date(student.paidDate).toISOString()) : null),
        nextPaymentDate: student.nextPaymentDate ? 
          (student.nextPaymentDate instanceof Date ? student.nextPaymentDate.toISOString() : new Date(student.nextPaymentDate).toISOString()) : 
          new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        courseStartDate: student.courseStartDate ? 
          (student.courseStartDate instanceof Date ? student.courseStartDate.toISOString() : new Date(student.courseStartDate).toISOString()) : 
          new Date().toISOString(),
        paymentReminder: paymentStatus === 'Paid' ? false : (student.paymentReminder !== false),
        reminderMode: student.modeOfCommunication || student.reminderMode || 'Email',
        communicationText: student.communicationText || `Payment reminder for ${student.course || student.activity}. Amount due: ₹${balancePayment}.`,
        reminderDays: student.reminderDays || [7, 3, 1],
        registrationFees: student.registrationFees || {
          studentRegistration: 500,
          courseRegistration: 1000,
          confirmationFee: 250,
          paid: false,
          status: 'Pending'
        },
        paymentDetails: student.paymentDetails || {
          upiId: 'payment@uniqbrio.com',
          paymentLink: 'https://pay.uniqbrio.com',
          qrCode: 'QR_CODE_PLACEHOLDER'
        },
        paymentModes: student.paymentModes || ['UPI', 'Card', 'Bank Transfer'],
        studentType: student.studentType || 'New',
        emiSplit: student.emiSplit || 1,
        // Additional metadata from payments
        totalTransactions: payments.length,
        lastPaymentDate: latestPayment ? latestPayment.paymentDate : null,
        lastPaymentAmount: latestPayment ? latestPayment.amount : 0,
        paymentHistory: payments.slice(0, 1).map(p => ({
          id: p.transactionId,
          amount: p.amount,
          date: p.paymentDate,
          method: p.paymentMethod,
          notes: p.notes
        }))
      };
    }));
    
    console.log(`Returning ${updatedStudents.length} synchronized payment records`);
    
    return NextResponse.json({
      success: true,
      data: updatedStudents,
      message: `Synchronized payment data for ${updatedStudents.length} students`
    });
    
  } catch (error) {
    console.error('Payment sync error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to sync payment data" },
      { status: 500 }
    );
  }
}

// Add POST method to manually trigger sync
export async function POST(request: NextRequest) {
  try {
    console.log('Manual sync triggered');
    
    // Force refresh by calling GET method
    const result = await GET(request);
    return result;
    
  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to manually sync payment data" },
      { status: 500 }
    );
  }
}
