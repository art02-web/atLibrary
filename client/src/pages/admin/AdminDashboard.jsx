import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Col, Row } from 'react-bootstrap'
import Notice from '../../components/Notice'
import { borrowApi, statsApi } from '../../api/services'
import { errorMessage } from '../../api/axios'
import { formatDate } from '../../utils/format'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(() => {
    statsApi.admin().then(({ data }) => setStats(data)).catch((e) => setError(errorMessage(e)))
    borrowApi.list({ status: 'pending', limit: 5 }).then(({ data }) => setPending(data.borrows)).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const quick = async (fn, id) => {
    setError('')
    try {
      await fn(id)
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!stats) return error ? <Notice message={error} /> : <Loader />
  const t = stats.totals
  const maxCat = Math.max(1, ...stats.byCategory.map((c) => c.count))

  return (
    <>
      <Notice message={error} onClose={() => setError('')} />
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="page-title">Library overview</h3>
          <p className="text-muted mb-0 mt-1">Here&apos;s what&apos;s happening in atLibrary today.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/books" className="btn btn-primary"><i className="bi bi-plus-lg me-1" />Add book</Link>
          <Link to="/admin/borrows" className="btn btn-outline-primary">Process requests</Link>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={6} xl={3}><StatCard icon="bi-book" label="Book titles" value={t.titles} hint={`${t.copies} total copies`} /></Col>
        <Col xs={6} xl={3}><StatCard icon="bi-people" label="Members" value={t.users} tone="info" /></Col>
        <Col xs={6} xl={3}><StatCard icon="bi-book-half" label="On loan" value={t.borrowed} tone="purple" hint={`${t.availableCopies} copies on shelf`} /></Col>
        <Col xs={6} xl={3}><StatCard icon="bi-exclamation-triangle" label="Overdue" value={t.overdue} tone="danger" hint={`${t.pending} pending request(s)`} /></Col>
      </Row>

      <Row className="g-4">
        <Col lg={7}>
          <div className="at-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Pending requests</h6>
              <Link to="/admin/borrows" className="small">View all</Link>
            </div>
            {pending.length === 0 ? (
              <EmptyState icon="bi-check2-all" title="All caught up" text="There are no pending borrow requests." />
            ) : (
              <div className="d-grid gap-2">
                {pending.map((r) => (
                  <div key={r._id} className="d-flex align-items-center gap-3 p-2 rounded-3 border">
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate">{r.book?.title}</div>
                      <small className="text-muted">{r.user?.name} · {formatDate(r.requestDate)}</small>
                    </div>
                    <button className="btn btn-sm btn-success" onClick={() => quick(borrowApi.approve, r._id)}>Approve</button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => quick(borrowApi.reject, r._id)}>Reject</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
        <Col lg={5}>
          <div className="at-card p-4 h-100">
            <h6 className="fw-bold mb-3">Books by category</h6>
            {stats.byCategory.length === 0 && (
              <EmptyState icon="bi-bar-chart" title="No books yet" text="Add books to see how the catalog is split by category." />
            )}
            <div className="d-grid gap-2">
              {stats.byCategory.map((c) => (
                <div className="bar-row" key={c.category}>
                  <span className="text-truncate">{c.category}</span>
                  <div className="progress progress-thin">
                    <div className="progress-bar" style={{ width: `${(c.count / maxCat) * 100}%`, background: 'var(--at-primary)' }} />
                  </div>
                  <span className="text-end fw-semibold">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Col>
        <Col lg={7}>
          <div className="at-card p-4 h-100">
            <h6 className="fw-bold mb-3">Recent activity</h6>
            {stats.recent.length === 0 ? (
              <EmptyState icon="bi-clock-history" title="No activity yet" />
            ) : (
              <div className="d-grid gap-3">
                {stats.recent.map((r) => (
                  <div key={r._id} className="d-flex align-items-center gap-3">
                    <div className="feature-icon flex-shrink-0" style={{ width: 38, height: 38, fontSize: '1rem' }}>
                      <i className="bi bi-arrow-left-right" />
                    </div>
                    <div className="flex-grow-1 min-w-0 small">
                      <div className="text-truncate">
                        <span className="fw-semibold">{r.user?.name || 'Deleted user'}</span> · {r.book?.title || 'Deleted book'}
                      </div>
                      <span className="text-muted">{formatDate(r.updatedAt)}</span>
                    </div>
                    <StatusBadge status={r.status} overdue={r.status === 'borrowed' && new Date(r.dueDate) < new Date()} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
        <Col lg={5}>
          <div className="at-card p-4 h-100">
            <h6 className="fw-bold mb-3">Most borrowed</h6>
            {stats.popular.length === 0 ? (
              <EmptyState icon="bi-trophy" title="No loans yet" />
            ) : (
              <ol className="list-unstyled d-grid gap-3 mb-0">
                {stats.popular.map((p, i) => (
                  <li key={p._id} className="d-flex align-items-center gap-3">
                    <span className="at-avatar" style={{ width: 32, height: 32 }}>{i + 1}</span>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate">{p.title}</div>
                      <small className="text-muted">{p.author}</small>
                    </div>
                    <span className="badge bg-primary-soft text-primary">{p.count}×</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Col>
      </Row>
    </>
  )
}
