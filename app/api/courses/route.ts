import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/course";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find();
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
