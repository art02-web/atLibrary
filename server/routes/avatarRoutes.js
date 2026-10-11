const express = require('express');
const Avatar = require('../models/Avatar');

const router = express.Router();

// GET /api/avatars/:key  (public, like any image link) - a profile picture stored in MongoDB.
// The key is random and changes with every upload, so browsers may cache it for good.
router.get('/:key', async (req, res) => {
  if (!/^[a-f0-9]{32}$/.test(req.params.key)) return res.status(404).json({ message: 'Picture not found' });
  const avatar = await Avatar.findOne({ key: req.params.key }).lean();
  if (!avatar) return res.status(404).json({ message: 'Picture not found' });
  res.set({
    'Content-Type': avatar.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    // The website may be on another address (for example Vercel), so allow it to show this image
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  res.send(avatar.data.buffer ? Buffer.from(avatar.data.buffer) : avatar.data);
});

module.exports = router;
