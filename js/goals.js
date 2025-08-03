// js/goals.js (Frontend)

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      window.location.href = "login.html";
      return;
    }
  
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  
    const goalForm = document.getElementById("goalForm");
    const goalTableBody = document.querySelector("#goalTable tbody");
  
    goalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const description = document.getElementById("description").value;
      const targetDate = document.getElementById("targetDate").value;
  
      fetch("http://localhost:5000/goals/add", {
        method: "POST",
        headers,
        body: JSON.stringify({ description, target_date: targetDate })
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          goalForm.reset();
          loadGoals();
        })
        .catch(err => console.error("Add goal error:", err));
    });
  
    function loadGoals() {
      fetch("http://localhost:5000/goals", { headers })
        .then(res => res.json())
        .then(data => {
          goalTableBody.innerHTML = "";
          data.forEach(goal => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${goal.description}</td>
              <td>${new Date(goal.target_date).toLocaleDateString()}</td>
              <td>${goal.status || "active"}</td>
              <td>
                <button onclick="deleteGoal(${goal.id})">Delete</button>
              </td>
            `;
            goalTableBody.appendChild(tr);
          });
        })
        .catch(err => console.error("Load goals error:", err));
    }
  
    window.deleteGoal = function(id) {
      if (confirm("Are you sure you want to delete this goal?")) {
        fetch(`http://localhost:5000/goals/${id}`, {
          method: "DELETE",
          headers
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message);
            loadGoals();
          })
          .catch(err => console.error("Delete goal error:", err));
      }
    };
  
    document.getElementById("dashboardBtn").addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  
    loadGoals();
  });  