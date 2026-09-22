import ChemicalContainer from './ChemicalContainer.jsx'

/**
 * One shelf level. The slot row wraps on narrow screens and each wrapped row
 * gets its own deck board, so the rack grows taller instead of shrinking
 * containers below a tappable size. The `floor` variant drops the board and
 * stands its containers on the warehouse floor, which is where barrels live.
 */
export default function Shelf({ shelf, chemicals, onSelectChemical, variant = 'shelf' }) {
  const onFloor = variant === 'floor'
  const inCabinet = variant === 'cabinet'

  return (
    <section className={`shelf shelf--${variant}`} aria-label={onFloor ? `Floor ${shelf}` : `Shelf ${shelf}`}>
      <div className="shelf__tag">
        {inCabinet ? null : (
          <span className="shelf__tag-word">{onFloor ? 'Floor' : 'Shelf'}</span>
        )}
        <span className="shelf__tag-value">{shelf}</span>
      </div>

      <div className="shelf__bay">
        <div className="shelf__grid">
          {chemicals.map((chemical) => (
            <div className="slot" key={chemical.id}>
              <ChemicalContainer chemical={chemical} onSelect={onSelectChemical} />
              <div
                className={`deck${onFloor ? ' deck--floor' : ''}${
                  inCabinet ? ' deck--cabinet' : ''
                }`}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
