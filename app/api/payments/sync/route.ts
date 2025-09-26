import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Disable caching for Vercel
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 VERCEL DEBUG: Starting payments sync...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    try {
      await connectDB();
      console.log('✅ VERCEL DEBUG: Database connection successful');
    } catch (error) {
      console.error('❌ VERCEL DEBUG: Database connection failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: (error as any).message,
        data: []
      }, { status: 200 });
    }
    
    console.log('Fetching students for payment sync...');
    
    // Aggregate all payments and update student records with latest balances
    let students;
    try {
      students = await Student.find({}).lean();
      console.log(`📊 VERCEL DEBUG: Found ${students.length} students in database`);
    } catch (error) {
      console.error('❌ VERCEL DEBUG: Failed to fetch students:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch students',
        details: (error as any).message,
        data: []
      }, { status: 200 });
    }
    
    const updatedStudents = await Promise.all(students.map(async (student) => {
      console.log(`💰 VERCEL DEBUG: Processing student ${student.studentId} - ${student.name}`);
      
      // Get payment document for this student (new structure: one doc per student)
      const paymentDoc = await Payment.findOne({ 
        studentId: student.studentId 
      });
      
      console.log(`📄 VERCEL DEBUG: Payment doc exists for ${student.name}:`, !!paymentDoc);
      if (paymentDoc) {
        console.log(`📊 VERCEL DEBUG: Payment records count for ${student.name}:`, paymentDoc.paymentRecords?.length || 0);
      }
      
      // Get completed payment records from the document
      const paymentRecords = paymentDoc?.paymentRecords?.filter((record: any) => 
        record.paymentStatus === 'Completed'
      ) || [];
      
      console.log(`✅ VERCEL DEBUG: Completed payments for ${student.name}:`, paymentRecords.length);
      
      // Calculate totals - separate course payments from registration fee payments to avoid double counting
      // Dynamically calculate total paid from paymentDoc or sum all paymentRecords amounts
      let totalPaidAmount = 0;
      if (paymentDoc && typeof paymentDoc.totalPaidAmount === 'number') {
        totalPaidAmount = paymentDoc.totalPaidAmount;
      } else {
        totalPaidAmount = paymentRecords.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
      }
      // ...existing code...
      
      // Get total course fee (EXCLUDING registration fees) - prioritize payment doc, then calculate from student finalPayment
      let totalCourseFee = paymentDoc?.totalCourseFee || 0;
      
      // If payment doc doesn't have course fee, calculate from student finalPayment
      if (totalCourseFee === 0 && student.finalPayment && student.finalPayment > 0) {
        const standardRegistrationFees = 500 + 1000 + 250; // 1750
        totalCourseFee = Math.max(0, student.finalPayment - standardRegistrationFees);
        console.log('🧮 Calculated course fee for', student.name, ':', student.finalPayment, '- registration fees:', standardRegistrationFees, '= course fee:', totalCourseFee);
      }
      
      // If still 0, calculate from course/activity
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

      // Debug registration fees structure
      if (student && student.registrationFees) {
        console.log('🔍 Student registration fees for', student.name, ':', JSON.stringify(student.registrationFees, null, 2));
      }
      
  const balancePayment = Math.max(0, totalCourseFee - totalPaidAmount);
      
  console.log(`💵 VERCEL DEBUG: For ${student.name} - Course Fee: ₹${totalCourseFee}, Total Paid: ₹${totalPaidAmount}, Balance: ₹${balancePayment}`);
      
      // Determine status
      let paymentStatus = 'Paid';
      if (balancePayment > 0) {
        // Always show Pending if there's any balance remaining
        paymentStatus = 'Pending';
        console.log(`❌ VERCEL DEBUG: ${student.name} marked as PENDING (balance: ₹${balancePayment})`);
      } else {
        console.log(`✅ VERCEL DEBUG: ${student.name} marked as PAID (fully paid)`);
      }
      
      // Get latest payment date
      const latestPayment = paymentRecords.length > 0 ? 
        paymentRecords.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0] : null;
      
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
  finalPayment: totalCourseFee, // Course fee only (registration fees handled separately)
  totalPaidAmount: totalPaidAmount, // Always dynamic from payments collection
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
        registrationFees: paymentDoc?.registrationFees || {
          studentRegistration: {
            amount: 500,
            paid: false,
            paidDate: null
          },
          courseRegistration: {
            amount: 1000,
            paid: false,
            paidDate: null
          },
          confirmationFee: {
            amount: 250,
            paid: false,
            paidDate: null
          },
          overall: {
            paid: false,
            status: 'Pending'
          }
        },
        paymentDetails: student.paymentDetails || {
          upiId: 'payment@uniqbrio.com',
          paymentLink: 'https://pay.uniqbrio.com',
          qrCode: 'QR_CODE_PLACEHOLDER'
        },
        paymentModes: student.paymentModes || ['UPI', 'Card', 'Bank Transfer'],
        studentType: student.studentType || 'New',
        emiSplit: student.emiSplit || 1,
        // Additional metadata from payment records
        totalTransactions: paymentRecords.length,
        lastPaymentDate: latestPayment ? latestPayment.paymentDate : null,
        lastPaymentAmount: latestPayment ? latestPayment.amount : 0,
        paymentHistory: paymentRecords.slice(0, 1).map((p: any) => ({
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
