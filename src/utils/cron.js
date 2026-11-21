const cron = require('node-cron');
const { getCollections } = require('../config/db');

// automated cron job: updates booking statuses when rental end date has passed
const initRentalCronJob = () => {
  // schedule daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      const { bookingsCollection } = getCollections();
      const now = new Date();

      // update active bookings whose rentalEndDate is in the past
      const result = await bookingsCollection.updateMany(
        {
          bookingStatus: 'Active',
          rentalEndDate: { $lt: now }
        },
        {
          $set: {
            bookingStatus: 'Completed',
            updatedAt: now
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Cron Job] Automatically marked ${result.modifiedCount} overdue bookings as Completed.`);
      }
    } catch (error) {
      console.error('[Cron Job Error]:', error.message);
    }
  });

  console.log('Automated rental status cron job initialized');
};

module.exports = {
  initRentalCronJob
};
