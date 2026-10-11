// 404 for unknown API routes
const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Central error handler: converts Mongoose/JWT errors into clean JSON responses
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
  }
  if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status === 500) console.error(err);
  res.status(status).json({
    message: status === 500 && process.env.NODE_ENV === 'production' ? 'Server error' : message,
  });
};

module.exports = { notFound, errorHandler };
