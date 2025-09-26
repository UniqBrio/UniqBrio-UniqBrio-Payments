// Temporary test data for Final Payment logic testing
export const mockStudentsData = [
  {
    studentId: "STU001",
    name: "John Doe",
    activity: "COURSE_001", // This should match courses.id
    course: "React Development", // This should match courses.name
    category: "Beginner", // This should match courses.level
    totalPaidAmount: 5000,
    paymentStatus: "Partial"
  },
  {
    studentId: "STU002", 
    name: "Jane Smith",
    activity: "COURSE_002",
    course: "UI/UX Design", 
    category: "Intermediate",
    totalPaidAmount: 8000,
    paymentStatus: "Paid"
  },
  {
    studentId: "STU003",
    name: "Bob Johnson", 
    activity: "COURSE_001",
    course: "React Development",
    category: "Beginner", 
    totalPaidAmount: 2000,
    paymentStatus: "Pending"
  }
];

export const mockCoursesData = [
  {
    id: "COURSE_001",
    name: "React Development",
    level: "Beginner", 
    priceINR: 15000,
    instructor: "John Teacher"
  },
  {
    id: "COURSE_002", 
    name: "UI/UX Design",
    level: "Intermediate",
    priceINR: 20000,
    instructor: "Jane Instructor"  
  },
  {
    id: "COURSE_003",
    name: "Advanced JavaScript",
    level: "Advanced", 
    priceINR: 25000,
    instructor: "Bob Expert"
  }
];