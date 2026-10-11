import { ProgressBar } from 'react-bootstrap'
import { passwordStrength } from '../utils/validators'

const LEVELS = [
  ['danger', 'Too weak'],
  ['danger', 'Weak'],
  ['warning', 'Fair'],
  ['info', 'Good'],
  ['success', 'Strong'],
]

export default function PasswordStrength({ value }) {
  if (!value) return null
  const score = passwordStrength(value)
  const [variant, label] = LEVELS[score]
  return (
    <div className="mt-2">
      <ProgressBar now={(score / 4) * 100 || 8} variant={variant} className="progress-thin" />
      <small className={`text-${variant}`}>{label}</small>
    </div>
  )
}
