const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

// Signs a JWT that identifies the user and their role
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// Reads ?page=&limit= safely and returns skip/limit values
const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// Builds the pagination block returned with every list endpoint
const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.max(Math.ceil(total / limit), 1),
});

// Escapes user text before putting it in a RegExp (prevents ReDoS / regex injection)
const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The form older builds stored emails in (express-validator's normalizeEmail, which drops the dots and
// +tags in Gmail addresses). Used so accounts created before v5.1 can still log in.
const legacyEmail = async (email) => {
  const req = { body: { email } };
  await body('email').normalizeEmail().run(req);
  return req.body.email || email;
};

// Every stored form an email might have: as typed (lowercased) and the older normalized form
const emailForms = async (email) => [...new Set([email, await legacyEmail(email)])];

module.exports = { generateToken, getPagination, paginationMeta, escapeRegex, legacyEmail, emailForms };
