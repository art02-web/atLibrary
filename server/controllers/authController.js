const User = require('../models/User');
const AppError = require('../utils/AppError');
const { emailForms, generateToken } = require('../utils/helpers');
const { removeAvatar, saveAvatar } = require('../middleware/avatarUpload');

const pickProfile = (body) => {
  const fields = ['firstName', 'lastName', 'studentId', 'phone', 'address'];
  return Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
};

// POST /api/auth/register  (public) - sign up is for borrowers only: the role is always "user",
// whatever the request body says
exports.register = async (req, res) => {
  const { email, password } = req.body;
  if (await User.exists({ email: { $in: await emailForms(email) } })) throw new AppError('Email is already registered', 409);

  const user = await User.create({ ...pickProfile(req.body), email, password, role: 'user' });
  res.status(201).json({ message: 'Registration successful', token: generateToken(user), user });
};

// POST /api/auth/login  (public)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  // Exact match first, then the form older builds stored (Gmail dots removed)
  const forms = await emailForms(email);
  let user = null;
  for (const form of forms) {
    user = await User.findOne({ email: form }).select('+password');
    if (user) break;
  }

  // The browser always gets the same message for a wrong email or password so nobody can probe accounts.
  // The server terminal says which it was, to make login problems easy to fix.
  if (!user) {
    console.warn(`[auth] Login failed for ${email}: no account with this email. If this is the admin, check ADMIN_EMAIL in server/.env and run "npm run seed".`);
    throw new AppError('Invalid email or password', 401);
  }
  if (!(await user.matchPassword(password))) {
    const hint = user.role === 'admin' ? ' For the admin, set ADMIN_PASSWORD in server/.env and run "npm run seed".' : '';
    console.warn(`[auth] Login failed for ${email}: wrong password.${hint}`);
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) {
    console.warn(`[auth] Login refused for ${email}: account is deactivated.`);
    throw new AppError('Your account has been deactivated', 403);
  }

  res.json({ message: 'Login successful', token: generateToken(user), user });
};

// GET /api/auth/me  (protected)
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/me  (protected) - update own profile
exports.updateMe = async (req, res) => {
  // Load and save (instead of findByIdAndUpdate) so the full name is rebuilt from first/last name
  const user = await User.findById(req.user._id);
  Object.assign(user, pickProfile(req.body));
  await user.save();
  res.json({ message: 'Profile updated', user });
};

// PUT /api/auth/me/avatar  (protected) - upload or replace own profile picture (multipart field "avatar")
exports.uploadAvatar = async (req, res) => {
  const user = await User.findById(req.user._id);
  const old = user.avatarUrl;
  user.avatarUrl = await saveAvatar(user._id, req.file);
  await user.save();
  await removeAvatar(old);
  res.json({ message: 'Profile picture updated', user });
};

// DELETE /api/auth/me/avatar  (protected) - remove own profile picture
exports.removeAvatar = async (req, res) => {
  const user = await User.findById(req.user._id);
  await removeAvatar(user.avatarUrl);
  user.avatarUrl = '';
  await user.save();
  res.json({ message: 'Profile picture removed', user });
};

// PUT /api/auth/change-password  (protected)
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully', token: generateToken(user) });
};
