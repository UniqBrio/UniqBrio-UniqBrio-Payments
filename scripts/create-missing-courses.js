// Script to create missing course documents based on student activity codes
// Run this in MongoDB shell or adapt for your environment

const missingCourses = [
  {
    courseId: "WEB001",
    name: "Web Development", 
    level: "Beginner",
    priceINR: 25000,
    instructor: "Web Instructor",
    status: "Active",
    description: "Web Development Course",
    location: "Online",
    maxStudents: 50,
    courseCategory: "Programming",
    type: "Online"
  },
  {
    courseId: "MOB001", 
    name: "Mobile Development",
    level: "Beginner", 
    priceINR: 30000,
    instructor: "Mobile Instructor",
    status: "Active",
    description: "Mobile Development Course",
    location: "Online",
    maxStudents: 50,
    courseCategory: "Programming", 
    type: "Online"
  },
  {
    courseId: "DATA001",
    name: "Data Science",
    level: "Beginner",
    priceINR: 35000,
    instructor: "Data Science Instructor", 
    status: "Active",
    description: "Data Science Course",
    location: "Online",
    maxStudents: 50,
    courseCategory: "Analytics",
    type: "Online"
  },
  {
    courseId: "AI001",
    name: "Artificial Intelligence", 
    level: "Beginner",
    priceINR: 40000,
    instructor: "AI Instructor",
    status: "Active", 
    description: "AI Course",
    location: "Online",
    maxStudents: 50,
    courseCategory: "AI",
    type: "Online"
  },
  {
    courseId: "UX001",
    name: "UX/UI Design",
    level: "Beginner", 
    priceINR: 28000,
    instructor: "UX Instructor",
    status: "Active",
    description: "UX/UI Design Course", 
    location: "Online",
    maxStudents: 50,
    courseCategory: "Design",
    type: "Online"
  }
];

// MongoDB insert command:
// db.courses.insertMany(missingCourses);

console.log("Copy the missingCourses array above and run:");
console.log("db.courses.insertMany(missingCourses);");