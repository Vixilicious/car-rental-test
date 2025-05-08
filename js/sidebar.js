/**
 * Sidebar Module for Car Rental Application
 * Handles sidebar functionality and interactions
 */
const sidebarModule = (function () {
  // Debug mode
  const DEBUG = true;

  // Log helper
  function log(message, data) {
    if (DEBUG) {
      console.log(`[Sidebar] ${message}`);
      if (data !== undefined) console.log(data);
    }
  }

  // Function to initialize sidebar
  function init() {
    log("Initializing sidebar module");

    // Setup sidebar toggle
    setupSidebarToggle();

    // Setup sidebar links
    setupSidebarLinks();

    // Setup logout button
    setupLogoutButton();

    // Update sidebar state based on screen size
    updateSidebarState();
  }

  // Function to setup sidebar toggle button
  function setupSidebarToggle() {
    const sidebarToggle = document.querySelector(".menu-toggle.sidebar-toggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.querySelector(".sidebar-overlay");

    if (!sidebarToggle || !sidebar) {
      log("Sidebar elements not found");
      return;
    }

    log("Setting up sidebar toggle");

    sidebarToggle.addEventListener("click", function () {
      log("Sidebar toggle clicked");
      sidebar.classList.toggle("collapsed");

      // Toggle overlay
      if (sidebarOverlay) {
        sidebarOverlay.classList.toggle("active");
      }

      // Save preference
      localStorage.setItem(
        "sidebar-collapsed",
        sidebar.classList.contains("collapsed")
      );
    });

    // Add click event for overlay to close sidebar
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", function () {
        log("Overlay clicked, collapsing sidebar");
        sidebar.classList.add("collapsed");
        sidebarOverlay.classList.remove("active");
      });
    }
  }

  // Function to setup sidebar links
  // Update this function in your sidebar.js file
  function setupSidebarLinks() {
    const sidebarLinks = document.querySelectorAll(".nav-link");

    log(`Found ${sidebarLinks.length} sidebar links`);

    sidebarLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        // Only handle links with data-page attribute
        const pageName = this.getAttribute("data-page");
        if (pageName) {
          e.preventDefault();
          log(`Sidebar link clicked: ${pageName}`);

          // Update active state
          document.querySelectorAll(".nav-link").forEach((l) => {
            l.classList.remove("active");
          });
          this.classList.add("active");

          // Log the page we're trying to load
          log(`Attempting to load page: ${pageName}`);

          // Use app's loadPage function
          if (window.app && typeof window.app.loadPage === "function") {
            log(`Using app.loadPage to load: ${pageName}`);
            window.app.loadPage(pageName);
          } else {
            log(
              "WARNING: app.loadPage not available! Falling back to direct navigation"
            );
            window.location.href = pageName;
          }

          // Close sidebar on mobile
          if (window.innerWidth < 768) {
            const sidebar = document.getElementById("sidebar");
            const sidebarOverlay = document.querySelector(".sidebar-overlay");

            if (sidebar) {
              sidebar.classList.add("collapsed");
            }

            if (sidebarOverlay) {
              sidebarOverlay.classList.remove("active");
            }
          }
        } else {
          log("Link clicked but no data-page attribute found");
        }
      });
    });
  }

  // Function to setup logout button in sidebar.js
  function setupLogoutButton() {
    log("Setting up logout button in sidebar");

    // First try to find the actual logout link
    const logoutLink = document.querySelector(".logout-link");

    if (logoutLink) {
      log("Found logout link - adding click handler");

      logoutLink.addEventListener("click", function (e) {
        e.preventDefault();
        log("Logout link clicked");
        handleLogout();
      });
    } else {
      log("No logout link found with .logout-link selector");
    }

    // Also try to find the logout button container
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
      log("Found logout button container - adding click handler");

      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        log("Logout button container clicked");
        handleLogout();
      });
    } else {
      log("No logout button found with #logout-btn selector");
    }
  }

  // Separate function to handle the logout logic
  function handleLogout() {
    log("Handling logout");

    // Clear localStorage
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

    // Update UI
    updateSidebarState();

    // Force reload to homepage
    window.location.href = "index.html";
  }
  // Function to update sidebar state based on screen size
  function updateSidebarState() {
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.querySelector(".sidebar-overlay");

    if (!sidebar) {
      log("Sidebar element not found");
      return;
    }

    // Get saved preference
    const isCollapsed = localStorage.getItem("sidebar-collapsed") === "true";

    // Apply preference or set default based on screen size
    if (window.innerWidth < 768) {
      sidebar.classList.add("collapsed");
      if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    } else {
      if (isCollapsed) {
        sidebar.classList.add("collapsed");
      } else {
        sidebar.classList.remove("collapsed");
      }
    }
  }

  // Function to update auth-related UI elements (used by auth.js)
  function updateAuthUI() {
    log("Updating auth UI");

    if (!window.apiModule || !window.apiModule.authService) {
      log("API module not available, cannot update auth UI");
      return;
    }

    const isLoggedIn = window.apiModule.authService.isLoggedIn();
    const isAdmin = window.apiModule.authService.isAdmin();
    const username = window.apiModule.authService.getUsername();

    log(
      `Auth state: loggedIn=${isLoggedIn}, admin=${isAdmin}, username=${username}`
    );

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

  // Listen for window resize events
  window.addEventListener("resize", function () {
    updateSidebarState();
  });

  // Return public methods
  return {
    init,
    updateSidebarState,
    updateAuthUI,
  };
})();

// Initialize module when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  sidebarModule.init();
});

// Export module for use in other scripts
window.sidebarModule = sidebarModule;
