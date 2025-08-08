// js/dashboard.js (Frontend)

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login required");
      window.location.href = "login.html";
      return;
    }
  
    const headers = {
      Authorization: `Bearer ${token}`
    };
  
    // Fetch Dashboard Overview Data
    fetch("http://localhost:5000/dashboard", { headers })
      .then(res => res.json())
      .then(data => {
        document.getElementById("welcomeUser").textContent = `Welcome, ${data.firstName}`;
        document.getElementById("totalWorkouts").textContent = `Total Workouts: ${data.totalWorkouts}`;
        document.getElementById("totalCalories").textContent = `Total Calories: ${data.totalCalories}`;
        document.getElementById("activeGoals").textContent = `Active Goals: ${data.activeGoals}`;
  
        const days = data.weeklyProgress.map(item => item.day);
        const calories = data.weeklyProgress.map(item => item.calories);
  
        new Chart(document.getElementById("progressChart"), {
          type: "line",
          data: {
            labels: days,
            datasets: [{
              label: "Calories Burned",
              data: calories,
              fill: true,
              borderColor: "#00ffd5",
              backgroundColor: "rgba(0,255,213,0.2)",
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } }
          }
        });
      })
      .catch(err => {
        console.error("Dashboard data fetch failed:", err);
      });
  
    // Fetch and Display Goals: Current & Upcoming
    fetch("http://localhost:5000/goals", { headers })
      .then(res => res.json())
      .then(goals => {
        const currentContainer = document.getElementById("currentGoalContainer");
        const upcomingContainer = document.getElementById("upcomingGoalsContainer");
  
        currentContainer.innerHTML = "";
        upcomingContainer.innerHTML = "";
  
        // Filter active goals and sort by date
        const activeGoals = goals
          .filter(goal => (goal.status || 'active') === 'active')
          .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  
        // Display current goal (first in sorted list)
        if (activeGoals.length > 0) {
          const current = activeGoals[0];
          const div = document.createElement("div");
          div.className = "goal-card";
          div.innerHTML = `
            <strong>${current.description}</strong><br/>
            Target: ${new Date(current.target_date).toLocaleDateString()}<br/>
            <button onclick="window.location.href='goals.html'">Update</button>
          `;
          currentContainer.appendChild(div);
  
          // Display the rest as upcoming
          for (let i = 1; i < activeGoals.length; i++) {
            const goal = activeGoals[i];
            const div = document.createElement("div");
            div.className = "goal-card";
            div.innerHTML = `
              <strong>${goal.description}</strong><br/>
              Target: ${new Date(goal.target_date).toLocaleDateString()}<br/>
              <button onclick="window.location.href='goals.html'">Update</button>
            `;
            upcomingContainer.appendChild(div);
          }
        } else {
          currentContainer.textContent = "No active goals.";
          upcomingContainer.textContent = "No upcoming goals.";
        }
      })
      .catch(err => {
        console.error("Failed to fetch goals:", err);
      });
  
    // Fetch Quote
    fetch("http://localhost:5000/quotes", { headers })
      .then(res => res.json())
      .then(data => {
        document.getElementById("quoteText").textContent = data.quote || "Keep pushing!";
      });
  
    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  
    // Profile Redirect
    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) {
      profileIcon.addEventListener("click", () => {
        window.location.href = "userprofile.html";
      });
    }
  });  