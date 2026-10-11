const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const Avatar = require('../models/Avatar');
const AppError = require('../utils/AppError');

// Profile pictures are kept in MongoDB and served by GET /api/avatars/:key
const AVATAR_URL = '/api/avatars';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) =>
    TYPES.includes(file.mimetype) ? cb(null, true) : cb(new AppError('Profile picture must be a JPG, PNG or WEBP image', 400)),
}).single('avatar');

// Checks the first bytes of the file, so a renamed non-image is rejected even if its type was faked
const looksLikeImage = ({ buffer: head, mimetype }) => {
  if (head.length < 12) return false;
  if (mimetype === 'image/jpeg') return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (mimetype === 'image/png') return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP';
};

// Express middleware: parse the upload, turn multer errors into friendly messages, verify the content
const avatarUpload = (req, res, next) =>
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('Profile picture must be 2 MB or smaller', 400));
      if (err instanceof multer.MulterError) return next(new AppError('Upload one image in the "avatar" field', 400));
      return next(err);
    }
    if (!req.file) return next(new AppError('Choose an image to upload', 400));
    if (!looksLikeImage(req.file)) return next(new AppError('That file is not a valid JPG, PNG or WEBP image', 400));
    next();
  });

// Saves a picture for a user and returns its URL
const saveAvatar = async (userId, { buffer, mimetype }) => {
  const key = crypto.randomBytes(16).toString('hex');
  await Avatar.create({ key, user: userId, contentType: mimetype, data: buffer });
  return `${AVATAR_URL}/${key}`;
};

// Deletes a stored picture by its URL (ignores anything that is not one of ours)
const removeAvatar = async (url) => {
  if (!url || !url.startsWith(`${AVATAR_URL}/`)) return;
  await Avatar.deleteOne({ key: path.basename(url) });
};

// Before v6 pictures were files in server/uploads/avatars. Moves any that are still there into MongoDB
// (once, at startup) and clears links to files that no longer exist.
const migrateDiskAvatars = async (User) => {
  const OLD_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
  const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const users = await User.find({ avatarUrl: /^\/uploads\/avatars\// });
  let moved = 0;
  for (const user of users) {
    const file = path.join(OLD_DIR, path.basename(user.avatarUrl));
    const mimetype = MIME[path.extname(file)];
    let url = '';
    if (mimetype && fs.existsSync(file)) {
      url = await saveAvatar(user._id, { buffer: fs.readFileSync(file), mimetype });
      moved += 1;
    }
    await User.updateOne({ _id: user._id }, { $set: { avatarUrl: url } });
  }
  return moved;
};

module.exports = { avatarUpload, saveAvatar, removeAvatar, migrateDiskAvatars, AVATAR_URL };
