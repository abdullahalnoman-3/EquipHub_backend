const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyRentals,
  getOwnerRentals,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/booking.controller');
const { verifyToken, verifyCustomer, verifyOwner } = require('../middlewares/auth.middleware');

// customer routes
router.post('/', verifyToken, verifyCustomer, createBooking);
router.get('/my-rentals', verifyToken, verifyCustomer, getMyRentals);

// owner rental orders route
router.get('/owner-rentals', verifyToken, verifyOwner, getOwnerRentals);

// update booking status route (Owner or Admin)
router.patch('/:id/status', verifyToken, updateBookingStatus);

// delete rental order route (Owner or Admin)
router.delete('/:id', verifyToken, deleteBooking);

module.exports = router;
