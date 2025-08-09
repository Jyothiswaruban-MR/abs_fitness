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

    // Map results to expected format
    const dashboardData = {
      totalWorkouts: result.recordsets[0][0]?.totalWorkouts || 0,
      totalCalories: result.recordsets[1][0]?.totalCalories || 0,
      weeklyProgress: result.recordsets[2] || [], // Now matches day/calories format
      activeGoals: result.recordsets[3][0]?.activeGoals || 0,
      userInfo: result.recordsets[4][0] || {}
    };

    res.json({
      totalWorkouts: dashboardData.totalWorkouts,
      totalCalories: dashboardData.totalCalories,
      activeGoals: dashboardData.activeGoals,
      progress: {
        days: dashboardData.weeklyProgress.map(entry => entry.day),
        calories: dashboardData.weeklyProgress.map(entry => entry.calories || 0)
      },
      firstName: dashboardData.userInfo.first_name,
      username: dashboardData.userInfo.username
    });

  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
