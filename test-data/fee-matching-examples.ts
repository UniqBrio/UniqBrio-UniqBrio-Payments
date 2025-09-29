/**
 * Test File: Comprehensive Student-Course Matching System
 * 
 * This file demonstrates the expected behavior of the fee matching system
 * using sample data from both Students and Courses collections.
 */

// Sample Students Collection Data
const sampleStudents = [
  {
    studentId: "STU001",
    name: "Alice Johnson", 
    activity: "DANCE001", // courseId reference
    program: "Individual",
    category: "Beginner",
    courseStartDate: "2024-01-15T00:00:00.000Z"
  },
  {
    studentId: "STU002", 
    name: "Bob Smith",
    activity: "Dance", // Course name reference
    program: "Group",
    category: "Intermediate", 
    courseStartDate: "2024-02-01T00:00:00.000Z"
  },
  {
    studentId: "STU003",
    name: "Carol Davis",
    activity: "WEB001", // No matching course
    program: "Individual", 
    category: "Advanced",
    courseStartDate: "2024-03-01T00:00:00.000Z"
  }
];

// Sample Courses Collection Data  
const sampleCourses = [
  {
    courseId: "DANCE001",
    name: "Dance", 
    level: "Beginner",
    type: "Individual",
    priceINR: 30000,
    schedulePeriod: "3 months", 
    sessionDetails: "2 sessions per week, 1 hour each",
    status: "Active"
  },
  {
    courseId: "DANCE002", 
    name: "Dance",
    level: "Intermediate", 
    type: "Group",
    priceINR: 25000,
    schedulePeriod: "3 months",
    sessionDetails: "3 sessions per week, 1.5 hours each", 
    status: "Active"
  },
  {
    courseId: "TENNIS001",
    name: "Tennis",
    level: "Beginner", 
    type: "Individual", 
    priceINR: 40000,
    schedulePeriod: "4 months",
    sessionDetails: "2 sessions per week, 2 hours each",
    status: "Active" 
  }
];

/**
 * Expected Fee Matching Results:
 * 
 * STU001 (Alice Johnson):
 * - Match Type: EXACT_COURSE_ID (activity "DANCE001" matches courseId "DANCE001")
 * - Level Alignment: EXACT_MATCH ("Beginner" = "Beginner") 
 * - Common Factors: Program Type (Individual = Individual), Level alignment
 * - Final Fee: ₹30,000
 * - Log: Step-by-step matching process showing exact courseId match
 * 
 * STU002 (Bob Smith): 
 * - Match Type: EXACT_NAME (activity "Dance" matches course name "Dance")
 * - Level Alignment: EXACT_MATCH ("Intermediate" matches DANCE002 level)
 * - Common Factors: Program Type (Group = Group), Level alignment
 * - Final Fee: ₹25,000 (from DANCE002 since level matches)
 * - Log: Shows name match and level-based course selection
 * 
 * STU003 (Carol Davis):
 * - Match Type: NO_MATCH (activity "WEB001" has no corresponding course)
 * - Level Alignment: UNKNOWN (no course to compare against)
 * - Common Factors: None
 * - Final Fee: ₹0 (shows as "-" in UI)
 * - Log: Shows failed match attempts and available courses list
 */

export { sampleStudents, sampleCourses };