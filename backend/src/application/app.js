const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const pool = require('../config/postgres');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000","192.168.1.3:3002"],
        methods: ["GET", "POST"]
    }
});

// Store typing status in memory
const typingUsers = new Map();
// Track online users
const onlineUsers = new Map();
// Store messages with read status
const messages = new Map();

app.use(cors());
app.use(express.json());



// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user online status
    socket.on('user_online', (userId) => {
        onlineUsers.set(userId, true);
        io.emit('user_status_change', { userId, online: true });
    });

    socket.on('user_offline', (userId) => {
        onlineUsers.delete(userId);
        io.emit('user_status_change', { userId, online: false });
    });

    socket.on('user_connected', (userId) => {
        socket.userId = userId;
        io.emit('user_connected');
    });

    socket.on('join_room', async (data) => {
        const { userId, roomId } = data;
        socket.join(roomId);

        try {
            const result = await pool.query(
                'SELECT EXISTS(SELECT 1 FROM chat_participants WHERE user_id = $1 AND room_id = $2)',
                [userId, roomId]
            );

            if (!result.rows[0].exists) {
                await pool.query(
                    'INSERT INTO chat_participants (user_id, room_id) VALUES ($1, $2)',
                    [userId, roomId]
                );
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }
    });

    socket.on('send_message', async (data) => {
        const { roomId, userId, content } = data;
        console.log(data, " aku di server")
        try {
            const result = await pool.query(
                `INSERT INTO messages (room_id, user_id, content)
           VALUES ($1, $2, $3)
           RETURNING *, (SELECT username FROM users WHERE id = $2)`,
                [roomId, userId, content]
            );

            io.to(roomId).emit('receive_message', result.rows[0]);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('disconnect', () => {
        // Find and remove disconnected user
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user_status_change', { userId, online: false });
                break;
            }
        }
        if (socket.userId) {
            io.emit('user_disconnected');
        }
        console.log('User disconnected:', socket.id);
    });
});

app.post('/api/rooms', async (req, res) => {
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

app.get('/api/messages/:roomId', async (req, res) => {
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

const checkUserExists = async (username) => {
    const result = await pool.query(
        'SELECT id, username FROM users WHERE username = $1',
        [username]
    );
    return result.rows[0];
};

// Updated users endpoint with better handling
app.post('/api/users', async (req, res) => {
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
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username FROM users ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a route to reset the sequence if needed
app.post('/api/admin/reset-sequence', async (req, res) => {
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

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Add any file type restrictions here
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: fileFilter
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // You might want to save file info to your database here

        res.json({
            success: true,
            fileUrl: fileUrl,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });
    } catch (error) {
        console.error('Error handling file upload:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Test route to verify server is running
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });

});

// Typing status endpoint
app.post('/api/typing', (req, res) => {
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
app.get('/api/typing/:roomId', (req, res) => {
    const roomKey = `room:${req.params.roomId}`;
    const roomTyping = typingUsers.get(roomKey) || new Set();

    res.json({
        typingUsers: Array.from(roomTyping)
    });
});

// Messages endpoint
app.post('/api/messages', (req, res) => {
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

// Add API endpoint to get online users
app.get('/api/users/online', (req, res) => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    res.json(onlineUserIds);
});

// Update message read status
app.post('/api/messages/read', async (req, res) => {
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
app.get('/api/messages/unread/:userId', async (req, res) => {
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

// Add pin chat endpoint
app.post('/api/chats/pin', async (req, res) => {
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
app.delete('/api/chats/pin', async (req, res) => {
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
app.get('/api/chats/pin/:userId', async (req, res) => {
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

// Add this new endpoint to search messages
app.get('/api/messages/search/:roomId', async (req, res) => {
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
app.delete('/api/messages/:messageId', async (req, res) => {
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
app.post('/api/messages/forward', async (req, res) => {
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

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

module.exports = { server };