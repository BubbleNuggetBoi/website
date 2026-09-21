import ChemicalContainer from './ChemicalContainer.jsx'

/**
 * One physical shelf level. The slot grid wraps on narrow screens and each
 * wrapped row gets its own deck board, so the rack simply grows taller instead
 * of shrinking containers down to nothing.
 */
export default function Shelf({ shelf, chemicals, onSelectChemical }) {
  return (
    <section className="shelf" aria-label={`Shelf ${shelf}`}>
      <div className="shelf__tag">
        <span className="shelf__tag-word">Shelf</span>
        <span className="shelf__tag-value">{shelf}</span>
      </div>

      <div className="shelf__bay">
        {chemicals.length === 0 ? (
          <div className="shelf__empty">
            <span>Empty shelf</span>
            <div className="deck deck--full" aria-hidden="true" />
          </div>
        ) : (
          <div className="shelf__grid">
            {chemicals.map((chemical) => (
              <div className="slot" key={chemical.id}>
                <ChemicalContainer chemical={chemical} onSelect={onSelectChemical} />
                <div className="deck" aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
