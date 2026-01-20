# 🧪 Flow Verification Guide - Manual Testing

## Pre-Test Setup

### 1. Start the Server
```bash
npm run dev
# or
node server/server.js
```

Expected output:
```
✓ MongoDB Connected: localhost
Server Started Successfully
Environment: development
Port: 5000
Health Check: http://localhost:5000/api/health
```

### 2. Open Browser
Navigate to: `http://localhost:5000`

---

## Flow 1: Customer Registration & Login

### Step 1.1: Visit Home Page
- **Action**: Open http://localhost:5000
- **Expected**: See "Micro Finance Management System" homepage
- **Verify**: Navigation menu with Login/Register buttons visible

### Step 1.2: Register as New Customer
- **Action**: Click "Customer Login" → "Register Now" link
- **Expected**: Registration form appears with fields:
  - First Name
  - Last Name
  - Email
  - Phone Number
  - Password (with strength meter)
  - Confirm Password

### Step 1.3: Test Validation in Real-Time
- **Email validation**:
  - Enter invalid email (e.g., "test123"): 🔴 Red error "Invalid email format"
  - Enter valid email: ✅ Green check
  - Enter existing email: 🔴 Red error "Email already exists"

- **Phone validation**:
  - Enter < 10 digits: 🔴 Red error "10 digits required"
  - Enter valid phone: ✅ Green check

- **Password strength**:
  - Enter weak password (e.g., "test"): 🔴 Red "Weak"
  - Enter medium (e.g., "Test123"): 🟡 Yellow "Medium"
  - Enter strong (e.g., "Test@12345"): 🟢 Green "Strong"

- **Password match**:
  - Mismatch confirms: 🔴 Red error
  - Match confirms: ✅ Green check

### Step 1.4: Submit Registration
- **Action**: Fill all fields correctly and click "Register"
- **Expected**: 
  - Toast notification appears: "✅ Registration successful! Please login to continue."
  - Redirected to customer login page

### Step 1.5: Login
- **Action**: Enter registered email and password, click "Login"
- **Expected**:
  - Toast notification: "✅ Welcome back, [FirstName]!"
  - Redirected to customer dashboard

---

## Flow 2: Customer Dashboard & Loan Application

### Step 2.1: Explore Dashboard
- **Expected**: Three tabs visible:
  1. **My Loans** - List of applications with timeline
  2. **Apply for Loan** - Available loan products
  3. **KYC Status** - Know Your Customer documents
  4. **My Profile** - Personal information

### Step 2.2: View Available Loans
- **Action**: Stay on "Apply for Loan" tab
- **Expected**: Card layout with loan products:
  - Micro Loan (₹10,000 - ₹50,000)
  - Personal Loan (₹50,000 - ₹5,00,000)
  - Business Loan (₹1,00,000 - ₹25,00,000)
  - Home Loan (₹5,00,000 - ₹50,00,000)

### Step 2.3: Apply for Loan
- **Action**: Click "Apply Now" on any loan product
- **Expected**: Modal/form appears with:
  - Loan Amount slider (respects min/max)
  - Tenure slider (3-60 months)
  - Purpose text
  - "Submit Application" button

- **Validation test**:
  - Set amount < min: Button disabled
  - Set amount > max: Button disabled
  - Set amount in range: Button enabled ✅

### Step 2.4: Submit Application
- **Action**: Select valid amount and tenure, click "Submit"
- **Expected**: 
  - Toast appears: "✅ Your loan application for ₹[amount] has been received..."
  - Additional feedback showing:
    - **Review ETA**: Date when review will be complete (e.g., 2026-01-12)
    - **Next Steps**: Array of actions to take (e.g., "Complete KYC verification", "Wait for admin review")
    - **KYC Required**: Boolean flag if KYC needs completion

### Step 2.5: View Application in Timeline
- **Action**: Click "My Loans" tab
- **Expected**: Application appears with timeline showing:
  ```
  ✓ Submitted (2026-01-10) [COMPLETED]
  → Under Review (pending)
  → Decision Pending
  → Activated
  → Closed
  ```

**Timeline features to verify**:
- ✅ Submitted step shows green checkmark
- → Upcoming steps shown in gray
- Dates match application creation date
- Status text is clear and descriptive

---

## Flow 3: Admin Approval & Activation

### Step 3.1: Logout Customer
- **Action**: Click user menu → Logout
- **Expected**: Logged out, redirected to home page

### Step 3.2: Admin Login
- **Action**: 
  - Go to http://localhost:5000/admin/login
  - Email: `admin@microfinance.com`
  - Password: `Admin@12345`
- **Expected**:
  - Toast: "✅ Welcome Admin!"
  - Dashboard loads with statistics

### Step 3.3: View Admin Dashboard
- **Expected**: Displays:
  - **Statistics**: Total customers, pending apps, approved loans, active loans
  - **Recent Applications**: List of latest applications with:
    - Customer Name
    - Loan Amount
    - Status
    - Created Date
    - **Action Buttons**: Approve / Reject / Review (status-dependent)

### Step 3.4: Test Approve Action
- **Action**: Find the application from Step 2.4, click "Approve" button
- **Expected**:
  - Confirmation dialog: "Approve this application for ₹[amount]?"
  - Toast after confirm: "✅ Loan application [number] approved successfully."
  - Additional feedback showing next steps (e.g., "Activate the loan when documents are verified")
  - Application status in dashboard changes to "approved"
  - Button changes to "Activate"

