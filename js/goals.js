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
  
    // Submit form to add a new goal
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
  
    // Load all goals
    function loadGoals() {
      fetch("http://localhost:5000/goals", { headers })
        .then(res => res.json())
        .then(data => {
          goalTableBody.innerHTML = "";
          data.forEach(goal => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td><input type="text" value="${goal.description}" data-id="${goal.id}" class="edit-description" /></td>
              <td><input type="date" value="${goal.target_date.split('T')[0]}" data-id="${goal.id}" class="edit-date" /></td>
              <td>
                <select class="goal-status-select" data-id="${goal.id}">
                  <option value="active" ${goal.status === "active" ? "selected" : ""}>Active</option>
                  <option value="upcoming" ${goal.status === "upcoming" ? "selected" : ""}>Upcoming</option>
                  <option value="completed" ${goal.status === "completed" ? "selected" : ""}>Completed</option>
                </select>
              </td>
              <td class="actions">
                <button class="save" onclick="saveGoal(${goal.id})">Save</button>
                <button class="delete" onclick="deleteGoal(${goal.id})">Delete</button>
              </td>
            `;
            goalTableBody.appendChild(tr);
          });
        })
        .catch(err => console.error("Load goals error:", err));
    }
  
    // Save updated goal (status, description, target date)
    window.saveGoal = function (id) {
      const descInput = document.querySelector(`input.edit-description[data-id="${id}"]`);
      const dateInput = document.querySelector(`input.edit-date[data-id="${id}"]`);
      const statusSelect = document.querySelector(`select.goal-status-select[data-id="${id}"]`);
  
      const updatedGoal = {
        description: descInput.value,
        target_date: dateInput.value,
        status: statusSelect.value
      };
  
      fetch(`http://localhost:5000/goals/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedGoal)
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          loadGoals();
        })
        .catch(err => console.error("Save goal error:", err));
    };
  
    // Delete a goal
    window.deleteGoal = function (id) {
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
  
    // Navigation
    document.getElementById("dashboardBtn").addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  
    loadGoals();
  });
  