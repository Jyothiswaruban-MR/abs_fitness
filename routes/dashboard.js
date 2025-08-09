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

    // Map SQL results to expected frontend format
    const response = {
      success: true,
      user: {
        firstName: result.recordsets[0]?.[0]?.first_name || 'User',
        username: result.recordsets[0]?.[0]?.username || ''
      },
      totalWorkouts: result.recordsets[1]?.[0]?.totalWorkouts || 0,
      totalCalories: result.recordsets[2]?.[0]?.totalCalories || 0,
      progress: {
        days: result.recordsets[3]?.map(item => item.day) || [],
        calories: result.recordsets[3]?.map(item => item.calories) || []
      },
      workoutFrequency: [0, 0, 0, 0, 0, 0, 0], // Initialize with zeros
      goalCompletion: {
        completed: result.recordsets[5]?.[0]?.completed || 0,
        inProgress: result.recordsets[5]?.[0]?.inProgress || 0,
        notStarted: result.recordsets[5]?.[0]?.notStarted || 0
      },
      activeGoals: result.recordsets[5]?.[0]?.inProgress || 0
    };

    // Map workout frequency to proper weekday order (Mon-Sun)
    if (result.recordsets[4]) {
      result.recordsets[4].forEach(day => {
        const index = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(day.weekday);
        if (index >= 0) {
          response.workoutFrequency[index] = day.count;
        }
      });
    }

    res.json(response);

  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching dashboard data',
      error: err.message 
    });
  }
});

module.exports = router;