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
 * Send Password Reset Email - Customer
 * @param {string} email - Customer email
 * @param {string} resetToken - Password reset token
 * @param {number} port - Server port
 */
const sendCustomerPasswordResetEmail = async (email, resetToken) => {
  try {
    // Check if email service is properly configured
    if (!transporter) {
      const resetLink = buildAppUrl(`/customer/reset-password?token=${resetToken}`);
      console.warn('⚠️  SMTP not configured. Logging reset link for development.');
      console.log('🔗 Password reset link (Customer):', resetLink);
      return { success: true, delivered: false, testMode: true, previewUrl: null, resetLink };
    }

    const resetLink = buildAppUrl(`/customer/reset-password?token=${resetToken}`);
    const mailOptions = {
      from: emailUser || 'noreply@microfinance.com',
      to: email,
      subject: 'Password Reset Request - MicroFinance System',
      html: `...existing code...`,
      text: `...existing code...`
    };

    // Attempt to send via Gmail SMTP
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to', email);
      console.log('📨 Message ID:', info.messageId);
      return { success: true, messageId: info.messageId, delivered: true };
    } catch (error) {
      if (error && error.code === 'EAUTH' && /535/.test(error.message || '')) {
        console.error('==============================');
        console.error('Gmail Authentication Failed!');
        console.error('A normal Gmail password will NOT work.');
        console.error('A Gmail App Password is REQUIRED.');
        console.error('2-Step Verification must be ENABLED on your Google Account.');
        console.error('--- How to fix ---');
        console.error('1. Go to your Google Account → Security → App passwords');
        console.error('2. Generate a NEW App Password for Mail');
        console.error('3. Copy the 16-character password exactly (no spaces)');
        console.error('4. Update EMAIL_USER and EMAIL_PASSWORD in your .env file');
        console.error('5. Save and RESTART the server');
        console.error('==============================');
      } else {
        console.error('❌ Error in password reset email:', error.message);
      }
      // Fallback: log the reset link for development
      console.log('Falling back to logging reset link for development:');
      console.log('🔗 Password reset link (Customer):', resetLink);
      return { success: false, delivered: false, testMode: true, previewUrl: null, resetLink };
    }
  } catch (error) {
    console.error('❌ Error in password reset email:', error.message);
    console.log('📌 Configuration Status:', emailConfigStatus);
    throw error;
  }
};

/**
 * Send Password Reset Email - Admin
 * @param {string} email - Admin email
 * @param {string} resetToken - Password reset token
 * @param {number} port - Server port
 */
const sendAdminPasswordResetEmail = async (email, resetToken) => {
  try {
    // Check if email service is properly configured
    if (!transporter) {
      const resetLink = buildAppUrl(`/admin/reset-password?token=${resetToken}`);
      console.warn('⚠️  SMTP not configured. Logging reset link for development.');
      console.log('🔗 Password reset link (Admin):', resetLink);
      return { success: true, delivered: false, testMode: true, previewUrl: null, resetLink };
    }

    const resetLink = buildAppUrl(`/admin/reset-password?token=${resetToken}`);
    
    const mailOptions = {
      from: emailUser || 'noreply@microfinance.com',
      to: email,
      subject: 'Admin Password Reset Request - MicroFinance System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Admin Password Reset Request</h2>
            
            <p style="color: #666; font-size: 14px;">
              We received a request to reset your admin password for the MicroFinance system.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Click the button below to reset your password. This link will expire in 30 minutes.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;
                        display: inline-block;">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy this link in your browser:
            </p>
            <p style="color: #dc2626; font-size: 12px; word-break: break-all;">
              ${resetLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              If you didn't request this password reset, please ignore this email or contact support immediately.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">
              © 2024 MicroFinance System. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Admin Password Reset Request
        
        We received a request to reset your admin password. Click the link below to reset your password.
        This link will expire in 30 minutes.
        
        ${resetLink}
        
        If you didn't request this, please ignore this email and contact support.
      `
    };

    // Attempt to send via Gmail SMTP
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin password reset email sent to', email);
    console.log('📨 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId, delivered: true };
  } catch (error) {
    console.error('❌ Error in admin password reset email:', error.message);
    console.log('📌 Configuration Status:', emailConfigStatus);
    try {
      // Check if email service is properly configured
      if (!transporter) {
        const resetLink = buildAppUrl(`/admin/reset-password?token=${resetToken}`);
        console.warn('⚠️  SMTP not configured. Logging reset link for development.');
        console.log('🔗 Password reset link (Admin):', resetLink);
        return { success: true, delivered: false, testMode: true, previewUrl: null, resetLink };
      }

      const resetLink = buildAppUrl(`/admin/reset-password?token=${resetToken}`);
      const mailOptions = {
        from: emailUser || 'noreply@microfinance.com',
        to: email,
        subject: 'Admin Password Reset Request - MicroFinance System',
        html: `...existing code...`,
        text: `...existing code...`
      };

      // Attempt to send via Gmail SMTP
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Admin password reset email sent to', email);
        console.log('📨 Message ID:', info.messageId);
        return { success: true, messageId: info.messageId, delivered: true };
      } catch (error) {
        if (error && error.code === 'EAUTH' && /535/.test(error.message || '')) {
          console.error('==============================');
          console.error('Gmail Authentication Failed!');
          console.error('A normal Gmail password will NOT work.');
          console.error('A Gmail App Password is REQUIRED.');
          console.error('2-Step Verification must be ENABLED on your Google Account.');
          console.error('--- How to fix ---');
          console.error('1. Go to your Google Account → Security → App passwords');
          console.error('2. Generate a NEW App Password for Mail');
          console.error('3. Copy the 16-character password exactly (no spaces)');
          console.error('4. Update EMAIL_USER and EMAIL_PASSWORD in your .env file');
          console.error('5. Save and RESTART the server');
          console.error('==============================');
        } else {
          console.error('❌ Error in admin password reset email:', error.message);
        }
        // Fallback: log the reset link for development
        console.log('Falling back to logging reset link for development:');
        console.log('🔗 Password reset link (Admin):', resetLink);
        return { success: false, delivered: false, testMode: true, previewUrl: null, resetLink };
      }
    } catch (error) {
      console.error('❌ Error in admin password reset email:', error.message);
      console.log('📌 Configuration Status:', emailConfigStatus);
      throw error;
    }
    return false;
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

