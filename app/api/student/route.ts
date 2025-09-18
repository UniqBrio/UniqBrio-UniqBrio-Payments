import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const students = await Student.find({});
    
    return NextResponse.json({
      success: true,
      data: students,
      count: students.length,
      message: "Students fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error fetching students", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
