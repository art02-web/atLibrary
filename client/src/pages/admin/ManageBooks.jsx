import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Col, Form, Row, Table } from 'react-bootstrap'
import Notice from '../../components/Notice'
import { bookApi } from '../../api/services'
import { errorMessage } from '../../api/axios'
import useDebounce from '../../hooks/useDebounce'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import BookCover from '../../components/BookCover'
import Pagination from '../../components/Pagination'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import ConfirmModal from '../../components/ConfirmModal'
import BookFormModal from '../../components/BookFormModal'

// Admin CRUD screen for books
export default function ManageBooks() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [data, setData] = useState({ books: [], pagination: null })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ show: false, book: null })
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const debounced = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await bookApi.list({ search: debounced, category, page, limit: 10 })
      setData(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [debounced, category, page])

  useEffect(() => {
    bookApi.categories().then(({ data }) => setCategories(data.categories)).catch(() => {})
  }, [])
  useEffect(() => {
    load()
  }, [load])
  useEffect(() => setPage(1), [debounced, category])

  // CREATE + UPDATE
  const save = async (payload) => {
    setBusy(true)
    try {
      if (modal.book) await bookApi.update(modal.book._id, payload)
      else await bookApi.create(payload)
      setModal({ show: false, book: null })
      load()
    } catch (err) {
      // Shown inside the form: next to the field when the server names one, otherwise at the top
      const fe = err.response?.data?.errors
      return fe ? Object.fromEntries(fe.map((f) => [f.field, f.message])) : { _form: errorMessage(err) }
    } finally {
      setBusy(false)
    }
  }

  // DELETE
  const remove = async () => {
    setBusy(true)
    try {
      await bookApi.remove(toDelete._id)
      setToDelete(null)
      if (data.books.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Manage Books" subtitle="Add, edit and remove books from the catalog.">
        <Button onClick={() => setModal({ show: true, book: null })}>
          <i className="bi bi-plus-lg me-1" /> Add book
        </Button>
      </PageHeader>
      <Notice message={error} onClose={() => setError('')} />

      <div className="at-card p-3">
        <Row className="g-2 mb-3">
          <Col md={8}><SearchBar value={search} onChange={setSearch} placeholder="Search title, author, ISBN..." /></Col>
          <Col md={4}>
            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </Form.Select>
          </Col>
        </Row>

        {loading ? (
          <Loader />
        ) : data.books.length === 0 ? (
          <EmptyState icon="bi-book" title="No books found" text="Add your first book or change the filters."
            action={<Button size="sm" onClick={() => setModal({ show: true, book: null })}>Add book</Button>} />
        ) : (
          <>
            <Table responsive className="at-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Shelf</th>
                  <th>Available</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.books.map((b) => (
                  <tr key={b._id}>
                    <td style={{ minWidth: 240 }}>
                      <div className="d-flex align-items-center gap-2">
                        <BookCover book={b} small />
                        <div className="min-w-0">
                          <Link to={`/books/${b._id}`} className="fw-semibold text-reset text-decoration-none d-block text-truncate" style={{ maxWidth: 260 }}>
                            {b.title}
                          </Link>
                          <small className="text-muted">{b.author}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-nowrap small">{b.isbn}</td>
                    <td><span className="badge bg-primary-soft text-primary fw-medium">{b.category}</span></td>
                    <td>{b.publishedYear || '—'}</td>
                    <td>{b.shelfLocation || '—'}</td>
                    <td className="text-nowrap">
                      <span className={b.availableCopies ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                        {b.availableCopies}
                      </span>
                      <span className="text-muted"> / {b.totalCopies}</span>
                    </td>
                    <td className="text-end text-nowrap">
                      <Button size="sm" variant="light" className="btn-icon me-1" title="Edit" onClick={() => setModal({ show: true, book: b })}>
                        <i className="bi bi-pencil" />
                      </Button>
                      <Button size="sm" variant="light" className="btn-icon text-danger" title="Delete" onClick={() => setToDelete(b)}>
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

      <BookFormModal
        show={modal.show} book={modal.book} categories={categories} busy={busy}
        onHide={() => setModal({ show: false, book: null })} onSubmit={save}
      />
      <ConfirmModal
        show={!!toDelete} onHide={() => { setToDelete(null); setDeleteError('') }} onConfirm={remove} busy={busy} error={deleteError}
        title="Delete this book?" confirmText="Delete"
        message={`"${toDelete?.title}" will be permanently removed. This can't be undone.`}
      />
    </>
  )
}
