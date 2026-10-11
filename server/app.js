const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// On hosts like Render the app sits behind a proxy: trust it so rate limiting sees each visitor's real address
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// The website address(es) allowed to call the API, from CLIENT_URL (comma separated).
// A trailing slash is ignored, so "https://atlibrary.vercel.app/" works too.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// ---- Security middleware ----
app.use(helmet()); // secure HTTP headers
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' })); // reject oversized bodies
app.use(sanitize); // block MongoDB operator injection
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false })
);
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ---- Routes ----
// Opening the API address in a browser shows where the website is instead of an error
app.get('/', (_req, res) =>
  res.type('text').send(`This is the atLibrary API. Open the website at ${allowedOrigins[0]} instead.`)
);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'atLibrary' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/borrows', require('./routes/borrowRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/avatars', require('./routes/avatarRoutes'));

// ---- Errors ----
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
