const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getProfile); // 🆕 Endpoint na získanie profilu používateľa

module.exports = router;
