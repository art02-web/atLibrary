const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const AppError = require('../utils/AppError');
const { CATEGORIES } = require('../config/constants');
const { getPagination, paginationMeta, escapeRegex } = require('../utils/helpers');

const BOOK_FIELDS = [
  'title', 'author', 'isbn', 'category', 'publisher', 'publishedYear',
  'description', 'coverImage', 'shelfLocation', 'totalCopies',
];
const pickBook = (body) =>
  Object.fromEntries(BOOK_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
  author: { author: 1 },
  year: { publishedYear: -1 },
};

// GET /api/books?search=&category=&available=true&sort=&page=&limit=
exports.getBooks = async (req, res) => {
  const { search, category, available, sort } = req.query;
  const { page, limit, skip } = getPagination(req.query, 12);

  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).slice(0, 100)), 'i');
    filter.$or = [{ title: rx }, { author: rx }, { isbn: rx }, { publisher: rx }];
  }
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (available === 'true') filter.availableCopies = { $gt: 0 };

  const [books, total] = await Promise.all([
    Book.find(filter).sort(SORTS[sort] || SORTS.newest).skip(skip).limit(limit),
    Book.countDocuments(filter),
  ]);
  res.json({ books, pagination: paginationMeta(total, page, limit) });
};

// GET /api/books/categories
exports.getCategories = (_req, res) => res.json({ categories: CATEGORIES });

// GET /api/books/:id
exports.getBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);
  res.json({ book });
};

// POST /api/books  (admin)
exports.createBook = async (req, res) => {
  const data = pickBook(req.body);
  data.availableCopies = data.totalCopies;
  const book = await Book.create(data);
  res.status(201).json({ message: 'Book added', book });
};

// PUT /api/books/:id  (admin)
exports.updateBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  const data = pickBook(req.body);
  if (data.totalCopies !== undefined) {
    // Copies currently out on loan can't disappear: keep available = total - borrowed
    const onLoan = book.totalCopies - book.availableCopies;
    if (data.totalCopies < onLoan) {
      throw new AppError(`Total copies can't be less than the ${onLoan} copies currently on loan`, 400);
    }
    data.availableCopies = data.totalCopies - onLoan;
  }
  Object.assign(book, data);
  await book.save();
  res.json({ message: 'Book updated', book });
};

// DELETE /api/books/:id  (admin)
exports.deleteBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  const active = await Borrow.countDocuments({ book: book._id, status: 'borrowed' });
  if (active > 0) throw new AppError('This book has copies on loan and cannot be deleted yet', 400);

  await Borrow.updateMany({ book: book._id, status: 'pending' }, { status: 'cancelled', notes: 'Book removed from library' });
  await book.deleteOne();
  res.json({ message: 'Book deleted' });
};
