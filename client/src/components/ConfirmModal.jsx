import { Button, Modal, Spinner } from 'react-bootstrap'
import Notice from './Notice'

// Reusable "Are you sure?" dialog used before deleting/changing records
export default function ConfirmModal({
  show, title = 'Are you sure?', message, confirmText = 'Confirm', variant = 'danger', busy, error, onConfirm, onHide,
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Body className="p-4 text-center">
        <div className={`feature-icon mx-auto mb-3 text-${variant}`} style={{ background: 'var(--bs-tertiary-bg)' }}>
          <i className={`bi ${variant === 'danger' ? 'bi-trash3' : 'bi-question-circle'}`} />
        </div>
        <h5 className="fw-bold">{title}</h5>
        <p className="text-muted mb-4">{message}</p>
        <Notice message={error} className="text-start" />
        <div className="d-flex gap-2 justify-content-center">
          <Button variant="light" onClick={onHide} disabled={busy}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size="sm" className="me-2" />}
            {confirmText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}
