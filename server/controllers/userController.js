const User = require('../models/User');
const Borrow = require('../models/Borrow');
const AppError = require('../utils/AppError');
const { removeAvatarFile } = require('../middleware/avatarUpload');
const { emailForms, getPagination, paginationMeta, escapeRegex } = require('../utils/helpers');

// No "role" here: this screen only manages borrower accounts, and nobody can be made an admin.
// The single admin account comes from ADMIN_EMAIL / ADMIN_PASSWORD via the seed script.
const USER_FIELDS = ['firstName', 'lastName', 'email', 'studentId', 'phone', 'address', 'isActive'];
const pickUser = (body) =>
  Object.fromEntries(USER_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// Borrower accounts are the only ones an admin can see or change through /api/users
const findBorrower = async (id, withPassword = false) => {
  const query = User.findOne({ _id: id, role: 'user' });
  const user = await (withPassword ? query.select('+password') : query);
  if (!user) throw new AppError('Borrower not found', 404);
  return user;
};

// GET /api/users?search=&page=  (admin) - borrower accounts only
exports.getUsers = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = { role: 'user' };
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 100)), 'i');
    filter.$or = [{ name: rx }, { firstName: rx }, { lastName: rx }, { email: rx }, { studentId: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ users, pagination: paginationMeta(total, page, limit) });
};

// GET /api/users/:id  (admin)
exports.getUser = async (req, res) => {
  const user = await findBorrower(req.params.id);
  const borrows = await Borrow.find({ user: user._id })
    .populate('book', 'title author')
    .sort({ createdAt: -1 })
    .limit(10);
  res.json({ user, borrows });
};

// POST /api/users  (admin) - create a borrower account (always role "user")
exports.createUser = async (req, res) => {
  if (await User.exists({ email: { $in: await emailForms(req.body.email) } })) {
    throw new AppError('Email is already registered', 409);
  }
  const user = await User.create({ ...pickUser(req.body), password: req.body.password, role: 'user' });
  res.status(201).json({ message: 'Borrower created', user });
};

// PUT /api/users/:id  (admin) - edit a borrower account; the role can't be changed
exports.updateUser = async (req, res) => {
  const user = await findBorrower(req.params.id, true);

  const data = pickUser(req.body);
  if (data.email && data.email !== user.email &&
    (await User.exists({ _id: { $ne: user._id }, email: { $in: await emailForms(data.email) } }))) {
    throw new AppError('Email is already registered', 409);
  }

  Object.assign(user, data);
  if (req.body.password) user.password = req.body.password; // re-hashed by pre-save hook
  await user.save();
  res.json({ message: 'Borrower updated', user });
};

// DELETE /api/users/:id  (admin) - remove a borrower account
exports.deleteUser = async (req, res) => {
  const user = await findBorrower(req.params.id);

  const onLoan = await Borrow.countDocuments({ user: user._id, status: 'borrowed' });
  if (onLoan > 0) throw new AppError('This user still has borrowed books. Process the returns first.', 400);

  await Borrow.deleteMany({ user: user._id });
  await user.deleteOne();
  removeAvatarFile(user.avatarUrl);
  res.json({ message: 'Borrower deleted' });
};
