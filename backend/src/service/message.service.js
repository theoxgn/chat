const pool = require("../config/postgres");
const {io} = require("../application/app");

class MessageService {
    async getMessagesByRoomId(roomId) {
        const result = await pool.query(
            `SELECT m.*, u.username
             FROM messages m
                      JOIN users u ON m.user_id = u.id
             WHERE room_id = $1
             ORDER BY m.created_at ASC`,
            [roomId]
        );
        return result.rows;
    }

    async createMessage(roomId, userId, content) {
        // Here you would typically save to database
        return {
            id: Date.now(),
            roomId,
            userId,
            content,
            created_at: new Date()
        };
    }

    async readMessage(roomId, userId, messageIds) {
        // Update read status in database
        await pool.query(
            'UPDATE messages SET read = true, read_at = NOW() WHERE id = ANY($1) AND user_id != $2',
            [messageIds, userId]
        );

        // Emit read receipt event
        if (io) {
            io.to(roomId).emit('messages_read', {
                roomId,
                userId,
                messageIds,
                readAt: new Date()
            });
        }
        return {success: true};
    }

    async getUnreadMessagesCount(userId) {
        const result = await pool.query(
            'SELECT room_id, COUNT(*) as count FROM messages WHERE user_id != $1 AND read = false GROUP BY room_id',
            [userId]
        );
        return result.rows;
    }

    async searchMessageInRoom(roomId, searchQuery) {
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

        return {
            totalResults: result.rows.length,
            groupedResults
        };
    }

    async deleteMessage(messageId) {

        // Optional: Add additional checks here (e.g., message ownership)
        await pool.query(
            'DELETE FROM messages WHERE id = $1',
            [messageId]
        );

        return {success: true};
    }

    async forwardMessage(messageId, targetRoomId, userId) {
        const result = await pool.query(
            `INSERT INTO messages (room_id, user_id, content, forwarded_from)
             SELECT $1, $2, content, id
             FROM messages
             WHERE id = $3
             RETURNING *`,
            [targetRoomId, userId, messageId]
        );

        return result.rows[0];
    }


}

module.exports = new MessageService();