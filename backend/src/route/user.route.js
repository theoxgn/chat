// Import the express router
const { Router } = require('express');
const pool = require('../config/postgres');
const { checkUserExists } = require('../service/user.service');

// Track online users
const onlineUsers = new Map();

// Create a new router
const userRouter = Router();

// Updated users endpoint with better handling
userRouter.post('/api/users', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        // First check if user exists
        const existingUser = await checkUserExists(username);
        if (existingUser) {
            return res.json(existingUser); // Return existing user instead of creating new one
        }

        // Create new user
        const result = await pool.query(
            'INSERT INTO users (username) VALUES ($1) RETURNING id, username',
            [username]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add a route to get all users (useful for debugging)
userRouter.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username FROM users ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add API endpoint to get online users
userRouter.get('/api/users/online', (req, res) => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    res.json(onlineUserIds);
});

// Export the router
module.exports = {userRouter, onlineUsers};
