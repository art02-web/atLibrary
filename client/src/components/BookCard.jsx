import { Link } from 'react-router-dom'
import { Button, Spinner } from 'react-bootstrap'
import BookCover from './BookCover'

export default function BookCard({ book, canBorrow, busy, onBorrow }) {
  const available = book.availableCopies > 0
  return (
    <div className="at-card at-card-hover p-2 h-100 d-flex flex-column">
      <Link to={`/books/${book._id}`} className="text-decoration-none text-reset">
        <BookCover book={book} />
        <div className="px-1 pt-2">
          <span className="badge bg-primary-soft text-primary fw-medium mb-1">{book.category}</span>
          <div className="fw-semibold book-title lh-sm">{book.title}</div>
          <div className="text-muted small text-truncate">{book.author}</div>
        </div>
      </Link>
      <div className="px-1 pt-2 mt-auto d-flex align-items-center justify-content-between gap-2">
        <small className={available ? 'text-success fw-medium' : 'text-danger fw-medium'}>
          <i className={`bi ${available ? 'bi-check-circle' : 'bi-x-circle'} me-1`} />
          {available ? `${book.availableCopies} left` : 'Unavailable'}
        </small>
        {canBorrow && (
          <Button size="sm" disabled={!available || busy} onClick={() => onBorrow(book)}>
            {busy ? <Spinner size="sm" /> : 'Borrow'}
          </Button>
        )}
      </div>
    </div>
  )
}
