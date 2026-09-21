import { useState } from 'react'
import { CONTAINER_TYPES, toQuantity } from '../lib/inventory.js'

const CONTAINER_LABELS = { gallon: 'Gallon Jug', can: 'Can' }

function initialValues(chemical) {
  return {
    name: chemical?.name ?? '',
    productNumber: chemical?.productNumber ?? '',
    containerType: chemical?.containerType ?? 'gallon',
    quantity: String(chemical?.quantity ?? 0),
    lowStockThreshold: String(chemical?.lowStockThreshold ?? 2),
    shelf: String(chemical?.shelf ?? '1'),
  }
}

/**
 * Shared add/edit form. Everything is free-form enough that new chemicals we
 * have never stocked before can be added at any time, onto any shelf.
 */
export default function ChemicalForm({
  chemical,
  shelves = [],
  submitLabel = 'Save',
  onSubmit,
  onCancel,
  secondaryAction,
}) {
  const [values, setValues] = useState(() => initialValues(chemical))
  const [error, setError] = useState('')

  const set = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
    setError('')
  }

  const submit = (event) => {
    event.preventDefault()
    if (!values.name.trim()) {
      setError('Product name is required.')
      return
    }
    onSubmit({
      name: values.name.trim(),
      productNumber: values.productNumber.trim(),
      containerType: values.containerType,
      quantity: toQuantity(values.quantity, 0),
      lowStockThreshold: toQuantity(values.lowStockThreshold, 2),
      shelf: values.shelf.trim() || '1',
    })
  }

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span className="field__label">Product Name</span>
        <input
          className="input input--lg"
          value={values.name}
          onChange={set('name')}
          placeholder="e.g. SERVPRO Green"
          autoComplete="off"
        />
      </label>

      <div className="form__grid">
        <label className="field">
          <span className="field__label">
            Product Number <span className="field__hint">optional</span>
          </span>
          <input
            className="input input--lg"
            value={values.productNumber}
            onChange={set('productNumber')}
            placeholder="138"
            inputMode="numeric"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field__label">Shelf / Rack Location</span>
          <input
            className="input input--lg"
            value={values.shelf}
            onChange={set('shelf')}
            list="shelf-options"
            placeholder="1"
            autoComplete="off"
          />
          <datalist id="shelf-options">
            {shelves.map((shelf) => (
              <option value={shelf} key={shelf} />
            ))}
          </datalist>
        </label>
      </div>

      <fieldset className="field field--fieldset">
        <legend className="field__label">Container Type</legend>
        <div className="segmented segmented--lg">
          {CONTAINER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`segmented__btn${values.containerType === type ? ' is-active' : ''}`}
              aria-pressed={values.containerType === type}
              onClick={() => setValues((current) => ({ ...current, containerType: type }))}
            >
              {CONTAINER_LABELS[type]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="form__grid">
        <label className="field">
          <span className="field__label">
            {chemical ? 'Current Quantity' : 'Starting Quantity'}
          </span>
          <input
            className="input input--lg"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.quantity}
            onChange={set('quantity')}
          />
        </label>

        <label className="field">
          <span className="field__label">Low Stock Threshold</span>
          <input
            className="input input--lg"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.lowStockThreshold}
            onChange={set('lowStockThreshold')}
          />
        </label>
      </div>

      {error ? <p className="form__error">{error}</p> : null}

      <div className="form__actions">
        {secondaryAction}
        <div className="form__actions-main">
          <button type="button" className="btn btn--ghost btn--lg" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary btn--lg">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
