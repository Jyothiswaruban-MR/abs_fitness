require('dotenv').config({path: './properties.env'});
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth'); 
const workoutRoutes = require('./routes/workouts');
const goalRoutes = require("./routes/goals");
const userProfileRoutes = require("./routes/userProfiles");
const dashboardRoutes = require('./routes/dashboard');
const quotesRoutes = require('./routes/quotes');

const {getConnection, sql} = require('./config');


const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/workouts', workoutRoutes);
app.use("/goals",goalRoutes);
app.use('/profile', userProfileRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/quotes', quotesRoutes);


app.get('/',(req, res)=>{
    res.send("Basic checks done, app is running ");
});

app.get('/test-db', async (req, res) => {
    try {
      const pool = await getConnection();
      if (!pool) throw new Error('No DB connection pool returned');
      const result = await pool.request().query('SELECT * FROM users');
      res.json({ success: true, users: result.recordset });
    } catch (err) {
      console.error('DB query failed:', err);
      res.status(500).json({ success: false, message: 'Database query failed', error: err.message });
    }
  });
  

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });