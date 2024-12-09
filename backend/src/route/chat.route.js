const { Router } = require('express');
const pool = require("../config/postgres");

// Store typing status in memory
const typingUsers = new Map();

// Create a new router
const chat_router = Router();

// Typing status endpoint
chat_router.post('/api/typing', (req, res) => {
    console.log('Received typing update:', req.body); // Debug log

    const { roomId, userId, typing } = req.body;

    if (!roomId || !userId) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }

    const roomKey = `room:${roomId}`;
    let roomTyping = typingUsers.get(roomKey) || new Set();

    if (typing) {
        roomTyping.add(userId);
    } else {
        roomTyping.delete(userId);
    }

    typingUsers.set(roomKey, roomTyping);

    // Auto-remove typing status after 3 seconds
    setTimeout(() => {
        const currentRoom = typingUsers.get(roomKey);
        if (currentRoom) {
            currentRoom.delete(userId);
            if (currentRoom.size === 0) {
                typingUsers.delete(roomKey);
            } else {
                typingUsers.set(roomKey, currentRoom);
            }
        }
    }, 3000);

    res.json({
        success: true,
        typingUsers: Array.from(roomTyping)
    });
});


// Get typing status
chat_router.get('/api/typing/:roomId', (req, res) => {
    const roomKey = `room:${req.params.roomId}`;
    const roomTyping = typingUsers.get(roomKey) || new Set();

    res.json({
        typingUsers: Array.from(roomTyping)
    });
});


// Add pin chat endpoint
chat_router.post('/api/chats/pin', async (req, res) => {
    const { userId, roomId } = req.body;

    try {
        await pool.query(
            'INSERT INTO pinned_chats (user_id, room_id) VALUES ($1, $2) ON CONFLICT (user_id, room_id) DO NOTHING',
            [userId, roomId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add unpin chat endpoint
chat_router.delete('/api/chats/pin', async (req, res) => {
    const { userId, roomId } = req.body;

    try {
        await pool.query(
            'DELETE FROM pinned_chats WHERE user_id = $1 AND room_id = $2',
            [userId, roomId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pinned chats endpoint
chat_router.get('/api/chats/pin/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT pc.*, cr.*, u.username as other_user_name
       FROM pinned_chats pc
       JOIN chat_rooms cr ON pc.room_id = cr.id
       JOIN chat_participants cp ON cr.id = cp.room_id
       JOIN users u ON cp.user_id = u.id
       WHERE pc.user_id = $1 AND cp.user_id != $1
       ORDER BY pc.pinned_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export the router
module.exports = chat_router;
