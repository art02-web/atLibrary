import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Nav, Table } from 'react-bootstrap'
import Notice from '../../components/Notice'
import { borrowApi } from '../../api/services'
import { errorMessage } from '../../api/axios'
import { daysLeft, formatDate, peso } from '../../utils/format'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import BookCover from '../../components/BookCover'
import Pagination from '../../components/Pagination'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import ConfirmModal from '../../components/ConfirmModal'

const TABS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['borrowed', 'Borrowed'],
  ['returned', 'Returned'],
  ['rejected', 'Rejected'],
  ['cancelled', 'Cancelled'],
]

export default function MyBorrows() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ borrows: [], pagination: null })
  const [loading, setLoading] = useState(true)
  const [toCancel, setToCancel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cancelError, setCancelError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await borrowApi.mine({ status: status || undefined, page })
      setData(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async () => {
    setBusy(true)
    setCancelError('')
    try {
      await borrowApi.cancel(toCancel._id)
      setToCancel(null)
      load()
    } catch (err) {
      setCancelError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const dueText = (b) => {
    if (b.status !== 'borrowed') return null
    const d = daysLeft(b.dueDate)
    if (d < 0) return <small className="text-danger d-block">{Math.abs(d)} day(s) overdue</small>
    return <small className={`d-block ${d <= 3 ? 'text-warning' : 'text-muted'}`}>{d} day(s) left</small>
  }

  return (
    <>
      <PageHeader title="My Borrowings" subtitle="Track your requests, loans and returns.">
        <Link to="/books" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" /> Borrow a book
        </Link>
      </PageHeader>
      <Notice message={error} onClose={() => setError('')} />

      <div className="at-card">
        <div className="px-3 pt-3 overflow-auto">
          <Nav variant="pills" activeKey={status} onSelect={(k) => { setStatus(k); setPage(1) }} className="at-tabs">
            {TABS.map(([key, label]) => (
              <Nav.Item key={label}>
                <Nav.Link eventKey={key} className="text-nowrap">{label}</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
        <div className="p-3">
          {loading ? (
            <Loader />
          ) : data.borrows.length === 0 ? (
            <EmptyState icon="bi-journal-bookmark" title="No records" text="Your borrow requests will appear here."
              action={<Link to="/books" className="btn btn-sm btn-primary">Browse books</Link>} />
          ) : (
            <>
              <Table responsive className="at-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Requested</th>
                    <th>Borrowed</th>
                    <th>Due / Returned</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.borrows.map((b) => (
                    <tr key={b._id}>
                      <td style={{ minWidth: 220 }}>
                        <div className="d-flex align-items-center gap-2">
                          <BookCover book={b.book || { title: 'Deleted book' }} small />
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate" style={{ maxWidth: 240 }}>
                              {b.book?.title || 'Deleted book'}
                            </div>
                            <small className="text-muted">{b.book?.author}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-nowrap">{formatDate(b.requestDate)}</td>
                      <td className="text-nowrap">{formatDate(b.borrowDate)}</td>
                      <td className="text-nowrap">
                        {b.status === 'returned' ? formatDate(b.returnDate) : formatDate(b.dueDate)}
                        {dueText(b)}
                      </td>
                      <td><StatusBadge status={b.status} overdue={b.overdue} /></td>
                      <td className={b.fine ? 'text-danger fw-semibold' : 'text-muted'}>{b.fine ? peso(b.fine) : '—'}</td>
                      <td className="text-end">
                        {b.status === 'pending' ? (
                          <Button size="sm" variant="outline-danger" onClick={() => setToCancel(b)}>Cancel</Button>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination pagination={data.pagination} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        show={!!toCancel} onHide={() => { setToCancel(null); setCancelError('') }} onConfirm={cancel} busy={busy} error={cancelError}
        title="Cancel this request?" confirmText="Yes, cancel"
        message={`Your request for "${toCancel?.book?.title}" will be withdrawn.`}
      />
    </>
  )
}
