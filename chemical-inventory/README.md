# SERVPRO Warehouse Chemical Inventory

A visual chemical inventory for the warehouse floor. The main screen is a
steel rack: every product sits on a shelf as a gallon jug or a can with a
quantity badge, so an employee can walk the warehouse, tap a container, and
count it in or out on a phone, tablet, or desktop.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
npm test         # unit tests for the inventory logic (node:test)
```

## How it works

- One container per product on the rack, never one per unit. 18 gallons of
  SERVPRO Green is a single jug with an `18` badge.
- Shelf levels are derived from the products themselves, so adding a chemical
  on shelf 7 creates shelf 7. Any number of products and shelves is supported;
  nothing about the rack is hard-coded to the current catalog.
- Each row of a shelf gets its own deck board, so on a phone the rack grows
  taller instead of shrinking containers below a tappable size.
- A product is low stock when `quantity <= lowStockThreshold`. That drives the
  badge color, the container flag, the toolbar count, and the Low Stock filter.
- Every quantity change writes a history entry (`5 → 8` with a timestamp),
  visible per product and on the global History screen.
- All state is saved to `localStorage` on every change and restored on load.
  Settings can export CSV/JSON, or reset back to the default product list.

## Project layout

```
src/
  data/defaultChemicals.js   seed catalog (the 18 gallons + 7 cans, at qty 0)
  lib/inventory.js           pure domain logic: filtering, grouping, low stock,
                             label colors, formatting, CSV/JSON export
  lib/inventoryReducer.js    pure state machine for every mutation + history
  lib/storage.js             localStorage read/write, defensive parsing, downloads
  hooks/useInventory.js      binds the reducer to storage; the only bridge
                             between data and UI
  components/
    Header.jsx               top toolbar: counts, History, Settings, Add
    SearchAndFilters.jsx     search box + All / Gallons / Cans / Low Stock
    ChemicalRack.jsx         rack frame, uprights, shelf levels
    Shelf.jsx                one shelf level, wraps into rows with deck boards
    ChemicalContainer.jsx    one product on the shelf (art, label, badge, flags)
    ContainerArt.jsx         SVG gallon jug and can silhouettes
    ChemicalModal.jsx        product window: facts, stock controls, history
    StockControls.jsx        large -1 / +1 steppers and Set Quantity
    AddChemicalModal.jsx     add a new chemical to the rack
    EditChemicalModal.jsx    edit fields, or delete (with confirmation)
    ChemicalForm.jsx         shared add/edit form
    InventoryHistory.jsx     history rows (per product and global)
    HistoryModal.jsx         global history screen
    SettingsModal.jsx        export CSV/JSON, reset to defaults
    Modal.jsx                dialog shell (Escape, backdrop, focus, scroll lock)
    ConfirmDialog.jsx        confirmation guard for destructive actions
  styles.css                 all styling (dark warehouse, steel racking, accents)
```

## Data model

```js
// chemical
{
  id: 'seed-1',
  productNumber: '138',
  name: 'SERVPRO Green',
  containerType: 'gallon',   // 'gallon' | 'can'
  quantity: 0,
  lowStockThreshold: 2,
  shelf: '1',
  createdAt: '2026-09-21T14:00:00.000Z',
  updatedAt: '2026-09-21T14:00:00.000Z',
}

// history entry
{
  id: 'hist-...',
  chemicalId: 'seed-1',
  chemicalName: 'SERVPRO Green',
  productNumber: '138',
  previousQuantity: 5,
  newQuantity: 8,
  timestamp: '2026-09-21T14:30:00.000Z',
}
```

## Adding a real backend later

The UI never touches storage directly. To move off `localStorage`:

1. Keep `lib/inventory.js` and `lib/inventoryReducer.js` as they are — they are
   pure functions with no browser dependencies and can run on a server too.
2. Replace `lib/storage.js` with an API client (`loadState`, `saveState` are the
   only two functions the app calls).
3. Or swap `hooks/useInventory.js` for a version that dispatches to the server
   and keeps the reducer as the optimistic local cache. Component props do not
   change.

`npm test` covers the logic layer (51 tests): seeding, quantity math and
clamping, history recording and capping, search/filter, shelf grouping and
sorting, CSV export, and recovery from corrupt saved data.
