import Shelf from './Shelf.jsx'

/**
 * One bay of the rack, holding a single container type: a sign overhead, then
 * its shelf levels. Barrels have no shelves — they stand on the floor.
 */
export default function RackSection({ section, onSelectChemical }) {
  const { containerType, label, chemicals, shelves, total } = section
  const onFloor = containerType === 'barrel'

  return (
    <section className={`bay bay--${containerType}`} aria-label={label}>
      <header className="bay__sign">
        <h2 className="bay__name">{label}</h2>
        <span className="bay__tally">
          {chemicals.length} {chemicals.length === 1 ? 'product' : 'products'}
          <span className="bay__tally-sep" aria-hidden="true">
            &middot;
          </span>
          {total} on hand
        </span>
      </header>

      <div className="bay__frame">
        <div className="rack__upright rack__upright--left" aria-hidden="true" />
        <div className="rack__upright rack__upright--right" aria-hidden="true" />

        <div className="bay__inner">
          {chemicals.length === 0 ? (
            <p className="bay__empty">
              Nothing in this bay yet. Add a {label.toLowerCase().replace(/s$/, '')} with
              <strong> + Add Chemical</strong>.
            </p>
          ) : (
            shelves.map(({ shelf, chemicals: shelfChemicals }) => (
              <Shelf
                key={shelf}
                shelf={shelf}
                chemicals={shelfChemicals}
                onSelectChemical={onSelectChemical}
                variant={onFloor ? 'floor' : 'shelf'}
              />
            ))
          )}
        </div>

        <div className="bay__base" aria-hidden="true" />
      </div>
    </section>
  )
}
