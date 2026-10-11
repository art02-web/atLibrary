import { Alert } from 'react-bootstrap'

// A plain message shown in place, next to what it is about: no pop-up, no timer.
// It stays until the next action or until the user closes it.
export default function Notice({ message, variant = 'danger', onClose, className = '' }) {
  if (!message) return null
  return (
    <Alert variant={variant} dismissible={Boolean(onClose)} onClose={onClose} className={`at-notice small py-2 ${className}`}>
      {message}
    </Alert>
  )
}
