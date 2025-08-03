const express = require('express');
const { getConnection, sql } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// Create user profile
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { age, gender, height_cm, weight_kg } = req.body;

  try {
    const pool = await getConnection();

    // Check if profile exists
    const existing = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM userProfiles WHERE userId = @userId');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' });
    }

    // Call stored procedure to create profile
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('age', sql.Int, age || null)
      .input('gender', sql.VarChar(10), gender || null)
      .input('height_cm', sql.Float, height_cm || null)
      .input('weight_kg', sql.Float, weight_kg || null)
      .execute('sp_CreateUserProfile');

    res.status(201).json({ message: 'Profile created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating profile' });
  }
});

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .execute('sp_GetUserProfile');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { age, gender, height_cm, weight_kg } = req.body;

  try {
    const pool = await getConnection();

    // Check if profile exists
    const check = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM userProfiles WHERE userId = @userId');

    if (check.recordset.length === 0) {
      // Create profile if not exists
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('age', sql.Int, age || null)
        .input('gender', sql.VarChar(10), gender || null)
        .input('height_cm', sql.Float, height_cm || null)
        .input('weight_kg', sql.Float, weight_kg || null)
        .execute('sp_CreateUserProfile');
    } else {
      // Update existing profile
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('age', sql.Int, age || null)
        .input('gender', sql.VarChar(10), gender || null)
        .input('height_cm', sql.Float, height_cm || null)
        .input('weight_kg', sql.Float, weight_kg || null)
        .execute('sp_UpdateUserProfile');
    }

    res.json({ message: 'Profile saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving profile' });
  }
});

module.exports = router;
