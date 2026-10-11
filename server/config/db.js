const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Works with a local MongoDB (mongodb://...) and MongoDB Atlas (mongodb+srv://...).
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set (in server/.env locally, or in the host\'s environment variables)');
  try {
    // Give up after 15 seconds instead of hanging when the database can't be reached
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    // Add a hint for the usual Atlas problems (the connection string itself is never printed)
    const msg = err.message || String(err);
    if (/auth|credentials/i.test(msg)) {
      err.message = `${msg}. Check the database user name and password in MONGO_URI (special characters in the password must be URL-encoded).`;
    } else if (uri.startsWith('mongodb+srv://') && /whitelist|ip|timed out|ServerSelection|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
      err.message = `${msg}. In MongoDB Atlas, open Network Access and allow this computer or host (0.0.0.0/0 allows any).`;
    }
    throw err;
  }
};

module.exports = connectDB;
