# SERVPRO Warehouse Chemical Inventory

A visual chemical inventory for the warehouse floor. The main screen is a
steel rack: every product stands in its bay as a gallon jug, a can, or a
barrel with a quantity badge, so an employee can walk the warehouse, tap a
container, and count it in or out on a phone, tablet, or desktop.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
npm test         # unit tests for the inventory logic (node:test)
```

## Areas

Tabs across the top switch between areas, each drawing its own rack from the
products filed in it:

- **Chemicals** — the steel rack, split into a bay per container type
  (gallons, cans, a floor for barrels).
- **Cabinet** — one white supply cabinet whose shelves hold whatever mix of
  items sits on them, with painter's-tape labels on the shelf edges. Shelves
  are named, not numbered (`Gloves`, `Tyvek`), because that is how the real
  cabinet is labelled; prefix a name with a number to force the order.

A product carries an `area`, so moving one between tabs is an edit, not a
migration. Low-stock counts ride on each tab, so something running out in the
cabinet is visible while you are looking at the chemicals, and a search tells
you when the match is in the other tab. Adding an area means one entry in
`AREAS` (id, label, and `bays` or `shelves` layout).

## How it works

- One container per product on the rack, never one per unit. 18 gallons of
  SERVPRO Green is a single jug with an `18` badge.
- The rack is split into a bay per container type — Gallons, Cans, and a floor
  area for Barrels — each with its own shelf levels. On wide screens the cans
  and barrels bays sit side by side beneath the gallons; on a phone the bays
  stack.
- Shelf levels are derived from the products themselves, so adding a chemical
  on shelf 7 creates shelf 7 in that bay. Any number of products and shelves is
  supported; nothing about the rack is hard-coded to the current catalog.
- Each row of a shelf gets its own deck board, so on a phone the rack grows
  taller instead of shrinking containers below a tappable size.
- Seven icons to choose from when adding a product — gallon jug, can, barrel,
  glove box, long box, suit, mop head — picked from a visual grid rather than a
  dropdown. Each is drawn in a viewBox matching its own proportions, so a long
  flat carton lies wide and short on the shelf while a jug stands tall, and
  every label stays glued to its front face.
- Each product can carry a contents color, which tints the container and its
  label: a pink chemical reads as pink on the shelf. Jugs are translucent, so
  the color shows through the plastic and deepens below the fill line; cans and
  barrels take the color on the body. Products with no color set keep neutral
  plastic or steel and a stable label color.
- A product is low stock when `quantity <= lowStockThreshold`. That drives the
  badge color, the container flag, the toolbar count, and the Low Stock filter.
- Every quantity change writes a history entry (`5 → 8` with a timestamp),
  visible per product and on the global History screen.
- All state is saved to `localStorage` on every change and restored on load.
  Settings can export CSV/JSON, or reset back to the default product list.

## Sharing one inventory from one link

On a host that lets a page save new versions of itself, the app publishes the
counts *into* the page. Whoever can edit the page counts stock; everyone else
opens the same link and sees those counts, with no account and no database:

- `lib/sharedCopy.js` rebuilds the whole document from its own stylesheet and
  script (found by the `app-css` / `app-js` ids) plus a fresh
  `<script id="inventory-state" type="application/json">` block, then hands it
  to the host. Only the embedded data differs between versions, so the page can
  republish itself indefinitely without growing.
- On load, the embedded counts win over this device's `localStorage` copy, so a
  viewer with stale local data still sees the shared numbers.
- Saves are batched (2.5s after the last change), so counting a shelf is one
  save rather than one per tap. The toolbar shows saving / saved / not saved.
- A page carrying the state block is **read-only until the host confirms the
  visitor can edit** — a signed-out visitor is never shown controls that would
  only write to their own browser. Readers keep search, filters, history and
  export; they lose the steppers, Add, Edit, Delete and Reset.
- With no such host (local dev, or your own web host) none of this engages and
  the app behaves exactly as it always has, on `localStorage`.

Note that a shared *database* is a different trade-off: it gives every viewer
live read/write, but requires each of them to be a signed-in member of the
owner's organization, and such a page cannot be shared by public link.

## Project layout

```
src/
  data/defaultChemicals.js   seed catalog (the 18 gallons + 7 cans, at qty 0)
  lib/inventory.js           pure domain logic: filtering, bay/shelf grouping,
                             low stock, contents colors and label contrast,
                             label text fitting, formatting, CSV/JSON export
  lib/inventoryReducer.js    pure state machine for every mutation + history
  lib/storage.js             localStorage read/write, defensive parsing, downloads
  lib/sharedCopy.js          publishing the counts into the page others open,
                             and deciding whether this visit may save at all
  hooks/useInventory.js      binds the reducer to storage; the only bridge
                             between data and UI
  components/
    Header.jsx               top toolbar: counts, History, Settings, Add
    SearchAndFilters.jsx     search box + All / Gallons / Cans / Low Stock
    ChemicalRack.jsx         the yard: lays out one bay per container type
    RackSection.jsx          one bay: sign, frame, uprights, shelf levels
    Shelf.jsx                one shelf level (or floor row), wrapping into
                             rows that each get a deck board
    ChemicalContainer.jsx    one product on the shelf (art, label, badge, flags)
    ContainerArt.jsx         SVG silhouettes for all seven item types
    AreaTabs.jsx             the area tabs, with per-area low-stock counts
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
  containerType: 'gallon',   // 'gallon' | 'can' | 'barrel'
  quantity: 0,
  lowStockThreshold: 2,
  shelf: '1',
  color: '#1f7a3f',          // contents color; '' when not set
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

### Adding an item type

Item types are data, not special cases. Add the name to `CONTAINER_TYPES` with
an entry in `CONTAINER_LABELS` (names and the unit word) and `CONTAINER_ART`
(the aspect ratio and where its label sits), then draw the silhouette in
`ContainerArt.jsx` in a viewBox with that same aspect. The icon picker offers
it, the filters pick it up, and `bayTypesFor` gives it a bay so nothing filed
with it can drop off the rack.

Two tests guard the wiring: every filter chip an area offers has to actually
narrow the list (a half-wired type fails), and every product has to land in a
bay when the rack is drawn.

`npm test` covers the logic layer (89 tests): seeding, quantity math and
clamping, history recording and capping, search/filter across every container
type and area, bay and shelf grouping and sorting, contents-color parsing and label
contrast, label text fitting, CSV export, recovery from corrupt saved data, and
the shared-copy serializer (round trips, `<` escaping, and rebuilding a page
that can rebuild itself again).
