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
import { ContainerArtDefs } from './components/ContainerArt.jsx'
import { useInventory } from './hooks/useInventory.js'
import { downloadFile } from './lib/storage.js'
import {
  filterChemicals,
  inventoryStats,
  isLowStock,
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

  // One piece of view state per overlay; `view` holds the stacked dialog.
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState(null) // 'add' | 'edit' | 'history' | 'settings'
  const [confirm, setConfirm] = useState(null) // { kind: 'delete' | 'reset' | 'clearHistory' }

  const visible = useMemo(() => filterChemicals(chemicals, { search, filter }), [
    chemicals,
    search,
    filter,
  ])

  const stats = useMemo(() => inventoryStats(chemicals), [chemicals])

  const counts = useMemo(
    () => ({
      all: chemicals.length,
      gallon: chemicals.filter((chemical) => chemical.containerType === 'gallon').length,
      can: chemicals.filter((chemical) => chemical.containerType === 'can').length,
      barrel: chemicals.filter((chemical) => chemical.containerType === 'barrel').length,
      low: chemicals.filter(isLowStock).length,
    }),
    [chemicals],
  )

  const shelves = useMemo(() => shelfOptions(chemicals), [chemicals])

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
  }

  const handleEditSubmit = (values) => {
    inventory.updateChemical(selected.id, values)
    setView(null)
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
    chemicals.length === 0 ? (
      <>
        <strong>The rack is empty.</strong>
        <span>Use + Add Chemical to stock the first product.</span>
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
        <SearchAndFilters
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        <div className="main__meta">
          <span>
            Showing {visible.length} of {chemicals.length} products
          </span>
          {stats.lowStock > 0 && filter !== 'low' ? (
            <button type="button" className="link-btn" onClick={() => setFilter('low')}>
              {stats.lowStock} need reordering
            </button>
          ) : null}
        </div>

        <ChemicalRack
          chemicals={visible}
          onSelectChemical={(id) => {
            setView(null)
            setSelectedId(id)
          }}
          emptyState={emptyState}
          // Bays with nothing in them still show while browsing, so an empty
          // barrel area is visibly ready to fill.
          showEmptyBays={filter === 'all' && search.trim() === '' && chemicals.length > 0}
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
        <AddChemicalModal shelves={shelves} onClose={() => setView(null)} onSubmit={handleAdd} />
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
