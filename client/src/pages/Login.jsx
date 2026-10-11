import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/axios'
import { isEmail } from '../utils/validators'
import PasswordInput from '../components/PasswordInput'
import Brand from '../components/Brand'
import AuthSide from './AuthSide'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const errs = {}
    if (!isEmail(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setBusy(true)
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setServerError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <AuthSide title="Welcome back to your library." text="Log in to browse the catalog, request books and keep track of your loans." />
      <div className="auth-form">
        <div>
          <div className="d-lg-none mb-4"><Brand /></div>
          <h3 className="fw-bold mb-1">Log in</h3>
          <p className="text-muted mb-4">Enter your account details to continue.</p>
          {serverError && <Alert variant="danger" className="py-2">{serverError}</Alert>}

          <Form noValidate onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="fw-medium small">Email</Form.Label>
              <Form.Control
                type="email" name="email" value={form.email} onChange={onChange}
                placeholder="you@example.com" isInvalid={!!errors.email} autoComplete="email" autoFocus
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-4" controlId="password">
              <Form.Label className="fw-medium small">Password</Form.Label>
              <PasswordInput
                name="password" value={form.password} onChange={onChange} placeholder="••••••••"
                isInvalid={!!errors.password} error={errors.password} autoComplete="current-password"
              />
            </Form.Group>
            <Button type="submit" className="w-100 py-2" disabled={busy}>
              {busy ? <Spinner size="sm" /> : 'Log in'}
            </Button>
          </Form>

          <p className="text-center text-muted mt-4 mb-0">
            New borrower? <Link to="/register" className="fw-semibold">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
