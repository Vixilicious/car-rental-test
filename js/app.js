/**
 * Main Application Module for Car Rental Application
 * Handles page loading, routing, and app initialization
 */
const app = (function () {
  // Debug mode
  const DEBUG = true;

  // HTML folder name
  const HTML_FOLDER = "pages";

  // Log helper
  function log(message, data) {
    if (DEBUG) {
      console.log(message);
      if (data !== undefined) console.log(data);
    }
  }

  // Function to load pages dynamically
  function loadPage(pageName, params = {}) {
    log(`Loading page: ${pageName} with params:`, params);

    // Special case for index.html or empty page name - load home.html
    if (pageName === "index.html" || pageName === "") {
      pageName = "home.html";
    }

    // Update current page in sessionStorage
    sessionStorage.setItem("currentPage", pageName);

    // Extract the base name without extension
    let baseName = pageName;
    if (pageName.endsWith(".html")) {
      baseName = pageName.substring(0, pageName.length - 5);
    }

    // Get the content container
    const contentContainer = document.getElementById("content-container");
    if (!contentContainer) {
      log("Content container not found");
      return Promise.reject(new Error("Content container not found"));
    }

    // Show loading indicator
    contentContainer.innerHTML = '<div class="loading-spinner"></div>';

    // Construct the correct path (ensure it's in the correct directory)
    const pagePath = `${HTML_FOLDER}/${pageName}`;

    log(`Fetching page content from: ${pagePath}`);

    // List available files in the pages directory (for debugging)
    log(
      `Available files in ${HTML_FOLDER}/ directory:`,
      "Check network tab or directory structure manually"
    );

    // Fetch the page content
    return fetch(pagePath)
      .then((response) => {
        log(
          `Response for ${pagePath}: ${response.status} ${response.statusText}`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to load page: ${response.status} ${response.statusText}`
          );
        }
        return response.text();
      })
      .then((html) => {
        log(
          `Successfully loaded content for ${pageName}, length: ${html.length} chars`
        );

        // Insert the HTML content
        contentContainer.innerHTML = html;

        // Update page title
        document.title = `Wigell Car Rentals - ${
          baseName.charAt(0).toUpperCase() + baseName.slice(1)
        }`;

        // Initialize page-specific functionality
        initCurrentPage(baseName);

        // Update login status display
        updateLoginStatus();

        return true;
      })
      .catch((error) => {
        log(`Error loading page ${pageName}:`, error);

        contentContainer.innerHTML = `
          <div class="error-container">
            <h2>Error Loading Page</h2>
            <p>${error.message}</p>
            <p>Could not find ${pagePath}</p>
            <p>Make sure the file exists in the "${HTML_FOLDER}" directory.</p>
            <button class="btn" onclick="app.loadPage('home.html')">Go to Home</button>
          </div>
        `;
        return false;
      });
  }

  // Function to initialize the app
  function init() {
    log("Initializing app");

    // Setup initial page
    loadPage("home.html");

    // Verify authentication status
    verifyAuthStatus();

    // Setup navigation link handling
    setupNavLinks();

    // Setup window popstate event (for browser back/forward buttons)
    window.addEventListener("popstate", function (event) {
      const currentPage = sessionStorage.getItem("currentPage") || "home.html";
      loadPage(currentPage);
    });
  }

  // Setup navigation links
  function setupNavLinks() {
    // This handles any navigation links that aren't in the sidebar
    document.addEventListener("click", function (e) {
      // Look for links with data-page attribute
      if (e.target && e.target.getAttribute("data-page")) {
        e.preventDefault();
        const pageName = e.target.getAttribute("data-page");
        loadPage(pageName);
      }
    });
  }

  // Function to initialize page-specific functionality
  function initCurrentPage(pageName) {
    log(`Initializing page-specific functionality for: ${pageName}`);

    // Get auth state
    const isLoggedIn = window.apiModule.authService.isLoggedIn();
    const isAdmin = window.apiModule.authService.isAdmin();

    // Initialize based on page
    switch (pageName) {
      case "home":
        // Home page initialization
        break;

      case "login":
        // Only setup login form if user is not already logged in
        if (!isLoggedIn && window.authModule) {
          window.authModule.setupLoginForm();
        } else {
          // Redirect to home if already logged in
          loadPage("home.html");
        }
        break;

      case "register":
        // Only setup register form if user is not already logged in
        if (!isLoggedIn && window.authModule) {
          window.authModule.setupRegistrationForm();
        } else {
          // Redirect to home if already logged in
          loadPage("home.html");
        }
        break;

      case "rental":
        // Initialize car rental page
        log("Setting up rental page");
        if (window.rentalModule) {
          log("Rental module found, calling setupCarList");
          window.rentalModule.setupCarList();
        } else {
          log("Warning: rentalModule not found or missing setupCarList method");
        }
        break;

      case "booking":
        // Initialize booking page - requires login
        if (!isLoggedIn) {
          sessionStorage.setItem("redirectAfterLogin", "booking.html");
          loadPage("login.html");
        } else if (window.bookingModule) {
          window.bookingModule.setupBookingPage();
        }
        break;

      case "user":
        // Initialize user page - requires login
        if (!isLoggedIn) {
          sessionStorage.setItem("redirectAfterLogin", "user.html");
          loadPage("login.html");
        } else if (window.userModule) {
          window.userModule.setupUserPage();
        }
        break;

      case "admin":
        // Initialize admin page - requires admin login
        if (!isLoggedIn) {
          sessionStorage.setItem("redirectAfterLogin", "admin.html");
          loadPage("login.html");
        } else if (!isAdmin) {
          alert("You do not have administrator privileges.");
          loadPage("home.html");
        } else if (window.adminModule) {
          log("Setting up admin page");
          window.adminModule.setupAdminPage();
        }
        break;

      default:
        log(`No specific initialization for page: ${pageName}`);
    }
  }

  // Function to update login status display
  function updateLoginStatus() {
    log(
      `Updating login status - isLoggedIn: ${window.apiModule.authService.isLoggedIn()} isAdmin: ${window.apiModule.authService.isAdmin()}`
    );

    // If auth module is available, update auth UI
    if (
      window.authModule &&
      typeof window.authModule.updateAuthUI === "function"
    ) {
      window.authModule.updateAuthUI();
    }
  }

  // Function to verify current authentication status
  function verifyAuthStatus() {
    log("Verifying authentication status");

    // Only check if user is supposedly logged in
    if (window.apiModule && window.apiModule.authService.isLoggedIn()) {
      window.apiModule.authService
        .verifyAuth()
        .then((isValid) => {
          log(`Auth verification result: ${isValid}`);

          if (!isValid) {
            // If verification fails, clear auth state
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("username");
            localStorage.removeItem("isAdmin");
            localStorage.removeItem("userId");

            // Update UI
            updateLoginStatus();

            // If on a protected page, redirect to login
            const currentPage = sessionStorage.getItem("currentPage");
            if (
              currentPage &&
              (currentPage === "admin.html" ||
                currentPage === "user.html" ||
                currentPage === "booking.html")
            ) {
              sessionStorage.setItem("redirectAfterLogin", currentPage);
              loadPage("login.html");
            }
          }
        })
        .catch((error) => {
          log("Auth verification error:", error);
          // On error, assume authentication is valid to prevent logout due to network issues
        });
    }
  }

  // Public API
  return {
    init,
    loadPage,
    updateLoginStatus,
  };
})();

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Make app globally available immediately
  window.app = app;

  // Initialize app after API and Auth modules are ready
  if (window.apiModule) {
    app.init();
  } else {
    // Wait for API module to be loaded
    const checkApiModule = setInterval(function () {
      if (window.apiModule) {
        clearInterval(checkApiModule);
        app.init();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(function () {
      clearInterval(checkApiModule);
      console.error("API module failed to load in time");

      // Fallback initialization
      app.init();
    }, 5000);
  }
});

// Ensure app is exported for global access
window.app = app;
