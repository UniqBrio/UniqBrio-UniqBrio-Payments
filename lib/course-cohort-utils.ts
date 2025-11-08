/**
 * Utility functions for generating course-wise and cohort-wise payment summaries
 */

import { PaymentRecord } from '@/components/payments/components/payment-types'

export interface CohortPayment {
  cohort: string
  students: number
  amount: number
  received: number
  outstanding: number
}

export interface CoursePaymentWithCohorts {
  courseId: string
  course: string
  program: string
  amount: number
  students: number
  received: number
  outstanding: number
  cohorts?: CohortPayment[]
}

export interface CohortFromDB {
  cohortId: string
  name: string
  courseId: string
  courseName: string
  startDate?: Date
  endDate?: Date
  status: 'Active' | 'Completed' | 'Upcoming' | 'Cancelled'
  instructor?: string
  enrolledStudents: number
  students?: Array<{
    studentId: string
    studentName: string
    enrollmentDate?: Date
  }>
}

export interface CourseFromDB {
  id: string
  name: string
  instructor: string
  level: string
  type: string
  priceINR: number
  status: string
}

/**
 * Fetch cohorts from database
 * @param courseId - Optional courseId to filter cohorts
 * @returns Array of cohorts from database
 */
export async function fetchCohortsFromDB(courseId?: string): Promise<CohortFromDB[]> {
  try {
    const url = new URL('/api/cohorts', window.location.origin)
    if (courseId) {
      url.searchParams.append('courseId', courseId)
    }
    
    const response = await fetch(url.toString())
    if (!response.ok) {
      console.error('Failed to fetch cohorts:', response.statusText)
      return []
    }
    
    const result = await response.json()
    return result.success ? result.data : []
  } catch (error) {
    console.error('Error fetching cohorts from database:', error)
    return []
  }
}

/**
 * Fetch courses from database
 * @returns Array of courses from database
 */
export async function fetchCoursesFromDB(): Promise<CourseFromDB[]> {
  try {
    const response = await fetch('/api/courses')
    if (!response.ok) {
      console.error('Failed to fetch courses:', response.statusText)
      return []
    }
    
    const result = await response.json()
    return result.success ? result.data : []
  } catch (error) {
    console.error('Error fetching courses from database:', error)
    return []
  }
}

/**
 * Generate course-wise summary with cohort breakdown from payment records
 * @param records - Array of payment records
 * @returns Array of courses with their cohort breakdowns
 */
export function generateCourseWiseSummaryWithCohorts(
  records: PaymentRecord[]
): CoursePaymentWithCohorts[] {
  // Group records by course
  const courseMap = new Map<string, {
    program: string
    records: PaymentRecord[]
  }>()

  records.forEach(record => {
    const courseKey = record.activity || record.enrolledCourse || 'Unknown Course'
    
    if (!courseMap.has(courseKey)) {
      courseMap.set(courseKey, {
        program: record.program || courseKey,
        records: []
      })
    }
    
    courseMap.get(courseKey)!.records.push(record)
  })

  // Process each course and generate cohort breakdown
  const courseSummaries: CoursePaymentWithCohorts[] = []

  courseMap.forEach((courseData, courseName) => {
    const { program, records: courseRecords } = courseData

    // Calculate course totals
    let courseTotalAmount = 0
    let courseTotalReceived = 0
    let courseTotalStudents = courseRecords.length

    // Group by cohort within this course
    const cohortMap = new Map<string, {
      students: number
      amount: number
      received: number
      outstanding: number
    }>()

    courseRecords.forEach(record => {
      const cohortName = record.cohort || 'Unassigned'
      
      // Calculate registration fees
      const registrationTotal = 
        (record.registrationFees?.studentRegistration?.amount || 0) + 
        (record.registrationFees?.courseRegistration?.amount || 0) + 
        (record.registrationFees?.confirmationFee?.amount || 0)
      
      const totalAmount = (Number(record.finalPayment) || 0) + registrationTotal
      const receivedAmount = Number(record.totalPaidAmount) || 0
      const outstandingAmount = totalAmount - receivedAmount

      // Update course totals
      courseTotalAmount += totalAmount
      courseTotalReceived += receivedAmount

      // Update cohort data
      if (!cohortMap.has(cohortName)) {
        cohortMap.set(cohortName, {
          students: 0,
          amount: 0,
          received: 0,
          outstanding: 0
        })
      }

      const cohortData = cohortMap.get(cohortName)!
      cohortData.students += 1
      cohortData.amount += totalAmount
      cohortData.received += receivedAmount
      cohortData.outstanding += outstandingAmount
    })

    // Convert cohort map to array
    const cohorts: CohortPayment[] = Array.from(cohortMap.entries())
      .map(([cohortName, data]) => ({
        cohort: cohortName,
        students: data.students,
        amount: data.amount,
        received: data.received,
        outstanding: data.outstanding
      }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort))

    courseSummaries.push({
      courseId: 'COURSE00', // Legacy function - no proper ID lookup
      course: courseName,
      program: program,
      amount: courseTotalAmount,
      students: courseTotalStudents,
      received: courseTotalReceived,
      outstanding: courseTotalAmount - courseTotalReceived,
      cohorts: cohorts.length > 0 ? cohorts : undefined
    })
  })

  // Sort courses by name
  return courseSummaries.sort((a, b) => a.course.localeCompare(b.course))
}

