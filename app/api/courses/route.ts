import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/course";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find({ status: { $ne: "Archived" } }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Course fetch error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
