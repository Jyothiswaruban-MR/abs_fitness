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

    const totalWorkouts = result.recordsets[0][0]?.totalWorkouts || 0;
    const totalCalories = result.recordsets[1][0]?.totalCalories || 0;
    const weeklyProgress = result.recordsets[2] || [];
    const activeGoalsCount = result.recordsets[3][0]?.activeGoals || 0;
    const userInfo = result.recordsets[4][0] || {};

    // Fetch full list of active goals separately
    const goalsResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT id, description, target_date, status
        FROM goals
        WHERE userId = @userId AND ISNULL(status, 'active') = 'active'
        ORDER BY target_date ASC
      `);

    const progress = {
      days: weeklyProgress.map(entry => new Date(entry.weekStart).toLocaleDateString()),
      calories: weeklyProgress.map(entry => entry.calories || 0)
    };

    res.json({
      totalWorkouts,
      totalCalories,
      activeGoals: activeGoalsCount,
      progress,
      username: userInfo.username,
      firstName: userInfo.first_name,
      goals: goalsResult.recordset  // Added this
    });

  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
