import Shelf from './Shelf.jsx'
import { groupByShelf } from '../lib/inventory.js'

/**
 * The warehouse rack: the main interface. Shelf levels are derived from the
 * products themselves, so adding a chemical on a new shelf adds a new level.
 */
export default function ChemicalRack({ chemicals, onSelectChemical, emptyState }) {
  const shelves = groupByShelf(chemicals)

  return (
    <div className="rack">
      <div className="rack__upright rack__upright--left" aria-hidden="true" />
      <div className="rack__upright rack__upright--right" aria-hidden="true" />

      <div className="rack__inner">
        {shelves.length === 0 ? (
          <div className="rack__empty">{emptyState}</div>
        ) : (
          shelves.map(({ shelf, chemicals: shelfChemicals }) => (
            <Shelf
              key={shelf}
              shelf={shelf}
              chemicals={shelfChemicals}
              onSelectChemical={onSelectChemical}
            />
          ))
        )}
      </div>

      <div className="rack__base" aria-hidden="true" />
    </div>
  )
}
