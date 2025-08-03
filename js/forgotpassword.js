// js/forgotpassword.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetForm");
  
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
  
      const email = document.getElementById("email").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();
  
      if (!email || !newPassword || !confirmPassword) {
        alert("All fields are required.");
        return;
      }
  
      if (newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:5000/forgot/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword })
        });
  
        const result = await response.json();
  
        if (response.ok) {
          alert(result.message);
          window.location.href = "login.html";
        } else {
          alert(result.message || "Password update failed.");
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Server error. Please try again later.");
      }
    });
  });  