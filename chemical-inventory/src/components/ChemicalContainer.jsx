import { ContainerIcon } from './ContainerArt.jsx'
import { isLowStock, isOutOfStock, labelColorFor } from '../lib/inventory.js'

const LABEL_MAX_LINES = 2
const LABEL_MAX_CHARS = 9

/**
 * Wraps a product name onto the sticker the way a warehouse label would:
 * short all-caps lines, abbreviated rather than shrunk to nothing. The full
 * name is always shown in the caption under the container.
 */
function labelLines(name) {
  const words = name.toUpperCase().split(/\s+/).filter(Boolean)
  const lines = []

  for (const word of words) {
    const current = lines[lines.length - 1]
    if (current && `${current} ${word}`.length <= LABEL_MAX_CHARS) {
      lines[lines.length - 1] = `${current} ${word}`
    } else if (lines.length < LABEL_MAX_LINES) {
      lines.push(word)
    } else {
      // Ran out of lines: mark the label as abbreviated and stop.
      const last = lines[LABEL_MAX_LINES - 1]
      lines[LABEL_MAX_LINES - 1] = `${last.replace(/[.\u2026]+$/, '')}\u2026`
      break
    }
  }

  return lines.map((line) =>
    line.length > LABEL_MAX_CHARS + 2 ? `${line.slice(0, LABEL_MAX_CHARS + 1)}\u2026` : line,
  )
}

/**
 * Sticker text is sized off the longest line so it always fits the label,
 * expressed in container query units so it scales with the container art.
 */
function labelNameSize(lines) {
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1)
  return `${Math.max(6, Math.min(10.5, 78 / longest)).toFixed(2)}cqw`
}

const TINTS = {
  gallon: '#dfe5ea',
  can: '#b4bec8',
}

/**
 * One product on the rack. Always a single container regardless of how many
 * units are in stock; the count lives in the quantity badge.
 */
export default function ChemicalContainer({ chemical, onSelect }) {
  const low = isLowStock(chemical)
  const empty = isOutOfStock(chemical)
  const color = labelColorFor(chemical)
  const lines = labelLines(chemical.name)

  const statusLabel = empty ? 'out of stock' : low ? 'low stock' : 'in stock'

  return (
    <button
      type="button"
      className={`container-card${low ? ' container-card--low' : ''}`}
      onClick={() => onSelect(chemical.id)}
      aria-label={`${chemical.name}${
        chemical.productNumber ? `, product number ${chemical.productNumber}` : ''
      }, ${chemical.quantity} in stock, ${statusLabel}. Open details.`}
    >
      <div className="container-card__art">
        <ContainerIcon containerType={chemical.containerType} tint={TINTS[chemical.containerType]} />

        <span
          className={`container-card__label container-card__label--${chemical.containerType}`}
          style={{
            '--label-bg': color.bg,
            '--label-ink': color.ink,
            '--label-name-size': labelNameSize(lines),
          }}
        >
          {chemical.productNumber ? (
            <span className="container-card__label-number">#{chemical.productNumber}</span>
          ) : null}
          {lines.map((line, index) => (
            <span className="container-card__label-name" key={index}>
              {line}
            </span>
          ))}
        </span>

        <span
          className={`qty-badge${empty ? ' qty-badge--empty' : low ? ' qty-badge--low' : ''}`}
          aria-hidden="true"
        >
          {chemical.quantity}
        </span>
      </div>

      <div className="container-card__caption">
        <span className="container-card__name">{chemical.name}</span>
        <span className="container-card__meta">
          {chemical.productNumber ? <span className="pill">#{chemical.productNumber}</span> : null}
          <span className="pill pill--type">
            {chemical.containerType === 'can' ? 'Can' : 'Gallon'}
          </span>
          <span className="container-card__count">&times; {chemical.quantity}</span>
        </span>
        {low ? (
          <span className={`flag${empty ? ' flag--empty' : ''}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="flag__icon">
              <path
                d="M12 3.5 22 20H2L12 3.5Z M12 9.5v5 M12 17.2v.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {empty ? 'OUT OF STOCK' : 'LOW STOCK'}
          </span>
        ) : null}
      </div>
    </button>
  )
}
