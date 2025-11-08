# Quick Start: Cohort-wise Summary

## 30-Second Setup

### Step 1: Import the utilities
```typescript
import { generateCourseWiseSummaryWithCohorts } from '@/lib/course-cohort-utils'
import { CourseWiseSummary } from '@/components/course-wise-summary'
```

### Step 2: Generate the summary
```typescript
const courseSummary = generateCourseWiseSummaryWithCohorts(paymentRecords)
```

### Step 3: Render the component
```typescript
<CourseWiseSummary coursePayments={courseSummary} />
```

## Complete Example

```typescript
import { useMemo } from 'react'
import { generateCourseWiseSummaryWithCohorts } from '@/lib/course-cohort-utils'
import { CourseWiseSummary } from '@/components/course-wise-summary'

export function MyPaymentDashboard() {
  const [records, setRecords] = useState([])
  
  // Fetch records...
  
  const courseSummary = useMemo(
    () => generateCourseWiseSummaryWithCohorts(records),
    [records]
  )
  
  return (
    <div>
      <h1>Payment Summary</h1>
      <CourseWiseSummary coursePayments={courseSummary} />
    </div>
  )
}
```

## What You Get

### Before (Course-only view):
```
Course Name          Students  Total     Received  Outstanding  Rate    Status
─────────────────────────────────────────────────────────────────────────────
Python Programming   25        150,000   120,000   30,000      80.0%   Partial
```

### After (With cohort expansion):
```
▼ Python Programming   25        150,000   120,000   30,000      80.0%   Partial
  
  Cohort-wise Breakdown:
  Cohort          Students  Total    Received  Outstanding  Rate
  ─────────────────────────────────────────────────────────────────
  2024-January    10        60,000   50,000    10,000      83.3%
  2024-February   15        90,000   70,000    20,000      77.8%
```

## Key Features

✅ **Click to expand** - Course rows with cohorts are clickable  
✅ **Visual indicator** - Chevron icon shows expand/collapse state  
✅ **Nested breakdown** - See detailed cohort statistics  
✅ **Progress bars** - Visual collection rate for each cohort  
✅ **Backward compatible** - Works with existing data  
✅ **Auto-handles** - Missing cohort data labeled as "Unassigned"  

## Data Requirements

Your `PaymentRecord` objects should have:
- `cohort` field (optional - will use "Unassigned" if missing)
- `finalPayment`, `totalPaidAmount` for calculations
- `registrationFees` object (optional)

The utility function handles everything else!

## Common Use Cases

### 1. Show in a popup/dialog
```typescript
<Dialog open={show} onOpenChange={setShow}>
  <DialogContent className="max-w-7xl">
    <CourseWiseSummary coursePayments={courseSummary} />
  </DialogContent>
</Dialog>
```

### 2. Filter by year
```typescript
const filtered = courseSummary.map(course => ({
  ...course,
  cohorts: course.cohorts?.filter(c => c.cohort.includes('2024'))
}))
```

### 3. Export to CSV
```typescript
const csvData = courseSummary.flatMap(course =>
  course.cohorts?.map(cohort => ({
    Course: course.course,
    Cohort: cohort.cohort,
    Students: cohort.students,
    Amount: cohort.amount,
    Received: cohort.received
  })) || []
)
```

## Troubleshooting

**Q: No chevron appears?**  
A: The course has no cohort data. Add cohorts to your payment records.

**Q: All showing as "Unassigned"?**  
A: Your records don't have the `cohort` field populated.

**Q: Not expanding?**  
A: Check that `cohorts` array has data. Empty array won't expand.

**Q: Styling looks off?**  
A: Ensure Tailwind CSS is properly configured and purple colors are available.

## Next Steps

📖 Read full documentation: `docs/COURSE_COHORT_SUMMARY.md`  
💡 See examples: `docs/cohort-summary-examples.tsx`  
📝 Review implementation: `docs/IMPLEMENTATION_SUMMARY.md`  

## Need Help?

The component is fully backward compatible. Start using it and cohort data will automatically appear as you add it to your records!
