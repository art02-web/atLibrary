/**
 * Removes keys starting with "$" or containing "." from request data
 * to block MongoDB operator injection (e.g. { "email": { "$gt": "" } }).
 */
const clean = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      clean(obj[key]);
    }
  }
  return obj;
};

const sanitize = (req, _res, next) => {
  clean(req.body);
  clean(req.params);
  // req.query is a getter in Express 5, so clean the object it returns in place
  clean(req.query);
  next();
};

module.exports = sanitize;
