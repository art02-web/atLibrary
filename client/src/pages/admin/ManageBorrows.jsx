import { useCallback, useEffect, useState } from 'react'
import { Button, Col, Nav, Row, Table } from 'react-bootstrap'
import Notice from '../../components/Notice'
import { borrowApi } from '../../api/services'
import { errorMessage } from '../../api/axios'
import { daysLeft, formatDate, peso } from '../../utils/format'
import useDebounce from '../../hooks/useDebounce'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import StatusBadge from '../../components/StatusBadge'
import BookCover from '../../components/BookCover'
import Pagination from '../../components/Pagination'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import ConfirmModal from '../../components/ConfirmModal'

const TABS = [
  ['pending', 'Pending'],
  ['borrowed', 'Borrowed'],
  ['overdue', 'Overdue'],
  ['returned', 'Returned'],
  ['rejected', 'Rejected'],
  ['', 'All'],
]

const ACTIONS = {
  approve: { title: 'Approve this request?', confirm: 'Approve', variant: 'success', fn: borrowApi.approve },
  reject: { title: 'Reject this request?', confirm: 'Reject', variant: 'danger', fn: borrowApi.reject },
  return: { title: 'Mark as returned?', confirm: 'Mark returned', variant: 'primary', fn: borrowApi.markReturned },
  delete: { title: 'Delete this record?', confirm: 'Delete', variant: 'danger', fn: borrowApi.remove },
}

// Admin screen to process borrow requests, returns and history
export default function ManageBorrows() {
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ borrows: [], pagination: null })
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null) // { type, record }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const debounced = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, search: debounced || undefined }
      if (tab === 'overdue') params.overdue = true
      else if (tab) params.status = tab
      const res = await borrowApi.list(params)
      setData(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [tab, page, debounced])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setPage(1), [tab, debounced])

  const run = async () => {
    setBusy(true)
    setActionError('')
    try {
      await ACTIONS[pending.type].fn(pending.record._id)
      setPending(null)
      load()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const action = (type, record, icon, variant, title) => (
    <Button size="sm" variant="light" className={`btn-icon text-${variant} ms-1`} title={title} onClick={() => setPending({ type, record })}>
      <i className={`bi ${icon}`} />
    </Button>
  )

  const confirmMsg = () => {
    if (!pending) return ''
    const { record, type } = pending
    const who = `${record.user?.name || 'Deleted user'} · "${record.book?.title || 'Deleted book'}"`
    if (type === 'return' && record.overdue) return `${who}. This book is overdue, a fine of ${peso(record.fine)} will be recorded.`
    if (type === 'approve') return `${who}. One copy will be issued with a due date set automatically.`
    return who
  }

  return (
    <>
      <PageHeader title="Borrow Records" subtitle="Approve requests, record returns and review the history." />
      <Notice message={error} onClose={() => setError('')} />
      <div className="at-card">
        <div className="px-3 pt-3">
          <Row className="g-2 align-items-end">
            <Col lg={7} className="overflow-auto">
              <Nav variant="pills" activeKey={tab} onSelect={setTab} className="at-tabs">
                {TABS.map(([key, label]) => (
                  <Nav.Item key={label}><Nav.Link eventKey={key} className="text-nowrap">{label}</Nav.Link></Nav.Item>
                ))}
              </Nav>
            </Col>
            <Col lg={5} className="pb-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search member, email, book or ISBN" />
            </Col>
          </Row>
        </div>
        <div className="p-3">
          {loading ? (
            <Loader />
          ) : data.borrows.length === 0 ? (
            <EmptyState icon="bi-arrow-left-right" title="No records" text="Nothing matches this view right now." />
          ) : (
            <>
              <Table responsive className="at-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Book</th>
                    <th>Requested</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.borrows.map((r) => (
                    <tr key={r._id}>
                      <td style={{ minWidth: 170 }}>
                        <div className="fw-semibold">{r.user?.name || 'Deleted user'}</div>
                        <small className="text-muted">{r.user?.email}</small>
                      </td>
                      <td style={{ minWidth: 220 }}>
                        <div className="d-flex align-items-center gap-2">
                          <BookCover book={r.book || { title: '?' }} small />
                          <div className="min-w-0">
                            <div className="fw-medium text-truncate" style={{ maxWidth: 220 }}>{r.book?.title || 'Deleted book'}</div>
                            <small className="text-muted">{r.book?.isbn}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-nowrap">{formatDate(r.requestDate)}</td>
                      <td className="text-nowrap">
                        {r.status === 'returned' ? (
                          <><span className="text-muted small">Returned</span><br />{formatDate(r.returnDate)}</>
                        ) : (
                          <>
                            {formatDate(r.dueDate)}
                            {r.status === 'borrowed' && (
                              <small className={`d-block ${r.overdue ? 'text-danger' : 'text-muted'}`}>
                                {r.overdue ? `${-daysLeft(r.dueDate)}d overdue` : `${daysLeft(r.dueDate)}d left`}
                              </small>
                            )}
                          </>
                        )}
                      </td>
                      <td><StatusBadge status={r.status} overdue={r.overdue} /></td>
                      <td className={r.fine ? 'text-danger fw-semibold' : 'text-muted'}>{r.fine ? peso(r.fine) : '—'}</td>
                      <td className="text-end text-nowrap">
                        {r.status === 'pending' && (
                          <>
                            {action('approve', r, 'bi-check-lg', 'success', 'Approve')}
                            {action('reject', r, 'bi-x-lg', 'danger', 'Reject')}
                          </>
                        )}
                        {r.status === 'borrowed' && action('return', r, 'bi-box-arrow-in-down', 'primary', 'Mark returned')}
                        {r.status !== 'borrowed' && r.status !== 'pending' && action('delete', r, 'bi-trash3', 'danger', 'Delete record')}
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
        show={!!pending} onHide={() => { setPending(null); setActionError('') }} onConfirm={run} busy={busy} error={actionError}
        title={pending && ACTIONS[pending.type].title} confirmText={pending && ACTIONS[pending.type].confirm}
        variant={pending ? ACTIONS[pending.type].variant : 'primary'} message={confirmMsg()}
      />
    </>
  )
}
