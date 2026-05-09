const { Pool, types } = require('pg');

// Return DATE columns as 'YYYY-MM-DD' strings (avoids timezone shifts)
types.setTypeParser(1082, (val) => val);
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err);
});

module.exports = pool;
