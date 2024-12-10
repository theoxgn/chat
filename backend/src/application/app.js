const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const pool = require('../config/postgres');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "192.168.1.3:3002"],
        methods: ["GET", "POST"]
    }
});

const {errorMiddleware} = require('../middleware/error.middleware');

// * Import from service
const onlineUsers = require('../store/onlineUsers.store')

// * Import routes
const userRouter = require('../route/user.route');
const messagesRouter = require('../route/message.route');
const chatRouter = require('../route/chat.route');
const roomRouter = require('../route/room.route');
const adminRouter = require('../route/admin.route');
const fileRouter = require('../route/file.route');
const menuRouter = require('../route/menu.route');

app.use(cors());
app.use(express.json());
app.use(userRouter);
app.use(messagesRouter)
app.use(chatRouter);
app.use(roomRouter);
app.use(adminRouter);
app.use(fileRouter);
app.use(menuRouter);

// *Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // !Handle user online status
    socket.on('user_online', (userId) => {
        onlineUsers.set(userId, true);
        io.emit('user_status_change', {userId, online: true});
    });

    // !Handle user offline status
    socket.on('user_offline', (userId) => {
        onlineUsers.delete(userId);
        io.emit('user_status_change', {userId, online: false});
    });

    // !Handle user connection
    socket.on('user_connected', (userId) => {
        socket.userId = userId;
        io.emit('user_connected');
    });

    // !Handle user joining room
    socket.on('join_room', async (data) => {
        const {userId, roomId} = data;
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

    // !Handle user sending message
    socket.on('send_message', async (data) => {
        const {roomId, userId, content} = data;
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

    // !Handle user leaving room (disconnect)
    socket.on('disconnect', () => {
        // Find and remove disconnected user
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user_status_change', {userId, online: false});
                break;
            }
        }
        if (socket.userId) {
            io.emit('user_disconnected');
        }
        console.log('User disconnected:', socket.id);
    });
});

// *Test route to verify server is running
app.get('/', (req, res) => {
    res.json({message: 'Server is running!'});

});


// *Serve uploaded files
app.use('/uploads', express.static('uploads'));

// * Error Middleware
app.use(errorMiddleware)

module.exports = {server, io, onlineUsers};