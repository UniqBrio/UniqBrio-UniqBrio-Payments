import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/course";

export async function POST() {
  try {
    await connectDB();
    
    // Sample courses that match the student data patterns
    const testCourses = [
      {
        id: "COURSE0001",
        name: "Badminton",
        instructor: "Sports Coach",
        description: "Basic to intermediate badminton training",
        level: "Regular",
        type: "Group",
        priceINR: 15000,
        currency: "INR",
        status: "Active"
      },
      {
        id: "COURSE0002", 
        name: "Music",
        instructor: "Music Teacher",
        description: "Music theory and practical training",
        level: "Regular",
        type: "Individual", 
        priceINR: 12000,
        currency: "INR",
        status: "Active"
      },
      {
        id: "COURSE0005",
        name: "Badminton",
        instructor: "Advanced Sports Coach", 
        description: "Advanced badminton coaching",
        level: "Regular",
        type: "Group",
        priceINR: 20000,
        currency: "INR", 
        status: "Active"
      },
      {
        id: "COURSE0007",
        name: "Badminton",
        instructor: "Expert Coach",
        description: "Expert level badminton training", 
        level: "Regular",
        type: "Individual",
        priceINR: 25000,
        currency: "INR",
        status: "Active"
      }
    ];
    
    // Clear existing courses and insert test data
    await Course.deleteMany({});
    const result = await Course.insertMany(testCourses);
    
    return NextResponse.json({ 
      success: true, 
      message: `Added ${result.length} test courses`,
      courses: result 
    });
  } catch (error: any) {
    console.error("Error adding test courses:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}