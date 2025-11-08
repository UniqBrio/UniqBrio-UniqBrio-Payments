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
  course: string
  program: string
  amount: number
  students: number
  received: number
  outstanding: number
  cohorts?: CohortPayment[]
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
