// js/workouts.js (Frontend)

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
  
    const form = document.getElementById("workoutForm");
    const tableBody = document.querySelector("#workoutTable tbody");
  
    form.addEventListener("submit", e => {
      e.preventDefault();
  
      const workoutData = {
        workoutType: document.getElementById("workoutType").value,
        duration: document.getElementById("duration").value,
        calories: document.getElementById("calories").value,
        workout_date: document.getElementById("workoutDate").value,
        notes: document.getElementById("notes").value
      };
  
      fetch("http://localhost:5000/workouts/add", {
        method: "POST",
        headers,
        body: JSON.stringify(workoutData)
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          form.reset();
          loadWorkouts();
        })
        .catch(err => console.error("Add workout failed:", err));
    });
  
    function loadWorkouts() {
      fetch("http://localhost:5000/workouts", { headers })
        .then(res => res.json())
        .then(data => {
          tableBody.innerHTML = "";
          data.forEach(workout => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${new Date(workout.workout_date).toLocaleDateString()}</td>
              <td>${workout.workoutType}</td>
              <td>${workout.duration} min</td>
              <td>${workout.calories}</td>
              <td>${workout.notes || ''}</td>
              <td>
                <button onclick="deleteWorkout(${workout.id})">Delete</button>
                <button onclick="editWorkout(${workout.id})">Update</button>
              </td>
            `;
            tableBody.appendChild(tr);
          });
        });
    }
    
    window.editWorkout = function (id) {
  fetch(`http://localhost:5000/workouts/${id}`, { headers })
    .then(res => res.json())
    .then(workout => {
      document.getElementById("workoutType").value = workout.workoutType;
      document.getElementById("duration").value = workout.duration;
      document.getElementById("calories").value = workout.calories;
      document.getElementById("workoutDate").value = workout.workout_date.split("T")[0];
      document.getElementById("notes").value = workout.notes || '';

      // Store workout id in form dataset for update mode
      form.dataset.editId = id;
    })
    .catch(err => console.error("Fetch workout failed:", err));
};
  window.editWorkout = function (id) {
  fetch(`http://localhost:5000/workouts/${id}`, { headers })
    .then(res => res.json())
    .then(workout => {
      document.getElementById("workoutType").value = workout.workoutType;
      document.getElementById("duration").value = workout.duration;
      document.getElementById("calories").value = workout.calories;
      document.getElementById("workoutDate").value = workout.workout_date.split("T")[0];
      document.getElementById("notes").value = workout.notes || '';

      // Store workout id in form dataset for update mode
      form.dataset.editId = id;
    })
    .catch(err => console.error("Fetch workout failed:", err));
};


    window.deleteWorkout = function (id) {
      if (confirm("Are you sure you want to delete this workout?")) {
        fetch(`http://localhost:5000/workouts/${id}`, {
          method: "DELETE",
          headers
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message);
            loadWorkouts();
          })
          .catch(err => console.error("Delete failed:", err));
      }
    };
  
    document.getElementById("dashboardBtn").addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  
    loadWorkouts();
  });  