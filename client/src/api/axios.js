import axios from 'axios'

export const TOKEN_KEY = 'atlibrary_token'

// One Axios instance for the whole app
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the token is expired/invalid, log out everywhere
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  },
)

// Where /api requests really go: in development Vite forwards them to the Express server
// (the address comes from vite.config.js), otherwise it is the base URL itself
const API_TARGET = import.meta.env.VITE_API_TARGET || api.defaults.baseURL

// Turns any Axios error into a readable message.
// atLibrary's API always sends { message }; if it is missing, the reply came from something else.
export const errorMessage = (err) => {
  const serverMessage = err?.response?.data?.message
  if (serverMessage) return serverMessage
  const url = `${err?.config?.baseURL || ''}${err?.config?.url || ''}`
  if (err?.response) {
    return `The atLibrary API did not answer ${url} (got status ${err.response.status} from ${API_TARGET}). ` +
      'Make sure "npm run dev" shows "atLibrary API running", and that PORT in server/.env is not 5000 ' +
      '(on a Mac, port 5000 belongs to AirPlay Receiver).'
  }
  if (err?.request) {
    return `Can't reach the atLibrary API at ${API_TARGET}. Make sure "npm run dev" is running.`
  }
  return err?.message || 'Something went wrong'
}

export default api