/**
 * Generate course-wise summary with cohort breakdown, enriched with cohort data from database
 * @param records - Array of payment records
 * @param cohortsFromDB - Optional array of cohorts from database
 * @returns Array of courses with their cohort breakdowns
 */
export function generateCourseWiseSummaryWithCohortsEnhanced(
  records: PaymentRecord[],
  cohortsFromDB: CohortFromDB[] = []
): CoursePaymentWithCohorts[] {
  // Group records by course
  const courseMap = new Map<string, {
    program: string
    records: PaymentRecord[]
  }>()

  records.forEach(record => {
    const courseKey = record.activity || record.enrolledCourse || 'Unknown Course'
    
    if (!courseMap.has(courseKey)) {
      courseMap.set(courseKey, {
        program: record.program || courseKey,
        records: []
      })
    }
    
    courseMap.get(courseKey)!.records.push(record)
  })

  // Create a map of cohorts from database for quick lookup
  const cohortDBMap = new Map<string, CohortFromDB>()
  cohortsFromDB.forEach(cohort => {
    cohortDBMap.set(cohort.name.toLowerCase(), cohort)
  })

  // Process each course and generate cohort breakdown
  const courseSummaries: CoursePaymentWithCohorts[] = []

  courseMap.forEach((courseData, courseName) => {
    const { program, records: courseRecords } = courseData

    // Calculate course totals
    let courseTotalAmount = 0
    let courseTotalReceived = 0
    let courseTotalStudents = courseRecords.length

    // Group by cohort within this course
    const cohortMap = new Map<string, {
      students: number
      amount: number
      received: number
      outstanding: number
    }>()

    courseRecords.forEach(record => {
      const cohortName = record.cohort || 'Unassigned'
      
      // Calculate registration fees
      const registrationTotal = 
        (record.registrationFees?.studentRegistration?.amount || 0) + 
        (record.registrationFees?.courseRegistration?.amount || 0) + 
        (record.registrationFees?.confirmationFee?.amount || 0)
      
      const totalAmount = (Number(record.finalPayment) || 0) + registrationTotal
      const receivedAmount = Number(record.totalPaidAmount) || 0
      const outstandingAmount = totalAmount - receivedAmount

      // Update course totals
      courseTotalAmount += totalAmount
      courseTotalReceived += receivedAmount

      // Update cohort data
      if (!cohortMap.has(cohortName)) {
        cohortMap.set(cohortName, {
          students: 0,
          amount: 0,
          received: 0,
          outstanding: 0
        })
      }

      const cohortData = cohortMap.get(cohortName)!
      cohortData.students += 1
      cohortData.amount += totalAmount
      cohortData.received += receivedAmount
      cohortData.outstanding += outstandingAmount
    })

    // Add cohorts from DB that exist for this course but may not have payment records yet
    cohortsFromDB
      .filter(cohort => 
        cohort.courseName && (
          cohort.courseName === courseName || 
          cohort.courseName.toLowerCase().includes(courseName.toLowerCase())
        )
      )
      .forEach(cohort => {
        if (!cohortMap.has(cohort.name)) {
          cohortMap.set(cohort.name, {
            students: 0,
            amount: 0,
            received: 0,
            outstanding: 0
          })
        }
      })

    // Convert cohort map to array
    const cohorts: CohortPayment[] = Array.from(cohortMap.entries())
      .map(([cohortName, data]) => ({
        cohort: cohortName,
        students: data.students,
        amount: data.amount,
        received: data.received,
        outstanding: data.outstanding
      }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort))

    courseSummaries.push({
      courseId: 'COURSE00', // Temporary - will be replaced with proper ID
      course: courseName,
      program: program,
      amount: courseTotalAmount,
      students: courseTotalStudents,
      received: courseTotalReceived,
      outstanding: courseTotalAmount - courseTotalReceived,
      cohorts: cohorts.length > 0 ? cohorts : undefined
    })
  })

  // Sort courses by name
  return courseSummaries.sort((a, b) => a.course.localeCompare(b.course))
}

/**
 * Generate course-wise summary with proper course IDs and cohort IDs from database
 * @param records - Array of payment records
 * @param coursesFromDB - Array of courses from database
 * @param cohortsFromDB - Array of cohorts from database
 * @returns Array of courses with their cohort breakdowns with proper IDs
 */
