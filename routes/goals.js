const express = require('express');
const { getConnection, sql } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// Utility to log user activity
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
      .execute('sp_LogUserActivity');
  } catch (err) {
    console.error('Activity log failed:', err);
  }
}

// Add a new goal
router.post('/add', authenticateToken, async (req, res) => {
  const { description, target_date } = req.body;
  const userId = req.user.userId;

  if (!description || !target_date) {
    return res.status(400).json({ message: 'Description and target date are required' });
  }

  try {
    const pool = await getConnection();
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('description', sql.VarChar(255), description)
      .input('target_date', sql.Date, target_date)
      .execute('sp_AddGoal');

    await logActivity(userId, 'Goal Added', `Goal: ${description}`);
    res.status(201).json({ message: 'Goal added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding goal' });
  }
});

// Get all goals for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .execute('sp_GetAllGoals');

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching goals' });
  }
});

// Get goal by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('id', sql.Int, goalId)
      .execute('sp_GetGoalById');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching goal' });
  }
});

// Update goal by ID
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;
  const { description, target_date, status } = req.body;

  if (!description || !target_date || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('id', sql.Int, goalId)
      .input('description', sql.VarChar(255), description)
      .input('target_date', sql.Date, target_date)
      .input('status', sql.VarChar(20), status)
      .execute('sp_UpdateGoal');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Goal not found or unauthorized' });
    }

    await logActivity(userId, 'Goal Updated', `Goal ID ${goalId} updated`);
    res.json({ message: 'Goal updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating goal' });
  }
});

// Delete goal by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('id', sql.Int, goalId)
      .execute('sp_DeleteGoal');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Goal not found or unauthorized' });
    }

    await logActivity(userId, 'Goal Deleted', `Goal ID ${goalId} deleted`);
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting goal' });
  }
});

module.exports = router;