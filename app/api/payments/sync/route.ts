import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Disable caching for Vercel
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    let students = await Student.find({}).lean();
    const updatedStudents = await Promise.all(students.map(async (student) => {
      const paymentDoc = await Payment.findOne({ studentId: student.studentId });
      const paymentRecords = paymentDoc?.paymentRecords?.filter((record: any) => record.paymentStatus === 'Completed') || [];
      let totalPaidAmount = 0;
      if (paymentDoc && typeof paymentDoc.totalPaidAmount === 'number') {
        totalPaidAmount = paymentDoc.totalPaidAmount;
      } else {
        totalPaidAmount = paymentRecords.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
      }
      let totalCourseFee = paymentDoc?.totalCourseFee || 0;
      if (totalCourseFee === 0 && student.finalPayment && student.finalPayment > 0) {
        const standardRegistrationFees = 500 + 1000 + 250;
        totalCourseFee = Math.max(0, student.finalPayment - standardRegistrationFees);
      }
      if (totalCourseFee === 0) {
        const courseName = (student.course || student.activity || '').toLowerCase();
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
        totalCourseFee = 10000;
        for (const [course, price] of Object.entries(coursePricing)) {
          if (courseName.includes(course)) {
            totalCourseFee = price;
            break;
          }
        }
      }
      const balancePayment = Math.max(0, totalCourseFee - totalPaidAmount);
      let paymentStatus = 'Paid';
      if (balancePayment > 0) {
        paymentStatus = 'Pending';
      }
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
        finalPayment: totalCourseFee,
        totalPaidAmount: totalPaidAmount,
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
        registrationFees: paymentDoc?.registrationFees
          ? {
              ...paymentDoc.registrationFees,
              advanceFee: paymentDoc.registrationFees.confirmationFee || {
                amount: 250,
                paid: false,
                paidDate: null
              }
            }
          : {
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
              advanceFee: {
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
    console.log('GET /api/payments/sync 200');
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
    const result = await GET(request);
    console.log('POST /api/payments/sync 200');
    return result;
  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to manually sync payment data" },
      { status: 500 }
    );
  }
}
