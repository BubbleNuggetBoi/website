/** Search by name or product number, plus the container / low-stock filters. */
export default function SearchAndFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  filters,
  counts,
}) {
  return (
    <div className="toolbar">
      <div className="search">
        <svg viewBox="0 0 24 24" className="search__icon" aria-hidden="true">
          <path
            d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.2-1.8L21 21"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          className="search__input"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search chemicals..."
          aria-label="Search chemicals by name or product number"
        />
        {search ? (
          <button
            type="button"
            className="search__clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            &times;
          </button>
        ) : null}
      </div>

      <div className="segmented segmented--filters" role="group" aria-label="Filter chemicals">
        {filters.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`segmented__btn${filter === option.id ? ' is-active' : ''}${
              option.id === 'low' ? ' segmented__btn--warn' : ''
            }`}
            aria-pressed={filter === option.id}
            onClick={() => onFilterChange(option.id)}
          >
            {option.label}
            <span className="segmented__count">{counts[option.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
