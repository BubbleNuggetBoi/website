import { formatRelativeTime, formatTimestamp } from '../lib/inventory.js'

function Delta({ entry }) {
  const diff = entry.newQuantity - entry.previousQuantity
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  return (
    <span className={`delta delta--${direction}`}>
      {diff > 0 ? `+${diff}` : diff}
    </span>
  )
}

/**
 * Recent quantity changes. Used both inside a product's window and on the
 * global history screen (showProduct adds the product name to each row).
 */
export default function InventoryHistory({ entries, showProduct = false, emptyMessage }) {
  if (entries.length === 0) {
    return <p className="empty-note">{emptyMessage || 'No inventory changes recorded yet.'}</p>
  }

  return (
    <ul className="history">
      {entries.map((entry) => (
        <li className="history__row" key={entry.id}>
          <div className="history__main">
            {showProduct ? (
              <span className="history__product">
                {entry.productNumber ? (
                  <span className="pill pill--sm">#{entry.productNumber}</span>
                ) : null}
                {entry.chemicalName}
              </span>
            ) : null}
            <span className="history__change">
              <span className="history__from">{entry.previousQuantity}</span>
              <span className="history__arrow" aria-hidden="true">
                &rarr;
              </span>
              <span className="history__to">{entry.newQuantity}</span>
              <Delta entry={entry} />
            </span>
          </div>
          <div className="history__time">
            <span className="history__stamp">{formatTimestamp(entry.timestamp)}</span>
            <span className="history__ago">{formatRelativeTime(entry.timestamp)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
