import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// Define Course schema for the courses collection
const CourseSchema = new mongoose.Schema({}, { strict: false });
const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema, "courses");

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find({});
    
    return NextResponse.json({
      success: true,
      data: courses
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}