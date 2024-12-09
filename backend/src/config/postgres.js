const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chatbaru',
    password: 'admin123*',
    port: 5432,
});

module.exports = pool;