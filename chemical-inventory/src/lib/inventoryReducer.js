/**
 * Pure state machine for the inventory. Every mutation flows through here so
 * history and timestamps stay consistent, and so the same logic can be moved
 * behind an API later without touching components.
 */
import {
  HISTORY_LIMIT,
  createHistoryEntry,
  normalizeChemical,
  toQuantity,
} from './inventory.js'
import { createDefaultChemicals } from '../data/defaultChemicals.js'

export function createInitialState(now = new Date().toISOString()) {
  // Normalized like any other input, so the seed can never be missing a field
  // the rest of the app expects (the catalog lists only what it cares about).
  return {
    chemicals: createDefaultChemicals(now).map((chemical) => normalizeChemical(chemical, now)),
    history: [],
  }
}

/** Newest first, capped so localStorage cannot grow without bound. */
function pushHistory(history, entries) {
  return [...entries, ...history].slice(0, HISTORY_LIMIT)
}

function replaceChemical(chemicals, id, updater) {
  return chemicals.map((chemical) => (chemical.id === id ? updater(chemical) : chemical))
}

export function inventoryReducer(state, action) {
  const now = action.now || new Date().toISOString()

  switch (action.type) {
    case 'hydrate':
      return action.state

    case 'add': {
      const chemical = normalizeChemical(action.chemical, now)
      const history =
        chemical.quantity > 0
          ? pushHistory(state.history, [createHistoryEntry(chemical, 0, chemical.quantity, now)])
          : state.history
      return { chemicals: [...state.chemicals, chemical], history }
    }

    case 'update': {
      const existing = state.chemicals.find((chemical) => chemical.id === action.id)
      if (!existing) return state

      const next = normalizeChemical(
        { ...existing, ...action.changes, id: existing.id, createdAt: existing.createdAt },
        now,
      )
      const quantityChanged = next.quantity !== existing.quantity
      const changed = quantityChanged || JSON.stringify(next) !== JSON.stringify(existing)
      if (!changed) return state

      next.updatedAt = now
      return {
        chemicals: replaceChemical(state.chemicals, action.id, () => next),
        history: quantityChanged
          ? pushHistory(state.history, [
              createHistoryEntry(next, existing.quantity, next.quantity, now),
            ])
          : state.history,
      }
    }

    case 'setQuantity': {
      const existing = state.chemicals.find((chemical) => chemical.id === action.id)
      if (!existing) return state

      const quantity = toQuantity(action.quantity, existing.quantity)
      if (quantity === existing.quantity) return state

      return {
        chemicals: replaceChemical(state.chemicals, action.id, (chemical) => ({
          ...chemical,
          quantity,
          updatedAt: now,
        })),
        history: pushHistory(state.history, [
          createHistoryEntry(existing, existing.quantity, quantity, now),
        ]),
      }
    }

    case 'adjustQuantity': {
      const existing = state.chemicals.find((chemical) => chemical.id === action.id)
      if (!existing) return state
      return inventoryReducer(state, {
        type: 'setQuantity',
        id: action.id,
        quantity: existing.quantity + action.delta,
        now,
      })
    }

    case 'delete': {
      if (!state.chemicals.some((chemical) => chemical.id === action.id)) return state
      return {
        chemicals: state.chemicals.filter((chemical) => chemical.id !== action.id),
        // History keeps the record of what happened to a product that is gone.
        history: state.history,
      }
    }

    case 'reset':
      return createInitialState(now)

    case 'clearHistory':
      return { ...state, history: [] }

    default:
      return state
  }
}
