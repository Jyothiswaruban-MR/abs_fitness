const express = require('express');
const { getConnection, sql } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

async function logActivity(userId, activityType, activityDescription) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('token', sql.VarChar(255), '')
      .input('tokenType', sql.VarChar(20), '')
      .input('tokenExpiry', sql.DateTime, null)
      .input('activityType', sql.VarChar(100), activityType)
      .input('activityDescription', sql.VarChar(100), activityDescription)
      .input('activityTimestamp', sql.DateTime, new Date())
      .input('ipAddress', sql.VarChar(60), '')
      .query(`
        INSERT INTO userActivity 
        (userId, token, tokenType, tokenExpiry, activityType, activityDescription, activityTimestamp, ipAddress)
        VALUES (@userId, @token, @tokenType, @tokenExpiry, @activityType, @activityDescription, @activityTimestamp, @ipAddress)
      `);
  } catch (err) {
    console.error('Activity log failed:', err);
  }
}

// Add workout
router.post('/add', authenticateToken, async (req, res) => {
  const { workoutType, duration, calories, notes, workout_date } = req.body;
  const userId = req.user.userId;

  if (!workoutType || !duration || !calories || !workout_date) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  try {
    const pool = await getConnection();

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('workoutType', sql.VarChar, workoutType)
      .input('duration', sql.Int, duration)
      .input('calories', sql.Int, calories)
      .input('notes', sql.VarChar(255), notes || null)
      .input('workout_date', sql.Date, workout_date)
      .execute('sp_AddWorkout');

    await logActivity(userId, 'Workout Added', `${workoutType} workout logged`);

    res.status(201).json({ message: 'Workout added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error while adding workout' });
  }
});

// Get all workouts
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .execute('sp_GetAllWorkouts');

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving workouts' });
  }
});

// Get workout by id
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const workoutId = req.params.id;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, workoutId)
      .input('userId', sql.Int, userId)
      .execute('sp_GetWorkoutById');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving workout' });
  }
});

// Update workout by id
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const workoutId = req.params.id;
  const { workoutType, duration, calories, notes, workout_date } = req.body;

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, workoutId)
      .input('userId', sql.Int, userId)
      .input('workoutType', sql.VarChar, workoutType)
      .input('duration', sql.Int, duration)
      .input('calories', sql.Int, calories)
      .input('notes', sql.VarChar(255), notes || null)
      .input('workout_date', sql.Date, workout_date)
      .execute('sp_UpdateWorkout');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Workout not found or unauthorized' });
    }

    await logActivity(userId, 'Workout Updated', `Workout ID ${workoutId} updated`);

    res.json({ message: 'Workout updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating workout' });
  }
});

// Delete workout by id
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const workoutId = req.params.id;

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, workoutId)
      .input('userId', sql.Int, userId)
      .execute('sp_DeleteWorkout');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Workout not found or unauthorized' });
    }

    await logActivity(userId, 'Workout Deleted', `Workout ID ${workoutId} deleted`);

    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting workout' });
  }
});

module.exports = router;
