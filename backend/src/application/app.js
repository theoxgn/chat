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
    },
    connectionStateRecovery: {}
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

// * Import services
const MessageServices = require('../service/message.service');
const RoomServices = require('../service/room.service');
const SocketService = require('../service/socket.service');
const UserService = require('../service/user.service');

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
    socket.on('set_online_user', async (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log('User online:', userId);

        // Broadcast ke semua client bahwa user ini online
        io.emit('user_status_changed', {
            userId,
            status: 'online'
        });

        // Kirim daftar semua user yang online ke client yang baru connect
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));

        // Update last seen
        await UserService.updateUserLastSeen(userId);
    });

    // !Handle get online users
    socket.on('get_online_users', () => {
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));
    });

    // !Handle user offline status
    socket.on('set_user_offline', async (userId) => {
        onlineUsers.delete(userId);
        io.emit('user_status_changed', {userId, online: false});

        // Update last seen
        await UserService.updateUserLastSeen(userId);
    });

    // !Handle typing status
    socket.on('set_typing', (data) => {
        const {roomId, userId, typing} = data;

        // send to all clients
        io.emit('receive_typing', {userId, typing});

        // send to specific room
        socket.to(roomId).emit('receive_typing', {userId, typing});
    });

    // !Handle room joining
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // !Handle room leaving
    socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room ${roomId}`);
    });

    // !Handle user sending message
    socket.on('send_message', async (data) => {
        const {roomId, userId, content, tempId, files} = data;
        console.log(data, " <-- received on server");
        const message = await MessageServices.createMessage(roomId, userId, content, files);
        console.log(message, " <-- message created on server");
        const messageJson = JSON.parse(JSON.stringify(message));
        messageJson.tempId = tempId;
        io.to(roomId).emit('receive_message', messageJson);

        await SocketService.publishChatListUpdate(data, io, onlineUsers, MessageServices, RoomServices);
    });

    // !Handle message read
    socket.on('read_message', async (data) => {
        const {roomId, userId, messageIds} = data;

        // Update in database
        const updated = await MessageServices.readMessage(roomId, userId, messageIds);

        // Broadcast to all clients in the room that messages have been read
        console.log("sending message read update to room", roomId);
        socket.to(roomId).emit('message_read_update', {
            messageIds
        });

        console.log(updated, " <-- message read on server");
        await SocketService.publishChatListUpdate(data, io, onlineUsers, MessageServices, RoomServices);
    });

    // !Handle message update
    socket.on('update_message', async (data) => {
        const {roomId, messageId, content} = data;
        console.log(data, " <-- received on server");
        const updatedMessage = await MessageServices.editMessage(messageId, content);
        io.to(roomId).emit('message_updated', updatedMessage);

        await SocketService.publishChatListUpdate(data, io, onlineUsers, MessageServices, RoomServices);
    });

    // !Handle message delete
    socket.on('delete_message', async (data) => {
        const {roomId, messageId} = data;
        console.log(data, " <-- received on server");
        const deletedMessage = await MessageServices.deleteMessage(messageId);
        io.to(roomId).emit('message_deleted', deletedMessage);

        await SocketService.publishChatListUpdate(data, io, onlineUsers, MessageServices, RoomServices);
    });

    // !Handle message reply
    socket.on('reply_message', async (data) => {
        const {roomId, userId, content, replyTo, tempId} = data;
        console.log(data, " <-- received on server");
        const replyMessage = await MessageServices.replyMessage(roomId, userId, content, replyTo);
        const messageJson = JSON.parse(JSON.stringify(replyMessage));
        messageJson.tempId = tempId;
        io.to(roomId).emit('message_replied', messageJson);

        await SocketService.publishChatListUpdate(data, io, onlineUsers, MessageServices, RoomServices);
    });

    // !Handle message forward
    socket.on('forward_message', async (data) => {
        const {targetRoomId, userId, messageId} = data;
        data.roomId = targetRoomId;
        console.log(data, " <-- received on server");
        const forwardMessage = await MessageServices.forwardMessage(messageId, targetRoomId, userId);
        io.to(targetRoomId).emit('receive_message', forwardMessage);

        await SocketService.publishChatListUpdate(data, io, onlineUsers, MessageServices, RoomServices);
    });

    // !Handle disconnect
    socket.on('disconnect', async () => {
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

            // Update last seen
            await UserService.updateUserLastSeen(disconnectedUserId);
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