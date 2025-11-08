# Cohort Database Integration

## Overview
The Course & Cohort summary feature now fetches cohort data from the MongoDB database (`cohorts` collection) and merges it with payment records for comprehensive reporting.

## Architecture

### Backend Components

#### 1. Cohort Model (`models/cohort.js`)
```javascript
Schema Fields:
- cohortId: String (unique, indexed)
- name: String (required)
- courseId: String (required, indexed)
- courseName: String
- startDate: Date
- endDate: Date
- status: Enum ['Active', 'Completed', 'Upcoming', 'Cancelled']
- instructor: String
- maxStudents: Number
- enrolledStudents: Number (default: 0)
- students: Array of {studentId, studentName, enrollmentDate}
- schedule: {days, time, timezone}
- location: String
- description: String
- metadata: Map

Indexes:
- cohortId (unique)
- courseId + status (compound)
- startDate

Virtual Fields:
- activeStudentsCount: Calculates count of active students
```

#### 2. Cohorts API (`app/api/cohorts/route.ts`)
```typescript
GET /api/cohorts
- Query params: courseId (optional), status (optional)
- Returns: {success: boolean, data: Cohort[], count: number}
- Sorts by: startDate (ascending)

POST /api/cohorts
- Body: {cohortId, name, courseId, courseName, ...}
- Validates required fields
- Checks for duplicate cohortId
- Returns: {success: boolean, data: Cohort, message: string}
- Status codes: 201 (created), 400 (validation), 409 (duplicate), 500 (error)
```

### Frontend Components

#### 1. Course-Cohort Utilities (`lib/course-cohort-utils.ts`)

**New Functions:**

```typescript
fetchCohortsFromDB(courseId?: string): Promise<CohortFromDB[]>
```
- Fetches cohorts from `/api/cohorts`
- Optional courseId filter
- Returns empty array on error with console logging

```typescript
generateCourseWiseSummaryWithCohortsEnhanced(
  records: PaymentRecord[], 
  cohortsFromDB: CohortFromDB[]
): CoursePaymentWithCohorts[]
```
- Merges payment records with database cohorts
- Groups by course and cohort
- Includes cohorts from DB even if they have no payment records yet
- Calculates financial metrics per cohort
- Returns sorted course summaries with nested cohort breakdowns

**Legacy Function (still available):**
```typescript
generateCourseWiseSummaryWithCohorts(records: PaymentRecord[])
```
- Original function using only payment records
- Kept for backward compatibility

#### 2. Payments Page (`components/payments/page.tsx`)

**New State:**
```typescript
const [cohortsFromDB, setCohortsFromDB] = useState<CohortFromDB[]>([])
const [loadingCohorts, setLoadingCohorts] = useState(false)
```

**New Effect:**
```typescript
useEffect(() => {
  // Fetches cohorts on component mount
  // Shows toast notification on error
  // Updates cohortsFromDB state
}, [])
```

**Updated Memo:**
```typescript
const courseSummaryWithCohorts = useMemo(
  () => generateCourseWiseSummaryWithCohortsEnhanced(records, cohortsFromDB),
  [records, cohortsFromDB]
)
```
- Now depends on both payment records AND database cohorts
- Automatically refreshes when either data source changes

## Data Flow

```
1. Component Mount
   ↓
2. useEffect → fetchCohortsFromDB()
   ↓
3. GET /api/cohorts
   ↓
4. MongoDB cohorts collection
   ↓
5. setCohortsFromDB(data)
   ↓
6. useMemo triggers → generateCourseWiseSummaryWithCohortsEnhanced()
   ↓
7. Merges payment records + DB cohorts
   ↓
8. CourseWiseSummary component renders
   ↓
9. User sees courses with expandable cohort rows
```

## Key Features

### 1. Cohort Merging Logic
- Cohorts from payment records are matched with DB cohorts by name
- DB cohorts without payment data are included with zero amounts
- Case-insensitive matching for courseName
- Handles "Unassigned" cohort for students without cohort assignment

### 2. Error Handling
- API fetch errors are caught and logged
- Toast notification shown on cohort load failure
- Graceful fallback: shows payment-based data only
- Empty array returned on fetch errors (doesn't break UI)

### 3. Performance Optimizations
- useMemo for expensive calculations
- Single cohort fetch on mount (not per render)
- Efficient Map-based grouping
- Sorted results cached

### 4. UI Integration
- Seamless integration with existing Course & Cohort tab
- No visual changes to user interface
- Compatible with existing search/sort/export features
- Expandable rows work with merged data

## Usage Examples

### Example 1: Basic Fetch
```typescript
// Fetch all cohorts
const cohorts = await fetchCohortsFromDB()
console.log(cohorts) // Array of all cohorts from database
```

### Example 2: Filter by Course
```typescript
// Fetch cohorts for specific course
const cohorts = await fetchCohortsFromDB('COURSE-001')
console.log(cohorts) // Only cohorts for COURSE-001
```

### Example 3: Generate Enhanced Summary
```typescript
const paymentRecords = [...] // from API
const cohorts = await fetchCohortsFromDB()
const summary = generateCourseWiseSummaryWithCohortsEnhanced(paymentRecords, cohorts)
```

## Testing Scenarios

### Scenario 1: Cohort exists in DB, has payments
**Expected:** Cohort shows in breakdown with correct financial totals

### Scenario 2: Cohort exists in DB, no payments yet
**Expected:** Cohort shows in breakdown with 0 students, ₹0 amounts

### Scenario 3: Payment has cohort not in DB
**Expected:** Cohort shows as derived from payment records only

### Scenario 4: API fetch fails
**Expected:** Toast notification, uses payment-only data, no crash

### Scenario 5: Empty database
**Expected:** Shows payment-based cohorts only, works normally

## Benefits

1. **Accurate Data:** Uses official cohort records from database
2. **Completeness:** Shows all cohorts even without payments
3. **Consistency:** Cohort names standardized across system
4. **Scalability:** Separate concerns (cohorts vs. payments)
5. **Flexibility:** Can query cohorts independently of payments
6. **Backward Compatible:** Old function still available if needed

## Migration Notes

- No breaking changes to existing components
- Old `generateCourseWiseSummaryWithCohorts()` still works
- New functionality is opt-in via enhanced function
- Existing exports and UI remain unchanged
- Database schema additions are non-disruptive

## Future Enhancements

1. Add cohort status filter in UI
2. Link to cohort detail pages
3. Real-time cohort updates via WebSocket
4. Cohort analytics dashboard
5. Bulk cohort operations
6. Student enrollment tracking per cohort
7. Instructor assignment management
8. Schedule conflict detection
