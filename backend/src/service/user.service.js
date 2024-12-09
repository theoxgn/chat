const pool = require("../config/postgres");

const checkUserExists = async (username) => {
    const result = await pool.query(
        'SELECT id, username FROM users WHERE username = $1',
        [username]
    );
    return result.rows[0];
};