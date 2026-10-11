const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const { BORROW_STATUS } = require('../config/constants');
const { getPagination, paginationMeta, escapeRegex } = require('../utils/helpers');
const User = require('../models/User');

const DAY = 24 * 60 * 60 * 1000;
const loanDays = () => Number(process.env.LOAN_DAYS) || 14;
const finePerDay = () => Number(process.env.FINE_PER_DAY) || 10;
const maxActive = () => Number(process.env.MAX_ACTIVE_BORROWS) || 3;

// Fine for days past the due date (0 when on time)
const computeFine = (dueDate, at = new Date()) => {
  if (!dueDate) return 0;
  const lateDays = Math.ceil((at - dueDate) / DAY);
  return lateDays > 0 ? lateDays * finePerDay() : 0;
};

// Adds a live "overdue" flag and running fine to borrowed records
const withLiveInfo = (b) => {
  const obj = b.toObject();
  if (obj.status === 'borrowed') {
    obj.overdue = obj.dueDate < new Date();
    obj.fine = computeFine(obj.dueDate);
  }
  return obj;
};

const POPULATE = [
  { path: 'book', select: 'title author isbn coverImage category' },
  { path: 'user', select: 'name email studentId avatarUrl' },
];

// POST /api/borrows  (user) - request to borrow a book
exports.requestBorrow = async (req, res) => {
  const { bookId, notes } = req.body;
  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Book not found', 404);
  if (book.availableCopies < 1) throw new AppError('No copies available right now', 400);

  const existing = await Borrow.exists({
    user: req.user._id,
    book: bookId,
    status: { $in: ['pending', 'borrowed'] },
  });
  if (existing) throw new AppError('You already have a pending request or loan for this book', 400);

  const active = await Borrow.countDocuments({
    user: req.user._id,
    status: { $in: ['pending', 'borrowed'] },
  });
  if (active >= maxActive()) {
    throw new AppError(`You can only have ${maxActive()} active requests or loans at a time`, 400);
  }

  const borrow = await Borrow.create({ user: req.user._id, book: bookId, notes });
  await borrow.populate(POPULATE);
  res.status(201).json({ message: 'Borrow request sent. Wait for librarian approval.', borrow });
};

// GET /api/borrows/my?status=&page=
exports.getMyBorrows = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = { user: req.user._id };
  if (BORROW_STATUS.includes(req.query.status)) filter.status = req.query.status;

  const [borrows, total] = await Promise.all([
    Borrow.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Borrow.countDocuments(filter),
  ]);
  res.json({ borrows: borrows.map(withLiveInfo), pagination: paginationMeta(total, page, limit) });
};

// PUT /api/borrows/:id/cancel  (user) - cancel own pending request
exports.cancelRequest = async (req, res) => {
  const borrow = await Borrow.findOne({ _id: req.params.id, user: req.user._id });
  if (!borrow) throw new AppError('Request not found', 404);
  if (borrow.status !== 'pending') throw new AppError('Only pending requests can be cancelled', 400);
  borrow.status = 'cancelled';
  await borrow.save();
  res.json({ message: 'Request cancelled', borrow });
};

// GET /api/borrows?status=&search=&overdue=true&page=  (admin)
exports.getAllBorrows = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = {};
  if (BORROW_STATUS.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.overdue === 'true') {
    filter.status = 'borrowed';
    filter.dueDate = { $lt: new Date() };
  }
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 100)), 'i');
    const [users, books] = await Promise.all([
      User.find({ $or: [{ name: rx }, { email: rx }] }).distinct('_id'),
      Book.find({ $or: [{ title: rx }, { isbn: rx }] }).distinct('_id'),
    ]);
    filter.$or = [{ user: { $in: users } }, { book: { $in: books } }];
  }

  const [borrows, total] = await Promise.all([
    Borrow.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Borrow.countDocuments(filter),
  ]);
  res.json({ borrows: borrows.map(withLiveInfo), pagination: paginationMeta(total, page, limit) });
};

// PUT /api/borrows/:id/approve  (admin) - hand the book over
exports.approveBorrow = async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);
  if (!borrow) throw new AppError('Record not found', 404);
  if (borrow.status !== 'pending') throw new AppError('Only pending requests can be approved', 400);

  // Atomically take one copy so two approvals can't over-lend the last copy
  const book = await Book.findOneAndUpdate(
    { _id: borrow.book, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );
  if (!book) throw new AppError('No copies available to lend', 400);

  const now = new Date();
  borrow.status = 'borrowed';
  borrow.borrowDate = now;
  borrow.dueDate = new Date(now.getTime() + loanDays() * DAY);
  await borrow.save();
  await borrow.populate(POPULATE);
  res.json({ message: 'Request approved, book issued', borrow: withLiveInfo(borrow) });
};

// PUT /api/borrows/:id/reject  (admin)
exports.rejectBorrow = async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);
  if (!borrow) throw new AppError('Record not found', 404);
  if (borrow.status !== 'pending') throw new AppError('Only pending requests can be rejected', 400);
  borrow.status = 'rejected';
  if (req.body.notes) borrow.notes = String(req.body.notes).slice(0, 300);
  await borrow.save();
  res.json({ message: 'Request rejected', borrow });
};

// PUT /api/borrows/:id/return  (admin) - mark as returned and compute fine
exports.returnBorrow = async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);
  if (!borrow) throw new AppError('Record not found', 404);
  if (borrow.status !== 'borrowed') throw new AppError('Only borrowed books can be returned', 400);

  const now = new Date();
  borrow.status = 'returned';
  borrow.returnDate = now;
  borrow.fine = computeFine(borrow.dueDate, now);
  await borrow.save();
  await Book.findByIdAndUpdate(borrow.book, { $inc: { availableCopies: 1 } });
  await borrow.populate(POPULATE);
  res.json({
    message: borrow.fine ? `Book returned. Late fine: ₱${borrow.fine}` : 'Book returned on time',
    borrow,
  });
};

// DELETE /api/borrows/:id  (admin) - remove a closed record from history
exports.deleteBorrow = async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);
  if (!borrow) throw new AppError('Record not found', 404);
  if (borrow.status === 'borrowed') {
    throw new AppError('Mark the book as returned before deleting this record', 400);
  }
  await borrow.deleteOne();
  res.json({ message: 'Record deleted' });
};

exports.computeFine = computeFine;
