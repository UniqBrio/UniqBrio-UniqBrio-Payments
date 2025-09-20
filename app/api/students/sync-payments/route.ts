import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

// Course pricing data - should ideally come from a Course model/API
const coursePricing: Record<string, number> = {
  "Advanced React Development": 24999,
  "UI/UX Design Fundamentals": 15999,
  "Digital Marketing Strategy": 12999,
  "Data Science with Python": 29999,
  "Mobile App Development": 22999,
  "Full Stack Web Development": 35999,
  "Machine Learning Basics": 18999,
  "Graphic Design": 14999,
  "Cloud Computing": 27999,
  "Cybersecurity Essentials": 21999
};

export async function POST() {
  try {
    await connectDB();
    const students = await Student.find({});
    
    let updatedCount = 0;
    
    for (const student of students) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Calculate final payment if missing or zero
      if (!student.finalPayment || student.finalPayment === 0) {
        const courseFee = coursePricing[student.activity] || 15000; // Default fee
        const registrationFee = 1750; // 500 + 1000 + 250
        updates.finalPayment = courseFee + registrationFee;
        needsUpdate = true;
      }
      
      // Set default values for missing fields
      if (!student.totalPaidAmount) {
        updates.totalPaidAmount = 0;
        needsUpdate = true;
      }
      
      if (!student.balancePayment && updates.finalPayment) {
        updates.balancePayment = updates.finalPayment - (student.totalPaidAmount || 0);
        needsUpdate = true;
      } else if (!student.balancePayment && student.finalPayment) {
        updates.balancePayment = student.finalPayment - (student.totalPaidAmount || 0);
        needsUpdate = true;
      }
      
      // Set payment status
      if (!student.paymentStatus) {
        const totalPaid = student.totalPaidAmount || 0;
        const balance = updates.balancePayment || student.balancePayment || 0;
        
        if (balance === 0 && totalPaid > 0) {
          updates.paymentStatus = 'Paid';
        } else if (totalPaid > 0) {
          updates.paymentStatus = 'Partial';
        } else {
          updates.paymentStatus = 'Pending';
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await Student.updateOne({ _id: student._id }, { $set: updates });
        updatedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} student payment records`,
      updatedCount
    });
    
  } catch (error) {
    console.error('Payment sync error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to sync payment data" },
      { status: 500 }
    );
  }
}