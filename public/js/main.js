/**
 * Main JavaScript
 * Client-side utilities and event handlers
 */

// API Base URL
const API_URL = '/api';

/**
 * Fetch with token
 * Automatically includes JWT token in headers
 */
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Check authentication
 */
function isCustomerLoggedIn() {
  return !!localStorage.getItem('token');
}

function isAdminLoggedIn() {
  return !!localStorage.getItem('adminToken');
}

/**
 * Logout utility
 */
function logout(isAdmin = false) {
  if (isAdmin) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  window.location.href = isAdmin ? '/admin/login' : '/customer/login';
}

/**
 * Show notification
 * Uses enhanced notification manager if available, falls back to simple notification
 */
function showNotification(message, type = 'info', title = '') {
  // Use notification manager if loaded
  if (typeof notificationManager !== 'undefined') {
    const notifTitle = title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info');
    switch(type) {
      case 'success':
        return notificationManager.success(notifTitle, message);
      case 'error':
        return notificationManager.error(notifTitle, message);
      case 'warning':
        return notificationManager.warning(notifTitle, message);
      case 'info':
        return notificationManager.info(notifTitle, message);
      case 'loading':
        return notificationManager.loading(notifTitle, message);
      default:
        return notificationManager.info(notifTitle, message);
    }
  }
  
  // Fallback notification
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 
    ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Show API error with detailed feedback
 */
function handleApiError(error, customMessage = '') {
  if (error.response) {
    const data = error.response.data || {};
    const message = data.message || customMessage || 'An error occurred';
    const details = data.details || data.error || '';
    
    // If notification manager is available, use it for better UX
    if (typeof notificationManager !== 'undefined') {
      notificationManager.error('Request Failed', message, {
        actions: details ? [{ label: 'Details', action: () => console.log(details) }] : []
      });
    } else {
      showNotification(`${message}${details ? ': ' + details : ''}`, 'error');
    }
    
    console.error('API Error:', { message, details, error });
  } else {
    showNotification(customMessage || 'Network error. Please check your connection.', 'error');
  }
}

/**
 * Show API success with detailed feedback
 */
function handleApiSuccess(response, customMessage = '') {
  const message = customMessage || response.message || 'Operation successful';
  showNotification(message, 'success');
  return response;
}

/**
 * Validate email
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone
 */
function isValidPhone(phone) {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone);
}

/**
 * Validate pincode
 */
function isValidPincode(pincode) {
  const regex = /^[0-9]{6}$/;
  return regex.test(pincode);
}

// Document ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize tooltips if Bootstrap is available
  if (typeof bootstrap !== 'undefined') {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});
