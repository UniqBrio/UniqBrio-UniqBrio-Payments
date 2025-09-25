import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

// READ-ONLY: Students collection only supports GET operations
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    
    console.log('Fetching student:', id);
    
    // Try to find by studentId first, then by _id
    let student = await Student.findOne({ studentId: id });
    if (!student) {
      student = await Student.findById(id);
    }
    
    if (!student) {
      console.log('Student not found with id:', id);
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch student" },
      { status: 500 }
    );
  }
}