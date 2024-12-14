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
    console.log('User connected to socketio:', socket.id);

    // !Handle user online status
    socket.on('set_online_user', (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log('User online:', userId);

        // Broadcast ke semua client bahwa user ini online
        io.emit('user_status_changed', {
            userId,
            status: 'online'
        });

        // Kirim daftar semua user yang online ke client yang baru connect
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));
    });

    // !Handle get online users
    socket.on('get_online_users', () => {
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));
    });

    // !Handle user offline status
    socket.on('set_user_offline', (userId) => {
        onlineUsers.delete(userId);
        io.emit('user_status_changed', {userId, online: false});
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

    // !Handle disconnect
    socket.on('disconnect', () => {
        // Cari userId berdasarkan socket.id yang disconnect
        let disconnectedUserId = null;
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }

        if (disconnectedUserId) {
            // Hapus user dari daftar online
            onlineUsers.delete(disconnectedUserId);
            console.log('User disconnected:', disconnectedUserId);

            // Broadcast ke semua client bahwa user ini offline
            io.emit('user_status_changed', {
                userId: disconnectedUserId,
                status: 'offline'
            });
        }
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