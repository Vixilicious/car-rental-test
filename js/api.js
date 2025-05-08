/**
 * API Module for Car Rental Application
 * Manages all API calls and authentication
 */
const apiModule = (function () {
  // Configuration
  const API_BASE_URL = "http://localhost:8080/api/v1";
  const DEBUG = true;

  // Log helper
  function log(message, data) {
    if (DEBUG) {
      console.log(`[API] ${message}`);
      if (data !== undefined) console.log(data);
    }
  }

  // General API call function with proper credentials handling
  async function callApi(endpoint, method = "GET", data = null) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Setup request options with credentials
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // This is critical - it tells fetch to include cookies
    };

    // Add body data for non-GET requests
    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    log(`Making ${method} request to: ${url}`);

    try {
      const response = await fetch(url, options);
      log(`Response status: ${response.status}`);

      // Handle no content responses
      if (response.status === 204) {
        return null;
      }

      // Get response text
      const text = await response.text();
      log(`Response text length: ${text ? text.length : 0} chars`);

      if (text && text.length < 1000) {
        log(`Response text: ${text}`);
      }

      // Parse JSON if present
      let responseData = null;
      if (text) {
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          log("Response is not JSON");
          responseData = text;
        }
      }

      // Check if request was successful
      if (!response.ok) {
        // Specifically handle 401 Unauthorized
        if (response.status === 401) {
          log("Unauthorized access - clearing authentication state");
          // Clear auth data
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("username");
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("userId");

          // Redirect to login page
          if (
            typeof window.app !== "undefined" &&
            typeof window.app.loadPage === "function"
          ) {
            setTimeout(() => {
              window.app.loadPage("login.html");
            }, 100);
          } else {
            window.location.href = "login.html";
          }
        }

        throw {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        };
      }

      return responseData;
    } catch (error) {
      log("API call failed: ", error);
      throw error;
    }
  }

  // Auth Service
  const authService = {
    // Check if user is logged in
    isLoggedIn: function () {
      return localStorage.getItem("isLoggedIn") === "true";
    },

    // Check if user is admin
    isAdmin: function () {
      return localStorage.getItem("isAdmin") === "true";
    },

    // Get username
    getUsername: function () {
      return localStorage.getItem("username") || "Guest";
    },

    // Get user ID
    getUserId: function () {
      return localStorage.getItem("userId");
    },

    // Login function - using direct fetch approach that we know works
    login: async function (username, password) {
      log(`Attempting login with username: ${username}`);
      log(`Using API endpoint: ${API_BASE_URL}/auth/login`);

      try {
        // Make login request
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          credentials: "include", // Important for cookies
        });

        log(`Login response status: ${response.status}`);

        // Check for cookies
        const cookies = document.cookie;
        log("Cookies after login: ", cookies);

        // Get response text
        const text = await response.text();
        log(`Login response text: ${text}`);

        // Check if request was successful
        if (!response.ok) {
          throw new Error(
            `Login failed with status ${response.status}: ${response.statusText}`
          );
        }

        // Parse response if JSON
        let data = null;
        if (text) {
          try {
            data = JSON.parse(text);
            log("Login successful, parsed data:", data);
          } catch (e) {
            log("Response is not JSON, using text");
            data = { message: text };
          }
        } else {
          // If no response text but successful status, create minimal data
          data = { username: username };
        }

        // Store authentication data in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", username);
        localStorage.setItem(
          "isAdmin",
          data.isAdmin === true ? "true" : "false"
        );

        log("Authentication data stored in localStorage");

        return data;
      } catch (error) {
        log("Login error:", error);
        throw error;
      }
    },

    // Logout function
    logout: async function () {
      log("Logging out user");

      // Clear authentication data
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

      log("Authentication data cleared from localStorage");
      return { success: true };
    },

    // Register function
    register: async function (userData) {
      log("Registering new user:", userData);

      try {
        // Use the users endpoint instead of auth/register since that's what the backend has
        const data = await callApi("/users", "POST", userData);
        log("Registration successful:", data);
        return data;
      } catch (error) {
        log("Registration error:", error);
        throw error;
      }
    },

    // Verify authentication
    verifyAuth: async function () {
      log("Verifying authentication status");

      // If we're not logged in according to localStorage, no need to verify
      if (!this.isLoggedIn()) {
        log("Not logged in according to localStorage");
        return false;
      }

      try {
        // Perform a simple API call to check auth
        await callApi("/users/current", "GET");
        log("Authentication verified successfully");
        return true;
      } catch (error) {
        // 401 means not authenticated
        if (error.status === 401) {
          log("Authentication verification failed - user is not logged in");
          return false;
        }

        // 403 means authenticated but not authorized
        if (error.status === 403) {
          log(
            "Authentication verified but access denied to requested resource"
          );
          return true;
        }

        log("Authentication verification error:", error);
        return false;
      }
    },
  };

  // User Service
  const userService = {
    // Get current user profile info
    getCurrentUser: async function () {
      log("Fetching current user profile");

      try {
        const data = await callApi("/users/current", "GET");
        log("Current user data:", data);

        // Store user ID if provided
        if (data && data.id) {
          localStorage.setItem("userId", data.id);
        }

        return data;
      } catch (error) {
        log("Error fetching current user:", error);
        throw error;
      }
    },

    // Get user by ID
    getUserById: async function (userId) {
      log(`Fetching user with ID: ${userId}`);

      try {
        const data = await callApi(`/users/${userId}`, "GET");
        log("User data:", data);
        return data;
      } catch (error) {
        log("Error fetching user:", error);
        throw error;
      }
    },

    // Get all users (admin only)
    getAllUsers: async function () {
      log("Fetching all users (admin function)");

      try {
        const data = await callApi("/users", "GET");
        log(`Retrieved ${data.length} users`);
        return data;
      } catch (error) {
        log("Error fetching users:", error);
        throw error;
      }
    },

    // Update user
    updateUser: async function (userId, userData) {
      log(`Updating user with ID: ${userId}`);

      try {
        const data = await callApi(`/users/${userId}`, "PUT", userData);
        log("Update successful:", data);
        return data;
      } catch (error) {
        log("Error updating user:", error);
        throw error;
      }
    },

    // Delete user (admin only)
    deleteUser: async function (userId) {
      log(`Deleting user with ID: ${userId}`);

      try {
        const data = await callApi(`/users/${userId}`, "DELETE");
        log("Delete successful:", data);
        return data;
      } catch (error) {
        log("Error deleting user:", error);
        throw error;
      }
    },
  };

  // Car Service
  const carService = {
    // Get all cars
    getAllCars: async function () {
      log("Fetching all cars");

      try {
        const data = await callApi("/cars", "GET");
        log(`Retrieved ${data.length} cars`);
        return data;
      } catch (error) {
        log("Error fetching cars:", error);
        throw error;
      }
    },

    // Get car by ID
    getCarById: async function (carId) {
      log(`Fetching car with ID: ${carId}`);

      try {
        const data = await callApi(`/cars/${carId}`, "GET");
        log("Car data:", data);
        return data;
      } catch (error) {
        log("Error fetching car:", error);
        throw error;
      }
    },

    // Create car (admin only)
    createCar: async function (carData) {
      log("Creating new car");

      try {
        const data = await callApi("/cars", "POST", carData);
        log("Creation successful:", data);
        return data;
      } catch (error) {
        log("Error creating car:", error);
        throw error;
      }
    },

    // Update car (admin only)
    updateCar: async function (carId, carData) {
      log(`Updating car with ID: ${carId}`);

      try {
        const data = await callApi(`/cars/${carId}`, "PUT", carData);
        log("Update successful:", data);
        return data;
      } catch (error) {
        log("Error updating car:", error);
        throw error;
      }
    },

    // Delete car (admin only)
    deleteCar: async function (carId) {
      log(`Deleting car with ID: ${carId}`);

      try {
        const data = await callApi(`/cars/${carId}`, "DELETE");
        log("Delete successful:", data);
        return data;
      } catch (error) {
        log("Error deleting car:", error);
        throw error;
      }
    },
  };

  // Booking Service
  const bookingService = {
    // Get all bookings (admin only)
    getAllBookings: async function () {
      log("Fetching all bookings (admin function)");

      try {
        const data = await callApi("/bookings", "GET");
        log(`Retrieved ${data.length} bookings`);
        return data;
      } catch (error) {
        log("Error fetching bookings:", error);
        throw error;
      }
    },

    // Get booking by ID
    getBookingById: async function (bookingId) {
      log(`Fetching booking with ID: ${bookingId}`);

      try {
        const data = await callApi(`/bookings/${bookingId}`, "GET");
        log("Booking data:", data);
        return data;
      } catch (error) {
        log("Error fetching booking:", error);
        throw error;
      }
    },

    // Create booking (order car)
    createBooking: async function (bookingData) {
      log("Creating new booking");

      try {
        const data = await callApi("/bookings", "POST", bookingData);
        log("Creation successful:", data);
        return data;
      } catch (error) {
        log("Error creating booking:", error);
        throw error;
      }
    },

    // Update booking
    updateBooking: async function (bookingId, bookingData) {
      log(`Updating booking with ID: ${bookingId}`);

      try {
        const data = await callApi(
          `/bookings/${bookingId}`,
          "PUT",
          bookingData
        );
        log("Update successful:", data);
        return data;
      } catch (error) {
        log("Error updating booking:", error);
        throw error;
      }
    },

    // Delete booking
    deleteBooking: async function (bookingId) {
      log(`Deleting booking with ID: ${bookingId}`);

      try {
        const data = await callApi(`/bookings/${bookingId}`, "DELETE");
        log("Delete successful:", data);
        return data;
      } catch (error) {
        log("Error deleting booking:", error);
        throw error;
      }
    },

    // Get bookings for a specific user
    getUserBookings: async function (userId) {
      log(`Fetching bookings for user with ID: ${userId}`);

      try {
        // This endpoint matches your BookingController
        const data = await callApi(`/bookings/user/${userId}`, "GET");
        log(`Retrieved ${data.length} bookings for user ${userId}`);
        return data;
      } catch (error) {
        log("Error fetching user bookings:", error);
        throw error;
      }
    },
  };

  // UI Helpers for formatting
  const uiHelpers = {
    formatDate: function (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    formatPrice: function (price) {
      return price.toLocaleString() + " kr";
    },
  };

  // Initialize the API module
  function init() {
    log("API module initialized");
  }

  // Return public methods and services
  return {
    init,
    callApi,
    authService,
    userService,
    carService,
    bookingService,
    uiHelpers,
  };
})();

// Initialize module when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  apiModule.init();
});

// Export module for use in other scripts
window.apiModule = apiModule;
