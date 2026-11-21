const express = require('express');
const router = express.Router();
const {
  getAdminAnalytics,
  getOwnerAnalytics
} = require('../controllers/analytics.controller');
const { verifyToken, verifyAdmin, verifyOwner } = require('../middlewares/auth.middleware');

// admin analytics route
router.get('/admin', verifyToken, verifyAdmin, getAdminAnalytics);

// owner analytics route
router.get('/owner', verifyToken, verifyOwner, getOwnerAnalytics);

module.exports = router;
