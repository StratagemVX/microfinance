# 🔧 Email Delivery Troubleshooting Guide

## Quick Diagnosis

### Check Server Logs on Startup

Look for this line:
```
📧 Email Service: [Gmail SMTP / Ethereal (TEST MODE) / ERROR]
```

---

## Issue 1: "Email Credentials Missing"

**You See This:**
```
⚠️  Email Credentials Missing!
   To send real emails, set EMAIL_USER and EMAIL_PASSWORD in .env
```

**What It Means:**
- Placeholder values in .env (your-email@gmail.com, your-app-specific-password)
- System is in Test Mode
- Reset links shown in console, but no real emails sent

**How to Fix:**

1. Get real Gmail credentials:
   ```
   https://myaccount.google.com/apppasswords
   ```

2. Update .env with real values:
   ```env
   EMAIL_USER=rahulgavari207@gmail.com
   EMAIL_PASSWORD=pvke nfgh ijkl mnop
   ```

3. Restart server:
   ```bash
   npm run dev
   ```

4. Verify:
   ```
   📧 Email Service: Gmail SMTP
   ✅ Email service is configured and ready
   ```

---

## Issue 2: "535 Authentication failed"

**You See This:**
```
Error: 535-5.7.8 Username and password not accepted
```

**Possible Causes:**
1. ❌ Using regular Gmail password instead of App Password
2. ❌ App Password copied incorrectly
3. ❌ 2-Step Verification not enabled
4. ❌ Spaces in password not preserved

**How to Fix:**

1. **Verify 2-Step Verification is ON:**
   - Go to: https://myaccount.google.com/security
   - Check "2-Step Verification"
   - If OFF, enable it first

2. **Generate New App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Make sure Mail is selected
   - Make sure device is selected
   - Click Generate
   - **Copy EXACTLY** (including spaces)

3. **Update .env Carefully:**
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=aaaa bbbb cccc dddd
   ```
   - No extra spaces
   - Include the spaces FROM the password
   - Don't add quotes

4. **Restart Server:**
   ```bash
   npm run dev
   ```

---

## Issue 3: "Email not received"

**You're Sending Emails But They Don't Arrive**

**Check 1: Spam/Junk Folder**
- In Gmail, check Spam folder
- Mark email as "Not Spam"
- Add sender to contacts

**Check 2: Wrong Email Address**
- Verify recipient email in form
- Check for typos
- Make sure email exists

**Check 3: Email Service Status**
- Check server logs: `✅ Password reset email sent to`
- If not showing, email sending failed
- Review error messages in logs

**Check 4: Firewall/Network**
- Your internet may block SMTP
- Try on different network
- Check if ISP blocks port 587

**Solutions:**

1. **Test with Test Email First:**
   - System auto-detects missing credentials
   - Shows reset link in console
   - Verifies email flow works

2. **Check Gmail App Specific Password:**
   - Regenerate at https://myaccount.google.com/apppasswords
   - Copy exactly as shown
   - Don't modify or add extra characters

3. **Use Different Email:**
   - Try with a different Gmail account
   - Verify credentials work on that account

---

## Issue 4: "ECONNREFUSED" or "connect ETIMEDOUT"

**You See This:**
```
Error: connect ECONNREFUSED 127.0.0.1:587
or
Error: connect ETIMEDOUT
```

**Possible Causes:**
1. No internet connection
2. Firewall blocking SMTP
3. ISP blocking port 587
4. DNS issues

**How to Fix:**

1. **Check Internet Connection:**
   ```bash
   ping google.com
   ```
   If fails → Internet is down

2. **Try Different Network:**
   - Use mobile hotspot
   - Try different WiFi
   - Verify issue isn't your network

3. **Check Firewall:**
   - Disable Windows Firewall temporarily
   - Test email again
   - Re-enable if it works (adjust settings)

4. **Try Different Port:**
   - Gmail also works on port 465 with TLS
   - Contact your ISP if port 587 blocked

---

## Issue 5: "INVALID CREDENTIALS"

**You See This:**
```
Error: Invalid login - 535-5.7.8 Username and password not accepted
```

**Double-Check:**
1. EMAIL_USER exactly matches Gmail address
2. EMAIL_PASSWORD is App Password (16 chars)
3. No extra spaces at start/end
4. Preserve internal spaces in password
5. 2-Step Verification is enabled

**Test Credentials:**
1. Go to: https://accounts.google.com/
2. Sign out
3. Sign in with EMAIL_USER
4. Use EMAIL_PASSWORD
5. If login fails → Credentials wrong

---

## Issue 6: "Test Mode" Won't Switch to Gmail

**You Added Credentials But Still See:**
```
📧 Email Service: Ethereal (TEST MODE)
```

**Fix:**

1. **Restart server completely:**
   ```bash
   # Kill all node processes
   Get-Process -Name node | Stop-Process -Force
   
   # Start server
   npm run dev
   ```

2. **Verify .env file:**
   - Open `.env` in editor
   - Check EMAIL_USER has no placeholder text
   - Check EMAIL_PASSWORD has no placeholder text
   - Save file

3. **Check exact values:**
   ```env
   EMAIL_USER=rahulgavari207@gmail.com
   EMAIL_PASSWORD=pvke nfgh ijkl mnop
   ```
   - Should be real values, not "your-email"
   - Should be real password, not "your-password"

---

## Issue 7: "Email Service Verification Failed"

**You See This:**
```
❌ Email service error: Error message here
```

**How to Fix:**

1. **Check .env syntax:**
   - No quotes around values
   - No extra spaces
   - No special characters

2. **Verify Gmail Settings:**
   - 2-Step Verification enabled
   - App Password generated
   - Correct app password copied

3. **Test with Console:**
   - Node REPL test:
   ```javascript
   const nodemailer = require('nodemailer');
   const t = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: 'your-email@gmail.com',
       pass: 'app-password'
     }
   });
   t.verify((err, ok) => {
     if (ok) console.log('✅ Works!');
     else console.log('❌', err);
   });
   ```

---

## Testing Checklist

- [ ] Server shows correct email provider
- [ ] No "Email Credentials Missing" warning
- [ ] .env has real credentials (not placeholders)
- [ ] 2-Step Verification enabled on Gmail
- [ ] App Password generated (16 chars)
- [ ] Password copied exactly
- [ ] Server restarted after .env update
- [ ] Password reset form submitted
- [ ] Email sent successfully in logs
- [ ] Email received in inbox (1-2 min)
- [ ] Reset link in email works

---

## Contact & Support

### If Problem Persists:

1. **Collect Information:**
   - Full error message from logs
   - Value of EMAIL_USER from .env
   - Screenshot of error

2. **Try Alternative:**
   - Use Test Mode (already working)
   - Use Ethereal for testing
   - Use different Gmail account

3. **Last Resort:**
   - Use professional email service
   - SendGrid, Mailgun, AWS SES
   - More reliable for production anyway

---

## Common Solutions

**Most Common Issues (95% of cases):**

1. **Using wrong password** → Use App Password from apppasswords
2. **Placeholder values in .env** → Replace with real Gmail credentials
3. **2-Step not enabled** → Enable it at myaccount.google.com/security
4. **Server not restarted** → Do: `npm run dev`
5. **Email in spam folder** → Check spam, mark as "Not Spam"

**Do This First:**
1. Check server log for provider info
2. If Ethereal → Add Gmail credentials
3. If Gmail but failing → Verify App Password
4. If error message → Check credential format

---

**Status:** ✅ Email service is now resilient with better error handling
**Current Mode:** Automatic detection (Gmail if credentials valid, Ethereal if not)
**Next Step:** Add real Gmail credentials for production
