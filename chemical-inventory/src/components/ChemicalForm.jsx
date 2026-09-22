import { useState } from 'react'
import {
  AREAS,
  CONTAINER_ART,
  CONTAINER_LABELS,
  CONTAINER_TYPES,
  PRODUCT_COLORS,
  normalizeColor,
  toQuantity,
} from '../lib/inventory.js'
import { ContainerIcon } from './ContainerArt.jsx'

function initialValues(chemical, defaultArea) {
  return {
    name: chemical?.name ?? '',
    productNumber: chemical?.productNumber ?? '',
    containerType: chemical?.containerType ?? 'gallon',
    quantity: String(chemical?.quantity ?? 0),
    lowStockThreshold: String(chemical?.lowStockThreshold ?? 2),
    shelf: String(chemical?.shelf ?? '1'),
    area: chemical?.area ?? defaultArea ?? 'chemicals',
    color: normalizeColor(chemical?.color),
  }
}

/**
 * Shared add/edit form. Everything is free-form enough that new chemicals we
 * have never stocked before can be added at any time, onto any shelf.
 */
export default function ChemicalForm({
  chemical,
  defaultArea,
  shelves = [],
  submitLabel = 'Save',
  onSubmit,
  onCancel,
  secondaryAction,
}) {
  const [values, setValues] = useState(() => initialValues(chemical, defaultArea))
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
      area: values.area,
      color: normalizeColor(values.color),
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
        <legend className="field__label">Area</legend>
        <div className="segmented segmented--lg">
          {AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              className={`segmented__btn${values.area === area.id ? ' is-active' : ''}`}
              aria-pressed={values.area === area.id}
              onClick={() => setValues((current) => ({ ...current, area: area.id }))}
            >
              {area.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field field--fieldset">
        <legend className="field__label">
          Icon <span className="field__hint">how it looks on the shelf</span>
        </legend>
        <div className="icon-picker">
          {CONTAINER_TYPES.map((type) => {
            const active = values.containerType === type
            return (
              <button
                key={type}
                type="button"
                className={`icon-option${active ? ' is-active' : ''}`}
                aria-pressed={active}
                aria-label={CONTAINER_LABELS[type].one}
                onClick={() => setValues((current) => ({ ...current, containerType: type }))}
              >
                <span
                  className="icon-option__art"
                  // the drawing is decorative here: the button is already named
                  aria-hidden="true"
                  style={{ '--art-aspect': CONTAINER_ART[type].aspect }}
                >
                  <ContainerIcon containerType={type} contents={values.color} />
                </span>
                <span className="icon-option__name">{CONTAINER_LABELS[type].one}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="field field--fieldset">
        <legend className="field__label">
          Contents Color <span className="field__hint">tints the container and its label</span>
        </legend>
        <div className="swatches">
          {PRODUCT_COLORS.map((preset) => {
            const active = values.color === preset.value
            return (
              <button
                key={preset.value || 'unset'}
                type="button"
                className={`swatch${active ? ' is-active' : ''}${
                  preset.value ? '' : ' swatch--unset'
                }`}
                style={preset.value ? { '--swatch': preset.value } : undefined}
                aria-pressed={active}
                title={preset.name}
                onClick={() => setValues((current) => ({ ...current, color: preset.value }))}
              >
                <span className="swatch__dot" aria-hidden="true" />
                <span className="swatch__name">{preset.name}</span>
              </button>
            )
          })}
        </div>
        <label className="swatch-custom">
          <span className="swatch-custom__label">Custom</span>
          <input
            type="color"
            className="swatch-custom__input"
            value={values.color || '#8c98a4'}
            onChange={(event) =>
              setValues((current) => ({ ...current, color: normalizeColor(event.target.value) }))
            }
            aria-label="Pick a custom contents color"
          />
          <span className="swatch-custom__value">{values.color || 'not set'}</span>
        </label>
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
