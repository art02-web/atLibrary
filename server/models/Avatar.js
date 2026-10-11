const mongoose = require('mongoose');

// Profile pictures are stored in MongoDB (not on disk), so they survive restarts and redeploys on hosts
// like Render whose disk is wiped. Each upload gets a new random key, which is also part of its URL.
const avatarSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Avatar', avatarSchema);
