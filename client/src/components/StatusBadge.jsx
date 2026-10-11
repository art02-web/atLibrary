const MAP = {
  pending: ['warning', 'bi-hourglass-split', 'Pending'],
  borrowed: ['primary', 'bi-book-half', 'Borrowed'],
  returned: ['success', 'bi-check-circle', 'Returned'],
  rejected: ['danger', 'bi-x-circle', 'Rejected'],
  cancelled: ['secondary', 'bi-slash-circle', 'Cancelled'],
  overdue: ['danger', 'bi-exclamation-triangle', 'Overdue'],
}

export default function StatusBadge({ status, overdue }) {
  const [bg, icon, label] = MAP[overdue ? 'overdue' : status] || MAP.pending
  return (
    <span className={`at-badge at-badge-${bg}`}>
      <i className={`bi ${icon} me-1`} />
      {label}
    </span>
  )
}
