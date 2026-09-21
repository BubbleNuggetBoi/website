/**
 * Pure inventory domain logic. Nothing in here touches React or the browser,
 * so it can be unit tested in plain Node and later reused by a real backend.
 */

export const CONTAINER_TYPES = ['gallon', 'can', 'barrel']

/** Labels used on forms, filters and the bay signs over each rack. */
export const CONTAINER_LABELS = {
  gallon: { one: 'Gallon Jug', many: 'Gallons', unit: 'gallons' },
  can: { one: 'Can', many: 'Cans', unit: 'cans' },
  barrel: { one: 'Barrel', many: 'Barrels', unit: 'barrels' },
}

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'gallon', label: 'Gallons' },
  { id: 'can', label: 'Cans' },
  { id: 'barrel', label: 'Barrels' },
  { id: 'low', label: 'Low Stock' },
]

/**
 * Drawing geometry per container type, shared by the SVG art and the label
 * sticker laid over it. `aspect` is the art's width ÷ height, so every
 * container on a shelf is the same height and only the widths differ — a slim
 * can next to a wide jug, as they sit on a real shelf. Label boxes are
 * percentages of the art box.
 */
export const CONTAINER_ART = {
  gallon: {
    aspect: 0.575,
    label: { left: 13, right: 13, top: 52, height: 30 },
    maxLines: 2,
    maxChars: 9,
  },
  can: {
    aspect: 0.4,
    label: { left: 6, right: 6, top: 39, height: 36 },
    maxLines: 2,
    maxChars: 8,
  },
  barrel: {
    aspect: 0.66,
    label: { left: 12, right: 12, top: 33, height: 34 },
    maxLines: 2,
    maxChars: 10,
  },
}

/**
 * Colors for what is actually in the container, so a pink chemical reads as
 * pink on the shelf. Any hex value works; these are just the quick picks.
 */
export const PRODUCT_COLORS = [
  { value: '', name: 'Unset' },
  { value: '#1f7a3f', name: 'Green' },
  { value: '#d4650f', name: 'Orange' },
  { value: '#d6417e', name: 'Pink' },
  { value: '#c0392b', name: 'Red' },
  { value: '#c9931a', name: 'Amber' },
  { value: '#2f6f9f', name: 'Blue' },
  { value: '#1f8f84', name: 'Teal' },
  { value: '#6b4fa8', name: 'Purple' },
  { value: '#7a5230', name: 'Brown' },
  { value: '#e8edf1', name: 'Clear' },
  { value: '#2b3238', name: 'Black' },
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

/** Accepts #abc, #aabbcc or bare hex; returns '' for anything else. */
export function normalizeColor(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const hex = text.startsWith('#') ? text.slice(1) : text
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return ''
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex
  return `#${full.toLowerCase()}`
}

function channels(hex) {
  const value = normalizeColor(hex) || '#000000'
  return [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16))
}

