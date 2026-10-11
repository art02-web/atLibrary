// Client-side form validation (the server validates again; never trust the client alone)
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

export const passwordError = (v) => {
  if (!v || v.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Za-z]/.test(v)) return 'Password must contain a letter'
  if (!/\d/.test(v)) return 'Password must contain a number'
  return ''
}

// First name: letters (accents included) and spaces only. Last name: special characters allowed, except < >.
// The server applies the same rules.
const FIRST_NAME = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u
const LAST_NAME = /^[^<>\p{C}]+$/u

export const nameError = (v, label) => {
  const name = (v || '').trim()
  if (!name) return `${label} is required`
  if (name.length > 30) return `${label} must be at most 30 characters`
  if (label === 'First name' && !FIRST_NAME.test(name.replace(/\s+/g, ' '))) {
    return 'First name can only contain letters and spaces'
  }
  if (label === 'Last name' && !LAST_NAME.test(name)) return 'Last name cannot contain < or >'
  return ''
}

// Profile picture: JPG, PNG or WEBP up to 2 MB (the server checks again)
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const avatarError = (file) => {
  if (!file) return 'Choose an image'
  if (!AVATAR_TYPES.includes(file.type)) return 'Profile picture must be a JPG, PNG or WEBP image'
  if (file.size > 2 * 1024 * 1024) return 'Profile picture must be 2 MB or smaller'
  return ''
}

export const phoneError = (v) =>
  v && !/^[0-9+\-\s()]{7,20}$/.test(v) ? 'Enter a valid phone number' : ''

export const passwordStrength = (v = '') => {
  let score = 0
  if (v.length >= 8) score++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++
  if (/\d/.test(v)) score++
  if (/[^A-Za-z0-9]/.test(v)) score++
  return score // 0..4
}

export const isbnError = (v) =>
  /^(97[89])?[\d-]{9,16}[\dXx]$/.test((v || '').trim()) ? '' : 'Enter a valid ISBN (10 or 13 digits)'
