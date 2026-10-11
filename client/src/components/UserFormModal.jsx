import { useEffect, useState } from 'react'
import Notice from './Notice'
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap'
import { isEmail, nameError, passwordError, phoneError } from '../utils/validators'
import { nameParts } from '../utils/format'
import PasswordInput from './PasswordInput'

const EMPTY = { firstName: '', lastName: '', email: '', password: '', studentId: '', phone: '', address: '', isActive: true }

// Add / Edit borrower form (used by ManageUsers). There is no role field: every account made here is a borrower.
export default function UserFormModal({ show, user, onHide, onSubmit, busy }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const editing = Boolean(user)

  useEffect(() => {
    if (!show) return
    setErrors({})
    setForm(user ? { ...EMPTY, ...user, ...nameParts(user), password: '' } : EMPTY)
  }, [show, user])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setErrors({ ...errors, [name]: '' })
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    // Older accounts may have a first name that predates the letters-only rule: only check it when it changes
    const firstChanged = !editing || form.firstName.trim() !== nameParts(user).firstName
    const fn = firstChanged ? nameError(form.firstName, 'First name') : ''
    if (fn) errs.firstName = fn
    const ln = nameError(form.lastName, 'Last name')
    if (ln) errs.lastName = ln
    if (!isEmail(form.email)) errs.email = 'Enter a valid email'
    if (!editing || form.password) {
      const pe = passwordError(form.password)
      if (pe) errs.password = pe
    }
    const ph = phoneError(form.phone)
    if (ph) errs.phone = ph
    setErrors(errs)
    if (Object.keys(errs).length) return

    const payload = {
      firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), studentId: form.studentId,
      phone: form.phone, address: form.address, isActive: form.isActive,
    }
    if (!firstChanged) delete payload.firstName
    if (form.password) payload.password = form.password
    const fieldErrors = await onSubmit(payload)
    if (fieldErrors) setErrors(fieldErrors)
  }

  const field = (name, label, props = {}, md = 6) => (
    <Col md={md}>
      <Form.Group className="mb-3" controlId={`user-${name}`}>
        <Form.Label className="small fw-medium">{label}</Form.Label>
        <Form.Control name={name} value={form[name]} onChange={onChange} isInvalid={!!errors[name]} {...props} />
        <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
      </Form.Group>
    </Col>
  )

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Form noValidate onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">{editing ? 'Edit borrower' : 'Add borrower'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Notice message={errors._form} />
          <Row>
            {field('firstName', 'First name *', { maxLength: 30 })}
            {field('lastName', 'Last name *', { maxLength: 30 })}
            {field('email', 'Email *', { type: 'email' }, 12)}
            <Col md={12}>
              <Form.Group className="mb-3" controlId="user-password">
                <Form.Label className="small fw-medium">{editing ? 'New password (leave blank to keep)' : 'Password *'}</Form.Label>
                <PasswordInput name="password" value={form.password} onChange={onChange}
                  isInvalid={!!errors.password} error={errors.password} autoComplete="new-password" />
              </Form.Group>
            </Col>
            {field('studentId', 'Student ID', { maxLength: 30 })}
            {field('phone', 'Phone')}
            {field('address', 'Address', { maxLength: 200 })}
            <Col xs={12}>
              <Form.Check type="switch" id="user-active" name="isActive" label="Account is active"
                checked={form.isActive} onChange={onChange} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy && <Spinner size="sm" className="me-2" />}
            {editing ? 'Save changes' : 'Create borrower'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
