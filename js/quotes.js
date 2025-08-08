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
  
    const quoteText = document.getElementById("quoteText");
    const newQuoteBtn = document.getElementById("newQuoteBtn");
  
    // Fetch and display a quote
    function fetchQuote() {
      fetch("http://localhost:5000/quotes", { headers })
        .then(res => res.json())
        .then(data => {
          // Now simply read the 'quote' field from the backend
          quoteText.textContent = data.quote || "Stay positive and keep pushing!";
        })
        .catch(err => {
          console.error("Failed to fetch quote:", err);
          quoteText.textContent = "Could not load quote. Try again later.";
        });
    }
  
    // Initial load
    fetchQuote();
  
    // Refresh quote on button click
    newQuoteBtn.addEventListener("click", fetchQuote);
  
    // Navigation buttons
    document.getElementById("dashboardBtn").addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  });  