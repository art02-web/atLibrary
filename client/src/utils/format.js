export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export const peso = (n = 0) => `₱${Number(n).toLocaleString()}`

export const daysLeft = (due) => Math.ceil((new Date(due) - new Date()) / 86400000)

// First / last name of a user; older accounts only have "name", so split it on the first space
export const nameParts = (user = {}) => {
  if (user.firstName || user.lastName) return { firstName: user.firstName || '', lastName: user.lastName || '' }
  const [first = '', ...rest] = (user.name || '').trim().split(/\s+/)
  return { firstName: first, lastName: rest.join(' ') }
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
