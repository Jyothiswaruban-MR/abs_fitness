const express = require('express');
const { getConnection, sql } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getConnection();

    // Total workouts
    const totalWorkoutsResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT COUNT(*) AS totalWorkouts FROM workouts WHERE userId = @userId');
    const totalWorkouts = totalWorkoutsResult.recordset[0].totalWorkouts;

    // Total calories burned
    const totalCaloriesResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT SUM(calories) AS totalCalories FROM workouts WHERE userId = @userId');
    const totalCalories = totalCaloriesResult.recordset[0].totalCalories || 0;

    // Weekly progress for past 4 weeks (start dates + totals)
    const weeklyProgressResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          DATEADD(WEEK, DATEDIFF(WEEK, 0, workout_date), 0) AS weekStart,
          COUNT(*) AS workouts,
          SUM(calories) AS calories
        FROM workouts
        WHERE userId = @userId
          AND workout_date >= DATEADD(WEEK, -4, GETDATE())
        GROUP BY DATEADD(WEEK, DATEDIFF(WEEK, 0, workout_date), 0)
        ORDER BY weekStart ASC
      `);

    res.json({
      totalWorkouts,
      totalCalories,
      weeklyProgress: weeklyProgressResult.recordset
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
