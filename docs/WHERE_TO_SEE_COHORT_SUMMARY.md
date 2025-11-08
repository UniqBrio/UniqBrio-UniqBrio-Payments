# Where to See the Cohort-wise Summary Feature

## 🎯 Quick Access Guide

### 1. Start Your Application

```bash
# Make sure you're in the project directory
cd c:\Users\Savitha\Downloads\UniqBrio-UniqBrio-Payments

# Install dependencies (if not already installed)
npm install
# or
pnpm install

# Start the development server
npm run dev
# or
pnpm dev
```

### 2. Navigate to Payment Management Page

Open your browser and go to:
```
http://localhost:3000/payments
```

### 3. Click the "Course & Cohort" Tab

**Location:** Third tab in the tab bar (next to "Analytics" and "Student-wise")

Look for:
```
[ Analytics ] [ Student-wise ] [ Course & Cohort ] ← Click here!
```

### 4. View the Summary

The page will display:
- **Course-wise summary table**
- **Expandable rows** (click any course row with a ▶ icon)
- **Cohort breakdown** for each course (when expanded)

## 📸 Visual Flow

```
Payment Management Page
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Payment Management                                          │
├─────────────────────────────────────────────────────────────┤
│ [ Analytics ] [ Student-wise ] [ Course & Cohort ] ← Tab 3 │
│                                        ⬆ Click here!        │
└─────────────────────────────────────────────────────────────┘
    ↓
Course & Cohort Tab Opens
    ↓
┌─────────────────────────────────────────┐
│ Course-wise Payment Summary             │
├─────────────────────────────────────────┤
│                                         │
│ ▶ Python Programming                    │  ← Click to expand
│ ▼ Data Science Bootcamp                 │  ← Expanded
│    └─ Cohort: 2024-January             │
│        Students: 10                     │
│        Amount: 60,000                   │
│        Received: 50,000                 │
│        Outstanding: 10,000              │
│        Collection: 83.3% [████████░]    │
│    └─ Cohort: 2024-February            │
│        Students: 15                     │
│        Amount: 90,000                   │
│        ...                              │
│                                         │
└─────────────────────────────────────────┘
```

## 🔄 Step-by-Step Interaction

### Step 1: View Course Summary
- All courses are listed in the main table
- Each row shows: CourseID, Name, Students, Amount, Received, Outstanding, Collection Rate, Status

### Step 2: Expand a Course
- Look for courses with a **▶ chevron icon**
- Click anywhere on the course row
- The chevron changes to **▼** and cohort details appear below

### Step 3: View Cohort Details
- See breakdown of students and payments per cohort
- Each cohort shows:
  - Cohort name (e.g., "2024-January", "Batch-1")
  - Number of students
  - Financial metrics (Total, Received, Outstanding)
  - Collection rate with visual progress bar

### Step 4: Collapse a Course
- Click the expanded course row again
- The cohort details hide

## 🎨 What You'll See

### Main Table Columns:
1. **CourseID** - Short course identifier
2. **Course Name** - Full course/program name
3. **Students** - Total number of students
4. **Total Amount (INR)** - Total fees expected
5. **Received (INR)** - Amount collected (green)
6. **Outstanding (INR)** - Amount pending (red)
7. **Collection Rate** - Percentage with progress bar
8. **Status** - Badge (Complete/Partial/Pending)

### Cohort Breakdown Table (when expanded):
- **Purple-themed** nested table
- Header: "👥 Cohort-wise Breakdown"
- Same financial columns as main table, but per cohort
- Alternating row colors for readability

## 🎭 Features to Try

### 1. Multiple Course Expansion
- You can expand multiple courses simultaneously
- Each maintains its own state

### 2. No Cohort Data
- Courses without cohort data won't have chevron icon
- Clicking them won't expand anything

### 3. Progress Bars
- Visual representation of collection rates
- Green (80%+), Yellow (50-80%), Red (<50%)

### 4. Status Badges
- **Complete** (green) - All payments received
- **Partial** (gray) - 50%+ received
- **Pending** (red) - Less than 50% received

## 🚀 Demo Data

If you want to see the feature with sample data, the system will automatically:
- Group students by their enrolled course
- Group students by their cohort within each course
- Calculate all financial metrics
- Display expandable rows for courses with cohort data

## 📍 Alternative Access Points

You can also integrate the cohort summary in other places:

### In Analytics Tab
Add a summary card or chart showing cohort performance

### In Reports Section
Include cohort breakdown in exported reports

### In Dashboard
Add a quick cohort metrics widget

## 🔧 Customization

You can customize the appearance by modifying:
```typescript
// In components/payments/page.tsx
<Dialog open={showCohortSummary} onOpenChange={setShowCohortSummary}>
  <DialogContent className="max-w-7xl max-h-[90vh]">
    {/* Adjust max-w-7xl for dialog width */}
    {/* Adjust max-h-[90vh] for dialog height */}
    <CourseWiseSummary coursePayments={courseSummaryWithCohorts} />
  </DialogContent>
</Dialog>
```

## 🐛 Troubleshooting

### Button Not Showing?
- Make sure you're on `/payments` page
- Check that the page loaded without errors

### No Cohort Data?
- Verify that your payment records have `cohort` field populated
- Check that `generateCourseWiseSummaryWithCohorts` is receiving data

### Can't Expand Courses?
- Only courses with cohort data can be expanded
- Look for the **▶** chevron icon - if missing, no cohorts available

### Dialog Not Opening?
- Check browser console for errors
- Verify all imports are correct
- Clear cache and reload: `Ctrl+Shift+R`

## 📱 Mobile View

The summary is responsive:
- Horizontal scrolling enabled for large tables
- Touch-friendly expand/collapse
- Optimized font sizes

## 🎯 Quick Test

1. ✅ Navigate to `/payments`
2. ✅ Click "Course & Cohort" tab (3rd tab)
3. ✅ Course summary table loads
4. ✅ Click a course row with ▶ icon
5. ✅ Cohort details appear below
6. ✅ Click again to collapse

**That's it!** You should now see the cohort-wise summary feature in action.
