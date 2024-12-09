const pool = require("../config/postgres");
const typingUsers = require("../store/typingUsers.store")

class ChatService {
    async createChatTypingStatus(roomId, userId, typing) {
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

        return {
            success: true,
            typingUsers: Array.from(roomTyping)
        };

    }

    async getChatTypingStatus(roomKey) {
        const roomTyping = typingUsers.get(roomKey) || new Set();
        return {
            typingUsers: Array.from(roomTyping)
        };
    }

    async createChatPin(userId, roomId) {
        await pool.query(
            'INSERT INTO pinned_chats (user_id, room_id) VALUES ($1, $2) ON CONFLICT (user_id, room_id) DO NOTHING',
            [userId, roomId]
        );
        return {success: true};
    }

    async deleteChatPin(userId, roomId) {
        await pool.query(
            'DELETE FROM pinned_chats WHERE user_id = $1 AND room_id = $2',
            [userId, roomId]
        );
        return {success: true};
    }

    async getPinnedChats(userId) {
        const result = await pool.query(
            `SELECT pc.*, cr.*, u.username as other_user_name
             FROM pinned_chats pc
                      JOIN chat_rooms cr ON pc.room_id = cr.id
                      JOIN chat_participants cp ON cr.id = cp.room_id
                      JOIN users u ON cp.user_id = u.id
             WHERE pc.user_id = $1
               AND cp.user_id != $1
             ORDER BY pc.pinned_at DESC`,
            [userId]
        );
        return result.rows;
    }
}

module.exports = new ChatService();