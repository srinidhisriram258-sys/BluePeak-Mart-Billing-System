const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'billing_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to verify connection state safely without exposing credentials
async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { connected: true, message: 'Database connection established successfully.' };
  } catch (error) {
    let safeMessage = 'Database connection error. Please verify MySQL service and credentials in backend/.env';
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      safeMessage = 'MySQL Access Denied. Please set your actual MySQL root password in backend/.env (DB_PASSWORD=...)';
    } else if (error.code === 'ECONNREFUSED') {
      safeMessage = 'MySQL Connection Refused. Please verify MySQL service is running on specified DB_HOST and DB_PORT.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      safeMessage = "Database 'billing_db' does not exist. Run 'npm run init-db' to create tables.";
    }
    return {
      connected: false,
      message: safeMessage,
      code: error.code
    };
  }
}

module.exports = {
  pool,
  checkConnection
};
