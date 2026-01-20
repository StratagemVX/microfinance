/**
 * Notification Message Templates
 * Centralized messages for consistent customer communication
 */

const notificationMessages = {
  // Authentication Messages
  auth: {
    register: {
      success: {
        title: 'Registration Successful',
        message: 'Welcome! Your account has been created. You can now login with your credentials.'
      },
      emailExists: {
        title: 'Email Already Registered',
        message: 'This email is already associated with another account. Please use a different email or try logging in.'
      },
      invalidEmail: {
        title: 'Invalid Email Format',
        message: 'Please enter a valid email address (e.g., name@example.com)'
      },
      passwordWeak: {
        title: 'Password Too Weak',
        message: 'Password must contain: uppercase letter, lowercase letter, number, and special character (@, #, $, %, etc.)'
      },
      phoneInvalid: {
        title: 'Invalid Phone Number',
        message: 'Phone number must be exactly 10 digits without spaces or special characters.'
      },
      phoneExists: {
        title: 'Phone Number Already Registered',
        message: 'This phone number is already registered. Please use a different number.'
      }
    },
    login: {
      success: {
        title: 'Login Successful',
        message: 'Welcome back! Redirecting to your dashboard...'
      },
      invalidCredentials: {
        title: 'Login Failed',
        message: 'Email or password is incorrect. Please try again or reset your password.'
      },
      accountInactive: {
        title: 'Account Inactive',
        message: 'Your account has been deactivated. Please contact customer support for assistance.'
      },
      tooManyAttempts: {
        title: 'Too Many Failed Attempts',
        message: 'Your account has been temporarily locked for security. Please try again after 15 minutes or reset your password.'
      }
    }
  },

  // Loan Application Messages
  loan: {
    application: {
      submitted: {
        title: 'Application Submitted Successfully',
        message: 'Your loan application for ₹{amount} has been received. Expected review within 2-3 business days. Track status in your dashboard.'
      },
      updated: {
        title: 'Application Updated',
        message: 'Your loan application has been updated successfully. Review the latest details in your dashboard.'
      },
      rejected: {
        title: 'Application Could Not Be Processed',
        message: 'Your loan application could not be processed at this time. Reasons: {reasons}. You can reapply after {date}. Please contact support for more information.'
      },
      incompleteData: {
        title: 'Incomplete Information',
        message: 'Your application is missing required information. Please complete: {fields}. This step usually takes 5-10 minutes.'
      }
    },
    approval: {
      approved: {
        title: '🎉 Loan Approved!',
        message: 'Congratulations! Your loan of ₹{amount} has been approved.\n\nDetails:\n• Interest Rate: {rate}% p.a.\n• Tenure: {tenure} months\n• EMI: ₹{emi}\n\nNext: Complete KYC verification to receive funds.'
      },
      conditionalApproval: {
        title: 'Conditional Approval',
        message: 'Your loan has been conditionally approved pending: {conditions}. Please complete these within 48 hours to proceed.'
      },
      underReview: {
        title: 'Application Under Review',
        message: 'Your loan application is being reviewed by our loan officer. Expected decision: {date}. We\'ll notify you as soon as a decision is made.'
      }
    },
    kyc: {
      pending: {
        title: 'KYC Verification Pending',
        message: 'Your account is pending KYC verification. Please upload required documents: {documents}. This usually takes 24 hours to verify.'
      },
      documentsRejected: {
        title: 'Documents Rejected',
        message: 'Your {documentType} was rejected because: {reason}. Please resubmit a clear copy. {actionLink}'
      },
      verified: {
        title: '✓ KYC Verified',
        message: 'Your KYC verification is complete! You can now apply for loans or proceed with your pending application.'
      },
      missingDocuments: {
        title: 'Missing Documents',
        message: 'Your KYC verification is incomplete. Please submit: {documents}. Upload now to proceed.'
      }
    }
  },

  // Customer Profile Messages
  customer: {
    profile: {
      updated: {
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully.'
      },
      updateError: {
        title: 'Profile Update Failed',
        message: 'We couldn\'t update your profile. Please try again or contact support.'
      },
      completionProgress: {
        title: 'Profile Completion: {percentage}%',
        message: 'Next step: Complete {nextStep}. This usually takes 2-3 minutes.'
      }
    },
    document: {
      uploaded: {
        title: 'Document Uploaded',
        message: '{documentType} uploaded successfully. Verification in progress...'
      },
      uploadError: {
        title: 'Upload Failed',
        message: 'Failed to upload {documentType}. Ensure file is {format} and under {size}MB. Try again.'
      },
      uploadProgress: {
        title: 'Uploading {documentType}',
        message: 'Please wait while your document is being uploaded...'
      }
    }
  },

  // Admin Messages
  admin: {
    loan: {
      approved: {
        title: 'Loan Approved',
        message: 'Loan application #{loanId} for {customerName} (₹{amount}) has been approved. Customer notification sent.'
      },
      rejected: {
        title: 'Loan Rejected',
        message: 'Loan application #{loanId} for {customerName} has been rejected with reasons: {reasons}. Customer has been notified.'
      },
      approved_conditional: {
        title: 'Conditional Approval Issued',
        message: 'Loan #{loanId} conditionally approved. Customer must complete: {conditions} within 48 hours.'
      }
    },
    kyc: {
      verified: {
        title: 'KYC Verified',
        message: '{customerName}\'s KYC has been marked as verified. They can now proceed with loans.'
      },
      rejected: {
        title: 'KYC Documents Rejected',
        message: '{customerName}\'s {documentType} rejected: {reason}. Customer has been notified and can resubmit.'
      }
    },
    action: {
      success: {
        title: 'Action Completed',
        message: '{action} has been completed successfully.'
      },
      error: {
        title: 'Action Failed',
        message: 'Failed to {action}. Please try again or contact technical support.'
      }
    }
  },

  // Validation Messages
  validation: {
    fieldRequired: 'This field is required',
    minLength: 'Must be at least {min} characters',
    maxLength: 'Must not exceed {max} characters',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Phone number must be 10 digits',
    invalidAmount: 'Please enter a valid amount',
    invalidDate: 'Please select a valid date',
    passwordMatch: 'Passwords do not match',
    incomeValidation: 'Annual income must be at least ₹50,000',
    ageValidation: 'You must be at least 18 years old',
    agencyValidation: 'You must be employed or have business for at least 2 years',
    creditScoreValidation: 'Credit score must be at least 300'
  },

  // General Messages
  general: {
    loading: {
      title: 'Loading',
      message: 'Please wait while we fetch your information...'
    },
    saving: {
      title: 'Saving',
      message: 'Your changes are being saved...'
    },
    processing: {
      title: 'Processing',
      message: 'Your request is being processed. This may take a few moments...'
    },
    networkError: {
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.'
    },
    serverError: {
      title: 'Server Error',
      message: 'An unexpected error occurred on the server. Our team has been notified. Please try again later.'
    },
    unauthorized: {
      title: 'Unauthorized',
      message: 'You do not have permission to perform this action. Please contact an administrator.'
    },
    sessionExpired: {
      title: 'Session Expired',
      message: 'Your session has expired for security reasons. Please login again to continue.'
    }
  },

  // Email Notification Templates
  email: {
    loanApproved: {
      subject: 'Your Loan Application Has Been Approved! 🎉',
      body: `
Dear {firstName},

Great news! Your loan application for ₹{amount} has been approved.

Loan Details:
━━━━━━━━━━━━━━━━━━━━
Loan Amount: ₹{amount}
Interest Rate: {rate}% p.a.
Tenure: {tenure} months
Monthly EMI: ₹{emi}
Total Interest: ₹{totalInterest}
Total Amount: ₹{totalAmount}

Next Steps:
1. Complete your KYC verification (if not done)
2. Review and accept the loan terms
3. Funds will be transferred within 24 hours of KYC approval

Dashboard: {dashboardLink}
Questions? Contact: {supportEmail}

Best regards,
Micro-Finance Team
      `
    },
    loanRejected: {
      subject: 'Loan Application Status Update',
      body: `
Dear {firstName},

Thank you for applying for a loan with us. Unfortunately, we cannot process your application at this time.

Rejection Reasons:
━━━━━━━━━━━━━━━━━━━━
{reasons}

You can reapply after: {reapplyDate}

Tips to Improve:
• {suggestions}

Need Help? Contact our support team at {supportEmail}

Best regards,
Micro-Finance Team
      `
    },
    kycReminder: {
      subject: 'Complete Your KYC Verification - Action Required ⚠️',
      body: `
Dear {firstName},

Your loan has been approved! To complete the final step and receive your funds, please complete KYC verification.

Required Documents:
• {document1}
• {document2}
• {document3}

Upload documents: {uploadLink}

Expires in: 48 hours

Best regards,
Micro-Finance Team
      `
    },
    documentRejected: {
      subject: 'Document Resubmission Required',
      body: `
Dear {firstName},

Your {documentType} submission was rejected for the following reason:

Reason: {reason}

Please resubmit: {resubmitLink}

If you have questions, contact: {supportEmail}

Best regards,
Micro-Finance Team
      `
    }
  },

  /**
   * Get message by path with variable replacement
   * @param {string} path - Message path (e.g., 'loan.application.submitted')
   * @param {Object} variables - Variables to replace in message
   * @returns {Object} Message with title and message
   */
  getMessage(path, variables = {}) {
    const keys = path.split('.');
    let message = this;
    
    for (const key of keys) {
      message = message[key];
      if (!message) return null;
    }

    // Replace variables
    if (typeof message === 'object') {
      const result = { ...message };
      if (result.title) result.title = this.replaceVariables(result.title, variables);
      if (result.message) result.message = this.replaceVariables(result.message, variables);
      return result;
    }

    return this.replaceVariables(message, variables);
  },

  /**
   * Replace variables in message string
   * @param {string} text - Text with variables
   * @param {Object} variables - Variables to replace
   * @returns {string} Replaced text
   */
  replaceVariables(text, variables) {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }
};

// Export for use in Node.js/Express
if (typeof module !== 'undefined' && module.exports) {
  module.exports = notificationMessages;
}
