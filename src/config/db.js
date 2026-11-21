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

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'equiphub_db');
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
    paymentsCollection: database.collection('payments')
  };
};

module.exports = {
  connectDB,
  getDB,
  getCollections,
  client
};
