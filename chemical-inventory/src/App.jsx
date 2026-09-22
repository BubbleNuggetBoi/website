import { useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import SearchAndFilters from './components/SearchAndFilters.jsx'
import ChemicalRack from './components/ChemicalRack.jsx'
import ChemicalModal from './components/ChemicalModal.jsx'
import AddChemicalModal from './components/AddChemicalModal.jsx'
import EditChemicalModal from './components/EditChemicalModal.jsx'
import HistoryModal from './components/HistoryModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import AreaTabs from './components/AreaTabs.jsx'
import { ContainerArtDefs } from './components/ContainerArt.jsx'
import { useInventory } from './hooks/useInventory.js'
import { downloadFile } from './lib/storage.js'
import {
  AREA_IDS,
  areaById,
  areaSummary,
  filterChemicals,
  filtersFor,
  inArea,
  inventoryStats,
  isLowStock,
  matchesSearch,
  shelfOptions,
  toCsv,
  toJsonExport,
} from './lib/inventory.js'

function fileStamp(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export default function App() {
  const inventory = useInventory()
  const { chemicals, history, canEdit, isShared, status } = inventory

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [area, setArea] = useState(AREA_IDS[0])

  // One piece of view state per overlay; `view` holds the stacked dialog.
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState(null) // 'add' | 'edit' | 'history' | 'settings'
  const [confirm, setConfirm] = useState(null) // { kind: 'delete' | 'reset' | 'clearHistory' }

  // Everything below the tabs works within the active area.
  const areaChemicals = useMemo(() => inArea(chemicals, area), [chemicals, area])

  const visible = useMemo(() => filterChemicals(areaChemicals, { search, filter }), [
    areaChemicals,
    search,
    filter,
  ])

  const stats = useMemo(() => inventoryStats(chemicals), [chemicals])
  const areas = useMemo(() => areaSummary(chemicals), [chemicals])
  const filters = useMemo(() => filtersFor(chemicals, area), [chemicals, area])

  const counts = useMemo(() => {
    const byId = { all: areaChemicals.length, low: areaChemicals.filter(isLowStock).length }
    for (const chemical of areaChemicals) {
      byId[chemical.containerType] = (byId[chemical.containerType] ?? 0) + 1
    }
    return byId
  }, [areaChemicals])

  // A search is easy to mistake for "we don't stock it" when the match is
  // sitting in the other tab, so count those too.
  const elsewhere = useMemo(() => {
    if (!search.trim()) return null
    const hits = areas
      .filter((other) => other.id !== area)
      .map((other) => ({
        ...other,
        matches: inArea(chemicals, other.id).filter((chemical) => matchesSearch(chemical, search))
          .length,
      }))
      .filter((other) => other.matches > 0)
    return hits.length ? hits[0] : null
  }, [areas, area, chemicals, search])

  const shelves = useMemo(() => shelfOptions(chemicals, area), [chemicals, area])

  // Switching tabs can strip the active filter (no cans in the cabinet).
  const activeFilter = filters.some((option) => option.id === filter) ? filter : 'all'

  const selected = selectedId ? inventory.findChemical(selectedId) : null
  // A deleted product cannot stay open.
  const detailOpen = Boolean(selected) && view === null && confirm === null
  const editing = Boolean(selected) && view === 'edit'

  const closeAll = () => {
    setSelectedId(null)
    setView(null)
    setConfirm(null)
  }

  const handleAdd = (values) => {
    inventory.addChemical(values)
    setView(null)
    // Follow the product to wherever it was filed.
    if (values.area && values.area !== area) setArea(values.area)
  }

  const handleEditSubmit = (values) => {
    inventory.updateChemical(selected.id, values)
    setView(null)
    if (values.area && values.area !== area) setArea(values.area)
  }

  const handleConfirm = () => {
    if (confirm?.kind === 'delete' && confirm.id) {
      inventory.deleteChemical(confirm.id)
      setConfirm(null)
      setSelectedId(null)
      setView(null)
      return
    }
    if (confirm?.kind === 'reset') {
      inventory.resetToDefaults()
      setConfirm(null)
      setView(null)
      setSelectedId(null)
      setSearch('')
      setFilter('all')
      setArea(AREA_IDS[0])
      return
    }
    if (confirm?.kind === 'clearHistory') {
      inventory.clearHistory()
      setConfirm(null)
      return
    }
    setConfirm(null)
  }

  const emptyState =
    areaChemicals.length === 0 ? (
      <>
        <strong>Nothing in {areaById(area).label} yet.</strong>
        <span>Use + Add Chemical to stock the first product here.</span>
      </>
    ) : (
      <>
        <strong>No chemicals match this view.</strong>
        <span>
          {filter === 'low'
            ? 'Nothing is at or below its low-stock threshold right now.'
            : 'Try a different search term or filter.'}
        </span>
      </>
    )

  const confirmProps = {
    delete: {
      title: 'Delete Product?',
      message: confirm?.name
        ? `${confirm.name} will be removed from the rack. This cannot be undone.`
        : 'This product will be removed from the rack. This cannot be undone.',
      confirmLabel: 'Delete Permanently',
    },
    reset: {
      title: 'Reset To Default Products?',
      message:
        'This erases all current quantities, any products you added, and the change history, then restores the original list with every count at 0.',
      confirmLabel: 'Reset Inventory',
    },
    clearHistory: {
      title: 'Clear Inventory History?',
      message: 'All recorded quantity changes will be deleted. Current stock counts are not affected.',
      confirmLabel: 'Clear History',
    },
  }[confirm?.kind ?? 'delete']

  return (
    <div className="app">
      <ContainerArtDefs />

      <Header
        stats={stats}
        canEdit={canEdit}
        isShared={isShared}
        status={status}
        onAddChemical={() => {
          setSelectedId(null)
          setView('add')
        }}
        onOpenHistory={() => {
          setSelectedId(null)
          setView('history')
        }}
        onOpenSettings={() => {
          setSelectedId(null)
          setView('settings')
        }}
      />

      <main className="main">
        <AreaTabs areas={areas} activeArea={area} onSelectArea={setArea} />

        <SearchAndFilters
          search={search}
          onSearchChange={setSearch}
          filter={activeFilter}
          onFilterChange={setFilter}
          filters={filters}
          counts={counts}
        />

        <div className="main__meta">
          <span>
            Showing {visible.length} of {areaChemicals.length} in {areaById(area).label}
          </span>
          {counts.low > 0 && activeFilter !== 'low' ? (
            <button type="button" className="link-btn" onClick={() => setFilter('low')}>
              {counts.low} need reordering
            </button>
          ) : null}
          {elsewhere ? (
            <button type="button" className="link-btn" onClick={() => setArea(elsewhere.id)}>
              {elsewhere.matches} more in {elsewhere.label} &rarr;
            </button>
          ) : null}
        </div>

        <ChemicalRack
          chemicals={visible}
          area={area}
          onSelectChemical={(id) => {
            setView(null)
            setSelectedId(id)
          }}
          emptyState={emptyState}
          // Bays with nothing in them still show while browsing, so an empty
          // barrel floor is visibly ready to fill.
          showEmptyBays={
            activeFilter === 'all' && search.trim() === '' && areaChemicals.length > 0
          }
        />

        <p className="footnote">
          {canEdit
            ? isShared
              ? 'Tap a container to count it in or out. Changes save to the shared copy everyone with the link sees.'
              : 'Tap a container to count it in or out. Every change saves to this device automatically.'
            : 'Tap a container to see its details. Counts are kept by whoever manages this inventory.'}
        </p>
      </main>

      {detailOpen ? (
        <ChemicalModal
          chemical={selected}
          history={history}
          canEdit={canEdit}
          onClose={closeAll}
          onAdjust={(delta) => inventory.adjustQuantity(selected.id, delta)}
          onSetQuantity={(quantity) => inventory.setQuantity(selected.id, quantity)}
          onEdit={() => setView('edit')}
        />
      ) : null}

      {view === 'add' && canEdit ? (
        <AddChemicalModal
          shelves={shelves}
          // new products land in the tab you are standing in
          defaultArea={area}
          onClose={() => setView(null)}
          onSubmit={handleAdd}
        />
      ) : null}

      {editing && canEdit ? (
        <EditChemicalModal
          chemical={selected}
          shelves={shelves}
          onClose={() => setView(null)}
          onSubmit={handleEditSubmit}
          onRequestDelete={() => setConfirm({ kind: 'delete', id: selected.id, name: selected.name })}
        />
      ) : null}

      {view === 'history' ? (
        <HistoryModal
          history={history}
          canEdit={canEdit}
          onClose={() => setView(null)}
          onClearHistory={() => setConfirm({ kind: 'clearHistory' })}
        />
      ) : null}

      {view === 'settings' ? (
        <SettingsModal
          stats={stats}
          canEdit={canEdit}
          isShared={isShared}
          onClose={() => setView(null)}
          onExportCsv={() =>
            downloadFile(`chemical-inventory-${fileStamp()}.csv`, toCsv(chemicals), 'text/csv')
          }

          onExportJson={() =>
            downloadFile(
              `chemical-inventory-${fileStamp()}.json`,
              toJsonExport({ chemicals, history }),
              'application/json',
            )
          }
          onRequestReset={() => setConfirm({ kind: 'reset' })}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          {...confirmProps}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  )
}
