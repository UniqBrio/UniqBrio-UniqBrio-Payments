import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const students = await Student.find({});
    
    return NextResponse.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    
    // Return empty array instead of error when DB is unavailable
    // This allows the UI to load without crashing
    return NextResponse.json({
      success: true,
      data: [], // Empty students array
      fallback: true,
      message: "Database temporarily unavailable"
    });
  }
}
