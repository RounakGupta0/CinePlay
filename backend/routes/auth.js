const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, logout, getMe, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/resend-verification', resendVerification);

module.exports = router;
