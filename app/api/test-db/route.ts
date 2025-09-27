import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Course from "@/models/course";
import Payment from "@/models/payment";

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Test each collection
    const studentCount = await Student.countDocuments();
    console.log(`✅ Students collection: ${studentCount} documents`);

    const courseCount = await Course.countDocuments();
    console.log(`✅ Courses collection: ${courseCount} documents`);

    const paymentCount = await Payment.countDocuments();
    console.log(`✅ Payments collection: ${paymentCount} documents`);

    return NextResponse.json({
      success: true,
      message: "Database connection test successful",
      data: {
        students: studentCount,
        courses: courseCount,
        payments: paymentCount
      }
    });
  } catch (error: any) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: "Database connection test failed",
      details: error.message
    }, { status: 500 });
  }
}