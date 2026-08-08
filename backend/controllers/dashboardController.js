const DashboardModel = require('../models/dashboardModel');
const { checkConnection } = require('../config/db');

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const stats = await DashboardModel.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getHealth(req, res, next) {
    try {
      const dbStatus = await checkConnection();
      res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
