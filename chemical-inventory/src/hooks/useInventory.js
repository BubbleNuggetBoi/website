import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createInitialState, inventoryReducer } from '../lib/inventoryReducer.js'
import { loadState, saveState } from '../lib/storage.js'
import { embeddedState, isSharedCopy, publishInventory, resolveRole } from '../lib/sharedCopy.js'
import { normalizeChemical } from '../lib/inventory.js'

/** Changes are batched into one save so counting a shelf is not one save a tap. */
const SAVE_DELAY = 2500

function initialState() {
  // The counts published with the page win: that is the shared source of truth
  // for everyone who opens the link. Then this device's own saved copy, then
  // the seed catalog on a first visit.
  const shared = embeddedState()
  if (shared) {
    return {
      chemicals: shared.chemicals.map((chemical) => normalizeChemical(chemical)),
      history: shared.history,
    }
  }
  const stored = loadState()
  if (stored && stored.chemicals.length) return stored
  return createInitialState()
}

/**
 * Wires the pure reducer to storage. Components only ever see the actions and
 * the sync status below, never the storage or host details.
 */
export function useInventory() {
  const [state, dispatch] = useReducer(inventoryReducer, undefined, initialState)

  // The shared copy starts read-only and is upgraded once the host confirms
  // this visitor can save; a standalone deployment is editable right away.
  const [role, setRole] = useState(() => (isSharedCopy() ? 'reader' : 'standalone'))
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const artifactRef = useRef(null)
  const pendingRef = useRef(null)
  const timerRef = useRef(null)
  const dirtyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    resolveRole().then(({ role: resolved, artifact }) => {
      if (cancelled) return
      artifactRef.current = artifact
      setRole(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // This device's copy is always kept current, so the app still works offline
  // and on a host with no publishing.
  useEffect(() => {
    saveState(state)
  }, [state])

  // Writers push the inventory into the page everyone else opens.
  useEffect(() => {
    if (role !== 'writer') return undefined
    if (!dirtyRef.current) return undefined

    pendingRef.current = state
    setStatus('saving')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const saved = await publishInventory(artifactRef.current, pendingRef.current)
      setStatus(saved ? 'saved' : 'error')
    }, SAVE_DELAY)

    return () => clearTimeout(timerRef.current)
  }, [state, role])

  const act = useCallback((action) => {
    dirtyRef.current = true
    dispatch(action)
  }, [])

  const actions = useMemo(
    () => ({
      addChemical: (chemical) => act({ type: 'add', chemical }),
      updateChemical: (id, changes) => act({ type: 'update', id, changes }),
      deleteChemical: (id) => act({ type: 'delete', id }),
      setQuantity: (id, quantity) => act({ type: 'setQuantity', id, quantity }),
      adjustQuantity: (id, delta) => act({ type: 'adjustQuantity', id, delta }),
      resetToDefaults: () => act({ type: 'reset' }),
      clearHistory: () => act({ type: 'clearHistory' }),
    }),
    [act],
  )

  const findChemical = useCallback(
    (id) => state.chemicals.find((chemical) => chemical.id === id) || null,
    [state.chemicals],
  )

  return {
    chemicals: state.chemicals,
    history: state.history,
    findChemical,
    // Readers get the shared counts but no controls to change them.
    canEdit: role !== 'reader',
    isShared: role !== 'standalone',
    status,
    ...actions,
  }
}
