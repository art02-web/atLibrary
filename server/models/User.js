const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, maxlength: 30, default: '' },
    lastName: { type: String, trim: true, maxlength: 30, default: '' },
    // Full name, kept in sync from firstName + lastName (used for display, search and sorting)
    name: { type: String, required: true, trim: true, maxlength: 61 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false keeps the hash out of every query unless explicitly requested
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    studentId: { type: String, trim: true, maxlength: 30, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    address: { type: String, trim: true, maxlength: 200, default: '' },
    // URL of the uploaded profile picture (empty = show initials)
    avatarUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Splits a single full name into first and last name ("Juan Dela Cruz" -> "Juan" / "Dela Cruz")
const splitName = (full = '') => {
  const [first, ...rest] = String(full).trim().split(/\s+/);
  return { firstName: first || '', lastName: rest.join(' ') };
};

// Keep the full name in sync with first/last name. Accounts made before first/last name existed
// only have "name", so it is split on the first space the next time they are saved.
userSchema.pre('validate', function () {
  if (!this.firstName && !this.lastName && this.name) Object.assign(this, splitName(this.name));
  const full = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  if (full) this.name = full;
});

// Hash the password whenever it is created or changed (password encryption)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never send the password hash to the client
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// Fills in firstName/lastName for older accounts that only have "name" (runs at startup and in the seed)
userSchema.statics.backfillNames = async function () {
  const old = await this.find({ $or: [{ firstName: { $exists: false } }, { firstName: '' }], name: { $ne: '' } });
  for (const user of old) await this.updateOne({ _id: user._id }, { $set: splitName(user.name) });
  return old.length;
};

module.exports = mongoose.model('User', userSchema);
