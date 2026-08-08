/**
 * Owner Authentication Middleware
 * Protects administrative endpoints (Dashboard, Inventory Mutations, Settings)
 */
function requireOwnerAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer owner_session_')) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Owner login required to access administrative features.'
  });
}

module.exports = requireOwnerAuth;
