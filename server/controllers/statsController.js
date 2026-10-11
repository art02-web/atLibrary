const Book = require('../models/Book');
const User = require('../models/User');
const Borrow = require('../models/Borrow');
const { computeFine } = require('./borrowController');

// GET /api/stats/admin  (admin) - numbers for the admin dashboard
exports.adminStats = async (_req, res) => {
  const now = new Date();
  const [
    totalTitles, copies, totalUsers, pending, borrowed, overdue, returned,
    byCategory, recent, popular,
  ] = await Promise.all([
    Book.countDocuments(),
    Book.aggregate([{ $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }]),
    User.countDocuments({ role: 'user' }),
    Borrow.countDocuments({ status: 'pending' }),
    Borrow.countDocuments({ status: 'borrowed' }),
    Borrow.countDocuments({ status: 'borrowed', dueDate: { $lt: now } }),
    Borrow.countDocuments({ status: 'returned' }),
    Book.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Borrow.find().populate('book', 'title').populate('user', 'name avatarUrl').sort({ updatedAt: -1 }).limit(6),
    Borrow.aggregate([
      { $match: { status: { $in: ['borrowed', 'returned'] } } },
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $project: { count: 1, title: '$book.title', author: '$book.author' } },
    ]),
  ]);

  res.json({
    totals: {
      titles: totalTitles,
      copies: copies[0]?.total || 0,
      availableCopies: copies[0]?.available || 0,
      users: totalUsers,
      pending,
      borrowed,
      overdue,
      returned,
    },
    byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
    recent,
    popular,
  });
};

// GET /api/stats/me  (user) - numbers for the user dashboard
exports.userStats = async (req, res) => {
  const mine = await Borrow.find({ user: req.user._id }).populate('book', 'title author coverImage');
  const borrowed = mine.filter((b) => b.status === 'borrowed');
  const now = new Date();
  res.json({
    totals: {
      pending: mine.filter((b) => b.status === 'pending').length,
      borrowed: borrowed.length,
      overdue: borrowed.filter((b) => b.dueDate < now).length,
      returned: mine.filter((b) => b.status === 'returned').length,
      fines:
        mine.filter((b) => b.status === 'returned').reduce((s, b) => s + (b.fine || 0), 0) +
        borrowed.reduce((s, b) => s + computeFine(b.dueDate), 0),
    },
    current: borrowed
      .sort((a, b) => a.dueDate - b.dueDate)
      .map((b) => ({ ...b.toObject(), overdue: b.dueDate < now, fine: computeFine(b.dueDate) })),
  });
};
