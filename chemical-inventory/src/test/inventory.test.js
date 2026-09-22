import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AREA_IDS,
  CONTAINER_ART,
  CONTAINER_TYPES,
  bayTypesFor,
  compareShelves,
  filtersFor,
  inkOn,
  labelLines,
  labelTextSize,
  normalizeColor,
  rackSections,
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

  it('preloads every seed product at zero quantity', () => {
    assert.equal(defaults.length, 34)
    assert.ok(defaults.every((chemical) => chemical.quantity === 0))
  })

  it('has 18 gallons and 7 cans', () => {
    assert.equal(defaults.filter((c) => c.containerType === 'gallon').length, 18)
    assert.equal(defaults.filter((c) => c.containerType === 'can').length, 7)
  })

  it('seeds the contents color for the two products named after theirs', () => {
    assert.equal(defaults.find((c) => c.productNumber === '138').color, '#1f7a3f')
    assert.equal(defaults.find((c) => c.productNumber === '140').color, '#d4650f')
    assert.equal(defaults.find((c) => c.productNumber === '202').color, '')
  })

  it('gives every product a unique id', () => {
    assert.equal(new Set(defaults.map((c) => c.id)).size, defaults.length)
  })

  it('seeds a complete record for every product', () => {
    // A seed missing a field the app expects (an area, a threshold) renders a
    // blank rack on a first visit, so check against a normalized record.
    const expected = Object.keys(normalizeChemical({ name: 'x' })).sort()
    for (const chemical of defaults) {
      assert.deepEqual(Object.keys(chemical).sort(), expected, `incomplete: ${chemical.name}`)
    }
  })

  it('files every seed product in a real area', () => {
    for (const chemical of defaults) {
      assert.ok(AREA_IDS.includes(chemical.area), `${chemical.name} -> ${chemical.area}`)
    }
  })

  it('stocks both the chemical rack and the supply cabinet', () => {
    assert.equal(defaults.filter((c) => c.area === 'chemicals').length, 25)
    assert.ok(defaults.filter((c) => c.area === 'cabinet').length >= 8)
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
    assert.equal(normalizeChemical({ name: 'x', containerType: 'barrel' }).containerType, 'barrel')
  })

  it('supports every container type the rack can draw', () => {
    assert.deepEqual(CONTAINER_TYPES, [
      'gallon',
      'can',
      'barrel',
      'gloveBox',
      'longBox',
      'suit',
      'mop',
    ])
  })

  it('files a product in an area, defaulting to the chemical rack', () => {
    assert.equal(normalizeChemical({ name: 'x' }).area, 'chemicals')
    assert.equal(normalizeChemical({ name: 'x', area: 'cabinet' }).area, 'cabinet')
    assert.equal(normalizeChemical({ name: 'x', area: 'garage' }).area, 'chemicals')
  })

  it('keeps a valid contents color and drops junk', () => {
    assert.equal(normalizeChemical({ name: 'x', color: '#D6417E' }).color, '#d6417e')
    assert.equal(normalizeChemical({ name: 'x', color: 'pink' }).color, '')
    assert.equal(normalizeChemical({ name: 'x' }).color, '')
  })
})

describe('contents colors', () => {
  it('normalizes shorthand and bare hex', () => {
    assert.equal(normalizeColor('#f0a'), '#ff00aa')
    assert.equal(normalizeColor('1f7a3f'), '#1f7a3f')
    assert.equal(normalizeColor('  #1F7A3F '), '#1f7a3f')
  })

  it('rejects anything that is not a hex color', () => {
    for (const bad of ['', null, undefined, 'rgb(1,2,3)', '#12345', 'zzzzzz']) {
      assert.equal(normalizeColor(bad), '')
    }
  })

  it('picks readable label ink for light and dark colors', () => {
    assert.equal(inkOn('#e8edf1'), '#14181c')
    assert.equal(inkOn('#2b3238'), '#ffffff')
    assert.equal(inkOn('#d6417e'), '#ffffff')
  })

  it('uses the product color for its label, and a stable palette color without one', () => {
    const colored = normalizeChemical({ id: 'a', name: 'Shampoo', color: '#d6417e' })
    assert.equal(labelColorFor(colored).bg, '#d6417e')

    const plain = normalizeChemical({ id: 'a', name: 'Shampoo' })
    assert.deepEqual(labelColorFor(plain), labelColorFor({ ...plain, quantity: 9 }))
  })
})

