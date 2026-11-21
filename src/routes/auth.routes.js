const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  socialLogin,
  logoutUser
} = require('../controllers/auth.controller');

// auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/social-login', socialLogin);
router.post('/logout', logoutUser);

module.exports = router;
