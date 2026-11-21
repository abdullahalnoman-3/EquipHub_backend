const express = require('express');
const router = express.Router();
const {
  createReview,
  getEquipmentReviews,
  getFeaturedReviews
} = require('../controllers/review.controller');
const { verifyToken, verifyCustomer } = require('../middlewares/auth.middleware');

// public review routes
router.get('/featured', getFeaturedReviews);
router.get('/equipment/:equipmentId', getEquipmentReviews);

// customer submit review
router.post('/', verifyToken, verifyCustomer, createReview);

module.exports = router;
