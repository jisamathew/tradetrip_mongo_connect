// const mongoose = require('mongoose');
// require('dotenv').config();

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log(`MongoDB connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     process.exit(1); // Exit process with failure
//   }
// };

// module.exports = connectDB;
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();

let dbInstance;

const connectDB = async () => {
  try {
    // Mongoose Connection
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Mongoose connected');

    // MongoDB Driver Connection
    const client = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    dbInstance = client.db(); // Cache the database instance
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return dbInstance;
};

module.exports = { connectDB, getDB };
