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



// Import routes
const {user_router, onlineUsers} = require('../route/user.route');
const messages_router = require('../route/message.route');
const chat_router = require('../route/chat.route');

app.use(cors());
app.use(express.json());
app.use(user_router);
app.use(messages_router)
app.use(chat_router);

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

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

module.exports = { server, io, onlineUsers };