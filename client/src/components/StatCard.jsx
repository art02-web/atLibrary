// Tones drawn from the style guide palette (blues first, status colors kept soft)
const TONES = {
  primary: ['#f2f5ff', '#5a81fa'],
  secondary: ['#cddeff', '#2c3d8f'],
  success: ['#e6f7f0', '#1a9467'],
  warning: ['#fff5e3', '#c27c0e'],
  danger: ['#ffecee', '#df3f4f'],
  info: ['#f2f5ff', '#5a81fa'],
  purple: ['#cddeff', '#2c3d8f'],
}

export default function StatCard({ icon, label, value, tone = 'primary', hint }) {
  const [bg, fg] = TONES[tone] || TONES.primary
  return (
    <div className="at-card p-3 h-100 d-flex align-items-center gap-3">
      <div className="at-stat-icon" data-tone={tone} style={{ backgroundColor: bg, color: fg }}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="min-w-0">
        <div className="text-muted small fw-medium">{label}</div>
        <div className="at-stat-value">{value}</div>
        {hint && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{hint}</div>}
      </div>
    </div>
  )
}
