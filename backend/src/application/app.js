const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
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
const rooms_router = require('../route/room.route');
const admin_router = require('../route/admin.route');
const file_router = require('../route/file.route');

app.use(cors());
app.use(express.json());
app.use(user_router);
app.use(messages_router)
app.use(chat_router);
app.use(rooms_router);
app.use(admin_router);
app.use(file_router);

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

// Test route to verify server is running
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });

});


// Serve uploaded files
app.use('/uploads', express.static('uploads'));

module.exports = { server, io, onlineUsers };