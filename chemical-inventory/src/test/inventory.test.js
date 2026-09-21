import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  compareShelves,
  filterChemicals,
  groupByShelf,
  inventoryStats,
  isLowStock,
  labelColorFor,
  matchesSearch,
  normalizeChemical,
  shelfOptions,
  toCsv,
  toQuantity,
} from '../lib/inventory.js'
import { createDefaultChemicals } from '../data/defaultChemicals.js'

describe('default catalog', () => {
  const defaults = createDefaultChemicals()

  it('preloads all 25 seed products at zero quantity', () => {
    assert.equal(defaults.length, 25)
    assert.ok(defaults.every((chemical) => chemical.quantity === 0))
  })

  it('has 18 gallons and 7 cans', () => {
    assert.equal(defaults.filter((c) => c.containerType === 'gallon').length, 18)
    assert.equal(defaults.filter((c) => c.containerType === 'can').length, 7)
  })

  it('gives every product a unique id', () => {
    assert.equal(new Set(defaults.map((c) => c.id)).size, defaults.length)
  })

  it('leaves the Kilz products without product numbers', () => {
    const kilz = defaults.filter((c) => c.name.startsWith('Kilz'))
    assert.equal(kilz.length, 3)
    assert.ok(kilz.every((c) => c.productNumber === ''))
  })

  it('returns fresh objects each call', () => {
    const other = createDefaultChemicals()
    other[0].quantity = 99
    assert.equal(createDefaultChemicals()[0].quantity, 0)
  })
})

describe('toQuantity', () => {
  it('parses numeric strings', () => {
    assert.equal(toQuantity('12'), 12)
    assert.equal(toQuantity(' 7 '), 7)
  })

  it('never goes negative', () => {
    assert.equal(toQuantity('-5'), 0)
    assert.equal(toQuantity(-1), 0)
  })

  it('falls back on junk input', () => {
    assert.equal(toQuantity('abc', 4), 4)
    assert.equal(toQuantity('', 4), 4)
    assert.equal(toQuantity(undefined, 3), 3)
  })

  it('truncates decimals', () => {
    assert.equal(toQuantity('3.9'), 3)
  })
})

describe('normalizeChemical', () => {
  it('fills in defaults for loose input', () => {
    const chemical = normalizeChemical({ name: '  Kilz Red ' })
    assert.equal(chemical.name, 'Kilz Red')
    assert.equal(chemical.containerType, 'gallon')
    assert.equal(chemical.quantity, 0)
    assert.equal(chemical.lowStockThreshold, 2)
    assert.equal(chemical.shelf, '1')
    assert.ok(chemical.id)
  })

  it('rejects unknown container types', () => {
    assert.equal(normalizeChemical({ name: 'x', containerType: 'drum' }).containerType, 'gallon')
    assert.equal(normalizeChemical({ name: 'x', containerType: 'can' }).containerType, 'can')
  })
})

describe('low stock detection', () => {
  const make = (quantity, lowStockThreshold) =>
    normalizeChemical({ name: 'Test', quantity, lowStockThreshold })

  it('flags at or below the threshold', () => {
    assert.equal(isLowStock(make(2, 3)), true)
    assert.equal(isLowStock(make(3, 3)), true)
    assert.equal(isLowStock(make(4, 3)), false)
  })

  it('flags empty stock even with a zero threshold', () => {
    assert.equal(isLowStock(make(0, 0)), true)
    assert.equal(isLowStock(make(1, 0)), false)
  })
})

