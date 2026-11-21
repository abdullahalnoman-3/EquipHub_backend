const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifyCheckoutSession
} = require('../controllers/payment.controller');
const { verifyToken, verifyCustomer } = require('../middlewares/auth.middleware');

// stripe payment routes
router.post('/create-checkout-session', verifyToken, verifyCustomer, createCheckoutSession);
router.get('/verify-session/:sessionId', verifyToken, verifyCheckoutSession);

module.exports = router;
