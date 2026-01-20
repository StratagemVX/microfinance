# Forgot Password Feature - Implementation Guide

## Overview
The forgot password feature has been successfully implemented for both Customer and Admin portals in the MicroFinance System. This allows users to securely reset their passwords when they forget them.

## Components Implemented

### 1. Database Models
**Files Modified:**
- `server/models/Customer.js`
- `server/models/Admin.js`

**Changes:**
- Added `resetToken` field (hashed, not selected by default)
- Added `resetTokenExpiry` field (30-minute expiry)
- Added `passwordChangedAt` field (for audit trail)
- Added `generateResetToken()` method
- Added `clearResetToken()` method
- Updated password hashing middleware to set `passwordChangedAt`

### 2. API Routes & Controllers
**Files Modified:**
- `server/controllers/authController.js` - Added 4 new methods:
  - `customerForgotPassword` - Initiates password reset for customers
  - `customerResetPassword` - Resets customer password with token
  - `adminForgotPassword` - Initiates password reset for admins
  - `adminResetPassword` - Resets admin password with token

- `server/routes/authRoutes.js` - Added 4 new routes:
  - `POST /api/auth/customer/forgot-password`
  - `POST /api/auth/customer/reset-password`
  - `POST /api/auth/admin/forgot-password`
  - `POST /api/auth/admin/reset-password`

### 3. Frontend Views
**Files Created:**
- `views/customer/forgot-password.ejs` - Customer forgot password form
- `views/customer/reset-password.ejs` - Customer password reset form
- `views/admin/forgot-password.ejs` - Admin forgot password form
- `views/admin/reset-password.ejs` - Admin password reset form

### 4. Page Routes
**File Modified:**
- `server/app.js` - Added 4 new page routes:
  - `GET /customer/forgot-password`
  - `GET /customer/reset-password`
  - `GET /admin/forgot-password`
  - `GET /admin/reset-password`

## How It Works

### Password Reset Flow

#### 1. User Requests Password Reset
- User visits `/customer/forgot-password` or `/admin/forgot-password`
- Enters their email address
- Submits the form

#### 2. Backend Generates Reset Token
- Server finds user by email
- Generates a 32-byte random token using crypto
- Hashes the token using SHA256
- Stores hashed token and 30-minute expiry in database
- Returns the plain token in a reset link (for development)

```
Reset Link Format:
http://localhost:5000/customer/reset-password?token=<PLAIN_TOKEN>
```

#### 3. User Receives Reset Link
- In development mode: Link displayed on page
- In production: Link would be sent via email
- Link includes the plain token as a URL parameter

#### 4. User Clicks Reset Link
- User is redirected to reset password page
- Token is extracted from URL query parameter
- User enters new password and confirmation

#### 5. Backend Validates & Updates Password
- Server receives new password and token
- Hashes the token to match the stored version
- Verifies token exists and hasn't expired (30 minutes)
- If valid:
  - Updates password (auto-hashed by middleware)
  - Clears reset token
  - Sets `passwordChangedAt` timestamp
  - Returns success message
- User is redirected to login page

## API Endpoints

### Customer Endpoints

#### Forgot Password
```http
POST /api/auth/customer/forgot-password
Content-Type: application/json

{
  "email": "customer@example.com"
}

Response (Success):
{
  "success": true,
  "message": "Password reset link sent",
  "info": "Check your email for password reset instructions",
  "testResetLink": "http://localhost:5000/customer/reset-password?token=..." // DEV ONLY
}
```

#### Reset Password
```http
POST /api/auth/customer/reset-password
Content-Type: application/json

{
  "token": "plain_reset_token_from_url",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}

Response (Success):
{
  "success": true,
  "message": "Password reset successful",
  "info": "You can now login with your new password"
}
```

### Admin Endpoints

#### Forgot Password
```http
POST /api/auth/admin/forgot-password
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

#### Reset Password
```http
POST /api/auth/admin/reset-password
Content-Type: application/json

