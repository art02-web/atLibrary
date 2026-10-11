const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * protect - verifies the "Authorization: Bearer <token>" header
 * and attaches the logged-in user to req.user.
 */
const protect = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new AppError('Not authorized, please log in', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Session expired or invalid token, please log in again', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated', 403);

  req.user = user;
  next();
};

/**
 * authorize - role based access control, e.g. authorize('admin')
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('You do not have permission to perform this action', 403);
  }
  next();
};

module.exports = { protect, authorize };
