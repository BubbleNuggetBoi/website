import { useState } from 'react'
import Modal from './Modal.jsx'
import { STORAGE_KEY } from '../lib/storage.js'

/** Export + reset. Deliberately small: the rack is the app, not this screen. */
export default function SettingsModal({
  stats,
  canEdit,
  isShared,
  onClose,
  onExportJson,
  onExportCsv,
  onRequestReset,
}) {
  const [notice, setNotice] = useState('')

  // Exports go through the host on sandboxed pages, where a viewer can decline.
  const runExport = (exporter) => async () => {
    setNotice('')
    const saved = await exporter()
    if (!saved) setNotice('Export was cancelled, or saving files is not allowed on this device.')
  }

  return (
    <Modal title="Settings" subtitle="Backups and catalog maintenance" onClose={onClose}>
      <div className="settings">
        <section className="settings__block">
          <h3 className="section-title">Export Inventory</h3>
          <p className="settings__note">
            Downloads the current counts for all {stats.products} products, plus the recorded
            change history in the JSON file.
          </p>
          <div className="settings__row">
            <button
              type="button"
              className="btn btn--accent btn--lg"
              onClick={runExport(onExportCsv)}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--lg"
              onClick={runExport(onExportJson)}
            >
              Export JSON
            </button>
          </div>
          {notice ? <p className="settings__notice">{notice}</p> : null}
        </section>

        <section className="settings__block">
          <h3 className="section-title">Storage</h3>
          {isShared ? (
            <p className="settings__note">
              {canEdit
                ? 'Counts are published into this page, so everyone with the link sees the numbers you save. A copy is also kept in this browser so the app keeps working if a save does not go through.'
                : 'You are looking at a shared copy. The counts were published by whoever manages this inventory.'}
            </p>
          ) : (
            <p className="settings__note">
              Inventory is saved in this browser under <code>{STORAGE_KEY}</code>. It survives
              refreshes and restarts on this device. Export a backup before clearing browser data.
            </p>
          )}
        </section>

        {canEdit ? (
        <section className="settings__block settings__block--danger">
          <h3 className="section-title">Reset To Default Products</h3>
          <p className="settings__note">
            Restores the original chemical list with every quantity back at 0 and clears the change
            history. Current counts will be lost.
          </p>
          <button type="button" className="btn btn--danger btn--lg" onClick={onRequestReset}>
            Reset To Default Products
          </button>
        </section>
        ) : null}
      </div>
    </Modal>
  )
}