describe('container labels', () => {
  it('wraps a name onto short all-caps lines', () => {
    assert.deepEqual(labelLines('SERVPRO Green', 'gallon'), ['SERVPRO', 'GREEN'])
    assert.deepEqual(labelLines('Coil Cleaner', 'can'), ['COIL', 'CLEANER'])
  })

  it('abbreviates rather than overflowing', () => {
    const lines = labelLines('EXTREME Liquid Laundry Detergent', 'gallon')
    assert.equal(lines.length, 2)
    assert.ok(lines[1].endsWith('\u2026'))
  })

  it('handles an empty name', () => {
    assert.deepEqual(labelLines('', 'gallon'), [])
    assert.equal(labelTextSize([], '', 'gallon').nameSize, 0)
  })

  it('sizes text to fit the label box on every container type', () => {
    for (const type of CONTAINER_TYPES) {
      const lines = labelLines('Stainless Steel Cleaner', type)
      const { nameSize, numberSize } = labelTextSize(lines, '490', type)
      const { label } = CONTAINER_ART[type]
      // Both lines plus the number have to fit inside the label box.
      const stack = numberSize * 1.15 + nameSize * 1.15 * lines.length
      assert.ok(nameSize >= 4.4, `${type} name too small: ${nameSize}`)
      assert.ok(numberSize > 0, `${type} has no number line`)
      assert.ok(stack <= label.height, `${type} overflows its label: ${stack} > ${label.height}`)
    }
  })

  it('never lets a line overrun the label width', () => {
    for (const type of CONTAINER_TYPES) {
      const { label, aspect } = CONTAINER_ART[type]
      const available = (100 - label.left - label.right) * aspect
      const lines = labelLines('Bright-N-Neutral Cleaner', type)
      const { nameSize } = labelTextSize(lines, '408', type)
      const longest = Math.max(...lines.map((line) => line.length))
      // 0.724em per character, measured in the browser
      assert.ok(longest * 0.724 * nameSize < available, `${type} line too wide`)
    }
  })

  it('leaves out the number line when a product has no number', () => {
    assert.equal(labelTextSize(labelLines('Kilz Red', 'can'), '', 'can').numberSize, 0)
  })
})