/** Relative luminance, used to keep label text readable on any color. */
export function luminance(hex) {
  const [r, g, b] = channels(hex).map((channel) => {
    const srgb = channel / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function inkOn(hex) {
  return luminance(hex) > 0.42 ? '#14181c' : '#ffffff'
}

/**
 * The sticker color: the product's own color when one is set, otherwise a
 * stable color from the palette so the rack stays scannable either way.
 */
export function labelColorFor(chemical) {
  const color = normalizeColor(chemical?.color)
  if (color) return { bg: color, ink: inkOn(color) }
  const key = chemical?.id ?? chemical?.name ?? ''
  return LABEL_COLORS[hashString(key) % LABEL_COLORS.length]
}

/** The color of the contents, or '' when nobody has set one yet. */
export function contentsColorFor(chemical) {
  return normalizeColor(chemical?.color)
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
    color: normalizeColor(input.color),
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
  // Any container type doubles as a filter, so adding a type adds its filter.
  if (CONTAINER_TYPES.includes(filter)) return chemical.containerType === filter
  if (filter === 'low') return isLowStock(chemical)
  return true
}

export function filterChemicals(chemicals, { search = '', filter = 'all' } = {}) {
  return chemicals.filter(
    (chemical) => matchesFilter(chemical, filter) && matchesSearch(chemical, search),
  )
}

const LABEL_LINES = 2
/**
 * Average glyph width of the label's bold uppercase type, measured in the
 * browser at 0.724em, plus a little margin so rounding cannot trip the
 * ellipsis.
 */
const GLYPH_WIDTH = 0.75

/** The label box's own horizontal padding, in cqh at the smallest art size. */
const LABEL_PADDING = 3.6

/**
 * Wraps a product name onto the sticker the way a warehouse label would:
 * short all-caps lines, abbreviated rather than shrunk to nothing. The full
 * name always appears in the caption under the container.
 */
export function labelLines(name, containerType = 'gallon') {
  const { maxChars } = CONTAINER_ART[containerType] ?? CONTAINER_ART.gallon
  const words = String(name ?? '').toUpperCase().split(/\s+/).filter(Boolean)
  const lines = []

  for (const word of words) {
    const current = lines[lines.length - 1]
    if (current && `${current} ${word}`.length <= maxChars) {
      lines[lines.length - 1] = `${current} ${word}`
    } else if (lines.length < LABEL_LINES) {
      lines.push(word)
    } else {
      // Ran out of lines: mark the label as abbreviated and stop.
      const last = lines[LABEL_LINES - 1]
      lines[LABEL_LINES - 1] = `${last.replace(/[.\u2026]+$/, '')}\u2026`
      break
    }
  }

  return lines.map((line) =>
    line.length > maxChars + 2 ? `${line.slice(0, maxChars + 1)}\u2026` : line,
  )
}

/**
 * Sizes the sticker text to the label box. Sizes come back in `cqh` (percent
 * of the art's height), which is the same physical height for every container
 * type, so a slim can and a wide jug end up with comparable text instead of
 * one being sized off its own narrower width.
 */
export function labelTextSize(lines, productNumber, containerType = 'gallon') {
  const art = CONTAINER_ART[containerType] ?? CONTAINER_ART.gallon
  const { left, right, height } = art.label
  const widthAvailable = (100 - left - right) * art.aspect - LABEL_PADDING

  const fits = (chars, max) =>
    Math.min(max, chars > 0 ? widthAvailable / (chars * GLYPH_WIDTH) : max)

  const numberChars = productNumber ? String(productNumber).length + 1 : 0
  const numberSize = numberChars ? Math.max(4.5, fits(numberChars, 8.5)) : 0

  // The ellipsis glyph is wider than an average character; count it as more.
  const measure = (line) => line.length + (line.endsWith('\u2026') ? 0.6 : 0)
  const longest = lines.reduce((max, line) => Math.max(max, measure(line)), 0)
  const lineCount = Math.max(1, lines.length)
  // Whatever the number line leaves, split across the name lines.
  const heightBudget = (height - 4 - numberSize * 1.15) / (lineCount * 1.15)
  const nameSize = longest
    ? Math.max(4.4, Math.min(fits(longest, 9), heightBudget))
    : 0

  return { nameSize: Number(nameSize.toFixed(2)), numberSize: Number(numberSize.toFixed(2)) }
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
      chemicals: [...items].sort((a, b) =>
        String(a.productNumber || a.name).localeCompare(
          String(b.productNumber || b.name),
          undefined,
          { numeric: true },
        ),
      ),
    }))
}

/**
 * The rack is organized into one bay per container type — gallons, cans and a
 * floor area for barrels — each with its own shelf levels, as sketched.
 */
export function rackSections(chemicals, { includeEmpty = false } = {}) {
  return CONTAINER_TYPES.map((containerType) => {
    const items = chemicals.filter((chemical) => chemical.containerType === containerType)
    return {
      containerType,
      label: CONTAINER_LABELS[containerType].many,
      chemicals: items,
      shelves: groupByShelf(items),
      total: items.reduce((sum, chemical) => sum + chemical.quantity, 0),
    }
  }).filter((section) => includeEmpty || section.chemicals.length > 0)
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
    'Color',
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
    chemical.color,
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