### Step 3.5: Test Reject Action (for different app)
- **Action**: Find another pending application, click "Reject"
- **Expected**:
  - Dialog: "Reject this application?"
  - Optional: Text field for rejection reason
  - Toast after confirm: "✅ Loan application [number] rejected."
  - Status changes to "rejected"
  - Buttons disappear (no further actions)

### Step 3.6: Test Activate Action
- **Action**: Click "Activate" on approved application
- **Expected**:
  - Confirmation dialog: "Activate this loan?"
  - Toast: "✅ Loan [number] activated successfully. EMI of ₹[amount] scheduled."
  - Status changes to "active"
  - Next steps displayed (e.g., "Customer will receive payment instructions", "First EMI due on [date]")

---

## Flow 4: KYC Submission

### Step 4.1: Return to Customer Dashboard
- **Action**: Login as customer again
- **Expected**: Dashboard loads, see "KYC Status" tab

### Step 4.2: Check KYC Status
- **Action**: Click "KYC Status" tab
- **Expected**: 
  - If never submitted: "Not Started" status with upload button
  - Documents needed: Aadhar, PAN, Bank Statement

### Step 4.3: Submit KYC Documents
- **Action**: Upload documents and click "Submit KYC"
- **Expected**:
  - Toast: "✅ KYC documents submitted for verification."
  - Status changes to "Under Review"
  - Button disabled (waiting for admin review)

### Step 4.4: Admin KYC Approval
- **Action**: Login as admin, find dashboard with KYC pending approvals
- **Expected**: 
  - See customer with pending KYC
  - Click "Verify KYC" or similar button
  - Toast: "✅ KYC verified for [customer]"
  - Status changes to "Verified"

---

## Flow 5: Profile Management

### Step 5.1: Update Profile
- **Action**: Login as customer, go to "My Profile" tab
- **Expected**: Form with fields:
  - First Name
  - Last Name
  - Phone
  - Current Address
  - City, State, Pincode
  - "Save Changes" button

### Step 5.2: Make Changes
- **Action**: Update one field and click "Save Changes"
- **Expected**:
  - Toast: "✅ Profile updated successfully."
  - Form shows updated values

---

## ✅ Success Criteria - All Flows Working

| Flow | Component | Expected Behavior |
|------|-----------|-------------------|
| **Registration** | Email validation | 🟢 Real-time feedback (red/green) |
| **Registration** | Phone validation | 🟢 Real-time feedback (red/green) |
| **Registration** | Password strength | 🟢 Strength meter (weak/medium/strong) |
| **Registration** | Form submission | 🟢 Success toast, redirect to login |
| **Login** | Success flow | 🟢 JWT token stored, dashboard loads |
| **Dashboard** | Apply form | 🟢 Min/max validation, submit works |
| **Application** | Success feedback | 🟢 Toast shows ETA & next steps |
| **Timeline** | All applications | 🟢 Renders with multi-step visualization |
| **Timeline** | Status visualization | 🟢 Submitted (✓), Pending (→), Completed (✓) |
| **Admin** | Login & dashboard | 🟢 Stats load, applications display |
| **Admin** | Approve action | 🟢 Confirmation, success toast, status updates |
| **Admin** | Reject action | 🟢 Confirmation, success toast, status updates |
| **Admin** | Activate action | 🟢 Confirmation, EMI details in toast |
| **KYC** | Submission | 🟢 Toast notification, status changes |
| **Notifications** | Toast display | 🟢 Appears at top right, auto-closes after 4s |
| **Error Handling** | API errors | 🟢 Error toasts show helpful messages |
| **Assets** | CSS/JS loaded | 🟢 No console errors, styles apply |

---

## 🔧 Debugging

### Check Browser Console (F12)
- Should have **NO red errors**
- Warnings are acceptable (from libraries)

### Check Network Tab (F12)
- All API requests should return **200/201** for success
- **4xx** errors show in console
- **5xx** errors indicate server issues

### Server Console Output
- Should show request logs as you interact
- No "Cannot POST" or "Cannot GET" messages
- MongoDB queries logged (if debug enabled)

---

## 📝 Test Summary Template

Use this to document your testing:

```
✅ FLOW VERIFICATION COMPLETE

Flows Tested:
[ ] Customer Registration with validation
[ ] Customer Login
[ ] Loan Application with feedback
[ ] Application Timeline
[ ] Admin Approval & Activation
[ ] KYC Submission
[ ] Profile Management

Issues Found: None / [List here]

All Notifications Working: Yes / No
All Forms Validated: Yes / No
Timeline Renders Correctly: Yes / No
Admin Controls Functional: Yes / No

Date: [Date]
Tester: [Name]
```

---

## 🚀 Next Steps (If All Pass)

1. **Production Deployment**
   - Set NODE_ENV=production
   - Configure MONGODB_URI for production
   - Enable CORS restrictions
   - Setup SSL/TLS

2. **Load Testing**
   - Test with multiple concurrent users
   - Verify notifications system under load
   - Check database performance

3. **Security Audit**
   - Review JWT implementation
   - Test role-based access control
   - Verify input sanitization

4. **User Acceptance Testing**
   - Real users test all flows
   - Gather feedback on UX
   - Make UI improvements

---
