const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  socialLogin,
  logoutUser
} = require('../controllers/auth.controller');
const { getMyProfile } = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/social-login', socialLogin);
router.post('/logout', logoutUser);
router.get('/me', verifyToken, getMyProfile);

module.exports = router;
