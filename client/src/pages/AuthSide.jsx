import Brand from '../components/Brand'

// Decorative left panel shared by the Login and Register pages
export default function AuthSide({ title, text }) {
  return (
    <div className="auth-side">
      <Brand light />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="fw-bold mb-3" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
        <p className="opacity-75 mb-4" style={{ maxWidth: 420 }}>{text}</p>
        <div className="d-flex gap-4">
          {[['bi-book', 'Thousands of titles'], ['bi-lightning', 'Instant requests'], ['bi-shield-check', 'Secure access']].map(
            ([icon, label]) => (
              <div key={label} className="small">
                <i className={`bi ${icon} fs-4 d-block mb-1`} />
                {label}
              </div>
            ),
          )}
        </div>
      </div>
      <small className="opacity-50">© {new Date().getFullYear()} atLibrary</small>
    </div>
  )
}
