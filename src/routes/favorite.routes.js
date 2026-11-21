const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  getMyFavorites,
  checkIsFavorite,
  removeFromFavorites
} = require('../controllers/favorite.controller');
const { verifyToken, verifyCustomer } = require('../middlewares/auth.middleware');

// protect all favorite routes for customer/renter
router.use(verifyToken, verifyCustomer);

router.post('/', addToFavorites);
router.get('/', getMyFavorites);
router.get('/check/:equipmentId', checkIsFavorite);
router.delete('/:equipmentId', removeFromFavorites);

module.exports = router;
