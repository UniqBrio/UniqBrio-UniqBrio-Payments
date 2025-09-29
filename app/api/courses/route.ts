import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/course";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find().lean();
    return NextResponse.json({ success: true, data: courses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch courses", details: error.message }, { status: 500 });
  }
}
