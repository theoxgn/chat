const { Router } = require('express');
const messages_router = Router();
const { io } = require('../application/app');
const pool = require("../config/postgres");

messages_router.get('/api/messages/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        const result = await pool.query(
            `SELECT m.*, u.username
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE room_id = $1
         ORDER BY m.created_at ASC`,
            [roomId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Messages endpoint
messages_router.post('/api/messages', (req, res) => {
    const { roomId, userId, content } = req.body;

    // Here you would typically save to database
    const message = {
        id: Date.now(),
        roomId,
        userId,
        content,
        created_at: new Date()
    };

    res.json(message);
});


// Update message read status
messages_router.post('/api/messages/read', async (req, res) => {
    const { roomId, userId, messageIds } = req.body;

    try {
        // Update read status in database
        await pool.query(
            'UPDATE messages SET read = true, read_at = NOW() WHERE id = ANY($1) AND user_id != $2',
            [messageIds, userId]
        );

        // Emit read receipt event
        io.to(roomId).emit('messages_read', {
            roomId,
            userId,
            messageIds,
            readAt: new Date()
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to update read status' });
    }
});

// Get unread messages count
messages_router.get('/api/messages/unread/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            'SELECT room_id, COUNT(*) as count FROM messages WHERE user_id != $1 AND read = false GROUP BY room_id',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Add this new endpoint to search messages
messages_router.get('/api/messages/search/:roomId', async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const searchQuery = req.query.query;

        // Input validation
        if (isNaN(roomId) || !searchQuery) {
            return res.status(400).json({
                error: 'Valid room ID and search query are required'
            });
        }

        // Add logging for debugging
        console.log('Searching messages:', { roomId, searchQuery });

        const result = await pool.query(
            `SELECT m.*, u.username
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = $1
       AND LOWER(m.content) LIKE LOWER($2)
       ORDER BY m.created_at DESC`,
            [roomId, `%${searchQuery}%`]
        );

        // Group results by date for better organization
        const groupedResults = result.rows.reduce((acc, message) => {
            const date = new Date(message.created_at).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(message);
            return acc;
        }, {});

        res.json({
            totalResults: result.rows.length,
            groupedResults
        });

    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({
            error: 'Failed to search messages',
            details: error.message
        });
    }
});

// Delete message endpoint
messages_router.delete('/api/messages/:messageId', async (req, res) => {
    const { messageId } = req.params;

    try {
        // Optional: Add additional checks here (e.g., message ownership)
        await pool.query(
            'DELETE FROM messages WHERE id = $1',
            [messageId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Forward message endpoint
messages_router.post('/api/messages/forward', async (req, res) => {
    const { messageId, targetRoomId, userId } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO messages (room_id, user_id, content, forwarded_from)
       SELECT $1, $2, content, id
       FROM messages
       WHERE id = $3
       RETURNING *`,
            [targetRoomId, userId, messageId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error forwarding message:', error);
        res.status(500).json({ error: 'Failed to forward message' });
    }
});

module.exports = messages_router;