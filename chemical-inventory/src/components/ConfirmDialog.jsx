import Modal from './Modal.jsx'

/** Guard rail for destructive actions (delete product, reset catalog). */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p className="confirm__message">{message}</p>
      <div className="confirm__actions">
        <button type="button" className="btn btn--ghost btn--lg" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn btn--lg ${destructive ? 'btn--danger' : 'btn--primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
