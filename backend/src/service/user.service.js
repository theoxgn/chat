const pool = require("../config/postgres");
const onlineUsers = require("../store/onlineUsers.store");

class UserService {
    async checkUserExists(username) {
        const result = await pool.query(
            'SELECT id, username FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0];
    }

    async createUser(username) {
        // First check if user exists
        const existingUser = await this.checkUserExists(username);
        if (existingUser) {
            return existingUser; // Return existing user instead of creating new one
        }

        // Create new user
        const result = await pool.query(
            'INSERT INTO users (username) VALUES ($1) RETURNING id, username',
            [username]
        );

        return result.rows[0];
    }

    async getAllUsers() {
        const result = await pool.query('SELECT id, username FROM users ORDER BY id');
        return result.rows
    }

    async getOnlineUsers() {
        return Array.from(onlineUsers.keys());
    }
}

module.exports = new UserService();