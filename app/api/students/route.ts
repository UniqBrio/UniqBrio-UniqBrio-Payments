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
    return NextResponse.json(
      { success: false, error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
