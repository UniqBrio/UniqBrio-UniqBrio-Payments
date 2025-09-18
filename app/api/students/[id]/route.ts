import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    
    console.log('Updating student:', id, 'with data:', body);
    
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
    
    // Update the student
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update student" },
      { status: 500 }
    );
  }
}