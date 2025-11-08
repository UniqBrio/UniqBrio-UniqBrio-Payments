# Course-wise Summary with Cohort Breakdown

This document explains how to use the enhanced Course-wise Summary component that includes cohort-wise breakdowns for each course.

## Features

- **Expandable Rows**: Each course row can be expanded to show cohort-wise breakdown
- **Cohort Details**: For each cohort, displays:
  - Student count
  - Total amount
  - Received amount
  - Outstanding amount
  - Collection rate with progress bar
- **Visual Indicators**: Chevron icons (▶/▼) indicate expandable courses
- **Consistent Styling**: Cohort breakdown uses purple-themed styling matching the overall design

## Component Interface

```typescript
interface CohortPayment {
  cohort: string
  students: number
  amount: number
  received: number
  outstanding: number
}

interface CoursePayment {
  course: string
  program: string
  amount: number
  students: number
  received: number
  outstanding: number
  cohorts?: CohortPayment[]  // Optional cohort breakdown
}
```

## Usage Example

### 1. Using the Utility Function

```typescript
import { generateCourseWiseSummaryWithCohorts } from '@/lib/course-cohort-utils'
import { CourseWiseSummary } from '@/components/course-wise-summary'

function MyComponent() {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
  
  // Generate course-wise summary with cohorts from payment records
  const courseSummary = generateCourseWiseSummaryWithCohorts(paymentRecords)
  
  return <CourseWiseSummary coursePayments={courseSummary} />
}
```

### 2. Manual Data Preparation

```typescript
const coursePayments = [
  {
    course: "Python Programming",
    program: "Advanced Python Course",
    amount: 150000,
    students: 25,
    received: 120000,
    outstanding: 30000,
    cohorts: [
      {
        cohort: "2024-January",
        students: 10,
        amount: 60000,
        received: 50000,
        outstanding: 10000
      },
      {
        cohort: "2024-February",
        students: 15,
        amount: 90000,
        received: 70000,
        outstanding: 20000
      }
    ]
  },
  // ... more courses
]

<CourseWiseSummary coursePayments={coursePayments} />
```

### 3. Without Cohort Data (Legacy Support)

The component still works without cohort data:

```typescript
const coursePayments = [
  {
    course: "Data Science",
    program: "Data Science Bootcamp",
    amount: 200000,
    students: 30,
    received: 180000,
    outstanding: 20000
    // No cohorts property - row won't be expandable
  }
]

<CourseWiseSummary coursePayments={coursePayments} />
```

## Component Behavior

### Expandable Courses
- Courses **with cohort data** show a chevron icon and are clickable
- Clicking the row toggles the cohort breakdown display
- ChevronRight (▶) indicates collapsed state
- ChevronDown (▼) indicates expanded state

### Cohort Breakdown Table
When expanded, displays a nested table with:
- Header: "Cohort-wise Breakdown" with Users icon
- Columns: Cohort name, Students, Total Amount, Received, Outstanding, Collection Rate
- Alternating row colors for better readability
- Progress bars for collection rates

### Visual Styling
- Main course rows: White/gray alternating background
- Expanded cohort section: Purple-tinted background (`bg-purple-50/50`)
- Cohort table header: Purple accent (`bg-purple-100/50`)
- Collection rates: Progress bars with consistent styling

## Data Flow

```
PaymentRecord[] (from API)
       ↓
generateCourseWiseSummaryWithCohorts()
       ↓
CoursePaymentWithCohorts[]
       ↓
<CourseWiseSummary />
       ↓
Rendered UI with expandable cohort details
```

## Utility Functions

### `generateCourseWiseSummaryWithCohorts(records)`
Groups payment records by course and cohort, calculating totals at both levels.

**Parameters:**
- `records: PaymentRecord[]` - Array of payment records

**Returns:**
- `CoursePaymentWithCohorts[]` - Array of courses with cohort breakdowns

**Features:**
- Automatically handles missing cohort data (labels as "Unassigned")
- Includes registration fees in calculations
- Sorts courses alphabetically
- Sorts cohorts within each course alphabetically

### `generateCourseWiseSummary(records)`
Legacy function that returns course summaries without cohort details.

## Integration Examples

### In Payment Page Component

```typescript
import { generateCourseWiseSummaryWithCohorts } from '@/lib/course-cohort-utils'
import { CourseWiseSummary } from '@/components/course-wise-summary'

function PaymentDashboard() {
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [showSummary, setShowSummary] = useState(false)
  
  const courseSummary = useMemo(
    () => generateCourseWiseSummaryWithCohorts(records),
    [records]
  )
  
  return (
    <>
      <Button onClick={() => setShowSummary(true)}>
        View Course Summary
      </Button>
      
      {showSummary && (
        <Dialog open={showSummary} onClose={() => setShowSummary(false)}>
          <CourseWiseSummary coursePayments={courseSummary} />
        </Dialog>
      )}
    </>
  )
}
```

### With Filtering

```typescript
// Filter by specific cohort
const filteredSummary = courseSummary.map(course => ({
  ...course,
  cohorts: course.cohorts?.filter(cohort => 
    cohort.cohort.includes('2024')
  )
}))

<CourseWiseSummary coursePayments={filteredSummary} />
```

## Styling Customization

The component uses Tailwind CSS classes. Key styling elements:

```typescript
// Main row hover effect
className="hover:bg-purple-25"

// Expandable row indicator
className="cursor-pointer"

// Cohort section background
className="bg-purple-50/50"

// Chevron button hover
className="p-0 hover:bg-purple-100 rounded"
```

## Accessibility

- Interactive rows have cursor pointer when clickable
- Chevron buttons are properly styled for hover states
- Table structure maintains semantic HTML
- Color coding includes text indicators (not just color)

## Performance Considerations

- Use `useMemo` to cache generated summaries
- Component uses `useState` for expand/collapse state
- Renders only expanded cohort details (not pre-rendered)
- Efficient key usage prevents unnecessary re-renders

## Migration from Old Component

If you're upgrading from the old CourseWiseSummary:

**Old:**
```typescript
<CourseWiseSummary coursePayments={oldData} />
```

**New (backward compatible):**
```typescript
<CourseWiseSummary coursePayments={oldData} />  // Still works!

// Or with cohort data:
<CourseWiseSummary 
  coursePayments={generateCourseWiseSummaryWithCohorts(records)} 
/>
```

The component is **fully backward compatible** - existing code continues to work without changes.
