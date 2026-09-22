import Modal from './Modal.jsx'
import ChemicalForm from './ChemicalForm.jsx'

export default function AddChemicalModal({ shelves, defaultArea, onClose, onSubmit }) {
  return (
    <Modal
      title="Add Chemical"
      subtitle="Adds the product straight onto the rack."
      onClose={onClose}
    >
      <ChemicalForm
        shelves={shelves}
        defaultArea={defaultArea}
        submitLabel="Add To Rack"
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
