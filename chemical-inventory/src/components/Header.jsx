/** Top toolbar: identity, at-a-glance counts and the primary actions. */
export default function Header({ stats, onAddChemical, onOpenHistory, onOpenSettings }) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__mark" aria-hidden="true">
          <span>SP</span>
        </div>
        <div className="topbar__titles">
          <h1 className="topbar__title">Chemical Inventory</h1>
          <p className="topbar__sub">Warehouse Rack &middot; Live Count</p>
        </div>
      </div>

      <div className="topbar__stats" role="group" aria-label="Inventory summary">
        <div className="stat">
          <span className="stat__value">{stats.products}</span>
          <span className="stat__label">Products</span>
        </div>
        <div className="stat">
          <span className="stat__value">{stats.containers}</span>
          <span className="stat__label">Containers</span>
        </div>
        <div className={`stat${stats.lowStock ? ' stat--warn' : ''}`}>
          <span className="stat__value">{stats.lowStock}</span>
          <span className="stat__label">Low Stock</span>
        </div>
      </div>

      <div className="topbar__actions">
        <button type="button" className="btn btn--ghost" onClick={onOpenHistory}>
          <svg viewBox="0 0 24 24" className="btn__icon" aria-hidden="true">
            <path
              d="M12 7v5l3.5 2M21 12a9 9 0 1 1-2.64-6.36M21 3v4h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          History
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" className="btn__icon" aria-hidden="true">
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2v.17a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.6 14H2.4a2 2 0 1 1 0-4h.17A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 2.6h.09A1.7 1.7 0 0 0 10.3 1h3.4a1.7 1.7 0 0 0 1.21 1.6h.09A1.7 1.7 0 0 0 17 2.26l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 7v.09a1.7 1.7 0 0 0 1.6 1.21h.17a2 2 0 1 1 0 4h-.17a1.7 1.7 0 0 0-1.6 1.21Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="btn__text">Settings</span>
        </button>
        <button type="button" className="btn btn--primary btn--add" onClick={onAddChemical}>
          <span aria-hidden="true" className="btn__plus">
            +
          </span>
          Add Chemical
        </button>
      </div>
    </header>
  )
}
