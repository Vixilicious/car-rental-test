/**
 * Booking Module for Car Rental Application
 * Handles booking creation and management
 */
const bookingModule = (function () {
  // Store the current car data
  let currentCar = null;

  // Function to setup booking page
  function setupBookingPage(carId) {
    console.log("Setting up booking page for car:", carId);

    if (!carId) {
      console.error("No car ID provided");
      showError("No car selected. Please choose a car first.");
      return;
    }

    // Load car data
    loadCarData(carId);

    // Setup booking form
    setupBookingForm();
  }

  // Function to load car data
  async function loadCarData(carId) {
    try {
      // Show loading state
      const carDetails = document.getElementById("booking-car-details");
      if (carDetails) {
        carDetails.innerHTML =
          '<div class="loading-spinner">Loading car details...</div>';
      }

      // Fetch car data from API
      currentCar = await apiModule.carService.getCarById(carId);

      // Display car details
      displayCarDetails(currentCar);
    } catch (error) {
      console.error("Error loading car data:", error);
      showError("Failed to load car details. Please try again.");
    }
  }

  // Function to display car details
  function displayCarDetails(car) {
    const carDetails = document.getElementById("booking-car-details");

    if (!carDetails) {
      console.error("Car details container not found");
      return;
    }

    // Format price
    const formattedPrice = apiModule.uiHelpers.formatPrice(car.pricePerDay);

    carDetails.innerHTML = `
      <div class="booking-car-card">
        <div class="booking-car-image">
          <img src="${car.imageUrl || "images/default-car.jpg"}" alt="${
      car.make
    } ${car.model}">
        </div>
        <div class="booking-car-info">
          <h2>${car.make} ${car.model}</h2>
          <p class="booking-car-year">${car.year}</p>
          <div class="booking-car-specs">
            <span class="booking-car-category">${car.category}</span>
            <span class="booking-car-seats">${car.seats} seats</span>
            <span class="booking-car-transmission">${car.transmission}</span>
          </div>
          <p class="booking-car-description">${car.description}</p>
          <div class="booking-car-price">
            <span>Price per day:</span>
            <span class="price">${formattedPrice}</span>
          </div>
        </div>
      </div>
    `;

    // Update the price field in the booking form
    const pricePerDayElement = document.getElementById("booking-price-per-day");
    if (pricePerDayElement) {
      pricePerDayElement.textContent = formattedPrice;
    }

    // Calculate initial total price
    calculateTotalPrice();
  }

  // Function to setup the booking form
  function setupBookingForm() {
    const bookingForm = document.getElementById("booking-form");
    const startDateInput = document.getElementById("booking-start-date");
    const endDateInput = document.getElementById("booking-end-date");

    if (!bookingForm || !startDateInput || !endDateInput) {
      console.error("Booking form elements not found");
      return;
    }

    // Set min date to today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    startDateInput.min = todayStr;
    startDateInput.value = todayStr;

    endDateInput.min = tomorrowStr;
    endDateInput.value = tomorrowStr;

    // Add event listeners for date changes
    startDateInput.addEventListener("change", function () {
      // Ensure end date is after start date
      const startDate = new Date(this.value);
      const minEndDate = new Date(startDate);
      minEndDate.setDate(minEndDate.getDate() + 1);

      endDateInput.min = minEndDate.toISOString().split("T")[0];

      // If current end date is before new min end date, update it
      if (new Date(endDateInput.value) <= startDate) {
        endDateInput.value = minEndDate.toISOString().split("T")[0];
      }

      // Recalculate total price
      calculateTotalPrice();

      // Check availability
      checkAvailability();
    });

    endDateInput.addEventListener("change", function () {
      // Recalculate total price
      calculateTotalPrice();

      // Check availability
      checkAvailability();
    });

    // Setup form submission
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      createBooking();
    });

    // Initial calculation and availability check
    calculateTotalPrice();
    checkAvailability();
  }

  // Function to calculate total price
  function calculateTotalPrice() {
    if (!currentCar) return;

    const startDateInput = document.getElementById("booking-start-date");
    const endDateInput = document.getElementById("booking-end-date");
    const totalPriceElement = document.getElementById("booking-total-price");

    if (!startDateInput || !endDateInput || !totalPriceElement) {
      return;
    }

    // Calculate days
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Update days display
    const daysElement = document.getElementById("booking-days");
    if (daysElement) {
      daysElement.textContent = days;
    }

    // Calculate total price
    const totalPrice = days * currentCar.pricePerDay;

    // Update total price display
    totalPriceElement.textContent = apiModule.uiHelpers.formatPrice(totalPrice);
  }

  // Function to check car availability
  async function checkAvailability() {
    if (!currentCar) return;

    const startDateInput = document.getElementById("booking-start-date");
    const endDateInput = document.getElementById("booking-end-date");
    const availabilityMessage = document.getElementById(
      "booking-availability-message"
    );
    const submitButton = document.getElementById("booking-submit");

    if (
      !startDateInput ||
      !endDateInput ||
      !availabilityMessage ||
      !submitButton
    ) {
      return;
    }

    try {
      // Show checking message
      availabilityMessage.textContent = "Checking availability...";
      availabilityMessage.className = "availability-checking";

      // Disable submit button while checking
      submitButton.disabled = true;

      // Call API to check availability
      const result = await apiModule.bookingService.checkCarAvailability(
        currentCar.id,
        startDateInput.value,
        endDateInput.value
      );

      // Update UI based on availability
      if (result.available) {
        availabilityMessage.textContent =
          "Car is available for the selected dates!";
        availabilityMessage.className = "availability-available";
        submitButton.disabled = false;
      } else {
        availabilityMessage.textContent =
          "Sorry, this car is not available for the selected dates.";
        availabilityMessage.className = "availability-unavailable";
        submitButton.disabled = true;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      availabilityMessage.textContent =
        "Could not check availability. Please try again.";
      availabilityMessage.className = "availability-error";
      submitButton.disabled = true;
    }
  }

  // Function to create a booking
  async function createBooking() {
    if (!currentCar) {
      showError("No car selected. Please choose a car first.");
      return;
    }

    const startDateInput = document.getElementById("booking-start-date");
    const endDateInput = document.getElementById("booking-end-date");

    if (!startDateInput || !endDateInput) {
      showError(
        "Booking form is incomplete. Please refresh the page and try again."
      );
      return;
    }

    try {
      // Disable submit button and show loading
      const submitButton = document.getElementById("booking-submit");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
      }

      // Prepare booking data
      const bookingData = {
        carId: currentCar.id,
        startDate: startDateInput.value,
        endDate: endDateInput.value,
      };

      // Call API to create booking
      const result = await apiModule.bookingService.createBooking(bookingData);

      // Show success message
      showSuccess(
        "Booking created successfully! Booking reference: " + result.id
      );

      // Clear car selection from session storage
      sessionStorage.removeItem("carId");

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        window.loadPage("bookings.html");
      }, 2000);
    } catch (error) {
      console.error("Error creating booking:", error);

      // Re-enable submit button
      const submitButton = document.getElementById("booking-submit");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Complete Booking";
      }

      showError("Failed to create booking. Please try again. " + error.message);
    }
  }

  // Function to show error message
  function showError(message) {
    const errorContainer = document.getElementById("booking-error");
    const successContainer = document.getElementById("booking-success");

    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = "block";
    } else {
      alert("Error: " + message);
    }

    if (successContainer) {
      successContainer.style.display = "none";
    }
  }

  // Function to show success message
  function showSuccess(message) {
    const successContainer = document.getElementById("booking-success");
    const errorContainer = document.getElementById("booking-error");

    if (successContainer) {
      successContainer.textContent = message;
      successContainer.style.display = "block";
    } else {
      alert("Success: " + message);
    }

    if (errorContainer) {
      errorContainer.style.display = "none";
    }
  }

  // Return public methods
  return {
    setupBookingPage,
    loadCarData,
    calculateTotalPrice,
    checkAvailability,
    createBooking,
  };
})();

// Export the module for use in other scripts
window.bookingModule = bookingModule;
