import { Spinner } from 'react-bootstrap'

export default function Loader({ full = false, text = 'Loading...' }) {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-muted gap-2"
      style={{ minHeight: full ? '100vh' : 240 }}
    >
      <Spinner animation="border" variant="primary" />
      <small>{text}</small>
    </div>
  )
}
