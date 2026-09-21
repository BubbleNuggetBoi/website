import { ContainerIcon } from './ContainerArt.jsx'
import {
  CONTAINER_ART,
  CONTAINER_LABELS,
  contentsColorFor,
  isLowStock,
  isOutOfStock,
  labelColorFor,
  labelLines,
  labelTextSize,
} from '../lib/inventory.js'

/**
 * One product on the shelf. Always a single container no matter how many units
 * are in stock; the count lives in the quantity badge.
 */
export default function ChemicalContainer({ chemical, onSelect }) {
  const low = isLowStock(chemical)
  const empty = isOutOfStock(chemical)
  const color = labelColorFor(chemical)
  const contents = contentsColorFor(chemical)
  const art = CONTAINER_ART[chemical.containerType] ?? CONTAINER_ART.gallon
  const lines = labelLines(chemical.name, chemical.containerType)
  const { nameSize, numberSize } = labelTextSize(lines, chemical.productNumber, chemical.containerType)

  const statusLabel = empty ? 'out of stock' : low ? 'low stock' : 'in stock'
  const typeLabel = CONTAINER_LABELS[chemical.containerType]?.one ?? 'Container'

  return (
    <button
      type="button"
      className={`container-card${low ? ' container-card--low' : ''}`}
      onClick={() => onSelect(chemical.id)}
      aria-label={`${chemical.name}${
        chemical.productNumber ? `, product number ${chemical.productNumber}` : ''
      }, ${typeLabel}, ${chemical.quantity} in stock, ${statusLabel}. Open details.`}
    >
      <div className="container-card__art" style={{ '--art-aspect': art.aspect }}>
        <ContainerIcon containerType={chemical.containerType} contents={contents} />

        <span
          className="container-card__label"
          style={{
            '--label-bg': color.bg,
            '--label-ink': color.ink,
            '--label-left': `${art.label.left}%`,
            '--label-right': `${art.label.right}%`,
            '--label-top': `${art.label.top}%`,
            '--label-height': `${art.label.height}%`,
            '--label-name-size': `${nameSize}cqh`,
            '--label-number-size': `${numberSize}cqh`,
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
