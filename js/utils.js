/**
 * Utility Functions for Car Rental Application
 * Common helper functions used across the application
 */
const utils = (function () {
  // Debug flag
  const DEBUG = true;

  // Debug log helper
  function log(message, data) {
    if (DEBUG) {
      console.log(`[Utils] ${message}`);
      if (data !== undefined) console.log(data);
    }
  }

  // Format date for display (e.g., "2023-05-15" to "May 15, 2023")
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Format price for display (e.g., 1000 to "1,000 kr")
  function formatPrice(price) {
    if (typeof price !== "number") return "";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " kr";
  }

  // Truncate text with ellipsis
  function truncateText(text, maxLength = 100) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  // Get URL parameters as an object
  function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }

    return params;
  }

  // Get a specific URL parameter by name
  function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Format date to YYYY-MM-DD for input fields
  function formatDateForInput(date) {
    if (!date) return "";
    if (typeof date === "string") date = new Date(date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Calculate days between two dates
  function daysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Validate email format
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate password strength (at least 8 chars, with numbers and letters)
  function isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }

  // Set a cookie
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  // Get a cookie by name
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Delete a cookie
  function eraseCookie(name) {
    document.cookie = name + "=; Max-Age=-99999999; path=/";
  }

  // Debounce function to limit how often a function can run
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Show notification
  function showNotification(message, type = "info", duration = 3000) {
    log(`Showing notification: ${message} (${type})`);

    // Create notification container if it doesn't exist
    let container = document.querySelector(".notification-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "notification-container";
      document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to container
    container.appendChild(notification);

    // Show with animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Remove after duration
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }

  // Initialize utils module
  function init() {
    log("Utils module initialized");
  }

  // Return public methods
  return {
    init,
    log,
    formatDate,
    formatPrice,
    truncateText,
    getUrlParams,
    getUrlParam,
    formatDateForInput,
    daysBetween,
    isValidEmail,
    isStrongPassword,
    setCookie,
    getCookie,
    eraseCookie,
    debounce,
    showNotification,
  };
})();

// Initialize the utils module when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  utils.init();
});

// Export the module for use in other scripts
window.utils = utils;
