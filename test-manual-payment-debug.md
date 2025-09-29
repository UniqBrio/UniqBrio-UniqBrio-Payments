# Manual Payment Debug Guide

## Steps to Debug Manual Payment Issue

### 1. Open Browser Developer Tools
- Press F12 or right-click → Inspect
- Go to the Console tab
- Go to the Network tab

### 2. Test Manual Payment
1. Find a student record in the payment table
2. Click the "Manual Payment" button (₹ icon)
3. Fill in the payment details:
   - Amount: Enter any amount (e.g., 1000)
   - Date: Select today's date
   - Payment Mode: Select any mode (e.g., Cash)
   - Payment Types: Check "Course Payment"
   - Received By Name: Enter any name
   - Received By Role: Select any role
4. Click "Record Payment"

### 3. Check Console Logs
Look for these log messages in the Console:

**Frontend Logs (should appear):**
- `🚀 Manual payment triggered with payload:` (with payment details)
- `💳 MANUAL PAYMENT API CALL for course:` (with API data)
- `🔄 Refreshing payment data after manual payment...`
- `✅ Payment data refreshed successfully`

**Backend API Logs (should appear):**
- `🚀 POST /api/payments - Manual payment request received`
- `📝 Payment request body:` (with complete request data)
- `🔍 Looking for student with ID:`
- `✅ Student found:` (student name)
- `📄 Found existing payment document with X records` OR `📄 Creating new payment document`
- `➕ Adding payment record:` (new payment record)
- `💾 Saving payment document...`
- `✅ Payment document saved successfully`
- `💳 PAYMENT RECORDED for Student` (summary)

### 4. Check Network Tab
Look for these API calls:
1. **POST** `/api/payments` - Should return 200 OK with success: true
2. **GET** `/api/payments/sync` - Should be called after the payment (might be delayed)

### 5. Common Issues to Look For:

**If no frontend logs appear:**
- Manual payment form is not calling the handler
- JavaScript error preventing execution

**If frontend logs appear but no backend logs:**
- API call is failing to reach the server
- Check Network tab for failed requests

**If API logs stop at "Looking for student":**
- Student not found in database
- StudentId mismatch issue

**If API logs stop at "Saving payment document":**
- Database save error
- Validation error in payment model

**If refresh logs don't appear:**
- refreshPaymentData function not being called
- Error in refresh function

### 6. Manual Refresh Test
After attempting a manual payment, try refreshing the page to see if the payment appears. If it does, the issue is with the UI refresh, not the database save.

### 7. Check Database Directly (if possible)
Look at the `payments` collection to see if new payment records are being added.