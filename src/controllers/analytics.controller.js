const { getCollections } = require('../config/db');

// month names helper for chart labels
const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// admin dashboard analytics (Challenge 3)
const getAdminAnalytics = async (req, res) => {
  try {
    const { usersCollection, equipmentCollection, bookingsCollection, paymentsCollection } = getCollections();

    // calculate counts in parallel
    const [
      totalUsers,
      totalEquipment,
      pendingApprovals,
      approvedEquipment,
      totalBookings,
      completedRentals,
      activeRentals
    ] = await Promise.all([
      usersCollection.countDocuments(),
      equipmentCollection.countDocuments(),
      equipmentCollection.countDocuments({ status: 'Pending' }),
      equipmentCollection.countDocuments({ status: 'Approved' }),
      bookingsCollection.countDocuments(),
      bookingsCollection.countDocuments({ bookingStatus: 'Completed' }),
      bookingsCollection.countDocuments({ bookingStatus: 'Active' })
    ]);

    // calculate total revenue from payments collection
    const revenueAgg = await paymentsCollection.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const totalRevenue = revenueAgg[0]?.total || 0;

    // monthly booking and revenue statistics for charts
    const monthlyRaw = await bookingsCollection.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$bookingDate' },
            month: { $month: '$bookingDate' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).toArray();

    // format monthly statistics for chart
    const monthlyStats = monthlyRaw.map(item => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.totalRevenue,
      bookings: item.totalBookings
    }));

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEquipment,
        pendingApprovals,
        approvedEquipment,
        totalBookings,
        completedRentals,
        activeRentals,
        totalRevenue,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('getAdminAnalytics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin analytics'
    });
  }
};

// owner dashboard analytics (Challenge 3)
const getOwnerAnalytics = async (req, res) => {
  try {
    const { equipmentCollection, bookingsCollection } = getCollections();
    const ownerEmail = req.user.email;

    // counts for owner's equipment & rentals
    const [
      totalEquipment,
      pendingEquipment,
      approvedEquipment,
      totalRentals,
      completedRentals,
      activeRentals
    ] = await Promise.all([
      equipmentCollection.countDocuments({ 'owner.email': ownerEmail }),
      equipmentCollection.countDocuments({ 'owner.email': ownerEmail, status: 'Pending' }),
      equipmentCollection.countDocuments({ 'owner.email': ownerEmail, status: 'Approved' }),
      bookingsCollection.countDocuments({ ownerEmail }),
      bookingsCollection.countDocuments({ ownerEmail, bookingStatus: 'Completed' }),
      bookingsCollection.countDocuments({ ownerEmail, bookingStatus: 'Active' })
    ]);

    // calculate total earnings for this owner
    const earningsAgg = await bookingsCollection.aggregate([
      { $match: { ownerEmail, paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).toArray();
    const totalEarnings = earningsAgg[0]?.total || 0;

    // monthly earnings report for chart
    const monthlyRaw = await bookingsCollection.aggregate([
      { $match: { ownerEmail, paymentStatus: 'Paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$bookingDate' },
            month: { $month: '$bookingDate' }
          },
          totalEarnings: { $sum: '$totalAmount' },
          totalRentals: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).toArray();

    const monthlyEarnings = monthlyRaw.map(item => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      earnings: item.totalEarnings,
      rentals: item.totalRentals
    }));

    res.status(200).json({
      success: true,
      data: {
        totalEquipment,
        pendingEquipment,
        approvedEquipment,
        totalRentals,
        completedRentals,
        activeRentals,
        totalEarnings,
        monthlyEarnings
      }
    });
  } catch (error) {
    console.error('getOwnerAnalytics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner analytics'
    });
  }
};

module.exports = {
  getAdminAnalytics,
  getOwnerAnalytics
};
