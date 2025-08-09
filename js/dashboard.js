document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login to access the dashboard");
        window.location.href = "login.html";
        return;
    }

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    // Initialize dashboard
    initDashboard(headers);
});

async function initDashboard(headers) {
    try {
        // Main dashboard data
        const dashboardData = await fetchDashboardData(headers);
        updateUserInfo(dashboardData);
        
        // Initialize all charts
        initProgressChart(dashboardData);
        initWorkoutFrequencyChart();
        initGoalCompletionChart();

        // Additional data
        const goals = await fetchGoalsData(headers);
        renderGoals(goals);
        
        await fetchQuote(headers);
    } catch (err) {
        console.error("Dashboard initialization failed:", err);
        showError("Failed to load dashboard data. Please try again.");
    }
}

// Chart 1: Progress Chart (Calories Over Time)
function initProgressChart(data) {
    const ctx = document.getElementById("progressChart");
    if (!ctx) return;

    const formattedDates = data.progress.days.map(date => 
        new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        })
    );

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [{
                label: 'Calories Burned',
                data: data.progress.calories,
                borderColor: '#00ffd5',
                backgroundColor: 'rgba(0,255,213,0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: getChartOptions('Calories Burned Over Time')
    });
}

// Chart 2: Workout Frequency (Bar Chart)
function initWorkoutFrequencyChart() {
    const ctx = document.getElementById("workoutFrequencyChart");
    if (!ctx) return;

    // Sample data - replace with actual API data
    const workoutData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        counts: [2, 3, 1, 4, 2, 1, 0]
    };

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: workoutData.labels,
            datasets: [{
                label: 'Workouts',
                data: workoutData.counts,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: getChartOptions('Weekly Workout Frequency', 'Workouts')
    });
}

// Chart 3: Goal Completion (Doughnut Chart)
function initGoalCompletionChart() {
    const ctx = document.getElementById("goalCompletionChart");
    if (!ctx) return;

    // Sample data - replace with actual API data
    const goalData = {
        completed: 4,
        inProgress: 3,
        notStarted: 2
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [goalData.completed, goalData.inProgress, goalData.notStarted],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#ffffff'
                    }
                },
                title: {
                    display: true,
                    text: 'Goal Completion Status',
                    color: '#ffffff',
                    font: {
                        size: 16
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Common chart options
function getChartOptions(title, yAxisTitle = 'Calories') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { 
                    color: '#ffffff',
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: title,
                color: '#ffffff',
                font: { 
                    size: 16,
                    weight: 'bold'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: yAxisTitle,
                    color: '#ffffff'
                },
                ticks: { 
                    color: '#ffffff',
                    stepSize: 1
                },
                grid: { 
                    color: 'rgba(255,255,255,0.1)',
                    drawBorder: false
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date',
                    color: '#ffffff'
                },
                ticks: { 
                    color: '#ffffff'
                },
                grid: { 
                    color: 'rgba(255,255,255,0.1)',
                    drawBorder: false
                }
            }
        }
    };
}

// Data fetching functions
async function fetchDashboardData(headers) {
    try {
        const response = await fetch("http://localhost:5000/dashboard", { headers });
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        throw err;
    }
}

async function fetchGoalsData(headers) {
    try {
        const response = await fetch("http://localhost:5000/goals", { headers });
        if (!response.ok) throw new Error("Failed to fetch goals");
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch goals:", err);
        throw err;
    }
}

async function fetchQuote(headers) {
    try {
        const response = await fetch("http://localhost:5000/quotes", { headers });
        if (!response.ok) throw new Error("Failed to fetch quote");
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch quote:", err);
        return { quote: "Stay motivated!" };
    }
}

// UI update functions
function updateUserInfo(data) {
    document.getElementById("welcomeUser").textContent = `Welcome, ${data.firstName || "User"}`;
    document.getElementById("totalWorkouts").textContent = `Total Workouts: ${data.totalWorkouts || 0}`;
    document.getElementById("totalCalories").textContent = `Total Calories: ${data.totalCalories || 0}`;
    document.getElementById("activeGoals").textContent = `Active Goals: ${data.activeGoals || 0}`;
}

function renderGoals(goals) {
    const currentContainer = document.getElementById("currentGoalContainer");
    const upcomingContainer = document.getElementById("upcomingGoalsContainer");
    
    currentContainer.innerHTML = "";
    upcomingContainer.innerHTML = "";

    const activeGoals = goals
        ?.filter(goal => (goal.status || 'active') === 'active')
        ?.sort((a, b) => new Date(a.target_date) - new Date(b.target_date)) || [];

    if (activeGoals.length === 0) {
        currentContainer.textContent = "No active goals set";
        return;
    }

    // Render current goal (closest deadline)
    renderGoalCard(activeGoals[0], currentContainer);

    // Render upcoming goals
    if (activeGoals.length > 1) {
        activeGoals.slice(1).forEach(goal => {
            renderGoalCard(goal, upcomingContainer);
        });
    } else {
        upcomingContainer.textContent = "No upcoming goals";
    }
}

function renderGoalCard(goal, container) {
    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML = `
        <h3>${goal.description}</h3>
        <p><strong>Target:</strong> ${new Date(goal.target_date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${goal.status || 'active'}</p>
        <button class="btn-edit" onclick="window.location.href='goals.html'">
            View Details
        </button>
    `;
    container.appendChild(card);
}

// Utility functions
function setupEventListeners() {
    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    // Profile icon
    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) {
        profileIcon.addEventListener("click", () => {
            window.location.href = "userprofile.html";
        });
    }
}

function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "dashboard-error";
    errorDiv.textContent = message;
    document.querySelector(".dashboard-container").prepend(errorDiv);
}