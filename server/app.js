const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Security middleware ----
app.use(helmet()); // secure HTTP headers
app.use(
  cors({
    // The website's address(es). Both localhost and 127.0.0.1 work by default.
    origin: (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((o) => o.trim()),
  })
);
app.use(express.json({ limit: '100kb' })); // reject oversized bodies
app.use(sanitize); // block MongoDB operator injection
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false })
);
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ---- Uploaded profile pictures (random file names, images only) ----
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
  })
);

// ---- Routes ----
// Opening the API address in a browser shows where the website is instead of an error
app.get('/', (_req, res) =>
  res.type('text').send('This is the atLibrary API. Open the website at http://localhost:5173 instead.')
);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'atLibrary' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/borrows', require('./routes/borrowRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

// ---- Errors ----
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
