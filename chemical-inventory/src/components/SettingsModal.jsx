import Modal from './Modal.jsx'
import { STORAGE_KEY } from '../lib/storage.js'

/** Export + reset. Deliberately small: the rack is the app, not this screen. */
export default function SettingsModal({
  stats,
  onClose,
  onExportJson,
  onExportCsv,
  onRequestReset,
}) {
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
            <button type="button" className="btn btn--accent btn--lg" onClick={onExportCsv}>
              Export CSV
            </button>
            <button type="button" className="btn btn--ghost btn--lg" onClick={onExportJson}>
              Export JSON
            </button>
          </div>
        </section>

        <section className="settings__block">
          <h3 className="section-title">Storage</h3>
          <p className="settings__note">
            Inventory is saved in this browser under <code>{STORAGE_KEY}</code>. It survives
            refreshes and restarts on this device. Export a backup before clearing browser data,
            or before wiring this app up to a shared database.
          </p>
        </section>

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
      </div>
    </Modal>
  )
}
