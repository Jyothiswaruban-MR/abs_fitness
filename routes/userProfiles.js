const express = require('express');
const { getConnection, sql } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT 
                    u.first_name as firstName, 
                    u.last_name as lastName,
                    u.email,
                    u.phone,
                    p.age,
                    p.gender,
                    p.height_cm as height,
                    p.weight_kg as weight
                FROM users u
                LEFT JOIN userProfiles p ON u.id = p.userId
                WHERE u.id = @userId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/update', authenticateToken, async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('age', sql.Int, req.body.age)
            .input('gender', sql.VarChar(10), req.body.gender)
            .input('height', sql.Float, req.body.height)
            .input('weight', sql.Float, req.body.weight)
            .query(`
                IF EXISTS (SELECT 1 FROM userProfiles WHERE userId = @userId)
                    UPDATE userProfiles SET
                        age = @age,
                        gender = @gender,
                        height_cm = @height,
                        weight_kg = @weight
                    WHERE userId = @userId
                ELSE
                    INSERT INTO userProfiles (userId, age, gender, height_cm, weight_kg)
                    VALUES (@userId, @age, @gender, @height, @weight)
            `);

        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            await pool.request()
                .input('userId', sql.Int, req.user.userId)
                .input('password', sql.VarChar(255), hashedPassword)
                .query('UPDATE users SET password = @password WHERE id = @userId');
        }

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Profile update error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;