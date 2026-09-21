import Modal from './Modal.jsx'
import InventoryHistory from './InventoryHistory.jsx'

/** Global history screen: every inventory change, newest first. */
export default function HistoryModal({ history, onClose, onClearHistory }) {
  return (
    <Modal
      title="Inventory History"
      subtitle={`${history.length} recorded change${history.length === 1 ? '' : 's'}`}
      onClose={onClose}
      size="lg"
      footer={
        history.length > 0 ? (
          <button type="button" className="btn btn--danger-ghost" onClick={onClearHistory}>
            Clear History
          </button>
        ) : null
      }
    >
      <InventoryHistory entries={history} showProduct />
    </Modal>
  )
}
