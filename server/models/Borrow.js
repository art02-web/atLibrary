const mongoose = require('mongoose');
const { BORROW_STATUS } = require('../config/constants');

/**
 * A Borrow record tracks the life of one loan:
 * pending (user requested) -> borrowed (admin approved) -> returned
 * pending -> rejected (admin) | cancelled (user)
 */
const borrowSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    status: { type: String, enum: BORROW_STATUS, default: 'pending' },
    requestDate: { type: Date, default: Date.now },
    borrowDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date },
    fine: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Borrow', borrowSchema);
