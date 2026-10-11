const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/constants');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    author: { type: String, required: true, trim: true, maxlength: 100 },
    isbn: { type: String, required: true, unique: true, trim: true },
    category: { type: String, enum: CATEGORIES, default: 'Others' },
    publisher: { type: String, trim: true, maxlength: 100, default: '' },
    publishedYear: { type: Number, min: 1000, max: 3000 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    coverImage: { type: String, trim: true, default: '' },
    shelfLocation: { type: String, trim: true, maxlength: 30, default: '' },
    totalCopies: { type: Number, required: true, min: 0, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
  },
  { timestamps: true }
);

// Text index powers the search bar (title, author, isbn)
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

module.exports = mongoose.model('Book', bookSchema);
