import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

// Ensure no caching on Vercel/Edge and always execute dynamically
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const students = await Student.find({});
    
    return NextResponse.json({
      success: true,
      data: students
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    console.error("Database connection failed:", (error as any)?.message || error);
    
    // Return empty array instead of error when DB is unavailable
    // This allows the UI to load without crashing
    return NextResponse.json(
      {
        success: true,
        data: [], // Empty students array (client should ignore if fallback=true)
        fallback: true,
        message: "Database temporarily unavailable"
      },
      { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
