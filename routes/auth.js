const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../config'); 
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

async function logActivity(
  userId,
  activityType,
  activityDescription,
  ipAddress = null,
  token = '',
  tokenType = '',
  tokenExpiry = null
) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('token', sql.VarChar(255), token)
      .input('tokenType', sql.VarChar(20), tokenType)
      .input('tokenExpiry', sql.DateTime, tokenExpiry)
      .input('activityType', sql.VarChar(100), activityType)
      .input('activityDescription', sql.VarChar(100), activityDescription)
      .input('activityTimestamp', sql.DateTime, new Date())
      .input('ipAddress', sql.VarChar(60), ipAddress)
      .query(`
        INSERT INTO userActivity 
        (userId, token, tokenType, tokenExpiry, activityType, activityDescription, activityTimestamp, ipAddress)
        VALUES (@userId, @token, @tokenType, @tokenExpiry, @activityType, @activityDescription, @activityTimestamp, @ipAddress)
      `);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

//REGISTER ROUTE
router.post('/register', async (req, res) => {
  const { username, email, age, password } = req.body;
  if (!username || !email || !age || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const pool = await getConnection();

    const existingUser = await pool.request()
      .input('email', sql.VarChar(50), email)
      .query('SELECT * FROM users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await pool.request()
      .input('username', sql.VarChar(50), username)
      .input('email', sql.VarChar(50), email)
      .input('age', sql.Int, age)
      .input('password', sql.VarChar(255), hashedPassword)
      .query(`
        INSERT INTO users (username, email, age, password)
        VALUES (@username, @email, @age, @password);
        SELECT SCOPE_IDENTITY() AS userId;
      `);

    const userId = insertResult.recordset[0].userId;

    await logActivity(userId, 'Registration', 'User registered');

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});


//LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const pool = await getConnection();

    const userResult = await pool.request()
      .input('email', sql.VarChar(50), email)
      .query('SELECT * FROM users WHERE email = @email');

    const user = userResult.recordset[0];
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await logActivity(
      user.id,
      'Login',
      'User logged in',
      ipAddress,
      token,
      'JWT',
      tokenExpiry
    );

    res.json({ token, message: 'Login successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});



module.exports = router;
