import Modal from './Modal.jsx'
import ChemicalForm from './ChemicalForm.jsx'

export default function EditChemicalModal({ chemical, shelves, onClose, onSubmit, onRequestDelete }) {
  return (
    <Modal
      title="Edit Product"
      subtitle={chemical.productNumber ? `#${chemical.productNumber} — ${chemical.name}` : chemical.name}
      onClose={onClose}
    >
      <ChemicalForm
        chemical={chemical}
        shelves={shelves}
        submitLabel="Save Changes"
        onCancel={onClose}
        onSubmit={onSubmit}
        secondaryAction={
          <button type="button" className="btn btn--danger-ghost btn--lg" onClick={onRequestDelete}>
            Delete Product
          </button>
        }
      />
    </Modal>
  )
}
