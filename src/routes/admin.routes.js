const express = require('express');
const router = express.Router();
const {
  getAdminEquipment,
  updateEquipmentStatus,
  deleteAdminEquipment
} = require('../controllers/admin.controller');
const { verifyToken, verifyAdmin } = require('../middlewares/auth.middleware');

// protect all admin routes with verifyToken and verifyAdmin
router.use(verifyToken, verifyAdmin);

// admin equipment moderation routes
router.get('/equipment', getAdminEquipment);
router.patch('/equipment/:id/status', updateEquipmentStatus);
router.delete('/equipment/:id', deleteAdminEquipment);

module.exports = router;
