export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h3 className="page-title">{title}</h3>
        {subtitle && <p className="text-muted mb-0 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
