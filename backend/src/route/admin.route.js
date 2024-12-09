
const { Router } = require('express');
const pool = require('../config/postgres');

const admin_router = Router();

// Add a route to reset the sequence if needed
admin_router.post('/api/admin/reset-sequence', async (req, res) => {
    try {
        // Get the maximum id from the users table
        const result = await pool.query('SELECT MAX(id) FROM users');
        const maxId = result.rows[0].max || 0;

        // Reset the sequence to the max id + 1
        await pool.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${maxId + 1}`);

        res.json({ message: 'Sequence reset successfully', next_id: maxId + 1 });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = admin_router;