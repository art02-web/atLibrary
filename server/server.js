require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');

// Printed at startup so you can tell at a glance which copy of the code is running
const BUILD = 'atLibrary v5.2 build 2026-10-11';

// 5001, not 5000: macOS uses port 5000 for AirPlay Receiver, which answers every request with 403.
// The same rule is in client/vite.config.js so the website always talks to this port.
let PORT = Number(process.env.PORT) || 5001;
if (process.platform === 'darwin' && PORT === 5000) {
  console.warn('Port 5000 is taken by macOS AirPlay Receiver, so the API is using port 5001 instead.');
  PORT = 5001;
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

console.log(`${BUILD}: starting`);
connectDB()
  .then(async () => {
    const split = await User.backfillNames();
    if (split) console.log(`Split the full name into first and last name for ${split} older account(s).`);
    // Express 5 calls this with an error when the port can't be used, so check it before saying "running"
    app.listen(PORT, (err) => {
      if (err) {
        console.error(
          err.code === 'EADDRINUSE'
            ? `Port ${PORT} is already used by another program. Set a different PORT in server/.env and restart.`
            : err
        );
        process.exit(1);
      }
      console.log(`${BUILD}: API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
