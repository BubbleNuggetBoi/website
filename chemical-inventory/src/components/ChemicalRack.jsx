import RackSection from './RackSection.jsx'
import Shelf from './Shelf.jsx'
import { areaById, bayTypesFor, groupByShelf, rackSections } from '../lib/inventory.js'

/**
 * The rack for the active area. Chemicals are split into a bay per container
 * type; the cabinet is one unit whose shelves hold whatever mix sits on them,
 * the way the real supply cabinet is organized.
 */
export default function ChemicalRack({ chemicals, area, onSelectChemical, emptyState, showEmptyBays }) {
  const { layout } = areaById(area)

  if (chemicals.length === 0 && !showEmptyBays) {
    return (
      <div className="rack-yard rack-yard--empty">
        <div className="rack__empty">{emptyState}</div>
      </div>
    )
  }

  if (layout === 'shelves') {
    const shelves = groupByShelf(chemicals)
    return (
      <div className="rack-yard">
        <section className="bay bay--cabinet" aria-label="Supply cabinet">
          <header className="bay__sign">
            <h2 className="bay__name">Supply Cabinet</h2>
            <span className="bay__tally">
              {chemicals.length} {chemicals.length === 1 ? 'product' : 'products'}
              <span className="bay__tally-sep" aria-hidden="true">
                &middot;
              </span>
              {chemicals.reduce((sum, chemical) => sum + chemical.quantity, 0)} on hand
            </span>
          </header>

          <div className="bay__frame">
            <div className="cabinet__door cabinet__door--left" aria-hidden="true" />
            <div className="cabinet__door cabinet__door--right" aria-hidden="true" />

            <div className="bay__inner">
              {shelves.length === 0 ? (
                <p className="bay__empty">
                  The cabinet is empty. Add gloves, suits, masks or mop heads with
                  <strong> + Add Chemical</strong>.
                </p>
              ) : (
                shelves.map(({ shelf, chemicals: shelfChemicals }) => (
                  <Shelf
                    key={shelf}
                    shelf={shelf}
                    chemicals={shelfChemicals}
                    onSelectChemical={onSelectChemical}
                    variant="cabinet"
                  />
                ))
              )}
            </div>

            <div className="bay__base" aria-hidden="true" />
          </div>
        </section>
      </div>
    )
  }

  const types = bayTypesFor(chemicals, { includeEmpty: showEmptyBays })
  const sections = rackSections(chemicals, { includeEmpty: showEmptyBays, types })

  if (sections.length === 0) {
    return (
      <div className="rack-yard rack-yard--empty">
        <div className="rack__empty">{emptyState}</div>
      </div>
    )
  }

  return (
    <div className="rack-yard">
      {sections.map((section) => (
        <RackSection
          key={section.containerType}
          section={section}
          onSelectChemical={onSelectChemical}
        />
      ))}
    </div>
  )
}
