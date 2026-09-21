import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createInitialState, inventoryReducer } from '../lib/inventoryReducer.js'
import { historyForChemical, normalizeChemical } from '../lib/inventory.js'
import { STORAGE_KEY, parseState } from '../lib/storage.js'

const reduce = (state, ...actions) => actions.reduce(inventoryReducer, state)

describe('initial state', () => {
  it('seeds the catalog with no history', () => {
    const state = createInitialState()
    assert.equal(state.chemicals.length, 25)
    assert.deepEqual(state.history, [])
  })
})

describe('add', () => {
  it('appends a normalized product', () => {
    const state = reduce({ chemicals: [], history: [] }, {
      type: 'add',
      chemical: { name: 'New Solvent', productNumber: '900', quantity: '4', shelf: '2' },
    })
    assert.equal(state.chemicals.length, 1)
    assert.equal(state.chemicals[0].name, 'New Solvent')
    assert.equal(state.chemicals[0].quantity, 4)
    assert.equal(state.chemicals[0].shelf, '2')
  })

  it('records history only when it starts with stock', () => {
    const withStock = reduce({ chemicals: [], history: [] }, {
      type: 'add',
      chemical: { name: 'A', quantity: 3 },
    })
    assert.equal(withStock.history.length, 1)
    assert.deepEqual(
      [withStock.history[0].previousQuantity, withStock.history[0].newQuantity],
      [0, 3],
    )

    const empty = reduce({ chemicals: [], history: [] }, {
      type: 'add',
      chemical: { name: 'B', quantity: 0 },
    })
    assert.equal(empty.history.length, 0)
  })

  it('supports unlimited new products on new shelves', () => {
    let state = { chemicals: [], history: [] }
    for (let i = 0; i < 40; i += 1) {
      state = inventoryReducer(state, {
        type: 'add',
        chemical: { name: `Product ${i}`, shelf: String((i % 9) + 1) },
      })
    }
    assert.equal(state.chemicals.length, 40)
    assert.equal(new Set(state.chemicals.map((c) => c.id)).size, 40)
  })
})

describe('quantity changes', () => {
  const base = () => ({
    chemicals: [normalizeChemical({ id: 'x', name: 'SERVPRO Green', quantity: 12 })],
    history: [],
  })

  it('adjusts up and down, newest history first', () => {
    const state = reduce(
      base(),
      { type: 'adjustQuantity', id: 'x', delta: -1 },
      { type: 'adjustQuantity', id: 'x', delta: 1 },
      { type: 'adjustQuantity', id: 'x', delta: 1 },
    )
    assert.equal(state.chemicals[0].quantity, 13)
    assert.equal(state.history.length, 3)
    assert.deepEqual(
      state.history.map((entry) => [entry.previousQuantity, entry.newQuantity]),
      [
        [12, 13],
        [11, 12],
        [12, 11],
      ],
    )
  })

  it('never drops below zero', () => {
    const state = reduce({ chemicals: [normalizeChemical({ id: 'x', name: 'A', quantity: 0 })], history: [] }, {
      type: 'adjustQuantity',
      id: 'x',
      delta: -1,
    })
    assert.equal(state.chemicals[0].quantity, 0)
    assert.equal(state.history.length, 0, 'a no-op must not write history')
  })

  it('sets an exact quantity', () => {
    const state = reduce(base(), { type: 'setQuantity', id: 'x', quantity: '25' })
    assert.equal(state.chemicals[0].quantity, 25)
    assert.deepEqual(
      [state.history[0].previousQuantity, state.history[0].newQuantity],
      [12, 25],
    )
  })

  it('ignores a set to the same value', () => {
    const start = base()
    const state = inventoryReducer(start, { type: 'setQuantity', id: 'x', quantity: 12 })
    assert.equal(state, start)
  })

  it('ignores unknown ids', () => {
    const start = base()
    assert.equal(inventoryReducer(start, { type: 'setQuantity', id: 'nope', quantity: 1 }), start)
    assert.equal(inventoryReducer(start, { type: 'adjustQuantity', id: 'nope', delta: 1 }), start)
  })

  it('stamps updatedAt on the changed product', () => {
    const state = reduce(base(), {
      type: 'setQuantity',
      id: 'x',
      quantity: 1,
      now: '2026-09-21T15:30:00.000Z',
    })
    assert.equal(state.chemicals[0].updatedAt, '2026-09-21T15:30:00.000Z')
  })

  it('caps stored history', () => {
    let state = base()
    for (let i = 0; i < 520; i += 1) {
      state = inventoryReducer(state, { type: 'setQuantity', id: 'x', quantity: i + 1 })
    }
    assert.equal(state.history.length, 500)
  })
})