describe('rack bays', () => {
  const chemicals = [
    normalizeChemical({ id: 'a', name: 'Jug', containerType: 'gallon', shelf: '2', quantity: 3 }),
    normalizeChemical({ id: 'b', name: 'Can', containerType: 'can', shelf: '1', quantity: 4 }),
    normalizeChemical({ id: 'c', name: 'Jug 2', containerType: 'gallon', shelf: '1', quantity: 1 }),
  ]

  it('groups products into one bay per container type, in a fixed order', () => {
    const sections = rackSections(chemicals)
    assert.deepEqual(sections.map((s) => s.containerType), ['gallon', 'can'])
    assert.equal(sections[0].chemicals.length, 2)
    assert.equal(sections[0].total, 4)
  })

  it('gives each bay its own shelf levels', () => {
    const [gallons] = rackSections(chemicals)
    assert.deepEqual(gallons.shelves.map((level) => level.shelf), ['1', '2'])
  })

  it('hides empty bays unless asked to keep them', () => {
    const types = ['gallon', 'can', 'barrel']
    assert.equal(rackSections(chemicals, { types }).length, 2)
    assert.equal(rackSections(chemicals, { types, includeEmpty: true }).length, 3)
    assert.equal(rackSections([], { types }).length, 0)
  })

  it('always draws a bay for every type present, so nothing falls off the rack', () => {
    const mixed = [
      normalizeChemical({ name: 'Jug', containerType: 'gallon' }),
      normalizeChemical({ name: 'Gloves', containerType: 'gloveBox' }),
      normalizeChemical({ name: 'Mop', containerType: 'mop' }),
    ]
    const types = bayTypesFor(mixed)
    assert.deepEqual(types, ['gallon', 'gloveBox', 'mop'])

    const drawn = rackSections(mixed, { types }).flatMap((section) => section.chemicals)
    assert.equal(drawn.length, mixed.length, 'every product must land in a bay')
  })

  it('keeps the standing chemical bays while browsing', () => {
    const types = bayTypesFor([normalizeChemical({ name: 'Mop', containerType: 'mop' })], {
      includeEmpty: true,
    })
    assert.deepEqual(types, ['gallon', 'can', 'barrel', 'mop'])
  })

  it('draws bays only for the types it is given', () => {
    const sections = rackSections(chemicals, { types: ['can'] })
    assert.deepEqual(sections.map((s) => s.containerType), ['can'])
  })

  it('shows barrels as their own bay', () => {
    const withBarrel = [
      ...chemicals,
      normalizeChemical({ id: 'd', name: 'Drum', containerType: 'barrel', quantity: 2 }),
    ]
    const barrels = rackSections(withBarrel).find((s) => s.containerType === 'barrel')
    assert.equal(barrels.chemicals.length, 1)
    assert.equal(barrels.total, 2)
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

  it('filters by container type, for every type there is', () => {
    // one of each type, so a newly added type is covered automatically
    const stock = CONTAINER_TYPES.map((containerType, index) =>
      normalizeChemical({ id: `t${index}`, name: containerType, containerType, quantity: 4 }),
    )
    for (const type of CONTAINER_TYPES) {
      const matched = filterChemicals(stock, { filter: type })
      assert.equal(matched.length, 1, `${type} matched ${matched.length}`)
      assert.equal(matched[0].containerType, type)
    }
  })

  it('every filter chip offered for an area maps to a working filter', () => {
    const stock = [
      ...chemicals.map((c) => normalizeChemical({ ...c, area: 'chemicals' })),
      normalizeChemical({ id: 'd', name: 'Drum', containerType: 'barrel', area: 'chemicals' }),
      // two types in the cabinet, one well stocked and one not, so both a type
      // chip and the low-stock chip are observably narrowing
      normalizeChemical({
        id: 'e',
        name: 'Gloves',
        containerType: 'gloveBox',
        area: 'cabinet',
        quantity: 9,
      }),
      normalizeChemical({ id: 'f', name: 'Suit', containerType: 'suit', area: 'cabinet' }),
    ]
    for (const areaId of AREA_IDS) {
      const scoped = stock.filter((c) => c.area === areaId)
      for (const { id } of filtersFor(stock, areaId)) {
        const matched = filterChemicals(scoped, { filter: id })
        // 'all' is the only chip allowed to return everything in the area
        assert.ok(
          id === 'all' ? matched.length === scoped.length : matched.length < scoped.length,
          `${areaId}/${id} matched ${matched.length} of ${scoped.length}`,
        )
        assert.ok(matched.length > 0, `${areaId}/${id} matched nothing`)
      }
    }
  })

  it('only offers filter chips for types the area actually stocks', () => {
    const stock = [
      normalizeChemical({ name: 'Jug', containerType: 'gallon', area: 'chemicals' }),
      normalizeChemical({ name: 'Gloves', containerType: 'gloveBox', area: 'cabinet' }),
    ]
    assert.deepEqual(filtersFor(stock, 'chemicals').map((f) => f.id), ['all', 'gallon', 'low'])
    assert.deepEqual(filtersFor(stock, 'cabinet').map((f) => f.id), ['all', 'gloveBox', 'low'])
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

  it('orders a shelf by product number', () => {
    const chemicals = [
      normalizeChemical({ name: 'later', shelf: '1', productNumber: '408' }),
      normalizeChemical({ name: 'earlier', shelf: '1', productNumber: '138' }),
    ]
    assert.deepEqual(groupByShelf(chemicals)[0].chemicals.map((c) => c.name), [
      'earlier',
      'later',
    ])
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
    assert.ok(lines[0].includes('Color'))
    assert.ok(lines[1].includes(',A,gallon,10,'))
  })

  it('exports the contents color', () => {
    const csv = toCsv([normalizeChemical({ name: 'Pink One', color: '#d6417e' })])
    assert.ok(csv.includes('#d6417e'))
  })

  it('quotes CSV values containing commas', () => {
    const csv = toCsv([normalizeChemical({ name: 'Glass Cleaner, Super-con' })])
    assert.ok(csv.includes('"Glass Cleaner, Super-con"'))
  })
})
