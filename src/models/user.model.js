// user schema structure helper
const createUserObject = (userData) => {
  const isOwnerRequest = userData.role === 'Owner' || userData.requestedRole === 'Owner';
  return {
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    password: userData.password,
    photoURL: userData.photoURL || '',
    role: isOwnerRequest ? 'Customer' : (userData.role || 'Customer'), // Owner applicants start as Customer until Admin reviews & approves
    requestedRole: isOwnerRequest ? 'Owner' : 'Customer',
    ownerStatus: isOwnerRequest ? 'Pending' : (userData.ownerStatus || 'None'), // 'None', 'Pending', 'Approved', 'Rejected'
    ownerAppliedAt: isOwnerRequest ? new Date() : null,
    phone: userData.phone || '',
    address: userData.address || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

module.exports = { createUserObject };
