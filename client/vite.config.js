import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// In development, /api calls (and /uploads pictures) are forwarded to the Express server.
// The port is read from server/.env (PORT) so both sides always agree.
// Port 5000 is never used on a Mac: macOS AirPlay Receiver owns it and answers 403
// (server/server.js applies the same rule).
const apiPort = (serverEnv) => {
  const port = Number(serverEnv.PORT) || 5001
  return process.platform === 'darwin' && port === 5000 ? 5001 : port
}

export default defineConfig(({ mode, command }) => {
  const target = `http://127.0.0.1:${apiPort(loadEnv(mode, '../server', ''))}`
  return {
    plugins: [react()],
    // In development, lets error messages say where API calls were forwarded
    define: command === 'serve' ? { 'import.meta.env.VITE_API_TARGET': JSON.stringify(target) } : {},
    server: {
      port: 5173,
      proxy: {
        '/api': target,
        '/uploads': target, // profile pictures
      },
    },
  }
})