describe('search and filters', () => {
  const chemicals = [
    normalizeChemical({ id: 'a', name: 'SERVPRO Green', productNumber: '138', quantity: 12 }),
    normalizeChemical({
      id: 'b',
      name: 'Furniture Polish',
      productNumber: '207',
      containerType: 'can',
      quantity: 1,
      lowStockThreshold: 2,
    }),
    normalizeChemical({ id: 'c', name: 'Kilz Mold', containerType: 'can', quantity: 5 }),
  ]

  it('searches by name, case insensitively', () => {
    assert.deepEqual(
      filterChemicals(chemicals, { search: 'servpro' }).map((c) => c.id),
      ['a'],
    )
  })

  it('searches by product number, with or without the hash', () => {
    assert.deepEqual(filterChemicals(chemicals, { search: '207' }).map((c) => c.id), ['b'])
    assert.deepEqual(filterChemicals(chemicals, { search: '#138' }).map((c) => c.id), ['a'])
  })

  it('returns everything for a blank search', () => {
    assert.equal(filterChemicals(chemicals, { search: '   ' }).length, 3)
    assert.equal(matchesSearch(chemicals[0], undefined), true)
  })

  it('filters by container type', () => {
    assert.deepEqual(filterChemicals(chemicals, { filter: 'gallon' }).map((c) => c.id), ['a'])
    assert.deepEqual(filterChemicals(chemicals, { filter: 'can' }).map((c) => c.id), ['b', 'c'])
  })

  it('filters low stock', () => {
    assert.deepEqual(filterChemicals(chemicals, { filter: 'low' }).map((c) => c.id), ['b'])
  })

  it('combines search and filter', () => {
    assert.equal(filterChemicals(chemicals, { filter: 'can', search: 'green' }).length, 0)
    assert.equal(filterChemicals(chemicals, { filter: 'can', search: 'kilz' }).length, 1)
  })
})

describe('shelves', () => {
  it('sorts shelf levels numerically, not alphabetically', () => {
    const chemicals = [
      normalizeChemical({ name: 'a', shelf: '10' }),
      normalizeChemical({ name: 'b', shelf: '2' }),
      normalizeChemical({ name: 'c', shelf: '1' }),
    ]
    assert.deepEqual(groupByShelf(chemicals).map((level) => level.shelf), ['1', '2', '10'])
  })

  it('groups products onto shared shelves and keeps named shelves last', () => {
    const chemicals = [
      normalizeChemical({ name: 'a', shelf: 'Back Wall' }),
      normalizeChemical({ name: 'b', shelf: '1' }),
      normalizeChemical({ name: 'c', shelf: '1' }),
    ]
    const levels = groupByShelf(chemicals)
    assert.equal(levels.length, 2)
    assert.deepEqual(levels.map((l) => l.shelf), ['1', 'Back Wall'])
    assert.equal(levels[0].chemicals.length, 2)
  })

  it('sorts gallons before cans within a shelf', () => {
    const chemicals = [
      normalizeChemical({ name: 'can', containerType: 'can', shelf: '1', productNumber: '202' }),
      normalizeChemical({ name: 'jug', containerType: 'gallon', shelf: '1', productNumber: '999' }),
    ]
    assert.deepEqual(groupByShelf(chemicals)[0].chemicals.map((c) => c.name), ['jug', 'can'])
  })

  it('offers used shelves plus the next free one', () => {
    const options = shelfOptions([
      normalizeChemical({ name: 'a', shelf: '1' }),
      normalizeChemical({ name: 'b', shelf: '4' }),
    ])
    assert.deepEqual(options, ['1', '4', '5'])
  })

  it('handles an empty rack', () => {
    assert.deepEqual(shelfOptions([]), ['1'])
    assert.deepEqual(groupByShelf([]), [])
  })

  it('compares shelves consistently', () => {
    assert.ok(compareShelves('2', '10') < 0)
    assert.ok(compareShelves('10', 'Back') < 0)
  })
})

describe('stats, labels and export', () => {
  const chemicals = [
    normalizeChemical({ id: 'a', name: 'A', quantity: 10, lowStockThreshold: 2 }),
    normalizeChemical({ id: 'b', name: 'B', quantity: 0, lowStockThreshold: 2 }),
    normalizeChemical({ id: 'c', name: 'C', quantity: 2, lowStockThreshold: 3 }),
  ]

  it('totals products, containers and low stock', () => {
    assert.deepEqual(inventoryStats(chemicals), {
      products: 3,
      containers: 12,
      lowStock: 2,
      outOfStock: 1,
    })
  })

  it('gives a product a stable label color', () => {
    assert.deepEqual(labelColorFor(chemicals[0]), labelColorFor({ ...chemicals[0], quantity: 99 }))
  })

  it('exports CSV with a header and one row per product', () => {
    const lines = toCsv(chemicals).split('\r\n')
    assert.equal(lines.length, 4)
    assert.ok(lines[0].startsWith('Product Number,Name,Container Type'))
    assert.ok(lines[1].includes(',A,gallon,10,'))
  })

  it('quotes CSV values containing commas', () => {
    const csv = toCsv([normalizeChemical({ name: 'Glass Cleaner, Super-con' })])
    assert.ok(csv.includes('"Glass Cleaner, Super-con"'))
  })
})
