const express = require('express');
const { getConnection, sql } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .execute('sp_GetUserDashboard');

    // Stored procedure returns multiple recordsets
    const totalWorkouts = result.recordsets[0][0].totalWorkouts;
    const totalCalories = result.recordsets[1][0].totalCalories;
    const weeklyProgress = result.recordsets[2];

    res.json({
      totalWorkouts,
      totalCalories,
      weeklyProgress
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
