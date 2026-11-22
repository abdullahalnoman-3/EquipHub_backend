const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');
const { sendEquipmentStatusToOwner } = require('../services/email.service');

// get all equipment for admin moderation (Pending, Approved, Rejected)
const getAdminEquipment = async (req, res) => {
  try {
    const { status } = req.query;
    const { equipmentCollection } = getCollections();

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const equipmentList = await equipmentCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      totalCount: equipmentList.length,
      data: equipmentList
    });
  } catch (error) {
    console.error('getAdminEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin equipment list'
    });
  }
};

// update equipment status (Approve or Reject)
const updateEquipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Approved', 'Rejected', 'Pending'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved, Rejected, or Pending'
      });
    }

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

    await equipmentCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    // trigger email alert to owner in background
    if (equipment.owner?.email) {
      sendEquipmentStatusToOwner(equipment, status).catch(err => {
        console.log('Owner email notice:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: `Equipment status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('updateEquipmentStatus error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment status'
    });
  }
};

// admin delete any equipment
const deleteAdminEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { equipmentCollection, bookingsCollection } = getCollections();

    // Check if equipment has any associated rental orders/bookings
    const existingOrdersCount = await bookingsCollection.countDocuments({
      equipmentId: new ObjectId(id)
    });

    if (existingOrdersCount > 0) {
      return res.status(400).json({
        success: false,
        hasOrders: true,
        orderCount: existingOrdersCount,
        message: `Cannot delete equipment. There are ${existingOrdersCount} rental order(s) associated with this equipment. Please delete those rental orders first.`
      });
    }

    const result = await equipmentCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Equipment deleted by admin successfully'
    });
  } catch (error) {
    console.error('deleteAdminEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment'
    });
  }
};

// get all rental bookings for admin monitoring (Admin Dashboard)
const getAllRentals = async (req, res) => {
  try {
    const { bookingsCollection } = getCollections();
    const rentals = await bookingsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      totalCount: rentals.length,
      data: rentals
    });
  } catch (error) {
    console.error('getAllRentals error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all rentals for admin'
    });
  }
};

module.exports = {
  getAdminEquipment,
  updateEquipmentStatus,
  deleteAdminEquipment,
  getAllRentals
};
