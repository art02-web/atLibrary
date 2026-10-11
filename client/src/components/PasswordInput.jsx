import { useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'

// Password field with a show/hide toggle
export default function PasswordInput({ isInvalid, error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <InputGroup hasValidation>
      <Form.Control type={show ? 'text' : 'password'} isInvalid={isInvalid} {...props} />
      <Button
        variant="outline-secondary"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
      </Button>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </InputGroup>
  )
}
