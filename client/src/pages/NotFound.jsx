import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center p-4" style={{ minHeight: '100vh' }}>
      <div className="display-1 fw-bold gradient-text">404</div>
      <h4 className="fw-bold">Page not found</h4>
      <p className="text-muted">The page you are looking for doesn&apos;t exist or was moved.</p>
      <Link to="/" className="btn btn-primary">
        <i className="bi bi-house me-2" />
        Back to home
      </Link>
    </div>
  )
}
