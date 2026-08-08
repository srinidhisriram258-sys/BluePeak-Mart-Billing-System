const dotenv = require('dotenv');
dotenv.config();

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'CHANGE_ME';

      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
      }

      if (username === adminUser && password === adminPass) {
        // Generate lightweight demo session token
        const token = `owner_session_${Buffer.from(`${adminUser}:${Date.now()}`).toString('base64')}`;

        return res.json({
          success: true,
          message: 'Owner login successful.',
          data: {
            token,
            username: adminUser,
            role: 'owner'
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid owner username or password.'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Authentication error.' });
    }
  }

  static async verify(req, res) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer owner_session_')) {
      return res.json({ success: true, valid: true, role: 'owner' });
    }
    return res.status(401).json({ success: false, valid: false, message: 'Unauthorized' });
  }
}

module.exports = AuthController;
