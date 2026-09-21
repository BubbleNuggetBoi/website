import RackSection from './RackSection.jsx'
import { rackSections } from '../lib/inventory.js'

/**
 * The warehouse rack: the main interface. One bay per container type, each
 * growing its own shelf levels from the products standing in it, so adding a
 * chemical on a new shelf adds a new level without any layout work.
 */
export default function ChemicalRack({ chemicals, onSelectChemical, emptyState, showEmptyBays }) {
  const sections = rackSections(chemicals, { includeEmpty: showEmptyBays })

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
