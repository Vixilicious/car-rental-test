/**
 * Admin Module for Car Rental Application
 * Handles all admin dashboard functionality
 */
const adminModule = (function () {
  // Debug flag for verbose logging
  const DEBUG = true;

  // Helper function for debug logging
  function logDebug(message, data) {
    if (DEBUG) {
      console.log(`[Admin] ${message}`);
      if (data) console.log(data);
    }
  }

  // Error handling helper
  function handleApiError(error, message) {
    console.error(`[Admin Error] ${message}:`, error);

    // Check if the error is an authentication error
    if (
      error &&
      (error.message || "").toLowerCase().includes("authentication")
    ) {
      logDebug("Authentication error detected, redirecting to login");
      alert("Your session has expired. Please log in again.");

      // Clear auth state
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      localStorage.removeItem("isAdmin");

      // Redirect to login
      if (typeof window.loadPage === "function") {
        window.loadPage("login.html");
      } else {
        window.location.href = "login.html";
      }
      return;
    }

    // Regular error handling
    alert(`${message}. Please try again.`);
  }

  // Initialize admin dashboard
  function initAdminDashboard() {
    logDebug("Initializing admin dashboard");

    // Check if user is admin based on localStorage
    const isAdmin = apiModule.authService.isAdmin();
    logDebug(`Current user is admin according to localStorage: ${isAdmin}`);

    // Show/hide appropriate sections
    const adminDashboard = document.getElementById("admin-dashboard");
    const accessDenied = document.getElementById("admin-access-denied");

    if (!isAdmin) {
      logDebug("Access denied - user is not admin according to localStorage");
      if (adminDashboard) adminDashboard.style.display = "none";
      if (accessDenied) accessDenied.style.display = "block";

      // Redirect non-admin users
      setTimeout(() => {
        if (typeof window.loadPage === "function") {
          window.loadPage("cars.html");
        } else {
          window.location.href = "cars.html";
        }
      }, 2000);

      return; // Stop initialization if not admin
    } else {
      if (adminDashboard) adminDashboard.style.display = "block";
      if (accessDenied) accessDenied.style.display = "none";
    }

    // Verify admin privileges by trying to access admin-only data
    logDebug("Verifying admin privileges with API call");

    // Try to get all users (admin-only action)
    apiModule.userService
      .getAllUsers()
      .then((users) => {
        logDebug("Admin verification successful - able to fetch users", {
          userCount: users.length,
        });

        // Setup tab navigation
        setupTabNavigation();

        // Setup admin page content
        loadAdminUsers();
        loadAdminCars();
        loadAdminBookings();
        setupModalCloseButtons();
      })
      .catch((error) => {
        handleApiError(error, "Failed to verify admin status");

        // Hide admin dashboard on verification error
        if (adminDashboard) adminDashboard.style.display = "none";
        if (accessDenied) accessDenied.style.display = "block";

        // Clear admin status in localStorage since API call failed
        localStorage.setItem("isAdmin", "false");
      });
  }

  // Setup tab navigation
  function setupTabNavigation() {
    logDebug("Setting up tab navigation");
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".admin-tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove active class from all buttons and tabs
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((tab) => tab.classList.remove("active"));

        // Add active class to clicked button
        this.classList.add("active");

        // Show the corresponding tab content
        const tabId = this.getAttribute("data-tab");
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add("active");
        }
      });
    });
  }

  // Load users for the admin dashboard
  function loadAdminUsers() {
    logDebug("Loading users for admin dashboard");
    const userTable = document.querySelector("#users-tab table tbody");
    if (!userTable) {
      logDebug("User table not found in DOM");
      return;
    }

    userTable.innerHTML = '<tr><td colspan="6">Loading users...</td></tr>';

    // Get all users from API
    apiModule.userService
      .getAllUsers()
      .then((users) => {
        logDebug(`Retrieved ${users.length} users`);
        userTable.innerHTML = "";

        if (users.length === 0) {
          userTable.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
          return;
        }

        // Create table rows for each user
        users.forEach((user) => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email || "-"}</td>
            <td>${user.phone || "-"}</td>
            <td>${user.role || "USER"}</td>
            <td>
              <button class="btn view-button" data-user-id="${
                user.id
              }">View Bookings</button>
              <button class="btn delete-button" data-user-id="${user.id}" ${
            user.role === "ROLE_ADMIN" ? "disabled" : ""
          }>Delete User</button>
            </td>
          `;

          userTable.appendChild(row);
        });

        // Setup view booking buttons
        setupViewBookingButtons();

        // Setup delete user buttons
        setupDeleteUserButtons();
      })
      .catch((error) => {
        handleApiError(error, "Error loading users");
        userTable.innerHTML =
          '<tr><td colspan="6">Error loading users</td></tr>';
      });
  }

  // Function to set up view booking buttons
  function setupViewBookingButtons() {
    logDebug("Setting up view booking buttons");
    const viewButtons = document.querySelectorAll("#users-tab .view-button");
    const modal = document.getElementById("user-bookings-modal");
    if (!modal) return;

    viewButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const userId = this.getAttribute("data-user-id");
        logDebug(`View bookings clicked for user ID: ${userId}`);

        // Show loading state in modal
        const bookingsList = document.getElementById("user-bookings-list");
        if (bookingsList) {
          bookingsList.innerHTML =
            '<tr><td colspan="6">Loading bookings...</td></tr>';
        }

        // Show modal early to provide feedback
        modal.style.display = "block";

        // Get user details first
        apiModule.userService
          .getUserById(userId)
          .then((user) => {
            logDebug("Retrieved user details", user);

            const usernameEl = document.getElementById("modal-username");
            const emailEl = document.getElementById("modal-user-email");

            if (usernameEl) usernameEl.textContent = user.username;
            if (emailEl)
              emailEl.textContent = user.email || "No email provided";

            // Then get bookings
            return apiModule.bookingService.getUserBookings(userId);
          })
          .then((bookings) => {
            logDebug(`Retrieved ${bookings.length} bookings`);

            if (!bookingsList) return;
            bookingsList.innerHTML = "";

            if (bookings.length === 0) {
              bookingsList.innerHTML =
                '<tr><td colspan="6">No bookings found</td></tr>';
            } else {
              bookings.forEach((booking) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                  <td>${booking.id}</td>
                  <td>${
                    booking.car
                      ? booking.car.name + " " + booking.car.model
                      : "Unknown"
                  }</td>
                  <td>${new Date(booking.startDate).toLocaleDateString()}</td>
                  <td>${new Date(booking.endDate).toLocaleDateString()}</td>
                  <td>${booking.totalPrice}:-</td>
                  <td>
                    <button class="btn edit-button" data-booking-id="${
                      booking.id
                    }">Edit</button>
                    <button class="btn delete-button" data-booking-id="${
                      booking.id
                    }">Delete</button>
                  </td>
                `;

                bookingsList.appendChild(row);
              });

              // Setup edit and delete booking buttons in modal
              setupEditBookingButtons(bookingsList);
              setupDeleteBookingButtons(bookingsList);
            }
          })
          .catch((error) => {
            handleApiError(error, "Error fetching user bookings");

            if (bookingsList) {
              bookingsList.innerHTML =
                '<tr><td colspan="6">Error loading bookings</td></tr>';
            }
          });
      });
    });
  }

  // Function to set up delete user buttons
  function setupDeleteUserButtons() {
    logDebug("Setting up delete user buttons");
    const deleteButtons = document.querySelectorAll(
      "#users-tab .delete-button:not([disabled])"
    );

    deleteButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const userId = this.getAttribute("data-user-id");
        logDebug(`Delete user clicked for user ID: ${userId}`);

        // Show confirmation dialog
        confirmAction(
          "Are you sure you want to delete this user? This action cannot be undone.",
          function () {
            logDebug("User deletion confirmed, proceeding with deletion");

            // Execute delete on confirmation
            apiModule.userService
              .deleteUser(userId)
              .then(() => {
                logDebug("User deleted successfully");
                loadAdminUsers();
                alert("User deleted successfully!");
              })
              .catch((error) => {
                handleApiError(error, "Error deleting user");
              });
          }
        );
      });
    });
  }

  // Load cars for the admin dashboard
  function loadAdminCars() {
    logDebug("Loading cars for admin dashboard");
    const carTable = document.querySelector("#cars-tab table tbody");
    if (!carTable) {
      logDebug("Car table not found in DOM");
      return;
    }

    carTable.innerHTML = '<tr><td colspan="7">Loading cars...</td></tr>';

    // Get all cars from API
    apiModule.carService
      .getAllCars()
      .then((cars) => {
        logDebug(`Retrieved ${cars.length} cars`);
        carTable.innerHTML = "";

        if (cars.length === 0) {
          carTable.innerHTML = '<tr><td colspan="7">No cars found</td></tr>';
          return;
        }

        // Create table rows for each car
        cars.forEach((car) => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${car.id}</td>
            <td>${car.name}</td>
            <td>${car.model}</td>
            <td>${car.type}</td>
            <td>${car.price}:-</td>
            <td>${car.booked ? "Rented" : "Available"}</td>
            <td>
              <button class="btn edit-button" data-car-id="${
                car.id
              }">Edit</button>
              <button class="btn delete-button" data-car-id="${
                car.id
              }">Delete</button>
            </td>
          `;

          carTable.appendChild(row);
        });

        // Setup edit car buttons
        setupEditCarButtons();

        // Setup delete car buttons
        setupDeleteCarButtons();
      })
      .catch((error) => {
        handleApiError(error, "Error loading cars");
        carTable.innerHTML = '<tr><td colspan="7">Error loading cars</td></tr>';
      });

    // Setup add car button
    setupAddCarButton();
  }

  // Load bookings for the admin dashboard
  function loadAdminBookings() {
    logDebug("Loading bookings for admin dashboard");
    const bookingTable = document.querySelector("#bookings-tab table tbody");
    if (!bookingTable) {
      logDebug("Booking table not found in DOM");
      return;
    }

    bookingTable.innerHTML =
      '<tr><td colspan="7">Loading bookings...</td></tr>';

    // Get all bookings from API
    apiModule.bookingService
      .getAllBookings()
      .then((bookings) => {
        logDebug(`Retrieved ${bookings.length} bookings`);
        bookingTable.innerHTML = "";

        if (bookings.length === 0) {
          bookingTable.innerHTML =
            '<tr><td colspan="7">No bookings found</td></tr>';
          return;
        }

        // Create table rows for each booking
        bookings.forEach((booking) => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${booking.id}</td>
            <td>${booking.user ? booking.user.username : "Unknown"}</td>
            <td>${
              booking.car
                ? booking.car.name + " " + booking.car.model
                : "Unknown"
            }</td>
            <td>${new Date(booking.startDate).toLocaleDateString()}</td>
            <td>${new Date(booking.endDate).toLocaleDateString()}</td>
            <td>${booking.totalPrice}:-</td>
            <td>
              <button class="btn edit-button" data-booking-id="${
                booking.id
              }">Edit</button>
              <button class="btn delete-button" data-booking-id="${
                booking.id
              }">Delete</button>
            </td>
          `;

          bookingTable.appendChild(row);
        });

        // Setup edit booking buttons
        setupEditBookingButtons(bookingTable);

        // Setup delete booking buttons
        setupDeleteBookingButtons(bookingTable);
      })
      .catch((error) => {
        handleApiError(error, "Error loading bookings");
        bookingTable.innerHTML =
          '<tr><td colspan="7">Error loading bookings</td></tr>';
      });
  }

  // Function to set up edit booking buttons
  function setupEditBookingButtons(container) {
    logDebug("Setting up edit booking buttons");
    const editButtons = container.querySelectorAll(".edit-button");
    const modal = document.getElementById("edit-booking-modal");
    if (!modal) return;

    editButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const bookingId = this.getAttribute("data-booking-id");
        logDebug(`Edit booking clicked for booking ID: ${bookingId}`);

        // Show loading state in modal
        const form = document.getElementById("edit-booking-form");
        if (form) {
          for (const el of form.elements) {
            if (el.type !== "submit" && el.type !== "button") {
              el.disabled = true;
            }
          }
        }

        modal.style.display = "block";

        // Get booking details
        apiModule.bookingService
          .getBookingById(bookingId)
          .then((booking) => {
            logDebug("Retrieved booking details", booking);

            // Populate form fields
            const carInput = document.getElementById("edit-booking-car");
            const startDateInput = document.getElementById(
              "edit-booking-start-date"
            );
            const endDateInput = document.getElementById(
              "edit-booking-end-date"
            );

            if (!carInput || !startDateInput || !endDateInput || !form) {
              logDebug("Required form elements not found");
              return;
            }

            // Enable form elements
            for (const el of form.elements) {
              if (el.type !== "submit" && el.type !== "button") {
                el.disabled = false;
              }
            }

            carInput.value = booking.car.id;
            startDateInput.value = booking.startDate.split("T")[0];
            endDateInput.value = booking.endDate.split("T")[0];

            // Calculate and display booking summary
            updateBookingSummary(
              booking.car.price,
              booking.startDate,
              booking.endDate
            );

            // Add hidden booking ID field if it doesn't exist
            let idInput = document.getElementById("edit-booking-id");
            if (!idInput) {
              idInput = document.createElement("input");
              idInput.type = "hidden";
              idInput.id = "edit-booking-id";
              idInput.name = "id";
              form.appendChild(idInput);
            }
            idInput.value = bookingId;

            // Add event listeners for date changes
            setupDateChangeListeners(booking.car.price);

            // Setup form submission
            setupEditBookingForm();
          })
          .catch((error) => {
            handleApiError(error, "Error fetching booking details");
            modal.style.display = "none";
          });
      });
    });
  }

  // Function to set up delete booking buttons
  function setupDeleteBookingButtons(container) {
    logDebug("Setting up delete booking buttons");
    const deleteButtons = container.querySelectorAll(".delete-button");

    deleteButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const bookingId = this.getAttribute("data-booking-id");
        logDebug(`Delete booking clicked for booking ID: ${bookingId}`);

        // Show confirmation dialog
        confirmAction(
          "Are you sure you want to delete this booking? This action cannot be undone.",
          function () {
            logDebug("Booking deletion confirmed, proceeding with deletion");

            // Execute delete on confirmation
            apiModule.bookingService
              .deleteBooking(bookingId)
              .then(() => {
                logDebug("Booking deleted successfully");
                loadAdminBookings();
                alert("Booking deleted successfully!");
              })
              .catch((error) => {
                handleApiError(error, "Error deleting booking");
              });
          }
        );
      });
    });
  }

  // Function to update booking summary
  function updateBookingSummary(dailyRate, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const totalPrice = days * dailyRate;

    const durationEl = document.getElementById("edit-booking-duration");
    const rateEl = document.getElementById("edit-booking-daily-rate");
    const priceEl = document.getElementById("edit-booking-total-price");

    if (durationEl)
      durationEl.textContent = `${days} day${days > 1 ? "s" : ""}`;
    if (rateEl) rateEl.textContent = `${dailyRate}:-`;
    if (priceEl) priceEl.textContent = `${totalPrice}:-`;
  }

  // Function to set up date change listeners
  function setupDateChangeListeners(dailyRate) {
    const startDateInput = document.getElementById("edit-booking-start-date");
    const endDateInput = document.getElementById("edit-booking-end-date");
    const carSelect = document.getElementById("edit-booking-car");

    if (!startDateInput || !endDateInput || !carSelect) return;

    const updateListener = function () {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (startDate && endDate) {
        // Fetch selected car's rate
        apiModule.carService
          .getCarById(carSelect.value)
          .then((car) => {
            updateBookingSummary(car.price, startDate, endDate);
          })
          .catch((error) => {
            console.error("Error fetching car details:", error);
            // Fallback to using the provided rate
            updateBookingSummary(dailyRate, startDate, endDate);
          });
      }
    };

    startDateInput.addEventListener("change", updateListener);
    endDateInput.addEventListener("change", updateListener);
    carSelect.addEventListener("change", updateListener);
  }

  // Function to set up edit booking form submission
  function setupEditBookingForm() {
    const form = document.getElementById("edit-booking-form");
    if (!form) return;

    // Remove existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const bookingId = document.getElementById("edit-booking-id").value;
      const carId = document.getElementById("edit-booking-car").value;
      const startDate = document.getElementById(
        "edit-booking-start-date"
      ).value;
      const endDate = document.getElementById("edit-booking-end-date").value;

      logDebug("Booking form submitted", {
        bookingId,
        carId,
        startDate,
        endDate,
      });

      // Validate dates
      if (new Date(startDate) > new Date(endDate)) {
        alert("Start date must be before end date.");
        return;
      }

      // Prepare booking data
      const bookingData = {
        carId: parseInt(carId),
        startDate,
        endDate,
      };

      // Update booking
      apiModule.bookingService
        .updateBooking(bookingId, bookingData)
        .then(() => {
          logDebug("Booking updated successfully");

          // Hide modal
          document.getElementById("edit-booking-modal").style.display = "none";

          // Reload bookings
          loadAdminBookings();

          // Show success message
          alert("Booking updated successfully!");
        })
        .catch((error) => {
          handleApiError(error, "Error updating booking");
        });
    });
  }

  // Function to set up edit car buttons
  function setupEditCarButtons() {
    logDebug("Setting up edit car buttons");
    const editButtons = document.querySelectorAll("#cars-tab .edit-button");
    const modal = document.getElementById("edit-car-modal");
    if (!modal) return;

    editButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const carId = this.getAttribute("data-car-id");
        logDebug(`Edit car clicked for car ID: ${carId}`);

        // Show loading state in modal
        const form = document.getElementById("edit-car-form");
        if (form) {
          for (const el of form.elements) {
            if (el.type !== "submit" && el.type !== "button") {
              el.disabled = true;
            }
          }
        }

        modal.style.display = "block";

        // Fetch car details to populate the edit form
        apiModule.carService
          .getCarById(carId)
          .then((car) => {
            logDebug("Retrieved car details", car);

            // Set the modal title to "Edit Car"
            const titleEl = document.getElementById("car-modal-title");

            if (!titleEl || !form) {
              logDebug("Required form elements not found");
              return;
            }

            // Enable form elements
            for (const el of form.elements) {
              if (el.type !== "submit" && el.type !== "button") {
                el.disabled = false;
              }
            }

            titleEl.textContent = "Edit Car";

            // Add a hidden input for car ID if it doesn't exist
            let idInput = document.getElementById("edit-car-id");
            if (!idInput) {
              idInput = document.createElement("input");
              idInput.type = "hidden";
              idInput.id = "edit-car-id";
              idInput.name = "id";
              form.appendChild(idInput);
            }

            // Set car ID in the hidden field
            idInput.value = car.id;

            // Fill the form with car details
            const fields = {
              "edit-car-brand": car.name,
              "edit-car-model": car.model,
              "edit-car-type": car.type.toLowerCase(),
              "edit-car-price": car.price,
              "edit-car-feature1": car.feature1,
              "edit-car-feature2": car.feature2,
              "edit-car-feature3": car.feature3,
            };

            Object.keys(fields).forEach((id) => {
              const el = document.getElementById(id);
              if (el) el.value = fields[id] || "";
            });

            // Setup form submission
            setupCarFormSubmit();
          })
          .catch((error) => {
            handleApiError(error, "Error fetching car details");
            modal.style.display = "none";
          });
      });
    });
  }

  // Function to set up the add car button
  function setupAddCarButton() {
    logDebug("Setting up add car button");
    const addButton = document.querySelector("#cars-tab .add-button");
    const modal = document.getElementById("edit-car-modal");
    if (!addButton || !modal) return;

    addButton.addEventListener("click", function () {
      logDebug("Add car button clicked");

      // Set the modal title to "Add New Car"
      const titleEl = document.getElementById("car-modal-title");
      const form = document.getElementById("edit-car-form");

      if (!titleEl || !form) return;

      titleEl.textContent = "Add New Car";

      // Reset the form fields
      form.reset();

      // Remove any existing hidden ID field or set it to empty
      let idInput = document.getElementById("edit-car-id");
      if (idInput) {
        idInput.value = "";
      }

      // Show the modal
      modal.style.display = "block";

      // Setup form submission
      setupCarFormSubmit();
    });
  }

  // Function to handle car form submission
  function setupCarFormSubmit() {
    const carForm = document.getElementById("edit-car-form");
    if (!carForm) return;

    // Remove existing event listeners
    const newForm = carForm.cloneNode(true);
    carForm.parentNode.replaceChild(newForm, carForm);

    newForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = {
        name: document.getElementById("edit-car-brand").value,
        model: document.getElementById("edit-car-model").value,
        type: document.getElementById("edit-car-type").value,
        price: parseFloat(document.getElementById("edit-car-price").value),
        feature1: document.getElementById("edit-car-feature1").value,
        feature2: document.getElementById("edit-car-feature2").value,
        feature3: document.getElementById("edit-car-feature3").value,
      };

      logDebug("Car form submitted", formData);

      // Get image URL if provided
      const imageInput = document.getElementById("edit-car-image");
      if (imageInput && imageInput.value) {
        formData.imageUrl = imageInput.value;
      }

      // Check if we're editing an existing car or adding a new one
      const carIdElement = document.getElementById("edit-car-id");
      const carId = carIdElement ? carIdElement.value : null;

      const apiCall = carId
        ? apiModule.carService.updateCar(carId, formData)
        : apiModule.carService.createCar(formData);

      apiCall
        .then(() => {
          logDebug(
            carId ? "Car updated successfully" : "Car added successfully"
          );

          // Hide the modal
          document.getElementById("edit-car-modal").style.display = "none";

          // Reload the cars list
          loadAdminCars();

          // Show success message
          alert(
            carId ? "Car updated successfully!" : "Car added successfully!"
          );
        })
        .catch((error) => {
          handleApiError(error, "Error saving car");
        });
    });
  }

  // Function to set up delete car buttons
  function setupDeleteCarButtons() {
    logDebug("Setting up delete car buttons");
    const deleteButtons = document.querySelectorAll("#cars-tab .delete-button");

    deleteButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const carId = this.getAttribute("data-car-id");
        logDebug(`Delete car clicked for car ID: ${carId}`);

        // Show confirmation dialog
        confirmAction(
          "Are you sure you want to delete this car? This action cannot be undone.",
          function () {
            logDebug("Car deletion confirmed, proceeding with deletion");

            // Execute delete on confirmation
            apiModule.carService
              .deleteCar(carId)
              .then(() => {
                logDebug("Car deleted successfully");
                loadAdminCars();
                alert("Car deleted successfully!");
              })
              .catch((error) => {
                handleApiError(error, "Error deleting car");
              });
          }
        );
      });
    });
  }

  // Helper function for confirmation dialogs
  function confirmAction(message, onConfirm) {
    const confirmModal = document.getElementById("confirm-delete-modal");

    if (confirmModal) {
      // Set the confirmation message
      const messageEl = document.getElementById("delete-confirmation-message");
      if (messageEl) messageEl.textContent = message;

      // Show the modal
      confirmModal.style.display = "block";

      // Set up the confirm button
      const confirmButton = confirmModal.querySelector(
        ".delete-confirm-button"
      );
      const cancelButton = confirmModal.querySelector(".cancel-button");
      const closeButton = confirmModal.querySelector(".close-modal-button");

      if (!confirmButton || !cancelButton || !closeButton) {
        // Fallback to native confirm
        if (confirm(message)) {
          onConfirm();
        }
        return;
      }

      // Remove any existing event listeners using cloning
      const newConfirmButton = confirmButton.cloneNode(true);
      confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

      const newCancelButton = cancelButton.cloneNode(true);
      cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);

      const newCloseButton = closeButton.cloneNode(true);
      closeButton.parentNode.replaceChild(newCloseButton, closeButton);

      // Add new event listeners
      newConfirmButton.addEventListener("click", function () {
        confirmModal.style.display = "none";
        onConfirm();
      });

      newCancelButton.addEventListener("click", function () {
        confirmModal.style.display = "none";
      });

      newCloseButton.addEventListener("click", function () {
        confirmModal.style.display = "none";
      });
    } else {
      // Fallback to native confirm
      if (confirm(message)) {
        onConfirm();
      }
    }
  }

  // Setup modal close buttons
  function setupModalCloseButtons() {
    logDebug("Setting up modal close buttons");
    // Get all modals
    const modals = document.querySelectorAll(".admin-modal");

    modals.forEach((modal) => {
      // Get close buttons within this modal
      const closeButtons = modal.querySelectorAll(
        ".close-modal-button, .cancel-button"
      );

      closeButtons.forEach((button) => {
        button.addEventListener("click", function () {
          modal.style.display = "none";
        });
      });

      // Close modal when clicking outside the content
      window.addEventListener("click", function (event) {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      });
    });
  }

  // Setup admin page with data
  function setupAdminPage() {
    logDebug("Setting up admin page");

    // Verify that the user is logged in and is an admin
    if (!apiModule.authService.isLoggedIn()) {
      logDebug("User not logged in, redirecting to login");

      // Save current page for redirect after login
      sessionStorage.setItem("redirectAfterLogin", "admin.html");

      // Redirect to login
      if (typeof window.loadPage === "function") {
        window.loadPage("login.html");
      } else {
        window.location.href = "login.html";
      }
      return;
    }

    if (!apiModule.authService.isAdmin()) {
      logDebug("User not admin, redirecting to cars");
      alert("You do not have administrator privileges.");

      // Redirect to cars page
      if (typeof window.loadPage === "function") {
        window.loadPage("cars.html");
      } else {
        window.location.href = "cars.html";
      }
      return;
    }

    // Initialize admin dashboard
    initAdminDashboard();
  }

  // Return public methods
  return {
    setupAdminPage,
    loadAdminUsers,
    loadAdminCars,
    loadAdminBookings,
  };
})();

// Export the module for use in other scripts
window.adminModule = adminModule;
