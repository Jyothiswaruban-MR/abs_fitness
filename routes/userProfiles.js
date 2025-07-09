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
  
      const existing = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT id FROM userProfiles WHERE userId = @userId');
  
      if (existing.recordset.length > 0) {
        return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' });
      }
  
      // Insert new profile
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('age', sql.Int, age || null)
        .input('gender', sql.VarChar(10), gender || null)
        .input('height_cm', sql.Float, height_cm || null)
        .input('weight_kg', sql.Float, weight_kg || null)
        .query(`
          INSERT INTO userProfiles (userId, age, gender, height_cm, weight_kg, createdAt, updatedAt)
          VALUES (@userId, @age, @gender, @height_cm, @weight_kg, GETDATE(), GETDATE())
        `);
  
      res.status(201).json({ message: 'Profile created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creating profile' });
    }
  });
  

// get an user profile
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT userId, age, gender, height_cm, weight_kg, createdAt, updatedAt FROM userProfiles WHERE userId = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update an user profile
router.put('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { age, gender, height_cm, weight_kg } = req.body;

  try {
    const pool = await getConnection();

    const check = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM userProfiles WHERE userId = @userId');

    if (check.recordset.length === 0) {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('age', sql.Int, age || null)
        .input('gender', sql.VarChar(10), gender || null)
        .input('height_cm', sql.Float, height_cm || null)
        .input('weight_kg', sql.Float, weight_kg || null)
        .query(`INSERT INTO userProfiles (userId, age, gender, height_cm, weight_kg, createdAt, updatedAt)
                VALUES (@userId, @age, @gender, @height_cm, @weight_kg, GETDATE(), GETDATE())`);
    } else {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('age', sql.Int, age || null)
        .input('gender', sql.VarChar(10), gender || null)
        .input('height_cm', sql.Float, height_cm || null)
        .input('weight_kg', sql.Float, weight_kg || null)
        .query(`UPDATE userProfiles
                SET age = @age,
                    gender = @gender,
                    height_cm = @height_cm,
                    weight_kg = @weight_kg,
                    updatedAt = GETDATE()
                WHERE userId = @userId`);
    }

    res.json({ message: 'Profile saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving profile' });
  }
});

module.exports = router;
