import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/course";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find().lean();
    return NextResponse.json({ success: true, data: courses });
  } catch (error: any) {
    console.error("Database connection failed:", error.message);
    
    // Return empty array instead of error when DB is unavailable
    // This allows the UI to load without crashing
    return NextResponse.json({
      success: true,
      data: [], // Empty courses array
      fallback: true,
      message: "Database temporarily unavailable"
    });
  }
}
