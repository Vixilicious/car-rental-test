/**
 * Rental Module for Car Rental Application
 * Handles car listing, rental history and rental functionality
 */
const rentalModule = (function () {
  // Debug flag
  const DEBUG = true;

  // Store active rentals
  let activeRentals = [];

  // Log helper
  function log(message, data) {
    if (DEBUG) {
      console.log(`[Rental] ${message}`);
      if (data !== undefined) console.log(data);
    }
  }

  // Setup car list
  function setupCarList() {
    log("Setting up car list");

    // Load cars from API
    loadCars();

    // Setup search and filter functionality
    setupSearch();
    setupFilters();
    setupRentButtons();
  }

  // Load cars from API
  async function loadCars() {
    log("Loading cars from API");

    try {
      // Get car list container
      const carGrid = document.querySelector(".car-grid");
      if (!carGrid) {
        log("Car grid element not found");
        return;
      }

      // Clear existing content
      carGrid.innerHTML = '<div class="loading-spinner"></div>';

      // Get cars from API
      const cars = await window.apiModule.carService.getAllCars();
      log(`Retrieved ${cars.length} cars`, cars);

      // Clear loading spinner
      carGrid.innerHTML = "";

      // Check if we got any cars
      if (!cars || cars.length === 0) {
        carGrid.innerHTML = `
          <div class="no-cars-message">
            <p>No cars are currently available.</p>
          </div>
        `;
        return;
      }

      // Generate car cards
      cars.forEach((car) => {
        const carCard = createCarCard(car);
        carGrid.appendChild(carCard);
      });
    } catch (error) {
      log("Error loading cars:", error);

      // Show error message
      const carGrid = document.querySelector(".car-grid");
      if (carGrid) {
        carGrid.innerHTML = `
          <div class="error-message">
            <p>Failed to load cars. Please try again later.</p>
            <button class="btn retry-button">Retry</button>
          </div>
        `;

        // Add retry button functionality
        const retryButton = carGrid.querySelector(".retry-button");
        if (retryButton) {
          retryButton.addEventListener("click", loadCars);
        }
      }
    }
  }

  // Create a car card element
  function createCarCard(car) {
    log("Creating car card for:", car);

    // Create card element
    const card = document.createElement("div");
    card.className = "car-card";
    card.dataset.carId = car.id;
    card.dataset.carType = car.type?.toLowerCase() || "";

    // Determine image source
    let imgSrc = "images/cars/default-car.jpg"; // Default image
    if (car.image) {
      // If the image is a base64 string
      if (typeof car.image === "string" && car.image.startsWith("data:image")) {
        imgSrc = car.image;
      }
      // If the image is a byte array, convert to base64
      else if (car.image instanceof Array) {
        const byteArray = new Uint8Array(car.image);
        let binary = "";
        byteArray.forEach((byte) => (binary += String.fromCharCode(byte)));

        imgSrc = "data:image/jpeg;base64," + btoa(binary);
      }
    }

    // Populate card content
    card.innerHTML = `
      <div class="car-image-container">
        <img src="${imgSrc}" alt="${car.name} ${car.model}" class="car-image" />
      </div>
      <div class="car-details">
        <h2 class="car-name">${car.name || "Unknown"}</h2>
        <h3 class="car-model">${car.model || ""}</h3>
        <p class="car-type">${car.type || "Other"}</p>
        <ul class="car-features">
          <li class="car-feature1">${
            car.feature1 || "Feature not available"
          }</li>
          <li class="car-feature2">${
            car.feature2 || "Feature not available"
          }</li>
          <li class="car-feature3">${
            car.feature3 || "Feature not available"
          }</li>
        </ul>
        <div class="car-pricing">
          <p class="car-price">${car.price}:- per day</p>
          <button class="btn rent-button" data-car-id="${car.id}">
            ${car.booked ? "Currently Unavailable" : "Rent Now"}
          </button>
        </div>
      </div>
    `;

    // Disable button if car is booked
    if (car.booked) {
      const rentButton = card.querySelector(".rent-button");
      if (rentButton) {
        rentButton.disabled = true;
        rentButton.classList.add("disabled");
      }
    }

    return card;
  }

  // Setup search functionality
  function setupSearch() {
    log("Setting up search functionality");

    const searchInput = document.getElementById("car-search");
    const searchButton = document.querySelector(".search-button");

    if (!searchInput || !searchButton) {
      log("Search elements not found");
      return;
    }

    // Search function
    const performSearch = () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      log(`Performing search for: "${searchTerm}"`);

      const carCards = document.querySelectorAll(".car-card");

      carCards.forEach((card) => {
        const carName =
          card.querySelector(".car-name")?.textContent?.toLowerCase() || "";
        const carModel =
          card.querySelector(".car-model")?.textContent?.toLowerCase() || "";
        const carType =
          card.querySelector(".car-type")?.textContent?.toLowerCase() || "";

        // Check if car matches search term
        const matchesSearch =
          carName.includes(searchTerm) ||
          carModel.includes(searchTerm) ||
          carType.includes(searchTerm);

        // Show/hide based on search
        card.style.display = matchesSearch ? "flex" : "none";
      });

      // Check if no results
      checkNoResults();
    };

    // Add event listeners
    searchButton.addEventListener("click", performSearch);

    // Add keyup event listener for Enter key
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        performSearch();
      }
    });
  }

  // Setup filter functionality
  function setupFilters() {
    log("Setting up filter functionality");

    const typeFilter = document.getElementById("car-type-filter");
    const sortBy = document.getElementById("sort-by");

    if (!typeFilter || !sortBy) {
      log("Filter elements not found");
      return;
    }

    // Filter function
    const applyFilters = () => {
      const selectedType = typeFilter.value.toLowerCase();
      const sortOption = sortBy.value;

      log(`Applying filters: type=${selectedType}, sort=${sortOption}`);

      const carCards = document.querySelectorAll(".car-card");
      const carGrid = document.querySelector(".car-grid");

      // First apply type filter
      carCards.forEach((card) => {
        const cardType = card.dataset.carType;

        // Only filter by type if a specific type is selected
        if (selectedType && cardType !== selectedType) {
          card.style.display = "none";
        } else {
          // Make sure search filter is not hiding this card
          const searchInput = document.getElementById("car-search");
          const searchTerm = searchInput?.value.toLowerCase().trim() || "";

          if (searchTerm) {
            const carName =
              card.querySelector(".car-name")?.textContent?.toLowerCase() || "";
            const carModel =
              card.querySelector(".car-model")?.textContent?.toLowerCase() ||
              "";
            const carType =
              card.querySelector(".car-type")?.textContent?.toLowerCase() || "";

            const matchesSearch =
              carName.includes(searchTerm) ||
              carModel.includes(searchTerm) ||
              carType.includes(searchTerm);

            card.style.display = matchesSearch ? "flex" : "none";
          } else {
            card.style.display = "flex";
          }
        }
      });

      // Then sort cards
      const visibleCards = Array.from(carCards).filter(
        (card) => card.style.display !== "none"
      );

      visibleCards.sort((a, b) => {
        const priceA = parseInt(a.querySelector(".car-price").textContent);
        const priceB = parseInt(b.querySelector(".car-price").textContent);

        if (sortOption === "price-asc") {
          return priceA - priceB;
        } else {
          return priceB - priceA;
        }
      });

      // Reappend cards in sorted order
      visibleCards.forEach((card) => {
        carGrid.appendChild(card);
      });

      // Check if no results
      checkNoResults();
    };

    // Add event listeners
    typeFilter.addEventListener("change", applyFilters);
    sortBy.addEventListener("change", applyFilters);
  }

  // Check if no results are shown and display message
  function checkNoResults() {
    const carGrid = document.querySelector(".car-grid");
    const visibleCards = document.querySelectorAll(
      ".car-card[style='display: flex']"
    );

    // Remove existing no results message
    const existingMessage = carGrid.querySelector(".no-results-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // If no visible cards, show message
    if (visibleCards.length === 0) {
      const noResultsMessage = document.createElement("div");
      noResultsMessage.className = "no-results-message";
      noResultsMessage.innerHTML = `
        <p>No cars match your search/filter criteria.</p>
        <button class="btn clear-filters-btn">Clear Filters</button>
      `;
      carGrid.appendChild(noResultsMessage);

      // Add clear filters button functionality
      const clearFiltersBtn =
        noResultsMessage.querySelector(".clear-filters-btn");
      clearFiltersBtn.addEventListener("click", () => {
        // Reset search input
        const searchInput = document.getElementById("car-search");
        if (searchInput) searchInput.value = "";

        // Reset filters
        const typeFilter = document.getElementById("car-type-filter");
        if (typeFilter) typeFilter.value = "";

        // Reset sort
        const sortBy = document.getElementById("sort-by");
        if (sortBy) sortBy.value = "price-asc";

        // Show all cars
        const carCards = document.querySelectorAll(".car-card");
        carCards.forEach((card) => {
          card.style.display = "flex";
        });

        // Remove no results message
        noResultsMessage.remove();
      });
    }
  }

  // Setup rent buttons
  function setupRentButtons() {
    log("Setting up rent buttons");

    // Add click event to all rent buttons (including ones added dynamically)
    document.addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("rent-button")) {
        handleRentButtonClick(e.target);
      }
    });
  }

  // Handle rent button click
  function handleRentButtonClick(button) {
    const carId = button.getAttribute("data-car-id");
    log(`Rent button clicked for car ID: ${carId}`);

    // Check if user is logged in
    if (!window.apiModule.authService.isLoggedIn()) {
      log("User not logged in, showing login message");

      // Check if message already exists
      const parentDiv = button.closest(".car-pricing");
      let loginMessage = parentDiv.querySelector(".login-required-message");

      // Only create message if it doesn't exist yet
      if (!loginMessage) {
        // Create message container
        loginMessage = document.createElement("div");
        loginMessage.className = "login-required-message";
        loginMessage.style.display = "block";
        loginMessage.style.marginTop = "10px";
        loginMessage.style.fontSize = "14px";

        // Add error message text
        const errorText = document.createElement("span");
        errorText.textContent = "You need to be logged in to make a booking. ";
        errorText.style.color = "red";

        // Add login link
        const loginLink = document.createElement("a");
        loginLink.textContent = "Log in here";
        loginLink.href = "#";
        loginLink.style.color = "blue";
        loginLink.style.textDecoration = "underline";
        loginLink.addEventListener("click", function (e) {
          e.preventDefault();
          window.app.loadPage("login.html");
        });

        // Add elements to message container
        loginMessage.appendChild(errorText);
        loginMessage.appendChild(loginLink);

        // Add message after the button
        parentDiv.appendChild(loginMessage);

        // Animate the message appearance
        loginMessage.style.opacity = "0";
        setTimeout(() => {
          loginMessage.style.transition = "opacity 0.3s ease";
          loginMessage.style.opacity = "1";
        }, 10);
      }

      return;
    }

    // User is logged in, proceed to booking page
    log("User is logged in, redirecting to booking page with car ID:", carId);

    // Store selected car ID in sessionStorage
    sessionStorage.setItem("selectedCarId", carId);

    // Navigate to booking page
    window.app.loadPage("booking.html");
  }

  // Helper function to format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Helper function to format price
  function formatPrice(price) {
    return price.toLocaleString() + " kr";
  }

  // Function to setup rental history page
  function setupRentalHistoryPage() {
    log("Setting up rental history page");

    // Check if user is logged in
    if (!apiModule.authService.isLoggedIn()) {
      showError("Please log in to view your rental history.");
      return;
    }

    // Load user's rental history
    loadRentalHistory();
  }

  // Function to load user's rental history
  async function loadRentalHistory() {
    try {
      // Show loading state
      const rentalsList = document.getElementById("rentals-list");
      if (rentalsList) {
        rentalsList.innerHTML =
          '<div class="loading-spinner">Loading your rental history...</div>';
      }

      // Get current user
      const currentUser = await apiModule.userService.getCurrentUser();

      if (!currentUser || !currentUser.id) {
        throw new Error("Could not retrieve current user information");
      }

      // Fetch user's bookings (rentals)
      const bookings = await apiModule.bookingService.getUserBookings(
        currentUser.id
      );

      // Store active rentals
      activeRentals = bookings.filter((booking) => {
        const now = new Date();
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        return startDate <= now && endDate >= now;
      });

      // Fetch car details for each booking
      const bookingsWithCars = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const car = await apiModule.carService.getCarById(booking.carId);
            return { ...booking, car };
          } catch (error) {
            log(`Error fetching car data for booking ${booking.id}:`, error);
            return { ...booking, car: null };
          }
        })
      );

      // Display rental history
      displayRentalHistory(bookingsWithCars);
    } catch (error) {
      log("Error loading rental history:", error);
      showError("Failed to load your rental history. " + error.message);
    }
  }

  // Function to display rental history
  function displayRentalHistory(bookings) {
    const rentalsList = document.getElementById("rentals-list");

    if (!rentalsList) {
      log("Rentals list container not found");
      return;
    }

    // Clear previous content
    rentalsList.innerHTML = "";

    if (bookings.length === 0) {
      rentalsList.innerHTML = `
        <div class="no-results">
          <h3>No rentals found</h3>
          <p>You haven't rented any cars yet. <a href="#" class="browse-cars-link">Browse our cars</a> to make your first booking!</p>
        </div>
      `;

      // Add event listener to browse cars link
      const browseLink = rentalsList.querySelector(".browse-cars-link");
      if (browseLink) {
        browseLink.addEventListener("click", function (e) {
          e.preventDefault();
          window.app.loadPage("rental.html");
        });
      }
      return;
    }

    // Sort bookings by date (newest first)
    bookings.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    // Create rental cards for each booking
    bookings.forEach((booking) => {
      const rentalCard = createRentalCard(booking);
      rentalsList.appendChild(rentalCard);
    });
  }

  // Function to create a rental card element for history
  function createRentalCard(booking) {
    const card = document.createElement("div");
    card.className = "rental-card";
    card.setAttribute("data-booking-id", booking.id);

    // Calculate dates and status
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    let status = "upcoming";
    let statusText = "Upcoming";

    if (startDate <= now && endDate >= now) {
      status = "active";
      statusText = "Active";
    } else if (endDate < now) {
      status = "completed";
      statusText = "Completed";
    }

    // Calculate duration and total cost
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    let totalCost = 0;

    if (booking.car && booking.car.pricePerDay) {
      totalCost = booking.car.pricePerDay * days;
    }

    // Default image if car data is missing
    const imageUrl =
      booking.car && booking.car.imageUrl
        ? booking.car.imageUrl
        : "images/default-car.jpg";
    const carName = booking.car
      ? `${booking.car.make} ${booking.car.model}`
      : "Car details unavailable";

    card.innerHTML = `
      <div class="rental-header">
        <div class="rental-status">
          <span class="status-badge status-${status}">${statusText}</span>
        </div>
        <div class="rental-id">
          Booking #${booking.id}
        </div>
      </div>
      <div class="rental-content">
        <div class="rental-car">
          <div class="rental-car-image">
            <img src="${imageUrl}" alt="${carName}">
          </div>
          <div class="rental-car-info">
            <h3>${carName}</h3>
            ${booking.car ? `<p class="car-year">${booking.car.year}</p>` : ""}
          </div>
        </div>
        <div class="rental-details">
          <div class="rental-dates">
            <div class="date-item">
              <span class="date-label">From:</span>
              <span class="date-value">${formatDate(booking.startDate)}</span>
            </div>
            <div class="date-item">
              <span class="date-label">To:</span>
              <span class="date-value">${formatDate(booking.endDate)}</span>
            </div>
            <div class="date-item">
              <span class="date-label">Duration:</span>
              <span class="date-value">${days} day${days > 1 ? "s" : ""}</span>
            </div>
          </div>
          <div class="rental-cost">
            <span class="cost-label">Total Cost:</span>
            <span class="cost-value">${formatPrice(totalCost)}</span>
          </div>
        </div>
      </div>
      <div class="rental-actions">
        <button class="btn btn-primary view-rental-btn">View Details</button>
        ${
          status === "upcoming"
            ? '<button class="btn btn-danger cancel-rental-btn">Cancel Booking</button>'
            : ""
        }
        ${
          status === "active"
            ? '<button class="btn btn-info extend-rental-btn">Extend Rental</button>'
            : ""
        }
      </div>
    `;

    // Add event listeners
    const viewBtn = card.querySelector(".view-rental-btn");
    viewBtn.addEventListener("click", function () {
      showRentalDetails(booking);
    });

    const cancelBtn = card.querySelector(".cancel-rental-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        confirmCancelRental(booking.id);
      });
    }

    const extendBtn = card.querySelector(".extend-rental-btn");
    if (extendBtn) {
      extendBtn.addEventListener("click", function () {
        showExtendRentalModal(booking);
      });
    }

    return card;
  }

  // Function to show error message
  function showError(message) {
    const errorContainer = document.getElementById("rental-error");

    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = "block";
    } else {
      alert("Error: " + message);
    }
  }

  // Return public methods
  return {
    setupCarList,
    setupRentalHistoryPage,
    loadRentalHistory,
    getActiveRentals: function () {
      return activeRentals;
    },
  };
})();

// Export the module for use in other scripts
window.rentalModule = rentalModule;
