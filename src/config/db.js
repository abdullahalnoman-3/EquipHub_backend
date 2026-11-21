const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

// fix for windows dns resolution with mongodb srv records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

// create indexes for fast search and filtering
const setupIndexes = async (database) => {
  try {
    const equipmentCol = database.collection('equipment');
    await equipmentCol.createIndex({ name: 'text', location: 'text' });
    await equipmentCol.createIndex({ category: 1 });
    await equipmentCol.createIndex({ status: 1 });
    await equipmentCol.createIndex({ rentalPrice: 1 });
  } catch (err) {
    // ignore if index already exists
  }
};

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'equiphub_db');
    await setupIndexes(db);
    console.log('Successfully connected to MongoDB!');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected yet');
  }
  return db;
};

// collections helper
const getCollections = () => {
  const database = getDB();
  return {
    usersCollection: database.collection('users'),
    equipmentCollection: database.collection('equipment'),
    bookingsCollection: database.collection('bookings'),
    favoritesCollection: database.collection('favorites'),
    paymentsCollection: database.collection('payments'),
    reviewsCollection: database.collection('reviews'),
    settingsCollection: database.collection('settings')
  };
};

module.exports = {
  connectDB,
  getDB,
  getCollections,
  client
};
