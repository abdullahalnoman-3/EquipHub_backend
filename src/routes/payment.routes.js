const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifyCheckoutSession,
  getPaymentConfig
} = require('../controllers/payment.controller');
const { verifyToken, verifyCustomer } = require('../middlewares/auth.middleware');

// stripe payment routes
router.get('/config', getPaymentConfig);
router.post('/create-checkout-session', verifyToken, verifyCustomer, createCheckoutSession);
router.get('/verify-session/:sessionId', verifyToken, verifyCheckoutSession);

module.exports = router;
