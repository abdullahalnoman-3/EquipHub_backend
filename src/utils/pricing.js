// helper to calculate rental duration and total price
const calculateRentalPrice = (equipment, startDate, endDate, quantity) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = Math.abs(end - start);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let units = diffDays;
  if (equipment.rentalType === 'Weekly') {
    units = Math.max(1, Math.ceil(diffDays / 7));
  } else if (equipment.rentalType === 'Monthly') {
    units = Math.max(1, Math.ceil(diffDays / 30));
  }

  const totalAmount = units * Number(equipment.rentalPrice) * Number(quantity);

  return {
    diffDays,
    units,
    totalAmount
  };
};

module.exports = {
  calculateRentalPrice
};
