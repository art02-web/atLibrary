import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Brand from '../components/Brand'

const FEATURES = [
  ['bi-search', 'Find books fast', 'Search by title, author or ISBN and filter by category in seconds.'],
  ['bi-journal-check', 'Borrow online', 'Send a borrow request and track its status from your dashboard.'],
  ['bi-bell', 'Never miss a due date', 'See due dates, days left and overdue fines at a glance.'],
  ['bi-shield-lock', 'Secure by design', 'JWT login, encrypted passwords and role-based admin access.'],
]

export default function Landing() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="hero" style={{ minHeight: '100vh' }}>
      <nav className="container d-flex align-items-center py-3 gap-2">
        <Brand />
        <div className="ms-auto d-flex gap-2 align-items-center">
          <button className="btn btn-icon btn-light" onClick={toggleTheme} aria-label="Toggle dark mode">
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} />
          </button>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-light">Log in</Link>
              <Link to="/register" className="btn btn-primary d-none d-sm-inline-block">Sign up</Link>
            </>
          )}
        </div>
      </nav>

      <section className="container py-5 text-center" style={{ maxWidth: 820 }}>
        <span className="badge rounded-pill bg-primary-soft text-primary px-3 py-2 mb-3">
          <i className="bi bi-stars me-1" /> Your library, now online
        </span>
        <h1 className="mb-3">
          Borrow, track and manage books with <span className="gradient-text">atLibrary</span>
        </h1>
        <p className="lead text-muted mb-4">
          A simple, modern library management system for students and librarians. Browse the catalog,
          request books and keep every loan organized in one place.
        </p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg px-4">
            Get started <i className="bi bi-arrow-right ms-1" />
          </Link>
          <Link to={user ? '/books' : '/login'} className="btn btn-outline-primary btn-lg px-4">
            Browse books
          </Link>
        </div>
      </section>

      <section className="container pb-5">
        <div className="row g-3">
          {FEATURES.map(([icon, title, text]) => (
            <div className="col-sm-6 col-lg-3" key={title}>
              <div className="at-card at-card-hover p-4 h-100">
                <div className="feature-icon mb-3">
                  <i className={`bi ${icon}`} />
                </div>
                <h6 className="fw-bold">{title}</h6>
                <p className="text-muted small mb-0">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="container py-4 text-center text-muted small">
        © {new Date().getFullYear()} atLibrary · Built with MongoDB, Express, React & Node.js
      </footer>
    </div>
  )
}
