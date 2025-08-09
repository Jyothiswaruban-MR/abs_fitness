const API_BASE_URL = "http://localhost:5000";

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

    toggleForm(false);
    fetchProfileData(headers);

    editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleForm(true);
    });

    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await updateProfile(headers);
    });

    document.getElementById("dashboardBtn").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    async function fetchProfileData(headers) {
        try {
            const response = await fetch(`${API_BASE_URL}/profile/me`, { headers });
            if (!response.ok) throw new Error(await response.text());
            
            const data = await response.json();
            populateForm(data);
        } catch (err) {
            console.error("Error loading profile:", err);
            alert(err.message.includes("Unauthorized") ? "Session expired. Please login again." : "Failed to load profile");
            localStorage.removeItem("token");
            window.location.href = "login.html";
        }
    }

    function populateForm(data) {
        document.getElementById("firstName").value = data.firstName || "";
        document.getElementById("lastName").value = data.lastName || "";
        document.getElementById("age").value = data.age || "";
        document.getElementById("phone").value = data.phone || "";
        document.getElementById("gender").value = data.gender || "";
        document.getElementById("height").value = data.height || "";
        document.getElementById("weight").value = data.weight || "";
        document.getElementById("email").value = data.email || "";
    }

    async function updateProfile(headers) {
        try {
            const updatedData = {
                height: document.getElementById("height").value,
                weight: document.getElementById("weight").value,
                age: document.getElementById("age").value,
                gender: document.getElementById("gender").value,
                password: document.getElementById("password").value || undefined
            };

            const response = await fetch(`${API_BASE_URL}/profile/update`, {
                method: "PUT",
                headers,
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) throw new Error(await response.text());
            
            alert("Profile updated successfully");
            toggleForm(false);
            document.getElementById("password").value = "";
            await fetchProfileData(headers);
        } catch (err) {
            console.error("Update failed:", err);
            alert(err.message || "Failed to update profile");
        }
    }

    function toggleForm(enable) {
        ["height", "weight", "age", "gender", "password"].forEach(id => {
            const field = document.getElementById(id);
            if (field) field.disabled = !enable;
        });
        saveBtn.style.display = enable ? "block" : "none";
        editBtn.style.display = enable ? "none" : "block";
    }
});