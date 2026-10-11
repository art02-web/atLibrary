export default function EmptyState({ icon = 'bi-inbox', title = 'Nothing here yet', text, action }) {
  return (
    <div className="text-center py-5 px-3">
      <div className="feature-icon mb-3 mx-auto">
        <i className={`bi ${icon}`} />
      </div>
      <h6 className="fw-semibold mb-1">{title}</h6>
      {text && <p className="text-muted small mb-3">{text}</p>}
      {action}
    </div>
  )
}
