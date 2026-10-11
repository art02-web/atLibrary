import { useCallback, useEffect, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import Notice from '../../components/Notice'
import { userApi } from '../../api/services'
import { errorMessage } from '../../api/axios'
import { formatDate } from '../../utils/format'
import Avatar from '../../components/Avatar'
import useDebounce from '../../hooks/useDebounce'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import Pagination from '../../components/Pagination'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import ConfirmModal from '../../components/ConfirmModal'
import UserFormModal from '../../components/UserFormModal'

// Admin CRUD screen for borrower accounts (the single admin account is never listed or editable here)
export default function ManageUsers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ users: [], pagination: null })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ show: false, user: null })
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const debounced = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userApi.list({ search: debounced || undefined, page })
      setData(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [debounced, page])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setPage(1), [debounced])

  const save = async (payload) => {
    setBusy(true)
    try {
      if (modal.user) await userApi.update(modal.user._id, payload)
      else await userApi.create(payload)
      setModal({ show: false, user: null })
      load()
    } catch (err) {
      // Shown inside the form: next to the field when the server names one, otherwise at the top
      const fe = err.response?.data?.errors
      return fe ? Object.fromEntries(fe.map((f) => [f.field, f.message])) : { _form: errorMessage(err) }
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await userApi.remove(toDelete._id)
      setToDelete(null)
      if (data.users.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Manage Users" subtitle="Create, update and remove borrower accounts.">
        <Button onClick={() => setModal({ show: true, user: null })}>
          <i className="bi bi-person-plus me-1" /> Add borrower
        </Button>
      </PageHeader>
      <Notice message={error} onClose={() => setError('')} />

      <div className="at-card p-3">
        <SearchBar className="mb-3" value={search} onChange={setSearch} placeholder="Search name, email or student ID" />

        {loading ? (
          <Loader />
        ) : data.users.length === 0 ? (
          <EmptyState icon="bi-people" title="No borrowers found" text="Try a different search." />
        ) : (
          <>
            <Table responsive className="at-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Student ID</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                    <tr key={u._id}>
                      <td style={{ minWidth: 220 }}>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar user={u} />
                          <div className="min-w-0">
                            <div className="fw-semibold">{u.name}</div>
                            <small className="text-muted">{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{u.studentId || '—'}</td>
                      <td>
                        <span className={`small fw-medium ${u.isActive ? 'text-success' : 'text-muted'}`}>
                          <i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="text-end text-nowrap">
                        <Button size="sm" variant="light" className="btn-icon me-1" title="Edit" onClick={() => setModal({ show: true, user: u })}>
                          <i className="bi bi-pencil" />
                        </Button>
                        <Button size="sm" variant="light" className="btn-icon text-danger" title="Delete" onClick={() => setToDelete(u)}>
                          <i className="bi bi-trash3" />
                        </Button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </Table>
            <Pagination pagination={data.pagination} onChange={setPage} />
          </>
        )}
      </div>

      <UserFormModal
        show={modal.show} user={modal.user} busy={busy}
        onHide={() => setModal({ show: false, user: null })} onSubmit={save}
      />
      <ConfirmModal
        show={!!toDelete} onHide={() => { setToDelete(null); setDeleteError('') }} onConfirm={remove} busy={busy} error={deleteError}
        title="Delete this borrower?" confirmText="Delete"
        message={`${toDelete?.name}'s account and borrow history will be removed. This can't be undone.`}
      />
    </>
  )
}
