const pool = require("../config/postgres");

class AdminService {
    async resetSequence() {
        // Get the maximum id from the users table
        const result = await pool.query('SELECT MAX(id) FROM users');
        const maxId = result.rows[0].max || 0;

        // Reset the sequence to the max id + 1
        await pool.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${maxId + 1}`);

        return {message: 'Sequence reset successfully', next_id: maxId + 1};
    }
}

module.exports = new AdminService();