describe('update', () => {
  const base = () => ({
    chemicals: [
      normalizeChemical({
        id: 'x',
        name: 'Old Name',
        productNumber: '111',
        quantity: 5,
        shelf: '1',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ],
    history: [],
  })

  it('edits every field but keeps id and createdAt', () => {
    const state = reduce(base(), {
      type: 'update',
      id: 'x',
      changes: {
        name: 'New Name',
        productNumber: '222',
        containerType: 'can',
        quantity: 9,
        lowStockThreshold: 4,
        shelf: '3',
      },
    })
    const chemical = state.chemicals[0]
    assert.equal(chemical.id, 'x')
    assert.equal(chemical.createdAt, '2026-01-01T00:00:00.000Z')
    assert.equal(chemical.name, 'New Name')
    assert.equal(chemical.productNumber, '222')
    assert.equal(chemical.containerType, 'can')
    assert.equal(chemical.quantity, 9)
    assert.equal(chemical.lowStockThreshold, 4)
    assert.equal(chemical.shelf, '3')
  })

  it('writes history only for the quantity change', () => {
    const quantityEdit = reduce(base(), { type: 'update', id: 'x', changes: { quantity: 8 } })
    assert.equal(quantityEdit.history.length, 1)

    const nameEdit = reduce(base(), { type: 'update', id: 'x', changes: { name: 'Renamed' } })
    assert.equal(nameEdit.history.length, 0)
  })

  it('ignores a no-op edit', () => {
    const start = base()
    assert.equal(
      inventoryReducer(start, { type: 'update', id: 'x', changes: { name: 'Old Name' } }),
      start,
    )
  })
})

describe('delete and reset', () => {
  it('removes only the targeted product but keeps its history record', () => {
    const state = reduce(
      {
        chemicals: [
          normalizeChemical({ id: 'x', name: 'A', quantity: 1 }),
          normalizeChemical({ id: 'y', name: 'B', quantity: 1 }),
        ],
        history: [],
      },
      { type: 'setQuantity', id: 'x', quantity: 4 },
      { type: 'delete', id: 'x' },
    )
    assert.deepEqual(state.chemicals.map((c) => c.id), ['y'])
    assert.equal(historyForChemical(state.history, 'x').length, 1)
  })

  it('ignores deleting an unknown id', () => {
    const start = { chemicals: [], history: [] }
    assert.equal(inventoryReducer(start, { type: 'delete', id: 'nope' }), start)
  })

  it('reset restores the seed catalog and clears history', () => {
    const state = reduce(
      createInitialState(),
      { type: 'add', chemical: { name: 'Custom', quantity: 5 } },
      { type: 'reset' },
    )
    assert.equal(state.chemicals.length, 25)
    assert.equal(state.history.length, 0)
    assert.ok(state.chemicals.every((c) => c.quantity === 0))
  })

  it('clearHistory keeps the products', () => {
    const state = reduce(
      { chemicals: [normalizeChemical({ id: 'x', name: 'A', quantity: 2 })], history: [] },
      { type: 'setQuantity', id: 'x', quantity: 6 },
      { type: 'clearHistory' },
    )
    assert.equal(state.history.length, 0)
    assert.equal(state.chemicals[0].quantity, 6)
  })

  it('ignores unknown actions', () => {
    const start = createInitialState()
    assert.equal(inventoryReducer(start, { type: 'nonsense' }), start)
  })
})

describe('persistence round trip', () => {
  it('restores saved state exactly', () => {
    const saved = reduce(
      createInitialState(),
      { type: 'setQuantity', id: 'seed-1', quantity: 18 },
      { type: 'add', chemical: { name: 'Shop Solvent', shelf: '5', quantity: 2 } },
    )
    const restored = parseState(JSON.stringify(saved))
    assert.equal(restored.chemicals.length, 26)
    assert.equal(restored.chemicals.find((c) => c.id === 'seed-1').quantity, 18)
    assert.equal(restored.history.length, 2)
    assert.ok(STORAGE_KEY.length > 0)
  })

  it('survives corrupt or partial payloads', () => {
    assert.equal(parseState('not json'), null)
    assert.equal(parseState(null), null)
    assert.equal(parseState('{"nope":1}'), null)

    const patched = parseState('{"chemicals":[{"name":"Half Record"}]}')
    assert.equal(patched.chemicals.length, 1)
    assert.equal(patched.chemicals[0].quantity, 0)
    assert.equal(patched.chemicals[0].containerType, 'gallon')
    assert.deepEqual(patched.history, [])
  })

  it('drops duplicate ids', () => {
    const raw = JSON.stringify({
      chemicals: [
        { id: 'dupe', name: 'First' },
        { id: 'dupe', name: 'Second' },
      ],
    })
    assert.equal(parseState(raw).chemicals.length, 1)
  })
})
