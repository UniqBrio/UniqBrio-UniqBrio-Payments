import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Console message removed
    
    await connectDB();
    
    // Count total students
    const totalStudents = await db.collection('students').countDocuments();
    // Console message removed    // Get first few students for debugging
    const students = await Student.find({}).limit(3).lean();
    // Console message removed
    
    // Check collections in database
    const collections = await Student.db.listCollections().toArray();
    // Console message removed
    
    return NextResponse.json({
      success: true,
      debug: {
        totalStudents,
        sampleStudents: students.slice(0, 3),
        availableCollections: collections.map(c => c.name),
        databaseName: Student.db.databaseName,
        connectionState: Student.db.readyState
      }
    });
  } catch (error) {
    // Console message removed
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// POST endpoint to create sample students if none exist
export async function POST() {
  try {
    await connectDB();
    
    const existingCount = await Student.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        message: `Database already has ${existingCount} students. No sample data created.`
      });
    }
    
    // Console message removed
    
    const sampleStudents = [
      {
        studentId: "STU001",
        name: "John Doe",
        course: "Photography",
        activity: "Photography Course",
        finalPayment: 12000,
        balancePayment: 12000,
        paymentStatus: "Pending"
      },
      {
        studentId: "STU002", 
        name: "Jane Smith",
        course: "Art",
        activity: "Digital Art Course",
        finalPayment: 15000,
        balancePayment: 15000,
        paymentStatus: "Pending"
      },
      {
        studentId: "STU003",
        name: "Mike Johnson", 
        course: "Music",
        activity: "Guitar Lessons",
        finalPayment: 10000,
        balancePayment: 10000,
        paymentStatus: "Pending"
      }
    ];
    
    const createdStudents = await Student.insertMany(sampleStudents);
    // Console message removed
    
    return NextResponse.json({
      success: true,
      message: `Created ${createdStudents.length} sample students`,
      students: createdStudents
    });
    
  } catch (error) {
    // Console message removed
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}