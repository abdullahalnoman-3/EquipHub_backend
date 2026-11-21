const express = require('express');
const router = express.Router();
const {
  getAdminEquipment,
  updateEquipmentStatus,
  deleteAdminEquipment,
  getAllRentals
} = require('../controllers/admin.controller');
const {
  getAllReviewsAdmin,
  updateReviewStatusAdmin
} = require('../controllers/review.controller');
const {
  getSMTPSettings,
  updateSMTPSettings
} = require('../controllers/setting.controller');
const { verifyToken, verifyAdmin } = require('../middlewares/auth.middleware');

// protect all admin routes with verifyToken and verifyAdmin
router.use(verifyToken, verifyAdmin);

// admin equipment moderation routes
router.get('/equipment', getAdminEquipment);
router.patch('/equipment/:id/status', updateEquipmentStatus);
router.delete('/equipment/:id', deleteAdminEquipment);

// admin all rentals overview route
router.get('/rentals', getAllRentals);

// admin review moderation routes
router.get('/reviews', getAllReviewsAdmin);
router.patch('/reviews/:id/status', updateReviewStatusAdmin);

// admin SMTP configuration routes
router.get('/smtp', getSMTPSettings);
router.patch('/smtp', updateSMTPSettings);

module.exports = router;
