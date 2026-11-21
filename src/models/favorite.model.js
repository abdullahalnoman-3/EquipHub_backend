const { ObjectId } = require('mongodb');

// create formatted favorite item
const createFavoriteObject = (equipmentId, user) => {
  return {
    userId: new ObjectId(user._id),
    userEmail: user.email,
    equipmentId: new ObjectId(equipmentId),
    createdAt: new Date()
  };
};

module.exports = {
  createFavoriteObject
};
