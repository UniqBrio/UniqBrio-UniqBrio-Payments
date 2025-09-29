// Helper function to fetch course pricing based on student's course details
export interface CoursePrice {
  priceINR: number;
  courseName: string;
  level?: string;
  type?: string;
}

export async function getCoursePricing(studentActivity: string, studentLevel?: string, studentType?: string): Promise<CoursePrice | null> {
  try {
    const response = await fetch('/api/courses');
    const result = await response.json();
    if (result.success && result.data) {
      const norm = (str: string) => (str || '').toLowerCase().trim();
      // Try to match by name (case-insensitive, trimmed, partial)
      let matchedCourse = result.data.find((course: any) =>
        norm(course.name) === norm(studentActivity)
      );
      if (!matchedCourse) {
        matchedCourse = result.data.find((course: any) =>
          norm(course.name).includes(norm(studentActivity)) ||
          norm(studentActivity).includes(norm(course.name))
        );
      }
      // If still no match, try matching by name+level+type
      if (!matchedCourse && (studentLevel || studentType)) {
        matchedCourse = result.data.find((course: any) =>
          norm(course.name) === norm(studentActivity) &&
          (!studentLevel || norm(course.level) === norm(studentLevel)) &&
          (!studentType || norm(course.type) === norm(studentType))
        );
      }
      if (matchedCourse) {
        return {
          priceINR: matchedCourse.priceINR,
          courseName: matchedCourse.name,
          level: matchedCourse.level,
          type: matchedCourse.type
        };
      }
    }
  } catch (error) {
    console.error('Error fetching course pricing:', error);
  }
  return null;
}