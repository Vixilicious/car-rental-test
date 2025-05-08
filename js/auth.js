/**
 * Authentication Module for Car Rental Application
 * Handles user login, registration, and authentication state
 */
const authModule = (function () {
  // Debug flag
  const DEBUG = true;

  // Log helper
  function log(message, data) {
    if (DEBUG) {
      console.log(`[Auth] ${message}`);
      if (data !== undefined) console.log(data);
    }
  }

  // Function to set up login form
  function setupLoginForm() {
    log("Setting up login form");

    const loginForm = document.getElementById("login-form");

    if (!loginForm) {
      log("Login form not found in DOM");
      return;
    }

    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      log("Login form submitted");

      // Get the input values
      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;

      log(`Username: ${username}`);
      log(`Password: ${"*".repeat(password.length)}`);

      // Clear any previous error messages
      const errorElement = document.querySelector(".login-error-message");
      if (errorElement) {
        errorElement.style.display = "none";
      }

      // Call login API directly with fetch to match the test approach
      performLogin(username, password);
    });
  }

  // Enhanced login function that matches the successful test
  async function performLogin(username, password) {
    const API_BASE_URL = "http://localhost:8080/api/v1";
    const url = `${API_BASE_URL}/auth/login`;

    log(`Attempting login with username: ${username}`);
    log(`Using login endpoint: ${url}`);

    try {
      // Create request body
      const requestBody = JSON.stringify({
        username: username,
        password: password,
      });

      log("Sending login request...");

      // Make the request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
        credentials: "include", // Critical for cookies
      });

      log(`Login response status: ${response.status} ${response.statusText}`);

      // Check for cookies
      const cookies = document.cookie;
      log("Cookies after login: ", cookies);

      // Get response text
      const responseText = await response.text();
      log(`Login response text: ${responseText}`);

      // Check if request was successful
      if (!response.ok) {
        throw new Error(
          `Login failed with status ${response.status}: ${response.statusText}`
        );
      }

      // Parse response if it's JSON
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          log("Login successful, parsed data:", data);
        } catch (e) {
          log("Response is not JSON, using text");
          data = { message: responseText };
        }
      }

      // Store authentication data in localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username);

      // Store admin flag if provided
      if (data.isAdmin !== undefined) {
        localStorage.setItem("isAdmin", data.isAdmin ? "true" : "false");
      } else {
        // Default to false if not specified
        localStorage.setItem("isAdmin", "false");
      }

      log("Authentication data stored in localStorage");

      // Update the UI
      updateAuthUI();

      // Redirect after login
      redirectAfterLogin();

      return data;
    } catch (error) {
      log("Login error:", error);

      // Show error message
      const errorElement = document.querySelector(".login-error-message");
      if (errorElement) {
        errorElement.style.display = "block";
        errorElement.textContent = "Incorrect username or password.";
      }

      throw error;
    }
  }

  // Redirect after login based on user role
  function redirectAfterLogin() {
    // Check if there's a redirect URL in sessionStorage
    const redirectUrl = sessionStorage.getItem("redirectAfterLogin");

    if (redirectUrl) {
      log(`Redirecting to saved URL: ${redirectUrl}`);
      sessionStorage.removeItem("redirectAfterLogin");
      window.app.loadPage(redirectUrl);
      return;
    }

    // Otherwise redirect based on role
    if (isAdmin()) {
      log("Admin user, redirecting to admin page");
      window.app.loadPage("admin.html");
    } else {
      log("Regular user, redirecting to cars page");
      window.app.loadPage("rental.html");
    }
  }

  // Function to set up registration form
  function setupRegistrationForm() {
    log("Checking for registration form");

    const registrationForm = document.getElementById("register-form");

    if (!registrationForm) {
      log("Registration form not found in DOM");
      return;
    }

    log("Setting up registration form");

    registrationForm.addEventListener("submit", function (e) {
      e.preventDefault();
      log("Registration form submitted");

      // Get form values
      const username = document.getElementById("register-username").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById(
        "register-confirm-password"
      ).value;

      // Validation
      if (password !== confirmPassword) {
        const errorElement = document.getElementById("register-error");
        if (errorElement) {
          errorElement.textContent = "Passwords do not match";
          errorElement.style.display = "block";
        }
        return;
      }

      // Prepare user data
      const userData = {
        username,
        email,
        password,
      };

      log("Registering user:", userData);

      // Call registration API
      register(userData)
        .then((userData) => {
          log("Registration successful:", userData);

          // Show success message
          document.getElementById("register-form").style.display = "none";
          document.getElementById("register-success").style.display = "block";

          // Automatically log in after registration
          return performLogin(username, password);
        })
        .then(() => {
          log("Auto-login after registration successful");

          // Redirect after a short delay
          setTimeout(() => {
            window.app.loadPage("home.html");
          }, 2000);
        })
        .catch((error) => {
          log("Registration error:", error);

          // Show error message
          const errorElement = document.getElementById("register-error");
          if (errorElement) {
            let errorMsg = "Registration failed. Please try again.";

            if (error.data && error.data.message) {
              errorMsg = error.data.message;
            } else if (error.message) {
              errorMsg = error.message;
            }

            errorElement.textContent = errorMsg;
            errorElement.style.display = "block";
          }
        });
    });
  }

  // Registration function
  async function register(userData) {
    const API_BASE_URL = "http://localhost:8080/api/v1";
    const url = `${API_BASE_URL}/users`;

    log(`Registering user: ${userData.username}`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      log(
        `Registration response status: ${response.status} ${response.statusText}`
      );

      // Get response text
      const responseText = await response.text();
      log(`Registration response text: ${responseText}`);

      // Check if request was successful
      if (!response.ok) {
        throw new Error(
          `Registration failed with status ${response.status}: ${response.statusText}`
        );
      }

      // Parse response if it's JSON
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          log("Response is not JSON, using text");
          data = { message: responseText };
        }
      }

      return data;
    } catch (error) {
      log("Registration error:", error);
      throw error;
    }
  }

  // Function to set up logout button
  function setupLogoutButton() {
    log("Setting up logout button in auth module");

    // Find both the logout container and link
    const logoutBtn = document.getElementById("logout-btn");
    const logoutLink = document.querySelector(".logout-link");

    if (logoutBtn) {
      log("Found logout button container");
      logoutBtn.onclick = performLogout;
    }

    if (logoutLink) {
      log("Found logout link");
      logoutLink.onclick = performLogout;
    }

    if (!logoutBtn && !logoutLink) {
      log("No logout elements found");
    }
  }

  // Direct logout function with no async
  function performLogout(e) {
    if (e) {
      e.preventDefault();
    }

    log("Performing logout");

    // Clear all auth data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userId");

    // Clear cookies
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    log("Authentication data cleared");

    // Force reload the page to ensure a clean state
    window.location.href = "index.html";

    // Prevent further event handling
    return false;
  }

  // Function to update auth-related UI elements
  function updateAuthUI() {
    log("Updating auth UI");

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const username = localStorage.getItem("username") || "Guest";

    log("Current auth state:");
    log(`- isLoggedIn: ${isLoggedIn}`);
    log(`- username: ${username}`);
    log(`- isAdmin: ${isAdmin}`);

    // Update sidebar auth UI if sidebar module is available
    if (
      window.sidebarModule &&
      typeof window.sidebarModule.updateAuthUI === "function"
    ) {
      window.sidebarModule.updateAuthUI();
    } else {
      // If sidebar module isn't available, update UI elements directly

      // Update sidebar UI elements
      const loginNavItem = document.getElementById("login-nav-item");
      const myPagesNavItem = document.getElementById("my-pages-nav-item");
      const adminNavItem = document.getElementById("admin-nav-item");
      const userWelcome = document.getElementById("user-welcome");
      const logoutBtn = document.getElementById("logout-btn");

      // Update visibility
      if (loginNavItem) {
        loginNavItem.style.display = isLoggedIn ? "none" : "block";
      }

      if (myPagesNavItem) {
        myPagesNavItem.style.display = isLoggedIn ? "block" : "none";
      }

      if (adminNavItem) {
        adminNavItem.style.display = isLoggedIn && isAdmin ? "block" : "none";
      }

      if (userWelcome) {
        userWelcome.style.display = isLoggedIn ? "block" : "none";
        userWelcome.textContent = `Welcome, ${username}`;
      }

      if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? "block" : "none";
      }
    }
  }

  // Helper functions to check auth state
  function isLoggedIn() {
    return localStorage.getItem("isLoggedIn") === "true";
  }

  function isAdmin() {
    return localStorage.getItem("isAdmin") === "true";
  }

  function getUsername() {
    return localStorage.getItem("username") || "Guest";
  }

  // Initialize the auth module
  function init() {
    log("Auth module initialized");

    // Update auth UI based on current state
    updateAuthUI();
  }

  // Return public methods
  return {
    init,
    setupLoginForm,
    setupRegistrationForm,
    setupLogoutButton,
    updateAuthUI,
    isLoggedIn,
    isAdmin,
    getUsername,
  };
})();

// Initialize module when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  authModule.init();
});

// Export module for use in other scripts
window.authModule = authModule;
