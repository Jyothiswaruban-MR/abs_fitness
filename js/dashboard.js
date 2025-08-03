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
  
        new Chart(document.getElementById("progressChart"), {
          type: "line",
          data: {
            labels: data.progress.days,
            datasets: [{
              label: "Calories Burned",
              data: data.progress.calories,
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
  
    // Fetch Goals List
    fetch("http://localhost:5000/goals", { headers })
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById("goalsList");
        list.innerHTML = "";
        data.forEach(goal => {
          const li = document.createElement("li");
          li.textContent = `${goal.description} - ${goal.status}`;
          list.appendChild(li);
        });
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
  
    // Profile Icon Redirection
    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) {
      profileIcon.addEventListener("click", () => {
        window.location.href = "userprofile.html";
      });
    }
  });  