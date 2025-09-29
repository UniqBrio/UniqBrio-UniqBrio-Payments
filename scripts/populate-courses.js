const { connectDB } = require("../lib/db.js");
const Course = require("../models/course.js").default;

const sampleCourses = [
  {
    id: "COURSE_001",
    name: "React Development",
    instructor: "John Teacher",
    instructorId: "INST_001",
    description: "Learn modern React development with hooks, context, and best practices",
    level: "Beginner",
    type: "Online",
    duration: "3 months",
    priceINR: 15000,
    currency: "INR",
    schedule: "Mon-Wed-Fri 10:00-12:00",
    maxStudents: 25,
    enrolledStudents: 12,
    location: "Online",
    tags: ["React", "JavaScript", "Frontend", "Web Development"],
    status: "Active",
    courseCategory: "Digital Media",
    rating: 4.5,
    schedulePeriod: {
      startDate: "2025-10-01",
      endDate: "2025-12-31",
      totalWeeks: "12"
    },
    sessionDetails: {
      sessionDuration: "2 hours",
      maxClasses: "36"
    },
    frequencyDetails: {
      selectedDays: ["Monday", "Wednesday", "Friday"],
      dayTimes: {
        Monday: "10:00-12:00",
        Wednesday: "10:00-12:00", 
        Friday: "10:00-12:00"
      }
    },
    chapters: [
      { name: "Introduction to React", description: "Basic concepts and setup" },
      { name: "Components and JSX", description: "Building reusable components" },
      { name: "State and Props", description: "Managing component state" },
      { name: "Hooks and Context", description: "Advanced React patterns" }
    ],
    taxInfo: {
      gstEnabled: true,
      gstRate: 18,
      educationTaxRate: 0,
      autoGeneration: true,
      invoicePrefix: "REACT",
      lastInvoiceNumber: 0
    }
  },
  {
    id: "COURSE_002",
    name: "UI/UX Design Fundamentals",
    instructor: "Jane Designer",
    instructorId: "INST_002",
    description: "Master the principles of user interface and experience design",
    level: "Intermediate", 
    type: "Hybrid",
    duration: "4 months",
    priceINR: 20000,
    currency: "INR",
    schedule: "Tue-Thu 14:00-16:00",
    maxStudents: 20,
    enrolledStudents: 8,
    location: "Mumbai Studio + Online",
    tags: ["UI", "UX", "Design", "Figma", "Prototyping"],
    status: "Active",
    courseCategory: "Art",
    rating: 4.8,
    schedulePeriod: {
      startDate: "2025-10-15",
      endDate: "2026-02-15", 
      totalWeeks: "16"
    },
    sessionDetails: {
      sessionDuration: "2 hours",
      maxClasses: "32"
    },
    frequencyDetails: {
      selectedDays: ["Tuesday", "Thursday"],
      dayTimes: {
        Tuesday: "14:00-16:00",
        Thursday: "14:00-16:00"
      }
    },
    chapters: [
      { name: "Design Principles", description: "Fundamentals of good design" },
      { name: "User Research", description: "Understanding user needs" },
      { name: "Wireframing & Prototyping", description: "Creating design mockups" },
      { name: "Usability Testing", description: "Validating design decisions" }
    ],
    taxInfo: {
      gstEnabled: true,
      gstRate: 18,
      educationTaxRate: 0,
      autoGeneration: true,
      invoicePrefix: "UIUX",
      lastInvoiceNumber: 0
    }
  },
  {
    id: "COURSE_003", 
    name: "Advanced JavaScript & Node.js",
    instructor: "Bob Expert",
    instructorId: "INST_003",
    description: "Deep dive into JavaScript ES6+ features and Node.js backend development",
    level: "Advanced",
    type: "Online",
    duration: "5 months",
    priceINR: 25000,
    currency: "INR", 
    schedule: "Sat-Sun 09:00-12:00",
    maxStudents: 15,
    enrolledStudents: 6,
    location: "Online",
    tags: ["JavaScript", "Node.js", "Backend", "API Development", "Databases"],
    status: "Active",
    courseCategory: "Digital Media",
    rating: 4.7,
    schedulePeriod: {
      startDate: "2025-11-01",
      endDate: "2026-03-31",
      totalWeeks: "20"
    },
    sessionDetails: {
      sessionDuration: "3 hours", 
      maxClasses: "40"
    },
    frequencyDetails: {
      selectedDays: ["Saturday", "Sunday"],
      dayTimes: {
        Saturday: "09:00-12:00",
        Sunday: "09:00-12:00"
      }
    },
    chapters: [
      { name: "ES6+ Features", description: "Modern JavaScript syntax and features" },
      { name: "Asynchronous Programming", description: "Promises, async/await, and event loops" },
      { name: "Node.js Fundamentals", description: "Server-side JavaScript development" },
      { name: "API Development", description: "Building RESTful APIs and GraphQL" },
      { name: "Database Integration", description: "Working with MongoDB and PostgreSQL" }
    ],
    taxInfo: {
      gstEnabled: true,
      gstRate: 18,
      educationTaxRate: 0,
      autoGeneration: true,
      invoicePrefix: "JSNODE",
      lastInvoiceNumber: 0
    }
  },
  {
    id: "COURSE_004",
    name: "Digital Marketing Strategy",
    instructor: "Sarah Marketing",
    instructorId: "INST_004", 
    description: "Learn comprehensive digital marketing strategies and tools",
    level: "Beginner",
    type: "Group",
    duration: "2 months",
    priceINR: 12000,
    currency: "INR",
    schedule: "Mon-Wed-Fri 18:00-20:00",
    maxStudents: 30,
    enrolledStudents: 18,
    location: "Delhi Center",
    tags: ["Digital Marketing", "SEO", "Social Media", "Content Marketing", "Analytics"],
    status: "Active",
    courseCategory: "Other",
    rating: 4.3,
    schedulePeriod: {
      startDate: "2025-10-01", 
      endDate: "2025-11-30",
      totalWeeks: "8"
    },
    sessionDetails: {
      sessionDuration: "2 hours",
      maxClasses: "24"
    },
    frequencyDetails: {
      selectedDays: ["Monday", "Wednesday", "Friday"],
      dayTimes: {
        Monday: "18:00-20:00",
        Wednesday: "18:00-20:00",
        Friday: "18:00-20:00"
      }
    },
    chapters: [
      { name: "Marketing Fundamentals", description: "Core marketing concepts" },
      { name: "SEO & Content Strategy", description: "Search optimization and content planning" },
      { name: "Social Media Marketing", description: "Leveraging social platforms" },
      { name: "Analytics & Measurement", description: "Tracking and optimizing campaigns" }
    ],
    taxInfo: {
      gstEnabled: true,
      gstRate: 18,
      educationTaxRate: 0,
      autoGeneration: true,
      invoicePrefix: "DIGI",
      lastInvoiceNumber: 0
    }
  }
];

async function populateCourses() {
  try {
    console.log("🔄 Connecting to database...");
    await connectDB();
    
    console.log("🗑️ Clearing existing courses...");
    await Course.deleteMany({});
    
    console.log("📚 Inserting sample courses...");
    const insertedCourses = await Course.insertMany(sampleCourses);
    
    console.log(`✅ Successfully inserted ${insertedCourses.length} courses:`);
    insertedCourses.forEach(course => {
      console.log(`  - ${course.name} (${course.id}) - ₹${course.priceINR}`);
    });
    
    console.log("🎉 Database population completed successfully!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error populating database:", error);
    process.exit(1);
  }
}

populateCourses();