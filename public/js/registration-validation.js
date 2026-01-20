/**
 * Customer Registration Form Validation & UX Enhancement
 */

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');

  // Password strength meter
  if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
  }

  // Real-time email validation
  if (emailInput) {
    emailInput.addEventListener('blur', validateEmailField);
    emailInput.addEventListener('input', debounce(validateEmailOnInput, 500));
  }

  // Real-time phone validation
  if (phoneInput) {
    phoneInput.addEventListener('input', validatePhoneField);
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
});

/**
 * Update password strength meter
 */
function updatePasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');

  let strength = calculatePasswordStrength(password);

  // Update visual indicator
  strengthFill.className = 'strength-fill ' + strength.level;
  strengthText.className = 'strength-text ' + strength.level;
  strengthText.textContent = strength.text;

  // Show helpful tips
  if (password.length > 0) {
    showPasswordRequirements(password);
  }
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
  let score = 0;
  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[@#$%^&*]/.test(password),
    isLongEnough: password.length >= 8
  };

  // Count passing checks
  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  if (score <= 1) return { level: 'weak', text: 'Weak', score: score };
  if (score <= 2) return { level: 'fair', text: 'Fair', score: score };
  if (score <= 3) return { level: 'good', text: 'Good', score: score };
  return { level: 'strong', text: 'Strong', score: score };
}

/**
 * Show password requirements feedback
 */
function showPasswordRequirements(password) {
  const requirements = [
    { regex: /[a-z]/, text: 'Lowercase letter' },
    { regex: /[A-Z]/, text: 'Uppercase letter' },
    { regex: /[0-9]/, text: 'Number' },
    { regex: /@|#|\$|%|\^|&|\*/, text: 'Special character (@, #, $, %, etc.)' },
    { regex: /.{8,}/, text: '8+ characters' }
  ];

  const missing = requirements.filter(req => !req.regex.test(password)).map(req => req.text);

  if (missing.length > 0) {
    const helperText = document.querySelector('[for="password"] + .password-strength-meter + .helper-text');
    if (helperText) {
      helperText.innerHTML = `<strong>Missing:</strong> ${missing.join(', ')}`;
      helperText.style.color = '#ef4444';
    }
  } else {
    const helperText = document.querySelector('[for="password"] + .password-strength-meter + .helper-text');
    if (helperText) {
      helperText.innerHTML = '✓ Password meets all requirements';
      helperText.style.color = '#10b981';
    }
  }
}

/**
 * Validate password match
 */
function validatePasswordMatch() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const feedbackDiv = document.getElementById('confirmPasswordFeedback');
  const errorEl = document.getElementById('confirmPasswordError');
  const successEl = document.getElementById('confirmPasswordSuccess');

  if (confirmPassword.length === 0) {
    feedbackDiv.classList.add('hidden');
    return;
  }

  if (password === confirmPassword) {
    errorEl.textContent = '';
    successEl.textContent = '✓ Passwords match';
    feedbackDiv.classList.remove('hidden');
  } else {
    successEl.textContent = '';
    errorEl.textContent = '✗ Passwords do not match';
    feedbackDiv.classList.remove('hidden');
  }
}

/**
 * Validate email field on blur
 */
function validateEmailField(e) {
  const email = e.target.value;
  const feedbackDiv = document.getElementById('emailFeedback');
  const errorEl = document.getElementById('emailError');

  if (!email) return;

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValid) {
    errorEl.textContent = 'Please enter a valid email address';
    feedbackDiv.classList.remove('hidden');
  } else {
    feedbackDiv.classList.add('hidden');
  }
}

/**
 * Validate email on input with debounce
 */
function validateEmailOnInput(e) {
  const email = e.target.value;
  const feedbackDiv = document.getElementById('emailFeedback');
  const successEl = document.getElementById('emailSuccess');

  if (!email || email.length < 5) {
    feedbackDiv.classList.add('hidden');
    return;
  }

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (isValid) {
    successEl.textContent = '✓ Email format is valid';
    feedbackDiv.classList.remove('hidden');
  }
}

/**
 * Validate phone field
 */
function validatePhoneField(e) {
  const phone = e.target.value;
  const feedbackDiv = document.getElementById('phoneFeedback');
  const errorEl = document.getElementById('phoneError');
  const successEl = document.getElementById('phoneSuccess');

  // Remove any non-numeric characters
  const cleanedPhone = phone.replace(/\D/g, '');

  if (cleanedPhone.length > 0 && cleanedPhone.length < 10) {
    errorEl.textContent = `${cleanedPhone.length}/10 digits`;
    successEl.textContent = '';
    feedbackDiv.classList.remove('hidden');
  } else if (cleanedPhone.length === 10) {
    errorEl.textContent = '';
    successEl.textContent = '✓ Valid phone number';
    feedbackDiv.classList.remove('hidden');
  } else if (cleanedPhone.length > 10) {
    errorEl.textContent = 'Phone number must be exactly 10 digits';
    successEl.textContent = '';
    feedbackDiv.classList.remove('hidden');
  } else {
    feedbackDiv.classList.add('hidden');
  }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Handle form submission with enhanced feedback
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Show loading state
  const submitBtn = document.querySelector('button[type="submit"]') || document.querySelector('[onclick*="submitForm"]');
  if (submitBtn && typeof notificationManager !== 'undefined') {
    const loadingId = notificationManager.loading('Creating Account', 'Please wait while we create your account...');
  }

  // Get form data
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);

  // Basic validation
  if (data.password !== data.confirmPassword) {
    if (typeof showNotification !== 'undefined') {
      showNotification('Passwords do not match. Please try again.', 'error', 'Validation Error');
    } else {
      alert('Passwords do not match');
    }
    return;
  }

  try {
    const response = await fetch('/api/auth/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Success - show detailed feedback
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.customer));

      if (typeof notificationManager !== 'undefined') {
        notificationManager.success('Account Created! 🎉', 
          `Welcome, ${result.customer.firstName}! Redirecting to your dashboard...`);
      } else {
        showNotification('Registration successful!', 'success');
      }

      setTimeout(() => {
        window.location.href = '/customer/dashboard';
      }, 2000);
    } else {
      // Error - show specific feedback
      const errorMessage = result.message || 'Registration failed';
      const errorDetails = result.details || result.error || '';

      if (typeof notificationManager !== 'undefined') {
        notificationManager.error('Registration Failed', errorMessage, {
          actions: errorDetails ? [{ label: 'Details', action: () => console.log(errorDetails) }] : []
        });
      } else {
        showNotification(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`, 'error');
      }

      // Highlight problematic field if available
      if (result.field) {
        const fieldElement = document.querySelector(`input[name="${result.field}"]`);
        if (fieldElement) {
          fieldElement.classList.add('border-red-500');
          fieldElement.focus();
        }
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    if (typeof notificationManager !== 'undefined') {
      notificationManager.error('Network Error', 'Failed to connect to server. Please check your connection and try again.');
    } else {
      showNotification('Network error. Please try again.', 'error');
    }
  }
}
