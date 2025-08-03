// routes/forgotPassword.js

const express = require('express');
const { getConnection, sql } = require('../config');
const router = express.Router();

// Password update route
router.post('/reset', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required.' });
  }

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('Email', sql.VarChar(100), email)
      .input('NewPassword', sql.VarChar(100), newPassword)
      .execute('ResetUserPassword');  // 🔁 Make sure this stored procedure exists

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;