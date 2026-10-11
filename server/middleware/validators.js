const { body, param } = require('express-validator');
const { CATEGORIES } = require('../config/constants');

const passwordRule = (field = 'password') =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');

// First name: letters (accents included) and single spaces only.
// Last name: special characters are allowed too (- ' . , & numbers...), but never < > or control characters.
const FIRST_NAME = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u;
const LAST_NAME = /^[^<>\p{C}]+$/u;

const nameRule = (field, label, pattern, patternMessage, optional = false) => {
  const rule = body(field);
  return (optional ? rule.optional() : rule)
    .isString()
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .isLength({ max: 30 })
    .withMessage(`${label} must be at most 30 characters`)
    .matches(pattern)
    .withMessage(patternMessage);
};
const nameRules = (optional = false) => [
  nameRule('firstName', 'First name', FIRST_NAME, 'First name can only contain letters and spaces', optional),
  nameRule('lastName', 'Last name', LAST_NAME, 'Last name cannot contain < or >', optional),
];

const profileRules = [
  body('studentId').optional().trim().isLength({ max: 30 }),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Enter a valid phone number'),
  body('address').optional().trim().isLength({ max: 200 }),
];

// Emails are stored as typed, only trimmed and lowercased. (Older builds used normalizeEmail(),
// which also drops the dots in Gmail addresses, so a Gmail admin set in .env could never log in.)
const emailRule = (optional = false) =>
  (optional ? body('email').optional() : body('email'))
    .isString()
    .trim()
    .isEmail()
    .withMessage('Enter a valid email')
    .customSanitizer((v) => v.toLowerCase());

const registerRules = [
  ...nameRules(),
  emailRule(),
  passwordRule(),
  ...profileRules,
];

const loginRules = [
  emailRule(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [...nameRules(true), ...profileRules];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordRule('newPassword'),
];

const idParam = (name = 'id') => param(name).isMongoId().withMessage('Invalid ID');

const bookRules = (optional = false) => {
  const opt = (rule) => (optional ? rule.optional() : rule);
  const year = new Date().getFullYear();
  return [
    opt(body('title')).trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
    opt(body('author')).trim().notEmpty().withMessage('Author is required').isLength({ max: 100 }),
    opt(body('isbn'))
      .trim()
      .matches(/^(97[89])?[\d-]{9,16}[\dXx]$/)
      .withMessage('Enter a valid ISBN (10 or 13 digits)'),
    body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
    body('publisher').optional().trim().isLength({ max: 100 }),
    body('publishedYear')
      .optional({ values: 'falsy' })
      .isInt({ min: 1000, max: year })
      .withMessage(`Year must be between 1000 and ${year}`)
      .toInt(),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('coverImage')
      .optional({ values: 'falsy' })
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Cover image must be a valid http(s) URL'),
    body('shelfLocation').optional().trim().isLength({ max: 30 }),
    opt(body('totalCopies'))
      .isInt({ min: 0, max: 1000 })
      .withMessage('Total copies must be a number from 0 to 1000')
      .toInt(),
  ];
};

const adminUserRules = (optional = false) => [
  ...nameRules(optional),
  emailRule(optional),
  optional ? passwordRule().optional() : passwordRule(),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  ...profileRules,
];

const borrowRequestRules = [
  body('bookId').isMongoId().withMessage('Invalid book'),
  body('notes').optional().trim().isLength({ max: 300 }),
];

module.exports = {
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
  idParam,
  bookRules,
  adminUserRules,
  borrowRequestRules,
};
