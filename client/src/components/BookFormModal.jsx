import { useEffect, useState } from 'react'
import Notice from './Notice'
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap'
import { isbnError } from '../utils/validators'
import BookCover from './BookCover'

const EMPTY = {
  title: '', author: '', isbn: '', category: 'Fiction', publisher: '', publishedYear: '',
  totalCopies: 1, shelfLocation: '', coverImage: '', description: '',
}

// Add / Edit book form (used by ManageBooks)
export default function BookFormModal({ show, book, categories, onHide, onSubmit, busy }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const editing = Boolean(book)

  useEffect(() => {
    if (!show) return
    setErrors({})
    setForm(book ? { ...EMPTY, ...book, publishedYear: book.publishedYear || '' } : EMPTY)
  }, [show, book])

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const errs = {}
    const year = new Date().getFullYear()
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.author.trim()) errs.author = 'Author is required'
    const ie = isbnError(form.isbn)
    if (ie) errs.isbn = ie
    const copies = Number(form.totalCopies)
    if (!Number.isInteger(copies) || copies < 0 || copies > 1000) errs.totalCopies = 'Enter 0 to 1000'
    if (form.publishedYear && (form.publishedYear < 1000 || form.publishedYear > year)) {
      errs.publishedYear = `Year must be 1000–${year}`
    }
    if (form.coverImage && !/^https?:\/\/\S+$/i.test(form.coverImage)) errs.coverImage = 'Must be an http(s) URL'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      title: form.title.trim(), author: form.author.trim(), isbn: form.isbn.trim(), category: form.category,
      publisher: form.publisher.trim(), totalCopies: Number(form.totalCopies), shelfLocation: form.shelfLocation.trim(),
      coverImage: form.coverImage.trim(), description: form.description.trim(),
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
    }
    const fieldErrors = await onSubmit(payload)
    if (fieldErrors) setErrors(fieldErrors)
  }

  const field = (name, label, props = {}, col = 6) => (
    <Col md={col}>
      <Form.Group className="mb-3" controlId={`book-${name}`}>
        <Form.Label className="small fw-medium">{label}</Form.Label>
        <Form.Control name={name} value={form[name]} onChange={onChange} isInvalid={!!errors[name]} {...props} />
        <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
      </Form.Group>
    </Col>
  )

  const coverFromIsbn = () => {
    const isbn = form.isbn.replace(/[^0-9Xx]/g, '')
    if (isbn) setForm({ ...form, coverImage: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` })
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Form noValidate onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">{editing ? 'Edit book' : 'Add a new book'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Notice message={errors._form} />
          <Row>
            <Col md={3} className="d-none d-md-block">
              <BookCover key={form.coverImage} book={form} />
              <small className="text-muted d-block mt-2">Cover preview</small>
            </Col>
            <Col md={9}>
              <Row>
                {field('title', 'Title *', { maxLength: 150 }, 12)}
                {field('author', 'Author *', { maxLength: 100 })}
                {field('isbn', 'ISBN *', { placeholder: '978...' })}
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="book-category">
                    <Form.Label className="small fw-medium">Category</Form.Label>
                    <Form.Select name="category" value={form.category} onChange={onChange}>
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                {field('publisher', 'Publisher', { maxLength: 100 })}
                {field('publishedYear', 'Year published', { type: 'number' }, 4)}
                {field('totalCopies', 'Total copies *', { type: 'number', min: 0 }, 4)}
                {field('shelfLocation', 'Shelf location', { placeholder: 'A-12', maxLength: 30 }, 4)}
                <Col xs={12}>
                  <Form.Group className="mb-3" controlId="book-coverImage">
                    <Form.Label className="small fw-medium d-flex justify-content-between">
                      Cover image URL
                      <button type="button" className="btn btn-link btn-sm p-0" onClick={coverFromIsbn}>Use ISBN cover</button>
                    </Form.Label>
                    <Form.Control name="coverImage" value={form.coverImage} onChange={onChange} isInvalid={!!errors.coverImage} placeholder="https://..." />
                    <Form.Control.Feedback type="invalid">{errors.coverImage}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="book-description">
                    <Form.Label className="small fw-medium">Description</Form.Label>
                    <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={onChange} maxLength={2000} />
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
          {editing && (
            <small className="text-muted d-block mt-3">
              <i className="bi bi-info-circle me-1" />
              {book.totalCopies - book.availableCopies} copy(ies) are currently on loan. Available copies update automatically.
            </small>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy && <Spinner size="sm" className="me-2" />}
            {editing ? 'Save changes' : 'Add book'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
