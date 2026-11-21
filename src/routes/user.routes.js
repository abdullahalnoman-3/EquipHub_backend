const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  updateUserRole
} = require('../controllers/user.controller');
const { verifyToken, verifyAdmin } = require('../middlewares/auth.middleware');

// user self profile routes
router.get('/me', verifyToken, getMyProfile);
router.patch('/me', verifyToken, updateMyProfile);

// admin user management routes
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.patch('/:id/role', verifyToken, verifyAdmin, updateUserRole);

module.exports = router;
