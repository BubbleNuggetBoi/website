import { useState } from 'react'
import Modal from './Modal.jsx'
import StockControls from './StockControls.jsx'
import InventoryHistory from './InventoryHistory.jsx'
import { ContainerIcon } from './ContainerArt.jsx'
import {
  formatTimestamp,
  historyForChemical,
  isLowStock,
  isOutOfStock,
  labelColorFor,
} from '../lib/inventory.js'

const DETAIL_TINTS = { gallon: '#dfe5ea', can: '#b4bec8' }

/** Product window: current stock, quick adjustments, details and history. */
export default function ChemicalModal({
  chemical,
  history,
  onClose,
  onAdjust,
  onSetQuantity,
  onEdit,
}) {
  const [showHistory, setShowHistory] = useState(false)
  const entries = historyForChemical(history, chemical.id)
  const low = isLowStock(chemical)
  const empty = isOutOfStock(chemical)
  const color = labelColorFor(chemical)

  return (
    <Modal
      title={chemical.name}
      subtitle={chemical.productNumber ? `Product #${chemical.productNumber}` : 'No product number'}
      onClose={onClose}
    >
      <div className="detail">
        <div className="detail__hero" style={{ '--label-bg': color.bg }}>
          <div className="detail__art">
            <ContainerIcon
              containerType={chemical.containerType}
              tint={DETAIL_TINTS[chemical.containerType]}
            />
          </div>
          <dl className="detail__facts">
            <div className="detail__fact">
              <dt>Container Type</dt>
              <dd>{chemical.containerType === 'can' ? 'Can' : 'Gallon Jug'}</dd>
            </div>
            <div className="detail__fact">
              <dt>Shelf Location</dt>
              <dd>Shelf {chemical.shelf}</dd>
            </div>
            <div className="detail__fact">
              <dt>Current Quantity</dt>
              <dd>
                {chemical.quantity}
                {low ? (
                  <span className={`flag flag--inline${empty ? ' flag--empty' : ''}`}>
                    {empty ? 'OUT OF STOCK' : 'LOW STOCK'}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="detail__fact">
              <dt>Low Stock Threshold</dt>
              <dd>{chemical.lowStockThreshold}</dd>
            </div>
            <div className="detail__fact">
              <dt>Last Updated</dt>
              <dd>{formatTimestamp(chemical.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        <StockControls chemical={chemical} onAdjust={onAdjust} onSetQuantity={onSetQuantity} />

        <div className="detail__actions">
          <button
            type="button"
            className="btn btn--ghost btn--lg"
            onClick={() => setShowHistory((value) => !value)}
            aria-expanded={showHistory}
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
          <button type="button" className="btn btn--accent btn--lg" onClick={onEdit}>
            Edit Product
          </button>
        </div>

        {showHistory ? (
          <div className="detail__history">
            <h3 className="section-title">Recent Adjustments</h3>
            <InventoryHistory
              entries={entries.slice(0, 25)}
              emptyMessage="No changes recorded for this product yet."
            />
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
