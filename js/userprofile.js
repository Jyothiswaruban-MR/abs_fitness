// js/userprofile.js

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login required");
      window.location.href = "login.html";
      return;
    }
  
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  
    const profileForm = document.getElementById("profileForm");
    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");
  
    // Disable editable fields initially
    toggleForm(false);
  
    // Fetch user profile data
    fetch("http://localhost:5000/profile/me", { headers })
      .then(res => res.json())
      .then(data => {
        document.getElementById("firstName").value = data.firstName || "";
        document.getElementById("lastName").value = data.lastName || "";
        document.getElementById("age").value = data.age || "";
        document.getElementById("phone").value = data.phone || "";
        document.getElementById("gender").value = data.gender || "";
        document.getElementById("height").value = data.height || "";
        document.getElementById("weight").value = data.weight || "";
        document.getElementById("email").value = data.email || "";
      })
      .catch(err => {
        console.error("Error loading profile:", err);
      });
  
    // Enable editing
    editBtn.addEventListener("click", () => {
      toggleForm(true);
    });
  
    // Save changes
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
  
      const updatedData = {
        height: document.getElementById("height").value,
        weight: document.getElementById("weight").value,
        password: document.getElementById("password").value || undefined // optional update
      };
  
      fetch("http://localhost:5000/profile/update", {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedData)
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Profile updated successfully");
          toggleForm(false);
          document.getElementById("password").value = ""; // Clear password field
        })
        .catch(err => {
          console.error("Update failed:", err);
          alert("Failed to update profile.");
        });
    });
  
    // Toggle between view/edit mode
    function toggleForm(enable) {
      const editableIds = ["height", "weight", "password"];
      editableIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.disabled = !enable;
      });
  
      saveBtn.style.display = enable ? "inline-block" : "none";
      editBtn.style.display = enable ? "inline-block" : "block";
    }
  
    // Navigation Buttons
    document.getElementById("dashboardBtn").addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  });  