/**
 * Email Service
 * Handles sending emails for password reset and notifications
 * Supports Gmail SMTP and Ethereal for testing
 */

const nodemailer = require('nodemailer');
const { buildAppUrl } = require('./urlUtils');

// ============================================
// EMAIL CONFIGURATION DETECTION
// ============================================

// Check if credentials are placeholder values
const isPlaceholder = (value) => {
  if (!value) return true;
  const placeholders = [
    'your-email@gmail.com',
    'your-app-specific-password',
    'your-email',
    'your-password',
    'your-app-password'
  ];
  return placeholders.some(ph => value.includes(ph) || value.includes(ph.toLowerCase()));
};

// Support both EMAIL_PASSWORD and APP_PASSWORD env vars
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD || process.env.APP_PASSWORD;
const hasValidCredentials = emailUser && emailPassword && !isPlaceholder(emailUser) && !isPlaceholder(emailPassword);

// ============================================
// TRANSPORTER SETUP - Gmail SMTP
// ============================================

let transporter;

let emailConfigStatus = {
  configured: false,
  provider: 'none',
  reason: ''
};

if (hasValidCredentials) {
  // Use Gmail with real credentials (Gmail App Password required)
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
  emailConfigStatus = {
    configured: true,
    provider: 'Gmail',
    reason: 'Valid Gmail App Password detected'
  };
  console.log('📧 Email Service: Gmail SMTP');

  // Test connection immediately
  transporter.verify((error) => {
    if (error) {
      console.error('==============================');
      console.error('Gmail Authentication Failed!');
      console.error('   Error:', error.message);
      if (error.message && error.message.includes('535')) {
        console.error('   Gmail rejected your credentials.');
        console.error('   A normal Gmail password will NOT work.');
        console.error('   A Gmail App Password is REQUIRED.');
        console.error('   2-Step Verification must be ENABLED on your Google Account.');
        console.error('--- How to fix ---');
        console.error('1. Go to your Google Account → Security → App passwords');
        console.error('2. Generate a NEW App Password for Mail');
        console.error('3. Copy the 16-character password exactly (no spaces)');
        console.error('4. Update EMAIL_USER and EMAIL_PASSWORD in your .env file');
        console.error('5. Save and RESTART the server');
      } else {
        console.error('   Check your EMAIL_USER and EMAIL_PASSWORD in .env.');
        console.error('   Restart the server after making changes.');
      }
      console.error('==============================');
      transporter = null;
      emailConfigStatus = {
        configured: false,
        provider: 'none',
        reason: 'Gmail auth failed; falling back to console logging.'
      };
    } else {
      console.log('✅ Gmail connection verified - Ready to send emails!');
    }
  });
} else {
  // No credentials: fall back to console logging (do not fail requests)
  transporter = null;
  emailConfigStatus = {
    configured: false,
    provider: 'none',
    reason: 'No Gmail credentials provided; using console logging fallback.'
  };
  console.log('==============================');
  console.log('📧 Email Service: SMTP not configured');
  console.log('Email Credentials Missing!');
  console.log('Real emails require EMAIL_USER and EMAIL_PASSWORD in your .env file.');
  console.log('After updating .env, you MUST restart the server.');
  console.log('==============================');
}


/**
 * Build password reset email payload without logging sensitive reset tokens.
 */
const sendPasswordResetEmail = async ({
  email,
  resetToken,
  resetPath,
  subject,
  headline,
  introText,
  accentColor,
  plainIntro,
}) => {
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP email service is not configured for production password reset delivery.');
    }
    console.warn('⚠️  SMTP not configured; skipping email dispatch (reset token omitted from logs).');
    return { success: false, delivered: false, testMode: true, previewUrl: null };
  }

  const resetLink = buildAppUrl(`${resetPath}?token=${encodeURIComponent(resetToken)}`);
  const mailOptions = {
    from: emailUser || 'noreply@microfinance.com',
    to: email,
    subject,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">${headline}</h2>
            <p style="color: #666; font-size: 14px;">${introText}</p>
            <p style="color: #666; font-size: 14px;">
              Click the button below to reset your password. This link will expire in 30 minutes.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}"
                 style="background-color: ${accentColor}; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; font-weight: bold;
                        display: inline-block;">
                Reset Your Password
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              If you didn't request this password reset, please ignore this email or contact support immediately.
            </p>
          </div>
        </div>
      `,
    text: `${plainIntro}\n\nReset your password within 30 minutes:\n${resetLink}\n\nIf you didn't request this, please ignore this email.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email dispatched. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId, delivered: true };
  } catch (error) {
    if (error && error.code === 'EAUTH' && /535/.test(error.message || '')) {
      console.error('❌ Gmail SMTP authentication failed (App Password required).');
    } else {
      console.error('❌ Password reset email delivery failed:', error.name || 'Error');
    }
    return {
      success: false,
      delivered: false,
      testMode: process.env.NODE_ENV !== 'production',
      previewUrl: null,
    };
  }
};

/**
 * Send Password Reset Email - Customer
 */
const sendCustomerPasswordResetEmail = async (email, resetToken) =>
  sendPasswordResetEmail({
    email,
    resetToken,
    resetPath: '/customer/reset-password',
    subject: 'Password Reset Request - MicroFinance System',
    headline: 'Password Reset Request',
    introText: 'We received a request to reset your customer account password for the MicroFinance system.',
    accentColor: '#2563eb',
    plainIntro: 'Password Reset Request - MicroFinance System',
  });

/**
 * Send Password Reset Email - Admin
 */
const sendAdminPasswordResetEmail = async (email, resetToken) =>
  sendPasswordResetEmail({
    email,
    resetToken,
    resetPath: '/admin/reset-password',
    subject: 'Admin Password Reset Request - MicroFinance System',
    headline: 'Admin Password Reset Request',
    introText: 'We received a request to reset your admin password for the MicroFinance system.',
    accentColor: '#dc2626',
    plainIntro: 'Admin Password Reset Request',
  });

/**
 * Verify SMTP transporter configuration without exposing credentials.
 */
const verifyEmailConfig = async () => {
  if (!transporter) {
    return {
      configured: false,
      verified: false,
      reason: emailConfigStatus.reason,
    };
  }
  await transporter.verify();
  return { configured: true, verified: true };
};

/**
 * Get email configuration status
 */
const getEmailStatus = () => {
  return {
    ...emailConfigStatus,
    usingRealEmail: hasValidCredentials,
    testMode: !hasValidCredentials && process.env.NODE_ENV !== 'production'
  };
};

module.exports = {
  sendCustomerPasswordResetEmail,
  sendAdminPasswordResetEmail,
  verifyEmailConfig,
  getEmailStatus,
  transporter
};

