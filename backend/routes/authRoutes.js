const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.post('/login', AuthController.login);
router.get('/verify', AuthController.verify);

module.exports = router;
