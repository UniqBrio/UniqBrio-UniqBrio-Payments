import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Console message removed
    
    await connectDB();
    
    // Count total students (use Mongoose model, not an undefined `db` variable)
    const totalStudents = await Student.countDocuments();
    // Console message removed    // Get first few students for debugging
    const students = await Student.find({}).limit(3).lean();
    // Console message removed
    
    // Check collections in database
    // In newer mongodb drivers (used by mongoose@^8), listCollections returns a Promise of collection info array
    // so we should not call .toArray() on it. Also, Model.db is a Mongoose Connection; the native Db is at `.db`.
    const collections = (await (Student.db as any).db.listCollections({}, { nameOnly: true })) as Array<{ name: string }>;
    // Console message removed
    
    return NextResponse.json({
      success: true,
      debug: {
        totalStudents,
        sampleStudents: students.slice(0, 3),
        availableCollections: collections.map((c: { name: string }) => c.name),
        // Connection is a Mongoose Connection; database name is available via `.name`
        databaseName: Student.db.name,
        connectionState: Student.db.readyState
      }
    });
  } catch (error: unknown) {
    // Console message removed
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
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
    
  } catch (error: unknown) {
    // Console message removed
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}