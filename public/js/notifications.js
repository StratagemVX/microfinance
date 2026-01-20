/**
 * Notification System
 * Provides toast notifications with multiple types and actions
 */

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.initContainer();
  }

  initContainer() {
    this.container = document.getElementById('notification-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  success(title, message, options = {}) {
    return this.show({
      type: 'success',
      title,
      message,
      icon: 'fa-check-circle',
      duration: options.duration || 3000,
      ...options
    });
  }

  /**
   * Show error notification with retry capability
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  error(title, message, options = {}) {
    return this.show({
      type: 'error',
      title,
      message,
      icon: 'fa-exclamation-circle',
      duration: options.duration || 0, // Don't auto-close errors
      ...options,
      actions: [
        { label: 'Retry', action: options.retryCallback || (() => {}) },
        ...(options.actions || [])
      ]
    });
  }

  /**
   * Show warning notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  warning(title, message, options = {}) {
    return this.show({
      type: 'warning',
      title,
      message,
      icon: 'fa-exclamation-triangle',
      duration: options.duration || 4000,
      ...options
    });
  }

  /**
   * Show info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  info(title, message, options = {}) {
    return this.show({
      type: 'info',
      title,
      message,
      icon: 'fa-info-circle',
      duration: options.duration || 4000,
      ...options
    });
  }

  /**
   * Show loading notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  loading(title, message, options = {}) {
    return this.show({
      type: 'loading',
      title,
      message,
      icon: 'fa-spinner',
      duration: 0, // Never auto-close loading
      ...options
    });
  }

  /**
   * Show pending/waiting notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  pending(title, message, options = {}) {
    return this.show({
      type: 'pending',
      title,
      message,
      icon: 'fa-hourglass-half',
      duration: 0,
      ...options
    });
  }

  /**
   * Show form validation feedback
   * @param {Object} errors - Field errors object
   */
  validationError(fieldName, errorMessage) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const feedbackDiv = document.getElementById(`${fieldName}Feedback`);
    
    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.classList.remove('hidden');
    }
    
    if (feedbackDiv) {
      feedbackDiv.classList.remove('hidden');
    }

    // Also show as toast for critical errors
    if (errorMessage.length > 50) {
      this.error('Validation Error', errorMessage);
    }
  }

  /**
   * Clear validation feedback for a field
   * @param {string} fieldName - Field name
   */
  clearValidation(fieldName) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const successElement = document.getElementById(`${fieldName}Success`);
    const feedbackDiv = document.getElementById(`${fieldName}Feedback`);

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }
    if (successElement) {
      successElement.textContent = '';
    }
    if (feedbackDiv) {
      feedbackDiv.classList.add('hidden');
    }
  }

  /**
   * Show validation success for a field
   * @param {string} fieldName - Field name
   * @param {string} message - Success message
   */
  validationSuccess(fieldName, message = 'Valid') {
    const successElement = document.getElementById(`${fieldName}Success`);
    const feedbackDiv = document.getElementById(`${fieldName}Feedback`);
    
    if (successElement) {
      successElement.textContent = message;
      successElement.classList.remove('hidden');
    }
    
    if (feedbackDiv) {
      feedbackDiv.classList.remove('hidden');
    }
  }

  /**
   * Core show method
   * @param {Object} config - Notification configuration
   */
  show(config) {
    const notification = {
      id: `notification-${Date.now()}-${Math.random()}`,
      ...config,
      createdAt: new Date()
    };

    this.notifications.push(notification);
    this.render(notification);

    // Auto-close if duration specified
    if (config.duration > 0) {
      setTimeout(() => this.close(notification.id), config.duration);
    }

    return notification.id;
  }

  /**
   * Render notification to DOM
   * @param {Object} notification - Notification object
   */
  render(notification) {
    const notifEl = document.createElement('div');
    notifEl.id = notification.id;
    notifEl.className = `notification notification-${notification.type}`;
    
    // Icon
    let iconHTML = '';
    if (notification.icon) {
      const isSpinner = notification.icon === 'fa-spinner';
      iconHTML = `<i class="fas ${notification.icon} ${isSpinner ? 'spinning' : ''}"></i>`;
    }

    // Actions
    let actionsHTML = '';
    if (notification.actions && notification.actions.length > 0) {
      const actionsStr = notification.actions
        .map(action => `<button class="notification-action" data-action="${action.label}">${action.label}</button>`)
        .join('');
      actionsHTML = `<div class="notification-actions">${actionsStr}</div>`;
    }

    // Close button
    const closeHTML = `<button class="notification-close" aria-label="Close notification">&times;</button>`;

    notifEl.innerHTML = `
      <div class="notification-content">
        ${iconHTML}
        <div class="notification-text">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          ${actionsHTML}
        </div>
      </div>
      ${closeHTML}
    `;

    // Event listeners
    const closeBtn = notifEl.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.close(notification.id));

    const actionBtns = notifEl.querySelectorAll('.notification-action');
    actionBtns.forEach((btn, index) => {
      btn.addEventListener('click', async () => {
        const action = notification.actions[index];
        if (typeof action.action === 'function') {
          await action.action();
        }
      });
    });

    this.container.appendChild(notifEl);
  }

  /**
   * Close notification
   * @param {string} id - Notification ID
   */
  close(id) {
    const notifEl = document.getElementById(id);
    if (notifEl) {
      notifEl.classList.add('notification-exit');
      setTimeout(() => {
        notifEl.remove();
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300);
    }
  }

  /**
   * Close all notifications
   */
  closeAll() {
    this.notifications.forEach(notification => {
      this.close(notification.id);
    });
  }

  /**
   * Show operation progress
   * @param {string} title - Progress title
   * @param {number} percentage - Progress percentage (0-100)
   * @param {string} message - Status message
   */
  progress(title, percentage, message) {
    return this.show({
      type: 'progress',
      title,
      message: `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="progress-text">${message} (${percentage}%)</div>
      `,
      duration: 0
    });
  }

  /**
   * Update existing progress notification
   * @param {string} id - Notification ID
   * @param {number} percentage - New percentage
   * @param {string} message - New message
   */
  updateProgress(id, percentage, message) {
    const notifEl = document.getElementById(id);
    if (notifEl) {
      const progressFill = notifEl.querySelector('.progress-fill');
      const progressText = notifEl.querySelector('.progress-text');
      
      if (progressFill) {
        progressFill.style.width = percentage + '%';
      }
      if (progressText) {
        progressText.textContent = `${message} (${percentage}%)`;
      }
    }
  }
}

// Global instance
const notificationManager = new NotificationManager();

// Convenience functions
const showNotification = {
  success: (title, message, options) => notificationManager.success(title, message, options),
  error: (title, message, options) => notificationManager.error(title, message, options),
  warning: (title, message, options) => notificationManager.warning(title, message, options),
  info: (title, message, options) => notificationManager.info(title, message, options),
  loading: (title, message, options) => notificationManager.loading(title, message, options),
  pending: (title, message, options) => notificationManager.pending(title, message, options),
  progress: (title, percentage, message) => notificationManager.progress(title, percentage, message),
  updateProgress: (id, percentage, message) => notificationManager.updateProgress(id, percentage, message),
  closeAll: () => notificationManager.closeAll()
};
