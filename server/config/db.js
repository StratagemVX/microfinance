/**
 * Database Configuration
 * Handles MongoDB connection using Mongoose
 * Implements connection pooling and error handling
 */

require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * @async
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('✗ MongoDB Connection Error: MONGODB_URI is not set');
      console.error('   Add a MongoDB Atlas connection string to .env');
      console.error('   Example: mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    console.log('✓ MongoDB Connected');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB Runtime Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected');
    });

    return conn;
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    console.error('   Check your MongoDB Atlas URI and Network Access allowlist');
    process.exit(1); // Exit with failure
  }
};

/**
 * Disconnect from MongoDB
 * @async
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB Disconnected');
  } catch (error) {
    console.error(`✗ MongoDB Disconnection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, disconnectDB };
