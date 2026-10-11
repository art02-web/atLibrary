import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Col, ProgressBar, Row } from 'react-bootstrap'
import { bookApi, statsApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { daysLeft, formatDate, nameParts, peso } from '../../utils/format'
import StatCard from '../../components/StatCard'
import BookCover from '../../components/BookCover'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function UserDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [newBooks, setNewBooks] = useState([])

  useEffect(() => {
    statsApi.me().then(({ data }) => setStats(data)).catch(() => setStats({ totals: {}, current: [] }))
    bookApi.list({ limit: 6, sort: 'newest' }).then(({ data }) => setNewBooks(data.books)).catch(() => {})
  }, [])

  if (!stats) return <Loader />
  const t = stats.totals

  return (
    <>
      <div className="at-card at-card-dark p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h4 className="fw-bold mb-1">{greeting()}, {nameParts(user).firstName}! 👋</h4>
            <p className="mb-0 opacity-75">
              {t.overdue
                ? `You have ${t.overdue} overdue book(s). Please return them soon.`
                : 'Ready to discover your next favorite book?'}
            </p>
          </div>
          <Link to="/books" className="btn btn-light fw-semibold">
            <i className="bi bi-search me-2" />Browse catalog
          </Link>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}><StatCard icon="bi-book-half" label="Borrowed" value={t.borrowed ?? 0} /></Col>
        <Col xs={6} lg={3}><StatCard icon="bi-hourglass-split" label="Pending" value={t.pending ?? 0} tone="warning" /></Col>
        <Col xs={6} lg={3}><StatCard icon="bi-check2-circle" label="Returned" value={t.returned ?? 0} tone="success" /></Col>
        <Col xs={6} lg={3}>
          <StatCard icon="bi-cash-coin" label="Fines" value={peso(t.fines)} tone={t.fines ? 'danger' : 'info'}
            hint={t.overdue ? `${t.overdue} overdue` : 'All good'} />
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={7}>
          <div className="at-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Currently borrowed</h6>
              <Link to="/my-borrows" className="small">View all</Link>
            </div>
            {stats.current.length === 0 ? (
              <EmptyState icon="bi-journal" title="No active loans" text="Books you borrow will show up here." />
            ) : (
              <div className="d-grid gap-3">
                {stats.current.map((b) => {
                  const d = daysLeft(b.dueDate)
                  const pct = Math.min(100, Math.max(0, ((14 - d) / 14) * 100))
                  return (
                    <div key={b._id} className="d-flex gap-3 align-items-center">
                      <BookCover book={b.book || {}} small />
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between gap-2">
                          <span className="fw-semibold text-truncate">{b.book?.title}</span>
                          <small className={`text-nowrap ${d < 0 ? 'text-danger' : 'text-muted'}`}>
                            {d < 0 ? `${-d}d overdue · ${peso(b.fine)}` : `Due ${formatDate(b.dueDate)}`}
                          </small>
                        </div>
                        <ProgressBar now={pct} variant={d < 0 ? 'danger' : d <= 3 ? 'warning' : 'primary'} className="progress-thin mt-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Col>
        <Col lg={5}>
          <div className="at-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">New arrivals</h6>
              <Link to="/books" className="small">See more</Link>
            </div>
            {newBooks.length === 0 && (
              <EmptyState icon="bi-book" title="No books yet" text="New books will show up here." />
            )}
            <Row className="g-2">
              {newBooks.map((b) => (
                <Col xs={4} key={b._id}>
                  <Link to={`/books/${b._id}`} title={b.title}><BookCover book={b} /></Link>
                </Col>
              ))}
            </Row>
          </div>
        </Col>
      </Row>
    </>
  )
}
