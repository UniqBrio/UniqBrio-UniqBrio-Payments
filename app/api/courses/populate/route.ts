import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/course";

const sampleCourses = [
  {
    id: "WEB001",
    name: "Web Development",
    instructor: "John Teacher",
    instructorId: "INST_001",
    description: "Learn modern web development with HTML, CSS, JavaScript, and React",
    level: "Beginner",
    type: "Online",
    duration: "3 months",
    priceINR: 15000,
    currency: "INR",
    schedule: "Mon-Wed-Fri 10:00-12:00",
    maxStudents: 25,
    enrolledStudents: 0,
    location: "Online",
    tags: ["HTML", "CSS", "JavaScript", "React", "Frontend"],
    status: "Active",
    courseCategory: "Digital Media",
    rating: 4.5
  },
  {
    id: "MOB001",
    name: "Mobile Development",
    instructor: "Sarah Developer",
    instructorId: "INST_002", 
    description: "Learn mobile app development with React Native and Flutter",
    level: "Intermediate",
    type: "Hybrid",
    duration: "4 months",
    priceINR: 20000,
    currency: "INR",
    schedule: "Tue-Thu 14:00-16:00",
    maxStudents: 20,
    enrolledStudents: 0,
    location: "Online + Lab Sessions",
    tags: ["React Native", "Flutter", "Mobile", "iOS", "Android"],
    status: "Active",
    courseCategory: "Digital Media",
    rating: 4.7
  },
  {
    id: "DATA001",
    name: "Data Science",
    instructor: "Dr. Data Expert",
    instructorId: "INST_003",
    description: "Master data science with Python, machine learning, and analytics",
    level: "Advanced",
    type: "Online",
    duration: "6 months",
    priceINR: 30000,
    currency: "INR",
    schedule: "Sat-Sun 09:00-12:00",
    maxStudents: 15,
    enrolledStudents: 0,
    location: "Online",
    tags: ["Python", "Machine Learning", "Data Analytics", "Statistics", "AI"],
    status: "Active",
    courseCategory: "Digital Media",
    rating: 4.8
  },
  {
    id: "UX001",
    name: "UX/UI Design",
    instructor: "Jane Designer",
    instructorId: "INST_004",
    description: "Learn user experience and interface design principles",
    level: "Intermediate",
    type: "Hybrid",
    duration: "3 months",
    priceINR: 18000,
    currency: "INR",
    schedule: "Mon-Wed-Fri 16:00-18:00",
    maxStudents: 20,
    enrolledStudents: 0,
    location: "Design Studio + Online",
    tags: ["UX", "UI", "Design", "Figma", "Prototyping", "User Research"],
    status: "Active",
    courseCategory: "Art",
    rating: 4.6
  },
  {
    id: "COURSE0001",
    name: "Dance",
    instructor: "Dance Master",
    instructorId: "INST_005",
    description: "Learn various dance forms and techniques",
    level: "Expert",
    type: "Group",
    duration: "2 months",
    priceINR: 8000,
    currency: "INR",
    schedule: "Daily 18:00-20:00",
    maxStudents: 30,
    enrolledStudents: 0,
    location: "Dance Studio",
    tags: ["Dance", "Performance", "Choreography", "Fitness"],
    status: "Active",
    courseCategory: "Dance",
    rating: 4.4
  },
  {
    id: "COURSE0002",
    name: "Music",
    instructor: "Music Maestro",
    instructorId: "INST_006",
    description: "Learn music theory, instruments, and composition",
    level: "Beginner",
    type: "Individual",
    duration: "4 months",
    priceINR: 12000,
    currency: "INR",
    schedule: "Tue-Thu-Sat 10:00-12:00",
    maxStudents: 10,
    enrolledStudents: 0,
    location: "Music Room",
    tags: ["Music", "Instruments", "Theory", "Composition"],
    status: "Active",
    courseCategory: "Music",
    rating: 4.7
  },
  {
    id: "COURSE0005",
    name: "Cricket",
    instructor: "Cricket Coach",
    instructorId: "INST_007",
    description: "Master cricket techniques and strategies",
    level: "Expert",
    type: "Group",
    duration: "3 months",
    priceINR: 10000,
    currency: "INR",
    schedule: "Daily 06:00-08:00",
    maxStudents: 25,
    enrolledStudents: 0,
    location: "Cricket Ground",
    tags: ["Cricket", "Sports", "Fitness", "Team Play"],
    status: "Active",
    courseCategory: "Other",
    rating: 4.5
  },
  {
    id: "COURSE0007",
    name: "Volley ball",
    instructor: "Volleyball Coach",
    instructorId: "INST_008",
    description: "Learn volleyball skills and team strategies",
    level: "Intermediate",
    type: "Group",
    duration: "2 months",
    priceINR: 7000,
    currency: "INR",
    schedule: "Mon-Wed-Fri 17:00-19:00",
    maxStudents: 20,
    enrolledStudents: 0,
    location: "Sports Complex",
    tags: ["Volleyball", "Team Sports", "Fitness", "Coordination"],
    status: "Active",
    courseCategory: "Other",
    rating: 4.3
  }
];

export async function POST() {
  try {
    await connectDB();
    
    // Clear existing courses
    await Course.deleteMany({});
    
    // Insert new courses
    const insertedCourses = await Course.insertMany(sampleCourses);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully added ${insertedCourses.length} courses`,
      data: insertedCourses.map(course => ({
        id: course.id,
        name: course.name,
        level: course.level,
        priceINR: course.priceINR
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: "Failed to populate courses", 
      details: error.message 
    }, { status: 500 });
  }
}