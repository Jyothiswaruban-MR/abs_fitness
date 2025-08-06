// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../config'); 
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Log activity via stored procedure (keeps your implementation)
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
      .execute('sp_LogUserActivity');
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Basic helpers for server-side validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}
function isValidPhone(phone) {
  // accept + and digits only, length 7-20
  return /^[\+0-9]{7,20}$/.test(phone);
}

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  // Accept fields from the form
  const {
    firstName,
    lastName,
    username,
    phone,           // expected to be full phone (country code + number)
    gender,
    age,
    height_cm,
    weight_kg,
    email,
    password
  } = req.body;

  // Basic required-field checks
  if (!firstName || !lastName || !username || !phone || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: 'Invalid phone format' });
  }

  if (typeof age !== 'undefined' && (isNaN(age) || age < 10 || age > 120)) {
    return res.status(400).json({ message: 'Invalid age' });
  }

  if (typeof password === 'string' && password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const pool = await getConnection();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Call stored procedure. NOTE: you must update sp_RegisterUser to accept these parameters
    // and return output userId (or change to an INSERT statement here if you prefer).
    const result = await pool.request()
      .input('firstName', sql.VarChar(100), firstName)
      .input('lastName', sql.VarChar(100), lastName)
      .input('username', sql.VarChar(50), username)
      .input('phone', sql.VarChar(30), phone)
      .input('gender', sql.VarChar(20), gender)
      .input('age', sql.Int, age || null)
      .input('height_cm', sql.Decimal(6,2), height_cm ? parseFloat(height_cm) : null)
      .input('weight_kg', sql.Decimal(6,2), weight_kg ? parseFloat(weight_kg) : null)
      .input('email', sql.VarChar(255), email)
      .input('password', sql.VarChar(255), hashedPassword)
      .output('userId', sql.Int)
      .execute('sp_RegisterUser');

    const userId = result.output.userId;
    if (!userId) {
      // If stored procedure returns userId = 0 or null to indicate duplicate, handle it
      return res.status(409).json({ message: 'User registration failed: email or username may already exist' });
    }

    // Optionally log activity (ip detection)
    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip;
    await logActivity(userId, 'Registration', 'User registered', ipAddress);

    res.status(201).json({ message: 'User registered successfully', userId });

  } catch (err) {
    // If your DB throws a unique constraint message, handle gracefully
    if (err && err.originalError && typeof err.originalError.message === 'string' &&
        err.originalError.message.toLowerCase().includes('unique')) {
      return res.status(409).json({ message: 'Email or username already registered' });
    }

    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// LOGIN ROUTE (kept mostly same)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('email', sql.VarChar(255), email)
      .execute('sp_AuthenticateUser');

    const user = result.recordset && result.recordset[0];
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip;

    await logActivity(user.id, 'Login', 'User logged in', ipAddress, token, 'JWT', tokenExpiry);

 res.json({
      token,
      message: 'Login successful',
      firstName: user.first_name,   
      username: user.username       
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
