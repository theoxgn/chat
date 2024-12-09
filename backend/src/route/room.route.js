const { Router } = require('express');

const pool = require("../config/postgres");

const roomRouter = Router();
roomRouter.post('/api/rooms', async (req, res) => {
    const { user1Id, user2Id } = req.body;

    try {
        // First check if a room already exists for these users
        const existingRoomQuery = `
        SELECT r.id, r.created_at
        FROM chat_rooms r
        JOIN chat_participants p1 ON r.id = p1.room_id
        JOIN chat_participants p2 ON r.id = p2.room_id
        WHERE p1.user_id = $1 AND p2.user_id = $2
      `;

        const existingRoom = await pool.query(existingRoomQuery, [user1Id, user2Id]);

        if (existingRoom.rows.length > 0) {
            return res.json(existingRoom.rows[0]);
        }

        // If no room exists, create a new one
        const result = await pool.query(
            'INSERT INTO chat_rooms DEFAULT VALUES RETURNING *'
        );

        const roomId = result.rows[0].id;

        // Add both users to the room
        await pool.query(
            'INSERT INTO chat_participants (user_id, room_id) VALUES ($1, $2), ($3, $2)',
            [user1Id, roomId, user2Id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating/finding room:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = roomRouter;