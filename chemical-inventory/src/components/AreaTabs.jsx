/**
 * The tabs across the top. Each area is its own rack; the low-stock count
 * rides on the tab so something running out in the cabinet is visible while
 * you are looking at the chemicals.
 */
export default function AreaTabs({ areas, activeArea, onSelectArea }) {
  return (
    <nav className="tabs" aria-label="Inventory areas">
      {areas.map((area) => {
        const active = area.id === activeArea
        return (
          <button
            key={area.id}
            type="button"
            className={`tab${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelectArea(area.id)}
          >
            <span className="tab__label">{area.label}</span>
            <span className="tab__count">{area.products}</span>
            {area.lowStock > 0 ? (
              <span className="tab__low" title={`${area.lowStock} need reordering`}>
                {area.lowStock} low
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
