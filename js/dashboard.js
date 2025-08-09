// Constants
const API_BASE_URL = "http://localhost:5000";
const DEFAULT_QUOTE = "Stay motivated! Push your limits!";
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Main Initialization
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Check authentication
        const token = localStorage.getItem("token");
        if (!token) {
            redirectToLogin();
            return;
        }

        showLoading(true);
        await loadDashboardData(token);
        
    } catch (error) {
        handleDashboardError(error);
    } finally {
        showLoading(false);
    }

    setupEventListeners();
});

// ======================
// Data Loading Functions
// ======================

async function loadDashboardData(token) {
    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    try {
        // 1. Load main dashboard data
        const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard`, { headers });
        
        if (!dashboardResponse.ok) {
            throw new Error(`HTTP error! Status: ${dashboardResponse.status}`);
        }

        const dashboardData = await dashboardResponse.json();
        
        if (!dashboardData.success) {
            throw new Error(dashboardData.message || "Invalid dashboard data");
        }

        // Update UI with dashboard data
        updateUserInfo(dashboardData);
        renderCharts(dashboardData);

        // 2. Load goals data
        const goalsResponse = await fetch(`${API_BASE_URL}/goals`, { headers });
        if (!goalsResponse.ok) throw new Error("Failed to load goals");
        const goals = await goalsResponse.json();
        renderGoals(goals);

        // 3. Load motivational quote
        const quoteResponse = await fetch(`${API_BASE_URL}/quotes`, { headers });
        const quoteData = quoteResponse.ok ? await quoteResponse.json() : { quote: DEFAULT_QUOTE };
        document.getElementById("quoteText").textContent = quoteData.quote || DEFAULT_QUOTE;

    } catch (error) {
        console.error("Failed to load dashboard:", error);
        throw error;
    }
}

// ======================
// UI Rendering Functions
// ======================

function updateUserInfo(data) {
    if (!data) return;

    const userInfo = {
        welcomeUser: `Welcome, ${data.user?.firstName || "User"}`,
        totalWorkouts: `Total Workouts: ${data.totalWorkouts || 0}`,
        totalCalories: `Total Calories: ${data.totalCalories || 0}`,
        activeGoals: `Active Goals: ${data.activeGoals || 0}`
    };

    Object.entries(userInfo).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    });
}

function renderCharts(data) {
    if (!data) return;

    // Progress Chart (Calories Over Time)
    renderProgressChart(data.progress);

    // Workout Frequency Chart
    renderWorkoutFrequencyChart(data.workoutFrequency);

    // Goal Completion Chart
    renderGoalCompletionChart(data.goalCompletion);
}

function renderProgressChart(progressData) {
    const ctx = document.getElementById("progressChart");
    if (!ctx) return;

    const labels = progressData?.days?.map(day => 
        day ? new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
    ) || [];

    const caloriesData = progressData?.calories?.map(cal => cal || 0) || [];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Calories Burned',
                data: caloriesData,
                borderColor: '#00ffd5',
                backgroundColor: 'rgba(0,255,213,0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: getChartOptions('Calories Burned Over Time')
    });
}

function renderWorkoutFrequencyChart(frequencyData) {
    const ctx = document.getElementById("workoutFrequencyChart");
    if (!ctx) return;

    // Ensure we have data for all 7 days
    const workoutData = Array(7).fill(0).map((_, i) => {
        return frequencyData?.[i] || 0;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: WEEKDAYS,
            datasets: [{
                label: 'Workouts',
                data: workoutData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: getChartOptions('Weekly Workout Frequency', 'Workouts')
    });
}

function renderGoalCompletionChart(completionData) {
    const ctx = document.getElementById("goalCompletionChart");
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [
                    completionData?.completed || 0,
                    completionData?.inProgress || 0,
                    completionData?.notStarted || 0
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { 
                    position: 'right', 
                    labels: { color: '#ffffff' } 
                },
                title: { 
                    display: true, 
                    text: 'Goal Completion', 
                    color: '#ffffff',
                    font: { size: 16 }
                }
            },
            cutout: '70%'
        }
    });
}

function renderGoals(goals) {
    const currentContainer = document.getElementById("currentGoalContainer");
    const upcomingContainer = document.getElementById("upcomingGoalsContainer");
    
    if (!currentContainer || !upcomingContainer) return;

    // Clear existing content
    currentContainer.innerHTML = '';
    upcomingContainer.innerHTML = '';

    // Fixed syntax error - added missing parenthesis
    if (!goals || !Array.isArray(goals)) {
        currentContainer.textContent = "No goals data available";
        return;
    }

    const activeGoals = goals
        .filter(goal => goal.status === 'active')
        .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

    if (activeGoals.length === 0) {
        currentContainer.textContent = "No active goals set";
        upcomingContainer.textContent = "No upcoming goals";
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
    
    const targetDate = goal.target_date 
        ? new Date(goal.target_date).toLocaleDateString() 
        : "No target date";
    
    card.innerHTML = `
        <h3>${goal.description || "Untitled Goal"}</h3>
        <p><strong>Target:</strong> ${targetDate}</p>
        <p><strong>Status:</strong> ${goal.status || "active"}</p>
        <button class="btn-view-details">View Details</button>
    `;
    
    container.appendChild(card);
}

// ======================
// Utility Functions
// ======================

function getChartOptions(title, yAxisTitle = 'Calories') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { 
                    color: '#ffffff',
                    font: { size: 12 }
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

function setupEventListeners() {
    // Logo click - navigate to homepage
    const logo = document.querySelector('.navbar .logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = 'homepage.html';
        });
        logo.style.cursor = 'pointer';
    }

    // Profile icon - navigate to user profile
    const profileIcon = document.getElementById('profileIcon');
    if (profileIcon) {
        profileIcon.addEventListener('click', () => {
            window.location.href = 'userprofile.html';
        });
        profileIcon.style.cursor = 'pointer';
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'homepage.html';
        });
    }

    // View Details buttons in goal cards
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-view-details')) {
            window.location.href = 'goals.html';
        }
    });
}

function showLoading(show) {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'dashboard-error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.dashboard-container');
    if (container) {
        container.prepend(errorDiv);
        
        // Auto-remove error after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

function redirectToLogin() {
    alert("Please login to access the dashboard");
    window.location.href = "login.html";
}

function handleDashboardError(error) {
    console.error("Dashboard error:", error);
    
    // Specific handling for unauthorized errors
    if (error.message.includes("401")) {
        redirectToLogin();
        return;
    }
    
    showError(error.message || "Failed to load dashboard data. Please try again.");
}