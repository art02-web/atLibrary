import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Col, Row, Spinner } from 'react-bootstrap'
import { bookApi } from '../../api/services'
import { errorMessage } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Notice from '../../components/Notice'
import useBorrow from '../../hooks/useBorrow'
import BookCover from '../../components/BookCover'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

export default function BookDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [book, setBook] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    bookApi
      .get(id)
      .then(({ data }) => setBook(data.book))
      .catch((err) => setError(errorMessage(err)))
  }, [id])

  const { requestBorrow, busyId, notice, clearNotice } = useBorrow(load)

  useEffect(() => {
    load()
  }, [load])

  if (error) {
    return (
      <div className="at-card">
        <EmptyState icon="bi-book" title="Book not found" text={error}
          action={<Link to="/books" className="btn btn-primary btn-sm">Back to catalog</Link>} />
      </div>
    )
  }
  if (!book) return <Loader />

  const available = book.availableCopies > 0
  const details = [
    ['bi-upc', 'ISBN', book.isbn],
    ['bi-tags', 'Category', book.category],
    ['bi-building', 'Publisher', book.publisher || '—'],
    ['bi-calendar3', 'Published', book.publishedYear || '—'],
    ['bi-geo', 'Shelf', book.shelfLocation || '—'],
    ['bi-stack', 'Copies', `${book.availableCopies} of ${book.totalCopies} available`],
  ]

  return (
    <>
      <Button variant="link" className="px-0 mb-3 text-decoration-none" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-1" /> Back
      </Button>
      <div className="at-card p-4">
        <Row className="g-4">
          <Col sm={5} md={4} lg={3}>
            <BookCover book={book} />
          </Col>
          <Col>
            <span className="badge bg-primary-soft text-primary fw-medium mb-2">{book.category}</span>
            <h2 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>{book.title}</h2>
            <p className="text-muted fs-5">by {book.author}</p>
            <p>{book.description || 'No description available.'}</p>

            <Row className="g-3 my-2">
              {details.map(([icon, label, value]) => (
                <Col xs={6} md={4} key={label}>
                  <div className="small text-muted"><i className={`bi ${icon} me-1`} />{label}</div>
                  <div className="fw-semibold">{value}</div>
                </Col>
              ))}
            </Row>

            <div className="mt-4"><Notice message={notice?.message} variant={notice?.variant} onClose={clearNotice} /></div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {isAdmin ? (
                <Link to="/admin/books" className="btn btn-primary">
                  <i className="bi bi-pencil me-2" />Manage in admin
                </Link>
              ) : (
                <Button size="lg" disabled={!available || busyId === book._id} onClick={() => requestBorrow(book)}>
                  {busyId === book._id ? <Spinner size="sm" /> : <><i className="bi bi-journal-plus me-2" />Request to borrow</>}
                </Button>
              )}
              <span className={`fw-medium ${available ? 'text-success' : 'text-danger'}`}>
                <i className={`bi ${available ? 'bi-check-circle' : 'bi-x-circle'} me-1`} />
                {available ? 'Available now' : 'All copies are on loan'}
              </span>
            </div>
          </Col>
        </Row>
      </div>
    </>
  )
}