export function generateCourseWiseSummaryWithProperIDs(
  records: PaymentRecord[],
  coursesFromDB: CourseFromDB[] = [],
  cohortsFromDB: CohortFromDB[] = []
): CoursePaymentWithCohorts[] {
  // Create lookup maps
  const courseNameToIdMap = new Map<string, CourseFromDB>()
  const courseIdToObjMap = new Map<string, CourseFromDB>()
  coursesFromDB.forEach(course => {
    courseNameToIdMap.set(course.name.toLowerCase(), course)
    courseIdToObjMap.set(course.id, course)
  })

  const cohortNameToCohortMap = new Map<string, CohortFromDB>()
  cohortsFromDB.forEach(cohort => {
    cohortNameToCohortMap.set(cohort.name.toLowerCase(), cohort)
  })

  // Group records by courseId (proper ID from database)
  const courseMap = new Map<string, {
    courseId: string
    courseName: string
    program: string
    records: PaymentRecord[]
  }>()

  records.forEach(record => {
    // First try to use matchedCourseId if available (authoritative course ID from sync)
    let courseId: string
    let courseName: string
    
    if ((record as any).matchedCourseId) {
      // Use the matched course ID from the record
      courseId = (record as any).matchedCourseId
      // Find the course in database by ID
      const courseFromDB = courseIdToObjMap.get(courseId)
      courseName = courseFromDB?.name || record.activity || record.enrolledCourse || 'Unknown Course'
    } else {
      // Fallback: Try to match by course name
      const courseNameFromRecord = record.activity || record.enrolledCourse || 'Unknown Course'
      const courseFromDB = courseNameToIdMap.get(courseNameFromRecord.toLowerCase())
      courseId = courseFromDB?.id || `COURSE00-${courseNameFromRecord.replace(/\s+/g, '')}`
      courseName = courseFromDB?.name || courseNameFromRecord
    }
    
    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        courseId: courseId,
        courseName: courseName,
        program: record.program || courseName,
        records: []
      })
    }
    
    courseMap.get(courseId)!.records.push(record)
  })

  // Process each course and generate cohort breakdown
  const courseSummaries: CoursePaymentWithCohorts[] = []

  courseMap.forEach((courseData, courseId) => {
    const { courseName, program, records: courseRecords } = courseData

    // Calculate course totals
    let courseTotalAmount = 0
    let courseTotalReceived = 0
    let courseTotalStudents = courseRecords.length

    // Group by cohort within this course
    const cohortMap = new Map<string, {
      students: number
      amount: number
      received: number
      outstanding: number
    }>()

    courseRecords.forEach(record => {
      const cohortNameFromRecord = record.cohort || 'Unassigned'
      
      // Try to find proper cohort name from database
      const cohortFromDB = cohortNameToCohortMap.get(cohortNameFromRecord.toLowerCase())
      const cohortName = cohortFromDB?.name || cohortNameFromRecord
      
      // Calculate registration fees
      const registrationTotal = 
        (record.registrationFees?.studentRegistration?.amount || 0) + 
        (record.registrationFees?.courseRegistration?.amount || 0) + 
        (record.registrationFees?.confirmationFee?.amount || 0)
      
      const totalAmount = (Number(record.finalPayment) || 0) + registrationTotal
      const receivedAmount = Number(record.totalPaidAmount) || 0
      const outstandingAmount = totalAmount - receivedAmount

      // Update course totals
      courseTotalAmount += totalAmount
      courseTotalReceived += receivedAmount

      // Update cohort data
      if (!cohortMap.has(cohortName)) {
        cohortMap.set(cohortName, {
          students: 0,
          amount: 0,
          received: 0,
          outstanding: 0
        })
      }

      const cohortData = cohortMap.get(cohortName)!
      cohortData.students += 1
      cohortData.amount += totalAmount
      cohortData.received += receivedAmount
      cohortData.outstanding += outstandingAmount
    })

    // Add cohorts from DB that exist for this course but may not have payment records yet
    cohortsFromDB
      .filter(cohort => cohort.courseId === courseId)
      .forEach(cohort => {
        if (!cohortMap.has(cohort.name)) {
          cohortMap.set(cohort.name, {
            students: 0,
            amount: 0,
            received: 0,
            outstanding: 0
          })
        }
      })

    // Convert cohort map to array
    const cohorts: CohortPayment[] = Array.from(cohortMap.entries())
      .map(([cohortName, data]) => ({
        cohort: cohortName,
        students: data.students,
        amount: data.amount,
        received: data.received,
        outstanding: data.outstanding
      }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort))

    courseSummaries.push({
      courseId: courseId,
      course: courseName,
      program: program,
      amount: courseTotalAmount,
      students: courseTotalStudents,
      received: courseTotalReceived,
      outstanding: courseTotalAmount - courseTotalReceived,
      cohorts: cohorts.length > 0 ? cohorts : undefined
    })
  })

  // Sort courses by name
  return courseSummaries.sort((a, b) => a.course.localeCompare(b.course))
}

/**
 * Generate course-wise summary without cohort breakdown (legacy format)
 * @param records - Array of payment records
 * @returns Array of courses without cohort details
 */
export function generateCourseWiseSummary(
  records: PaymentRecord[]
): Omit<CoursePaymentWithCohorts, 'cohorts'>[] {
  const summariesWithCohorts = generateCourseWiseSummaryWithCohorts(records)
  
  // Remove cohorts from the response
  return summariesWithCohorts.map(({ cohorts, ...rest }) => rest)
}
