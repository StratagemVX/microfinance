# Email Configuration - Quick Reference

## ⚡ 30-Second Setup (Gmail)

1. **Enable 2-Step Verification**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Get App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select Mail + Windows Computer
   - Copy the 16-character password

3. **Update .env**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

4. **Restart Server**
   ```bash
   npm run dev
   ```

5. **Done!** ✅
   - Server will log: "✅ Email service is configured and ready"
   - Test at: http://localhost:5000/customer/forgot-password

---

## 🧪 Quick Testing

### Test with Real Email (Gmail)
```bash
# Step 1: Update .env with Gmail App Password
# Step 2: Restart server
# Step 3: Click "Forgot Password" → Check inbox
```

### Test with Test Email (Ethereal)
```bash
# Step 1: Create account at https://ethereal.email
# Step 2: Update emailService.js with Ethereal credentials
# Step 3: Restart server
# Step 4: Check server console for email preview link
```

---

## 📧 What Happens When User Resets Password

```
Customer enters email
         ↓
Server generates reset token
         ↓
⭐ EMAIL SENT with reset link
         ↓
Customer receives email (1-2 minutes)
         ↓
Customer clicks link
         ↓
Customer sets new password
         ↓
✅ Password updated!
         ↓
Customer can login with new password
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module nodemailer" | `npm install nodemailer --save` |
| Email not sent | Check .env EMAIL_USER and EMAIL_PASSWORD |
| Gmail auth fails | Verify you used App Password (not Gmail password) |
| Email in spam folder | Mark as "Not Spam" or whitelist sender |
| No email received | Try Ethereal first to test email sending |

---

## 📁 Files Updated

- ✅ `package.json` - Added nodemailer
- ✅ `server/utils/emailService.js` - NEW email service
- ✅ `server/controllers/authController.js` - Now sends emails
- ✅ `.env` - Added EMAIL_USER and EMAIL_PASSWORD
- ✅ `EMAIL_SETUP_GUIDE.md` - Full setup guide
- ✅ `EMAIL_IMPLEMENTATION.md` - Implementation details

---

## 🚀 Production Deployment

Before deploying to production:

1. **Set up professional email service**
   - SendGrid, Mailgun, AWS SES, or similar
   - (Gmail is only for development)

2. **Configure environment variables**
   - EMAIL_USER
   - EMAIL_PASSWORD
   - APP_DOMAIN (for production URLs)

3. **Enable HTTPS**
   - All reset links must use HTTPS

4. **Test thoroughly**
   - Test forgot password flow
   - Test reset password link
   - Test with different email providers

---

## 📞 Need Help?

See detailed guides:
- 📖 `EMAIL_SETUP_GUIDE.md` - Complete setup instructions
- 📚 `EMAIL_IMPLEMENTATION.md` - Technical implementation details
- 🔗 Nodemailer: https://nodemailer.com/

---

**Current Status:** ✅ Ready to Use
**Last Updated:** January 18, 2026
