import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/axios'
import { isEmail, nameError, passwordError } from '../utils/validators'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import Brand from '../components/Brand'
import AuthSide from './AuthSide'

const EMPTY = { firstName: '', lastName: '', email: '', studentId: '', password: '', confirm: '' }

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const errs = {}
    const fn = nameError(form.firstName, 'First name')
    if (fn) errs.firstName = fn
    const ln = nameError(form.lastName, 'Last name')
    if (ln) errs.lastName = ln
    if (!isEmail(form.email)) errs.email = 'Enter a valid email'
    const pw = passwordError(form.password)
    if (pw) errs.password = pw
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setBusy(true)
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirm, ...payload } = form
      await register(payload)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) setErrors(Object.fromEntries(fieldErrors.map((f) => [f.field, f.message])))
      setServerError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const field = (name, label, props = {}) => (
    <Form.Group className="mb-3" controlId={name}>
      <Form.Label className="fw-medium small">{label}</Form.Label>
      <Form.Control name={name} value={form[name]} onChange={onChange} isInvalid={!!errors[name]} {...props} />
      <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
    </Form.Group>
  )

  return (
    <div className="auth-wrap">
      <AuthSide title="Join atLibrary today." text="Create a free borrower account to borrow books and manage your reading in one place." />
      <div className="auth-form">
        <div>
          <div className="d-lg-none mb-4"><Brand /></div>
          <h3 className="fw-bold mb-1">Create an account</h3>
          <p className="text-muted mb-4">It only takes a minute.</p>
          {serverError && <Alert variant="danger" className="py-2">{serverError}</Alert>}

          <Form noValidate onSubmit={onSubmit}>
            <Row>
              <Col sm={6}>{field('firstName', 'First name', { placeholder: 'Juan', autoFocus: true, maxLength: 30, autoComplete: 'given-name' })}</Col>
              <Col sm={6}>{field('lastName', 'Last name', { placeholder: 'Dela Cruz', maxLength: 30, autoComplete: 'family-name' })}</Col>
            </Row>
            <Row>
              <Col sm={7}>{field('email', 'Email', { type: 'email', placeholder: 'you@example.com', autoComplete: 'email' })}</Col>
              <Col sm={5}>{field('studentId', 'Student ID (optional)', { placeholder: '2024-00001', maxLength: 30 })}</Col>
            </Row>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label className="fw-medium small">Password</Form.Label>
              <PasswordInput
                name="password" value={form.password} onChange={onChange} placeholder="At least 8 characters"
                isInvalid={!!errors.password} error={errors.password} autoComplete="new-password"
              />
              <PasswordStrength value={form.password} />
            </Form.Group>
            <Form.Group className="mb-4" controlId="confirm">
              <Form.Label className="fw-medium small">Confirm password</Form.Label>
              <PasswordInput
                name="confirm" value={form.confirm} onChange={onChange} placeholder="Re-enter password"
                isInvalid={!!errors.confirm} error={errors.confirm} autoComplete="new-password"
              />
            </Form.Group>
            <Button type="submit" className="w-100 py-2" disabled={busy}>
              {busy ? <Spinner size="sm" /> : 'Create account'}
            </Button>
          </Form>
          <p className="text-center text-muted mt-4">
            Already have an account? <Link to="/login" className="fw-semibold">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
