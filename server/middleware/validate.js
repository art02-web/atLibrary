const { validationResult } = require('express-validator');

// Runs after express-validator rules and returns the first error per field
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return res.status(422).json({ message: errors[0].message, errors });
};

module.exports = validate;
