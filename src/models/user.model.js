// user schema structure helper
const createUserObject = (userData) => {
  return {
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    password: userData.password,
    photoURL: userData.photoURL || '',
    role: userData.role || 'Customer', // default role is Customer
    phone: userData.phone || '',
    address: userData.address || '',
    createdAt: new Date()
  };
};

module.exports = { createUserObject };
