const express = require('express');
const router = express.Router();
const { createBooking } = require('../controllers/booking.controller');
const { verifyToken, verifyCustomer } = require('../middlewares/auth.middleware');

// customer create booking
router.post('/', verifyToken, verifyCustomer, createBooking);

module.exports = router;
