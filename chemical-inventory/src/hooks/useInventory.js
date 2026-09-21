import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { createInitialState, inventoryReducer } from '../lib/inventoryReducer.js'
import { loadState, saveState } from '../lib/storage.js'

/**
 * Wires the pure reducer to localStorage. Components only ever see the actions
 * below, never the storage layer.
 */
export function useInventory() {
  const [state, dispatch] = useReducer(inventoryReducer, undefined, () => {
    const stored = loadState()
    // First run on a device seeds the catalog; later runs restore what was saved.
    if (stored && stored.chemicals.length) return stored
    return createInitialState()
  })

  useEffect(() => {
    // The seed catalog is written on first load too, so a refresh keeps ids.
    saveState(state)
  }, [state])

  const actions = useMemo(
    () => ({
      addChemical: (chemical) => dispatch({ type: 'add', chemical }),
      updateChemical: (id, changes) => dispatch({ type: 'update', id, changes }),
      deleteChemical: (id) => dispatch({ type: 'delete', id }),
      setQuantity: (id, quantity) => dispatch({ type: 'setQuantity', id, quantity }),
      adjustQuantity: (id, delta) => dispatch({ type: 'adjustQuantity', id, delta }),
      resetToDefaults: () => dispatch({ type: 'reset' }),
      clearHistory: () => dispatch({ type: 'clearHistory' }),
    }),
    [dispatch],
  )

  const findChemical = useCallback(
    (id) => state.chemicals.find((chemical) => chemical.id === id) || null,
    [state.chemicals],
  )

  return { chemicals: state.chemicals, history: state.history, findChemical, ...actions }
}
