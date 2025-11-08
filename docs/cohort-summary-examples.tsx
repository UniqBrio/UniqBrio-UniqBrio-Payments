/**
 * Example: Integrating Cohort-wise Summary in Course-wise Payment Popup
 * 
 * This example shows how to enhance the existing CourseWisePaymentPopup
 * to include cohort breakdowns using the new utility functions.
 */

import { useMemo, useState } from 'react'
import { CourseWisePaymentPopup } from '@/components/payments/components/course-wise-payment-popup'
import { CourseWiseSummary } from '@/components/course-wise-summary'
import { generateCourseWiseSummaryWithCohorts } from '@/lib/course-cohort-utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PaymentRecord } from '@/components/payments/components/payment-types'

/**
 * Example 1: Using in Payment Dashboard
 */
export function PaymentDashboardExample({ records }: { records: PaymentRecord[] }) {
  const [showSummary, setShowSummary] = useState(false)
  
  // Generate course summary with cohort breakdown
  const courseSummaryWithCohorts = useMemo(
    () => generateCourseWiseSummaryWithCohorts(records),
    [records]
  )
  
  return (
    <>
      <button onClick={() => setShowSummary(true)}>
        View Course-wise Summary with Cohorts
      </button>
      
      {showSummary && (
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-7xl max-h-[90vh]">
            <CourseWiseSummary coursePayments={courseSummaryWithCohorts} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

/**
 * Example 2: Using the existing CourseWisePaymentPopup
 * (This component doesn't have cohort breakdown yet, but you can enhance it)
 */
export function ExistingPopupExample({ 
  records, 
  showPopup, 
  setShowPopup 
}: { 
  records: PaymentRecord[]
  showPopup: boolean
  setShowPopup: (show: boolean) => void
}) {
  return (
    <CourseWisePaymentPopup
      open={showPopup}
      onClose={() => setShowPopup(false)}
      courseData={records}
    />
  )
}

/**
 * Example 3: Filtering by specific cohorts
 */
export function FilteredCohortSummary({ 
  records,
  selectedYear = '2024'
}: { 
  records: PaymentRecord[]
  selectedYear?: string
}) {
  const courseSummary = useMemo(() => {
    const summary = generateCourseWiseSummaryWithCohorts(records)
    
    // Filter to only show cohorts from selected year
    return summary.map(course => ({
      ...course,
      cohorts: course.cohorts?.filter(cohort =>
        cohort.cohort.includes(selectedYear)
      )
    }))
  }, [records, selectedYear])
  
  return <CourseWiseSummary coursePayments={courseSummary} />
}

/**
 * Example 4: Showing summary cards with cohort stats
 */
export function CohortStatsSummary({ records }: { records: PaymentRecord[] }) {
  const courseSummary = useMemo(
    () => generateCourseWiseSummaryWithCohorts(records),
    [records]
  )
  
  // Calculate total cohorts across all courses
  const totalCohorts = courseSummary.reduce(
    (sum, course) => sum + (course.cohorts?.length || 0),
    0
  )
  
  // Find the course with most cohorts
  const courseWithMostCohorts = courseSummary.reduce((max, course) => {
    const cohortCount = course.cohorts?.length || 0
    return cohortCount > (max.cohorts?.length || 0) ? course : max
  }, courseSummary[0])
  
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p>{courseSummary.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Cohorts</h3>
          <p>{totalCohorts}</p>
        </div>
        <div className="stat-card">
          <h3>Most Cohorts in Course</h3>
          <p>{courseWithMostCohorts?.course}</p>
          <small>{courseWithMostCohorts?.cohorts?.length || 0} cohorts</small>
        </div>
      </div>
      
      <CourseWiseSummary coursePayments={courseSummary} />
    </div>
  )
}

/**
 * Example 5: Exporting cohort data
 */
export function exportCohortData(records: PaymentRecord[]) {
  const courseSummary = generateCourseWiseSummaryWithCohorts(records)
  
  // Flatten to CSV format
  const csvData: any[] = []
  
  courseSummary.forEach(course => {
    if (course.cohorts) {
      course.cohorts.forEach(cohort => {
        csvData.push({
          Course: course.course,
          Program: course.program,
          Cohort: cohort.cohort,
          Students: cohort.students,
          TotalAmount: cohort.amount,
          Received: cohort.received,
          Outstanding: cohort.outstanding,
          CollectionRate: ((cohort.received / cohort.amount) * 100).toFixed(2) + '%'
        })
      })
    } else {
      // Course without cohort breakdown
      csvData.push({
        Course: course.course,
        Program: course.program,
        Cohort: 'All',
        Students: course.students,
        TotalAmount: course.amount,
        Received: course.received,
        Outstanding: course.outstanding,
        CollectionRate: ((course.received / course.amount) * 100).toFixed(2) + '%'
      })
    }
  })
  
  return csvData
}

/**
 * Example 6: Real-time updates with cohort tracking
 */
export function RealtimeCohortSummary({ records }: { records: PaymentRecord[] }) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const courseSummary = useMemo(
    () => generateCourseWiseSummaryWithCohorts(records),
    [records]
  )
  
  // Highlight cohorts with recent payments (last 24 hours)
  const cohortsWithRecentPayments = useMemo(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentCohorts = new Set<string>()
    
    records.forEach(record => {
      if (record.paidDate && new Date(record.paidDate) > yesterday) {
        recentCohorts.add(record.cohort || 'Unassigned')
      }
    })
    
    return recentCohorts
  }, [records])
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Course & Cohort Summary</h2>
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      </div>
      
      {cohortsWithRecentPayments.size > 0 && (
        <div className="alert alert-info mb-4">
          Recent payments in cohorts: {Array.from(cohortsWithRecentPayments).join(', ')}
        </div>
      )}
      
      <CourseWiseSummary coursePayments={courseSummary} />
    </div>
  )
}

/**
 * Example 7: Integration with existing payment page
 * Update your payment page component like this:
 */
/*
// In your payment page component (e.g., components/payments/page.tsx)

import { generateCourseWiseSummaryWithCohorts } from '@/lib/course-cohort-utils'
import { CourseWiseSummary } from '@/components/course-wise-summary'

// Inside your component:
const [showCohortSummary, setShowCohortSummary] = useState(false)

const cohortSummary = useMemo(
  () => generateCourseWiseSummaryWithCohorts(records),
  [records]
)

// In your render:
<Button onClick={() => setShowCohortSummary(true)}>
  <BookOpen className="mr-2 h-4 w-4" />
  Course & Cohort Summary
</Button>

<Dialog open={showCohortSummary} onOpenChange={setShowCohortSummary}>
  <DialogContent className="max-w-7xl">
    <CourseWiseSummary coursePayments={cohortSummary} />
  </DialogContent>
</Dialog>
*/