{
  "token": "plain_reset_token_from_url",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

## Security Features

### Token Security
1. **Token Generation**: Uses `crypto.randomBytes(32)` for 256-bit entropy
2. **Token Storage**: Only SHA256-hashed version stored in database
3. **Token Expiry**: 30-minute window for security
4. **Token Comparison**: Hashes received token before comparing with stored hash

### Password Security
1. **Password Hashing**: bcryptjs with salt rounds = 10
2. **Min Length**: 6 characters enforced
3. **Password Updated At**: Tracks when password was last changed
4. **Clear Token**: Token immediately cleared after successful reset

### Additional Protections
1. **Email Verification**: No confirmation that email exists (prevents user enumeration)
2. **Invalid Token Handling**: Generic error message for expired/invalid tokens
3. **Case-Insensitive Email**: Email stored in lowercase for consistency
4. **Password Validation**: Client-side + server-side validation

## Frontend Features

### Forgot Password Page
- Beautiful gradient design (customer: indigo/purple, admin: red/dark)
- Email input field with validation
- Real-time email format checking
- Loading state with spinner
- Success message display
- Development-only test link display
- Responsive design for mobile/tablet

### Reset Password Page
- Password strength indicator (weak/medium/strong)
- Password visibility toggle
- Confirm password field
- Real-time password strength feedback
- Form validation
- Security notice (for admin)
- Error handling with specific messages
- Auto-redirect to login after successful reset
- Responsive design

## Testing the Feature

### Development Mode
1. **Forgot Password Request**
   ```
   POST http://localhost:5000/api/auth/customer/forgot-password
   Body: {"email": "customer@example.com"}
   ```

2. **Get Reset Link**
   - Response will include `testResetLink` in development mode
   - Copy the link or click it directly

3. **Reset Password**
   - Navigate to reset password page or use test link
   - Enter new password (min 6 characters)
   - Confirm password
   - Submit form

4. **Verify**
   - Login with new password should work
   - Old password should no longer work

### Production Deployment
1. Implement email service (SendGrid, Nodemailer, AWS SES, etc.)
2. Update `authController.js` to send reset link via email instead of returning in response
3. Set `NODE_ENV=production` to disable test links
4. Add email template for password reset link
5. Configure SMTP or API credentials

## Email Service Integration (Future)

To enable email notifications, update `authController.js`:

```javascript
// Example using Nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// In customerForgotPassword function:
await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: customer.email,
  subject: 'Password Reset Link',
  html: `Click here to reset your password: ${resetLink}`
});
```

## Database Requirements
- MongoDB/Mongoose must support:
  - String fields (for tokens)
  - Date fields (for token expiry)
  - Index on email (already exists)

## Environment Variables
No new environment variables needed, but ensure these are set:
- `JWT_SECRET` - For JWT token generation
- `JWT_EXPIRY` - For JWT token expiry (default: 7d)
- `NODE_ENV` - Set to 'production' to disable test links

## Error Handling

The implementation handles:
1. Missing email
2. Invalid email format
3. Email not found (generic response for security)
4. Invalid/expired token
5. Password mismatch
6. Password too short
7. Database errors
8. Server errors

All errors return appropriate HTTP status codes:
- 400: Bad request (validation)
- 401: Unauthorized (invalid token)
- 500: Server error

## Browser Compatibility
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly interface
- Password visibility toggle works on all devices

## Next Steps to Complete
1. Update customer/admin login pages to link to forgot-password pages (currently commented with `#`)
2. Implement email service integration for production
3. Add rate limiting to prevent brute force attempts
4. Add CAPTCHA for bot prevention
5. Add email notification confirmations
6. Add admin panel to view password reset requests

## Files Modified Summary
- ✅ Models: Customer.js, Admin.js
- ✅ Controllers: authController.js
- ✅ Routes: authRoutes.js
- ✅ Views: 4 new EJS files created
- ✅ App Config: app.js (page routes)
- ⚠️ Login Pages: Need to update links from `#` to actual routes

## Support
For issues or questions about the forgot password feature, refer to the security section above or contact the development team.
