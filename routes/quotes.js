const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://api.adviceslip.com/advice');
    const quotes = await response.json();

    res.json(quotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch quotes' });
  }
});

module.exports = router;
