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
  
    // Disable form inputs initially
    toggleForm(false);
  
    // Fetch profile data
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
  
    editBtn.addEventListener("click", () => {
      toggleForm(true);
    });
  
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
  
      const updatedData = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        age: document.getElementById("age").value,
        phone: document.getElementById("phone").value,
        gender: document.getElementById("gender").value
      };
  
      fetch("http://localhost:5000/profile/update", {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedData)
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Profile updated");
          toggleForm(false);
        })
        .catch(err => {
          console.error("Update failed:", err);
        });
    });
  
    function toggleForm(enable) {
      const fields = profileForm.querySelectorAll("input, select");
      fields.forEach(field => {
        if (["height", "weight", "email", "phone", "age", "gender", "firstName", "lastName"].includes(field.id)) {
          field.disabled = !enable;
        }
      });
      saveBtn.style.display = enable ? "block" : "none";
      editBtn.style.display = enable ? "none" : "block";
    }
  });  