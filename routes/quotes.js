const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://api.adviceslip.com/advice');
    const data = await response.json();

    // Return only the quote text for cleaner frontend handling
    res.json({ quote: data.slip?.advice || "Stay motivated!" });
  } catch (err) {
    console.error("Error fetching quote:", err);
    res.status(500).json({ message: 'Failed to fetch quotes' });
  }
});

module.exports = router;