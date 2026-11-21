const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');
const { validateEquipment, createEquipmentObject } = require('../models/equipment.model');

// create new equipment (Owner only)
const createEquipment = async (req, res) => {
  try {
    const validation = validateEquipment(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { equipmentCollection } = getCollections();
    const newEquipment = createEquipmentObject(req.body, req.user);

    const result = await equipmentCollection.insertOne(newEquipment);

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully. Waiting for admin approval.',
      data: {
        equipmentId: result.insertedId,
        name: newEquipment.name,
        status: newEquipment.status
      }
    });
  } catch (error) {
    console.error('createEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add equipment'
    });
  }
};

// get all equipment added by the logged-in owner
const getMyEquipment = async (req, res) => {
  try {
    const { equipmentCollection } = getCollections();
    const equipmentList = await equipmentCollection
      .find({ 'owner.email': req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: equipmentList
    });
  } catch (error) {
    console.error('getMyEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner equipment'
    });
  }
};

// update equipment (Owner only with ownership check)
const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { equipmentCollection } = getCollections();
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // verify ownership
    if (equipment.owner.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own equipment'
      });
    }

    // prepare update fields
    const allowedFields = [
      'name', 'description', 'category', 'rentalPrice',
      'rentalType', 'availableQuantity', 'condition',
      'brand', 'model', 'image', 'terms', 'location'
    ];

    const updateFields = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'rentalPrice' || field === 'availableQuantity') {
          updateFields[field] = Number(req.body[field]);
        } else {
          updateFields[field] = req.body[field];
        }
      }
    }
    updateFields.updatedAt = new Date();

    await equipmentCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    console.error('updateEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment'
    });
  }
};

// delete equipment (Owner only with ownership check)
const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { equipmentCollection } = getCollections();
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // verify ownership
    if (equipment.owner.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own equipment'
      });
    }

    await equipmentCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error('deleteEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment'
    });
  }
};

module.exports = {
  createEquipment,
  getMyEquipment,
  updateEquipment,
  deleteEquipment
};
