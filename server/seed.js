/**
 * Sets up the single admin account and removes the old sample borrowers.
 * The admin login comes from ADMIN_FIRST_NAME / ADMIN_LAST_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in server/.env.
 * Every run resets the admin's email, name, role, active flag and password to those values,
 * so running it again always fixes an admin that can't log in.
 * Usage: npm run seed
 *
 * Books are never deleted or changed. If the catalog is empty, the 22 sample books are added
 * (you can also add them any time with: npm run seed:books).
 * Safe to run again: it only removes the sample borrowers that earlier versions created
 * (and their borrow records), plus any other admin account. Borrowers who signed up are kept.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Book = require('./models/Book');
const { addSampleBooks } = require('./data/sampleBooks');
const Borrow = require('./models/Borrow');
const { emailForms } = require('./utils/helpers');

// Sample borrowers that earlier versions of this script created
const SAMPLE_BORROWER_EMAILS = ['juan@example.com', 'maria@example.com', 'juan@atlibrary.com', 'maria@atlibrary.com'];

// Reads the admin login from .env and checks it before touching the database
const adminFromEnv = () => {
  // ADMIN_NAME is the older single-name setting, still accepted as a fallback
  const [oldFirst, ...oldRest] = (process.env.ADMIN_NAME || 'Library Admin').trim().split(/\s+/);
  const firstName = (process.env.ADMIN_FIRST_NAME || oldFirst).trim();
  const lastName = (process.env.ADMIN_LAST_NAME || oldRest.join(' ') || 'Admin').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set a valid ADMIN_EMAIL in server/.env');
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Set ADMIN_PASSWORD in server/.env (at least 8 characters, with a letter and a number)');
  }
  return { firstName, lastName, email, password, role: 'admin', isActive: true };
};

const run = async () => {
  const admin = adminFromEnv();
  await connectDB();

  // 1. Remove the old sample borrowers and their borrow records (books are never touched).
  // Copies a sample borrower still had on loan go back on the shelf.
  const sampleUsers = await User.find({ email: { $in: SAMPLE_BORROWER_EMAILS }, role: 'user' }).distinct('_id');
  const onLoan = await Borrow.find({ user: { $in: sampleUsers }, status: 'borrowed' });
  for (const loan of onLoan) await Book.updateOne({ _id: loan.book }, { $inc: { availableCopies: 1 } });
  const borrows = await Borrow.deleteMany({ user: { $in: sampleUsers } });
  const users = await User.deleteMany({ _id: { $in: sampleUsers } });

  // 2. Fill an empty catalog with the sample books
  const books = (await Book.estimatedDocumentCount()) === 0 ? await addSampleBooks() : { added: 0 };

  // 3. Keep exactly one admin: remove any other admin, then create or update the one from .env.
  // This is the only place an admin is ever created: sign up and the API always make borrowers.
  const otherAdmins = await User.deleteMany({ role: 'admin', email: { $nin: await emailForms(admin.email) } });
  const split = await User.backfillNames();
  // Also finds an admin stored by an older build in the normalized form (Gmail dots removed)
  let account = await User.findOne({ email: { $in: await emailForms(admin.email) } }).select('+password');
  const existed = Boolean(account);
  if (!account) account = new User();
  Object.assign(account, admin);
  account.markModified('password'); // always re-hash, even if .env holds the same password as before
  await account.save();

  // Prove the login works before saying so
  const check = await User.findOne({ email: admin.email }).select('+password');
  if (!check || check.role !== 'admin' || !check.isActive || !(await check.matchPassword(admin.password))) {
    throw new Error('The admin account was saved but the login check failed. Please report this.');
  }

  if (users.deletedCount) console.log(`Removed ${users.deletedCount} sample borrower(s) and ${borrows.deletedCount} of their borrow record(s).`);
  if (books.added) console.log(`The catalog was empty, so ${books.added} sample books were added.`);
  if (split) console.log(`Split the full name into first and last name for ${split} older account(s).`);
  if (otherAdmins.deletedCount) console.log(`Removed ${otherAdmins.deletedCount} other admin account(s).`);
  console.log(`Admin account ${existed ? 'updated' : 'created'} and login checked: ${admin.email}`);
  console.log('Log in with ADMIN_EMAIL and ADMIN_PASSWORD from server/.env.');
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
