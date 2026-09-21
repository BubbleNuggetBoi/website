/**
 * localStorage persistence. Isolated from components so swapping in a real
 * backend later means replacing just this module.
 */
import { normalizeChemical } from './inventory.js'

export const STORAGE_KEY = 'servpro.chemical-inventory.v1'

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    // Safari private mode throws on write rather than on access.
    const probe = `${STORAGE_KEY}.probe`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

function normalizeHistoryEntry(entry) {
  return {
    id: String(entry?.id ?? ''),
    chemicalId: String(entry?.chemicalId ?? ''),
    chemicalName: String(entry?.chemicalName ?? ''),
    productNumber: String(entry?.productNumber ?? ''),
    previousQuantity: Number(entry?.previousQuantity ?? 0),
    newQuantity: Number(entry?.newQuantity ?? 0),
    timestamp: entry?.timestamp ?? new Date().toISOString(),
  }
}

/** Defensive parse: bad or partial data must never blank the warehouse rack. */
export function parseState(raw) {
  if (!raw) return null
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || !Array.isArray(parsed.chemicals)) return null

  const seen = new Set()
  const chemicals = parsed.chemicals
    .filter((chemical) => chemical && typeof chemical === 'object')
    .map((chemical) => normalizeChemical(chemical))
    .filter((chemical) => {
      if (seen.has(chemical.id)) return false
      seen.add(chemical.id)
      return true
    })

  const history = Array.isArray(parsed.history)
    ? parsed.history.filter(Boolean).map(normalizeHistoryEntry)
    : []

  return { chemicals, history }
}

export function loadState() {
  const storage = safeStorage()
  if (!storage) return null
  return parseState(storage.getItem(STORAGE_KEY))
}

export function saveState(state) {
  const storage = safeStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState() {
  const storage = safeStorage()
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/** Triggers a browser download; used by the Settings export actions. */
export function downloadFile(filename, contents, mimeType) {
  if (typeof document === 'undefined') return
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give Safari a beat to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
