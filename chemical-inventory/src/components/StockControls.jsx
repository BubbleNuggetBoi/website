import { useEffect, useState } from 'react'
import { CONTAINER_LABELS, toQuantity } from '../lib/inventory.js'

/**
 * Big, glove-and-thumb friendly stock controls: -1 / +1 apply immediately,
 * and "Set Quantity" commits an exact count on Save.
 */
export default function StockControls({ chemical, onAdjust, onSetQuantity }) {
  const [draft, setDraft] = useState(String(chemical.quantity))

  // Keep the manual field in step with +/- taps and outside edits.
  useEffect(() => {
    setDraft(String(chemical.quantity))
  }, [chemical.id, chemical.quantity])

  const parsed = toQuantity(draft, chemical.quantity)
  const dirty = draft.trim() !== '' && parsed !== chemical.quantity

  const submit = (event) => {
    event.preventDefault()
    if (draft.trim() === '') {
      setDraft(String(chemical.quantity))
      return
    }
    onSetQuantity(parsed)
  }

  return (
    <div className="stock">
      <div className="stock__row">
        <button
          type="button"
          className="stepper stepper--minus"
          onClick={() => onAdjust(-1)}
          disabled={chemical.quantity <= 0}
          aria-label="Remove one container"
        >
          <span aria-hidden="true">&minus;</span>
        </button>

        <div className="stock__readout">
          <span className="stock__value">{chemical.quantity}</span>
          <span className="stock__unit">
            {CONTAINER_LABELS[chemical.containerType]?.unit ?? 'containers'} on hand
          </span>
        </div>

        <button
          type="button"
          className="stepper stepper--plus"
          onClick={() => onAdjust(1)}
          aria-label="Add one container"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <form className="stock__set" onSubmit={submit}>
        <label className="field">
          <span className="field__label">Set Quantity</span>
          <input
            className="input input--lg"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Set exact quantity"
          />
        </label>
        <button type="submit" className="btn btn--primary btn--lg stock__save" disabled={!dirty}>
          Save
        </button>
      </form>
    </div>
  )
}
