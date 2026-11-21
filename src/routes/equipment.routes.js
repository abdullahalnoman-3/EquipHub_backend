const express = require('express');
const router = express.Router();
const {
  getAllPublicEquipment,
  getEquipmentById,
  createEquipment,
  getMyEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipment.controller');
const { verifyToken, verifyOwner } = require('../middlewares/auth.middleware');

// public equipment routes (search, filter, sort and details)
router.get('/', getAllPublicEquipment);
router.get('/my-equipment', verifyToken, verifyOwner, getMyEquipment);
router.get('/:id', getEquipmentById);

// owner equipment management routes
router.post('/', verifyToken, verifyOwner, createEquipment);
router.patch('/:id', verifyToken, verifyOwner, updateEquipment);
router.delete('/:id', verifyToken, verifyOwner, deleteEquipment);

module.exports = router;
