const express = require('express');
const router = express.Router();
const {
  createEquipment,
  getMyEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipment.controller');
const { verifyToken, verifyOwner } = require('../middlewares/auth.middleware');

// owner equipment management routes
router.post('/', verifyToken, verifyOwner, createEquipment);
router.get('/my-equipment', verifyToken, verifyOwner, getMyEquipment);
router.patch('/:id', verifyToken, verifyOwner, updateEquipment);
router.delete('/:id', verifyToken, verifyOwner, deleteEquipment);

module.exports = router;
