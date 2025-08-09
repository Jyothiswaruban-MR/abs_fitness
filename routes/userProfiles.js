const express = require('express');
const { getConnection, sql } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const router = express.Router();

// GET user profile (merged from users + userProfiles)
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT 
          u.first_name AS firstName,
          u.last_name AS lastName,
          u.email,
          u.phone,
          u.age,
          u.gender,
          p.height_cm AS height,
          p.weight_kg AS weight
        FROM users u
        LEFT JOIN userProfiles p ON u.id = p.userId
        WHERE u.id = @UserId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Failed to fetch profile:', err);
    res.status(500).json({ message: 'Error retrieving profile' });
  }
});

// UPDATE user profile (height, weight, gender, age + optional password)
router.put('/update', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const {
    age,
    gender,
    height,
    weight,
    password
  } = req.body;

  try {
    const pool = await getConnection();

    // If password provided, update it in users table
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await pool.request()
        .input('UserId', sql.Int, userId)
        .input('Password', sql.VarChar(255), hashedPassword)
        .query('UPDATE users SET password = @Password WHERE id = @UserId');
    }

    // Check if profile exists
    const existing = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT id FROM userProfiles WHERE userId = @userId');

    if (existing.recordset.length === 0) {
      // Create profile if not exists
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('age', sql.Int, age || null)
        .input('gender', sql.VarChar(10), gender || null)
        .input('height_cm', sql.Float, height || null)
        .input('weight_kg', sql.Float, weight || null)
        .execute('sp_CreateUserProfile');
    } else {
      // Update existing profile
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('age', sql.Int, age || null)
        .input('gender', sql.VarChar(10), gender || null)
        .input('height_cm', sql.Float, height || null)
        .input('weight_kg', sql.Float, weight || null)
        .execute('sp_UpdateUserProfile');
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Failed to update profile:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

module.exports = router;