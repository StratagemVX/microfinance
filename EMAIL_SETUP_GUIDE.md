# Email Configuration Guide - Password Reset Feature

## Overview

The password reset feature now includes **email functionality** to send reset links to users' email addresses. This guide will help you set up and configure email for your MicroFinance system.

---

## Quick Start (Gmail Setup)

### 1. Enable Gmail SMTP

Gmail requires an **App Password** (not your regular Gmail password) for security reasons.

#### Steps:

1. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification" and follow the prompts
   - Complete the verification process

2. **Generate App Password**
   - Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer" (or your device)
   - Click "Generate"
   - Google will show a 16-character password
   - **Copy this password** (you'll need it next)

3. **Update .env File**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```
   - Replace `your-email@gmail.com` with your Gmail address
   - Replace `abcd efgh ijkl mnop` with the 16-character App Password

4. **Test Email Configuration**
   - The server logs will show:
     - ✅ Email service is configured and ready (if successful)
     - ❌ Email service configuration error (if there's an issue)

---

## How It Works

### Customer Password Reset Flow

1. User clicks "Forgot your password?" on login page
2. User enters their email address
3. Server generates a secure reset token (valid for 30 minutes)
4. **Email is automatically sent** with:
   - Password reset link
   - 30-minute expiration warning
   - Instructions if they didn't request the reset
5. User clicks the link in the email
6. User enters new password
7. Password is updated and they can login

### Admin Password Reset Flow

Same as above but for admin users.

---

## Email Configuration Options

### Option 1: Gmail (Recommended for Development)
```env
# Gmail SMTP
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```
- ✅ Free tier available
- ✅ Reliable and tested
- ⚠️ Requires 2-Step Verification setup
- ⚠️ Rate limited (1000 emails/hour)

### Option 2: SendGrid
```env
# Uncomment in emailService.js and configure
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Option 3: Other SMTP Services
Update the `transporter` configuration in `server/utils/emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@your-provider.com',
    pass: 'your-password',
  },
});
```

---

## Testing Email Functionality

### Using Ethereal (Free Test Email Service)

For development/testing **without sending real emails**:

1. Visit [Ethereal Email](https://ethereal.email)
2. Click "Create Ethereal Account"
3. Get your test credentials
4. Update `server/utils/emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'your-ethereal-email@ethereal.email',
    pass: 'your-ethereal-password',
  },
});
```

5. Restart the server
6. Test the forgot password flow
7. Click the preview link in the console logs to see the email

### Manual Testing Steps

1. **Test Endpoint (POST)**
   ```bash
   curl -X POST http://localhost:5000/api/auth/customer/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Check Server Logs**
   - Look for: `✅ Password reset email sent to test@example.com`
   - Or errors like: `❌ Error sending password reset email`

3. **Check Email Inbox**
   - Wait 30 seconds to 1 minute
   - Check spam/junk folder if not in inbox
   - Click the reset link in the email

---

## Email Template Preview

The password reset emails include:

- **Professional HTML design** with branding
- **Prominent reset button** for easy clicking
- **Reset link** (also as plain text for copy-paste)
- **Security notice**: "If you didn't request this, please ignore"
- **Expiration warning**: "Link expires in 30 minutes"
- **Both HTML and plain text** versions

---

## Troubleshooting

### ❌ "Cannot find module 'nodemailer'"
```bash
npm install nodemailer --save
```

### ❌ "Email service configuration error"
- Check your `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- For Gmail: Verify you used an **App Password** (not regular Gmail password)
- For Gmail: Ensure **2-Step Verification** is enabled
- Test your credentials with the Gmail SMTP checker

### ❌ "Email delivery failed" (but token generated)
- Check internet connection
- Verify SMTP credentials
- Check if your email service has rate limits
- Look at server logs for specific error message

### ❌ No email received
1. Check **Spam/Junk folder**
2. Verify email address is correct
3. Check server logs for delivery confirmation
4. Test with a different email address
5. Check your email service's outbound email limits

### ❌ "535 Authentication failed"
- For Gmail: Your **App Password** might be wrong
- For Gmail: Verify you copied the full 16 characters
- Ensure no extra spaces in `.env` file

---

## Production Deployment

### ⚠️ Important Security Notes

1. **Never commit credentials to Git**
   - Keep `.env` file in `.gitignore` ✅
   - Use environment variables in production

2. **Use a Dedicated Email Service**
   - SendGrid, Mailgun, or AWS SES for production
   - Gmail is suitable for development only

3. **Update Email Addresses**
   - Change from `noreply@microfinance.com` placeholder
   - Use your actual company domain

4. **Enable HTTPS**
   - All password reset links must use HTTPS in production
   - Update `emailService.js` reset link generation:
   ```javascript
   const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
   const resetLink = `${protocol}://${process.env.APP_DOMAIN}/customer/reset-password?token=${resetToken}`;
   ```

5. **Token Expiration**
   - Current: 30 minutes
   - Adjust in `Customer.js` model if needed

---

## API Endpoints

### Customer Forgot Password
```
POST /api/auth/customer/forgot-password
Content-Type: application/json

{
  "email": "customer@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset link sent",
  "info": "Check your email for password reset instructions"
}
```

### Admin Forgot Password
```
POST /api/auth/admin/forgot-password
Content-Type: application/json

{
  "email": "admin@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset link sent",
  "info": "Check your email for password reset instructions"
}
```

### Reset Password
```
POST /api/auth/customer/reset-password
Content-Type: application/json

{
  "token": "generated-reset-token",
  "password": "new-password",
  "confirmPassword": "new-password"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## File Structure

```
server/
├── utils/
│   └── emailService.js          ← New email utility
├── controllers/
│   └── authController.js        ← Updated with email
├── models/
│   ├── Customer.js              ← Has reset token fields
│   └── Admin.js                 ← Has reset token fields
└── app.js                       ← Routes configured
```

---

## Environment Variables

Add to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Optional - For custom email service
# EMAIL_SERVICE=gmail
# EMAIL_FROM=noreply@yourdomain.com
# EMAIL_PORT=587
```

---

## Next Steps

1. ✅ Set up Gmail App Password
2. ✅ Update `.env` file with credentials
3. ✅ Restart the server
4. ✅ Test the forgot password flow
5. ✅ Verify email is delivered
6. ✅ Test the reset password link
7. ✅ Confirm you can login with new password

---

## Support

If you encounter issues:

1. Check server logs for error messages
2. Verify `.env` file has correct credentials
3. Test with Ethereal email first to eliminate SMTP issues
4. Check email service provider's documentation
5. Verify firewall/network allows outbound SMTP connections

---

**Last Updated:** January 18, 2026
**Version:** 1.0.0
