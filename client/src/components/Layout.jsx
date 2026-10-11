import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Dropdown } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Avatar from './Avatar'
import Brand from './Brand'

const USER_MENU = [
  { to: '/dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
  { to: '/books', icon: 'bi-search', label: 'Browse Books' },
  { to: '/my-borrows', icon: 'bi-journal-bookmark', label: 'My Borrowings' },
]

const ADMIN_MENU = [
  { to: '/dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
  { to: '/admin/books', icon: 'bi-book', label: 'Manage Books' },
  { to: '/admin/borrows', icon: 'bi-arrow-left-right', label: 'Borrow Records' },
  { to: '/admin/users', icon: 'bi-people', label: 'Manage Users' },
  { to: '/books', icon: 'bi-collection', label: 'Catalog View' },
]

const TITLES = {
  '/dashboard': 'Dashboard',
  '/books': 'Browse Books',
  '/my-borrows': 'My Borrowings',
  '/profile': 'My Profile',
  '/admin/books': 'Manage Books',
  '/admin/borrows': 'Borrow Records',
  '/admin/users': 'Manage Users',
}

// Responsive shell: sidebar navigation + top bar, page content goes in <Outlet />
export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const menu = isAdmin ? ADMIN_MENU : USER_MENU

  // Close the mobile sidebar after navigating
  useEffect(() => setOpen(false), [pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const title = TITLES[pathname] || (pathname.startsWith('/books/') ? 'Book Details' : 'atLibrary')

  return (
    <>
      <aside className={`at-sidebar ${open ? 'open' : ''}`}>
        <div className="p-3 ps-4 d-flex align-items-center justify-content-between" style={{ height: 64 }}>
          <Brand to="/dashboard" />
          <button className="btn btn-icon btn-light d-lg-none" onClick={() => setOpen(false)} aria-label="Close menu">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav className="flex-grow-1 overflow-auto">
          <div className="at-nav-label">{isAdmin ? 'Librarian' : 'Menu'}</div>
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} className="at-nav-link" end={m.to === '/books'}>
              <i className={`bi ${m.icon}`} />
              {m.label}
            </NavLink>
          ))}
          <div className="at-nav-label">Account</div>
          <NavLink to="/profile" className="at-nav-link">
            <i className="bi bi-person" />
            My Profile
          </NavLink>
          <button className="at-nav-link border-0 bg-transparent w-100 text-start" style={{ width: 'auto' }} onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" />
            Logout
          </button>
        </nav>
        <div className="p-3 m-3 at-side-note small">
          <div className="fw-semibold">
            <i className={`bi ${isAdmin ? 'bi-shield-lock' : 'bi-person-badge'} me-1`} />
            {isAdmin ? 'Admin access' : 'Member access'}
          </div>
          <div className="text-muted">
            {isAdmin ? 'You can manage books, users and loans.' : 'Borrow up to 3 books at a time.'}
          </div>
        </div>
      </aside>
      <div className={`at-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <div className="at-main">
        <header className="at-topbar">
          <button className="btn btn-icon btn-light d-lg-none" onClick={() => setOpen(true)} aria-label="Open menu">
            <i className="bi bi-list fs-5" />
          </button>
          <h6 className="mb-0 fw-semibold text-truncate">{title}</h6>
          <div className="ms-auto d-flex align-items-center gap-2">
            <button
              className="btn btn-icon btn-light"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle dark mode"
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} />
            </button>
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="at-user-menu d-flex align-items-center gap-2 p-0 border-0">
                <Avatar user={user} />
                <span className="d-none d-sm-block text-start lh-sm min-w-0">
                  <span className="d-block fw-semibold small at-user-name">{user?.name}</span>
                  <span className="d-block text-muted text-capitalize" style={{ fontSize: '0.72rem' }}>
                    {user?.role}
                  </span>
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-0 mt-2">
                <Dropdown.Item onClick={() => navigate('/profile')}>
                  <i className="bi bi-person me-2" />
                  Profile
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <i className="bi bi-box-arrow-left me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>
        <main className="at-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
