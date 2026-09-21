/**
 * Pure inventory domain logic. Nothing in here touches React or the browser,
 * so it can be unit tested in plain Node and later reused by a real backend.
 */

export const CONTAINER_TYPES = ['gallon', 'can']

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'gallon', label: 'Gallons' },
  { id: 'can', label: 'Cans' },
  { id: 'low', label: 'Low Stock' },
]

/** Cohesive label palette so the rack is easy to scan without looking random. */
const LABEL_COLORS = [
  { bg: '#1f7a3f', ink: '#f2fff6' }, // servpro green
  { bg: '#d4650f', ink: '#fff6ec' }, // servpro orange
  { bg: '#2f6f8f', ink: '#eff9ff' }, // steel blue
  { bg: '#6b6f2f', ink: '#fbffe8' }, // olive
  { bg: '#8a3f5e', ink: '#fff0f6' }, // plum
  { bg: '#2f7f74', ink: '#eafffb' }, // teal
  { bg: '#9a6b18', ink: '#fff8e8' }, // amber
  { bg: '#4a4f7a', ink: '#f1f2ff' }, // indigo slate
]

/** Stable hash so a product keeps the same label color across reloads. */
function hashString(value) {
  let hash = 0
  const text = String(value ?? '')
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function labelColorFor(chemical) {
  const key = chemical?.id ?? chemical?.name ?? ''
  return LABEL_COLORS[hashString(key) % LABEL_COLORS.length]
}

export function createId(prefix = 'chem') {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

/** Clamps a user supplied number into a safe, non-negative integer. */
export function toQuantity(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, Math.min(999999, Math.trunc(parsed)))
}

export function normalizeContainerType(value) {
  return CONTAINER_TYPES.includes(value) ? value : 'gallon'
}

/**
 * Accepts loose input (form values, old localStorage records, imported JSON)
 * and returns a complete chemical record.
 */
export function normalizeChemical(input = {}, now = new Date().toISOString()) {
  const name = String(input.name ?? '').trim()
  return {
    id: input.id || createId(),
    name: name || 'Unnamed Product',
    productNumber: String(input.productNumber ?? '').trim(),
    containerType: normalizeContainerType(input.containerType),
    quantity: toQuantity(input.quantity, 0),
    lowStockThreshold: toQuantity(input.lowStockThreshold, 2),
    shelf: String(input.shelf ?? '').trim() || '1',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  }
}

export function isLowStock(chemical) {
  if (!chemical) return false
  return chemical.quantity <= chemical.lowStockThreshold
}

export function isOutOfStock(chemical) {
  return !chemical || chemical.quantity === 0
}

export function matchesSearch(chemical, rawQuery) {
  const query = String(rawQuery ?? '').trim().toLowerCase()
  if (!query) return true
  const haystack = [chemical.name, chemical.productNumber, `#${chemical.productNumber}`]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

export function matchesFilter(chemical, filter) {
  switch (filter) {
    case 'gallon':
    case 'can':
      return chemical.containerType === filter
    case 'low':
      return isLowStock(chemical)
    default:
      return true
  }
}

export function filterChemicals(chemicals, { search = '', filter = 'all' } = {}) {
  return chemicals.filter(
    (chemical) => matchesFilter(chemical, filter) && matchesSearch(chemical, search),
  )
}

/** Shelf "2" and shelf 2 are the same shelf; numeric shelves sort numerically. */
function shelfSortValue(shelf) {
  const numeric = parseFloat(shelf)
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER
}

export function compareShelves(a, b) {
  const diff = shelfSortValue(a) - shelfSortValue(b)
  if (diff !== 0) return diff
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/**
 * Groups chemicals into shelf levels for the rack. The rack grows on its own:
 * every distinct shelf value becomes another level, in shelf order.
 */
export function groupByShelf(chemicals) {
  const shelves = new Map()
  for (const chemical of chemicals) {
    const key = String(chemical.shelf ?? '1').trim() || '1'
    if (!shelves.has(key)) shelves.set(key, [])
    shelves.get(key).push(chemical)
  }

  return [...shelves.entries()]
    .sort((a, b) => compareShelves(a[0], b[0]))
    .map(([shelf, items]) => ({
      shelf,
      chemicals: [...items].sort((a, b) => {
        if (a.containerType !== b.containerType) {
          return a.containerType === 'gallon' ? -1 : 1
        }
        return String(a.productNumber || a.name).localeCompare(
          String(b.productNumber || b.name),
          undefined,
          { numeric: true },
        )
      }),
    }))
}

/** Shelf options offered in the add/edit forms, plus the next free shelf. */
export function shelfOptions(chemicals) {
  const used = [...new Set(chemicals.map((c) => String(c.shelf)))].sort(compareShelves)
  const numeric = used.map((s) => parseFloat(s)).filter(Number.isFinite)
  const next = String(numeric.length ? Math.max(...numeric) + 1 : 1)
  return used.includes(next) ? used : [...used, next]
}

export function inventoryStats(chemicals) {
  return {
    products: chemicals.length,
    containers: chemicals.reduce((sum, chemical) => sum + chemical.quantity, 0),
    lowStock: chemicals.filter(isLowStock).length,
    outOfStock: chemicals.filter(isOutOfStock).length,
  }
}

export function createHistoryEntry(chemical, previousQuantity, newQuantity, timestamp) {
  return {
    id: createId('hist'),
    chemicalId: chemical.id,
    chemicalName: chemical.name,
    productNumber: chemical.productNumber,
    previousQuantity,
    newQuantity,
    timestamp: timestamp || new Date().toISOString(),
  }
}

export const HISTORY_LIMIT = 500

export function historyForChemical(history, chemicalId) {
  return history.filter((entry) => entry.chemicalId === chemicalId)
}

export function formatTimestamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeTime(value, now = Date.now()) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ''
  const seconds = Math.max(0, Math.round((now - time) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatTimestamp(value)
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(chemicals) {
  const header = [
    'Product Number',
    'Name',
    'Container Type',
    'Quantity',
    'Low Stock Threshold',
    'Shelf',
    'Low Stock',
    'Created',
    'Updated',
  ]
  const rows = chemicals.map((chemical) => [
    chemical.productNumber,
    chemical.name,
    chemical.containerType,
    chemical.quantity,
    chemical.lowStockThreshold,
    chemical.shelf,
    isLowStock(chemical) ? 'YES' : 'NO',
    chemical.createdAt,
    chemical.updatedAt,
  ])
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function toJsonExport(state) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      chemicals: state.chemicals,
      history: state.history,
    },
    null,
    2,
  )
}
