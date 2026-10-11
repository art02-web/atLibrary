/**
 * Adds the 22 sample books to the catalog.
 * Usage: npm run seed:books
 *
 * Only adds books that are missing (same title and author, or same ISBN), so it is safe to run again.
 * It never changes or deletes any book, user or borrow record.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { addSampleBooks } = require('./data/sampleBooks');

const run = async () => {
  await connectDB();
  const { added, total } = await addSampleBooks();
  console.log(added ? `Added ${added} sample book(s).` : 'All sample books are already in the catalog.');
  if (added && added < total) console.log(`${total - added} were already there and were left as they are.`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
