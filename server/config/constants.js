// Shared constants used by models, validators and controllers
const CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Mathematics',
  'Literature',
  'Philosophy',
  'Self-Help',
  'Children',
  'Reference',
  'Others',
];

const ROLES = ['user', 'admin'];

const BORROW_STATUS = ['pending', 'borrowed', 'returned', 'rejected', 'cancelled'];

module.exports = { CATEGORIES, ROLES, BORROW_STATUS };
