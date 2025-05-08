/**
 * User Module for Car Rental Application
 * Handles user profile and settings
 */
const userModule = (function () {
  // Function to setup user profile page
  function setupProfilePage() {
    console.log("Setting up user profile page");

    // Check if user is logged in
    if (!apiModule.authService.isLoggedIn()) {
      showProfileError("Please log in to view your profile.");
      return;
    }

    // Load user profile data
    loadProfileData();

    // Setup profile form submission
    setupProfileForm();

    // Setup password change form
    setupPasswordForm();
  }

  // Function to load user profile data
  async function loadProfileData() {
    try {
      // Show loading spinner
      const profileContainer = document.getElementById("profile-container");
      if (profileContainer) {
        profileContainer.innerHTML =
          '<div class="loading-spinner">Loading your profile...</div>';
      }

      // Get current user data
      const userData = await apiModule.userService.getCurrentUser();

      // Display user data
      displayProfileData(userData);
    } catch (error) {
      console.error("Error loading profile data:", error);
      showProfileError("Failed to load your profile data. " + error.message);
    }
  }

  // Function to display user profile data
  function displayProfileData(userData) {
    const profileContainer = document.getElementById("profile-container");

    if (!profileContainer) {
      console.error("Profile container not found");
      return;
    }

    // Create profile form
    profileContainer.innerHTML = `
      <div class="profile-section">
        <h2>My Profile</h2>
        <form id="profile-form" class="profile-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" class="form-control" value="${
              userData.username
            }" readonly>
            <small class="form-text text-muted">Username cannot be changed</small>
          </div>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" class="form-control" value="${
              userData.email
            }" required>
          </div>
          
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" name="fullName" class="form-control" value="${
              userData.fullName || ""
            }">
          </div>
          
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" class="form-control" value="${
              userData.phone || ""
            }">
          </div>
          
          <div class="form-group">
            <label for="address">Address</label>
            <textarea id="address" name="address" class="form-control" rows="3">${
              userData.address || ""
            }</textarea>
          </div>
          
          <div class="profile-actions">
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
        <div id="profile-success" class="alert alert-success" style="display: none;"></div>
        <div id="profile-error" class="alert alert-danger" style="display: none;"></div>
      </div>
      
      <div class="profile-section">
        <h2>Change Password</h2>
        <form id="password-form" class="password-form">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input type="password" id="currentPassword" name="currentPassword" class="form-control" required>
          </div>
          
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input type="password" id="newPassword" name="newPassword" class="form-control" required>
            <small class="form-text text-muted">Password must be at least 8 characters long</small>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" class="form-control" required>
          </div>
          
          <div class="profile-actions">
            <button type="submit" class="btn btn-primary">Update Password</button>
          </div>
        </form>
        <div id="password-success" class="alert alert-success" style="display: none;"></div>
        <div id="password-error" class="alert alert-danger" style="display: none;"></div>
      </div>
    `;
  }

  // Function to setup profile form submission
  function setupProfileForm() {
    const profileForm = document.getElementById("profile-form");

    if (!profileForm) {
      return;
    }

    profileForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Get form data
      const email = document.getElementById("email").value;
      const fullName = document.getElementById("fullName").value;
      const phone = document.getElementById("phone").value;
      const address = document.getElementById("address").value;

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showProfileError("Please enter a valid email address.");
        return;
      }

      try {
        // Show loading state
        const submitBtn = profileForm.querySelector("button[type=submit]");
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

        // Get current user
        const currentUser = await apiModule.userService.getCurrentUser();

        // Prepare updated user data
        const updatedUser = {
          ...currentUser,
          email,
          fullName,
          phone,
          address,
        };

        // Update user data
        await apiModule.userService.updateUser(currentUser.id, updatedUser);

        // Show success message
        showProfileSuccess("Profile updated successfully!");

        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Changes";
      } catch (error) {
        console.error("Error updating profile:", error);

        // Show error message
        showProfileError("Failed to update profile: " + error.message);

        // Reset button
        const submitBtn = profileForm.querySelector("button[type=submit]");
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Changes";
      }
    });
  }

  // Function to setup password change form
  function setupPasswordForm() {
    const passwordForm = document.getElementById("password-form");

    if (!passwordForm) {
      return;
    }

    passwordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Get form data
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Validate passwords
      if (newPassword.length < 8) {
        showPasswordError("New password must be at least 8 characters long.");
        return;
      }

      if (newPassword !== confirmPassword) {
        showPasswordError("New passwords do not match.");
        return;
      }

      try {
        // Show loading state
        const submitBtn = passwordForm.querySelector("button[type=submit]");
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';

        // Call API to change password
        await apiModule.callApi("/users/change-password", "POST", {
          currentPassword,
          newPassword,
        });

        // Show success message
        showPasswordSuccess("Password changed successfully!");

        // Reset form
        passwordForm.reset();

        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = "Update Password";
      } catch (error) {
        console.error("Error changing password:", error);

        // Show error message
        showPasswordError(
          "Failed to change password. " +
            (error.message.includes("401")
              ? "Current password is incorrect."
              : error.message)
        );

        // Reset button
        const submitBtn = passwordForm.querySelector("button[type=submit]");
        submitBtn.disabled = false;
        submitBtn.textContent = "Update Password";
      }
    });
  }

  // Function to show profile success message
  function showProfileSuccess(message) {
    const successEl = document.getElementById("profile-success");
    const errorEl = document.getElementById("profile-error");

    if (successEl) {
      successEl.textContent = message;
      successEl.style.display = "block";

      // Hide after 5 seconds
      setTimeout(() => {
        successEl.style.display = "none";
      }, 5000);
    }

    if (errorEl) {
      errorEl.style.display = "none";
    }
  }

  // Function to show profile error message
  function showProfileError(message) {
    const errorEl = document.getElementById("profile-error");
    const successEl = document.getElementById("profile-success");

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }

    if (successEl) {
      successEl.style.display = "none";
    }
  }

  // Function to show password success message
  function showPasswordSuccess(message) {
    const successEl = document.getElementById("password-success");
    const errorEl = document.getElementById("password-error");

    if (successEl) {
      successEl.textContent = message;
      successEl.style.display = "block";

      // Hide after 5 seconds
      setTimeout(() => {
        successEl.style.display = "none";
      }, 5000);
    }

    if (errorEl) {
      errorEl.style.display = "none";
    }
  }

  // Function to show password error message
  function showPasswordError(message) {
    const errorEl = document.getElementById("password-error");
    const successEl = document.getElementById("password-success");

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }

    if (successEl) {
      successEl.style.display = "none";
    }
  }

  // Return public methods
  return {
    setupProfilePage,
    loadProfileData,
  };
})();

// Export module for use in other scripts
window.userModule = userModule;
