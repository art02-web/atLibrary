const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

// Profile pictures are saved in server/uploads/avatars (created automatically) and served at /uploads/avatars
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
const AVATAR_URL = '/uploads/avatars';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

fs.mkdirSync(AVATAR_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: AVATAR_DIR,
    // Random file name: never trust or reuse the name the browser sent
    filename: (_req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}${TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) =>
    TYPES[file.mimetype] ? cb(null, true) : cb(new AppError('Profile picture must be a JPG, PNG or WEBP image', 400)),
}).single('avatar');

// Checks the first bytes of the saved file, so a renamed non-image is rejected even if its type was faked
const looksLikeImage = (file) => {
  const fd = fs.openSync(file.path, 'r');
  const head = Buffer.alloc(12);
  fs.readSync(fd, head, 0, 12, 0);
  fs.closeSync(fd);
  if (file.mimetype === 'image/jpeg') return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (file.mimetype === 'image/png') return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP';
};

// Removes a stored picture by its URL (ignores anything outside the avatars folder)
const removeAvatarFile = (url) => {
  if (!url || !url.startsWith(`${AVATAR_URL}/`)) return;
  const file = path.join(AVATAR_DIR, path.basename(url));
  fs.rm(file, { force: true }, () => {});
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
    if (!looksLikeImage(req.file)) {
      fs.rm(req.file.path, { force: true }, () => {});
      return next(new AppError('That file is not a valid JPG, PNG or WEBP image', 400));
    }
    req.file.url = `${AVATAR_URL}/${req.file.filename}`;
    next();
  });

module.exports = { avatarUpload, removeAvatarFile, AVATAR_DIR, AVATAR_URL };
