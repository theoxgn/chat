class SocketService {
    async publishChatListUpdate(data, io, onlineUsers, MessageServices, RoomServices) {
        const {roomId, userId} = data;

        console.log("publishing chat list update for room", roomId + " and user", userId);
        // Dapatkan recipient userId dari database berdasarkan roomId
        const room = await RoomServices.getRoomById(roomId);
        // recipientId adalah userId yang bukan sender
        const recipientId = userId === room.initiator ? room.recipient : room.initiator;
        // subMenuId adalah subMenu yang sama dengan room
        const subMenuId = room.subMenuId;

        // Emit update_chat_list hanya ke sender dan recipient dengan subMenu yang sama
        const senderSocketId = onlineUsers.get(userId);
        const recipientSocketId = onlineUsers.get(recipientId);

        if (senderSocketId) {
            io.to(senderSocketId).emit('update_chat_list', {
                roomId,
                userId,
                subMenuId,
            });
        }

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('update_chat_list', {
                roomId,
                userId,
                subMenuId,
            });
        }
    }
}

module.exports = new SocketService();