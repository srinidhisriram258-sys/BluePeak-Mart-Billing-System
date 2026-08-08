/**
 * Centralized Error Handler Middleware
 * Gracefully handles errors and prevents exposing DB credentials or crashing the server.
 */
function errorHandler(err, req, res, next) {
  const isDbError = ['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'PROTOCOL_CONNECTION_LOST', 'ER_NOT_SUPPORTED_AUTH_MODE'].includes(err.code);

  if (isDbError) {
    console.error(`[Database Warning] ${req.method} ${req.url} -> Code: ${err.code} (${err.sqlState || 'NO_SQL_STATE'})`);
  } else {
    console.error(`[Server Error] ${req.method} ${req.url}:`, err.message || err);
  }

  const statusCode = err.statusCode || (isDbError ? 503 : 500);

  let message = err.message || 'Internal Server Error';
  if (err.code === 'ECONNREFUSED') {
    message = 'MySQL server connection refused. Please verify MySQL service is running on DB_HOST and DB_PORT.';
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    message = 'MySQL Access Denied. Please update DB_USER and DB_PASSWORD in backend/.env';
  } else if (err.code === 'ER_BAD_DB_ERROR') {
    message = "Database 'billing_db' not found. Please run 'npm run init-db' to initialize tables.";
  } else if (isDbError) {
    message = 'Database unavailable. Please verify MySQL server status and backend/.env configuration.';
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;
