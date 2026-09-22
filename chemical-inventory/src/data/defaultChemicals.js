/**
 * Seed catalog for the warehouse: the chemical rack, plus a starting list for
 * the supply cabinet. Quantities intentionally start at 0 so the warehouse
 * team can enter real counts from the floor.
 *
 * This list is only a starting point: products are stored in localStorage after
 * first load, and any number of new chemicals can be added at runtime.
 */

/** [productNumber, name, contentsColor?] — colors are editable in the app. */
const GALLONS = [
  ['138', 'SERVPRO Green', '#1f7a3f'],
  ['140', 'SERVPRO Orange', '#d4650f'],
  ['155', 'Wintergreen Deodorizer'],
  ['204', 'Glass Cleaner, Super-con'],
  ['252', 'Shampoo Super-con'],
  ['260', 'EXTREME Liquid Laundry Detergent'],
  ['272', 'Pre Spray and Traffic Lane Cleaner'],
  ['335', 'Cherry Fog'],
  ['338', 'Neutral Fog Deodorizer'],
  ['350', 'Heavy Duty Degreaser'],
  ['352', 'Wall and All +'],
  ['357', 'Industrial Cleaner'],
  ['359', 'R.B.T Drywall Dust Remover'],
  ['362', 'Tile and Grout Cleaner'],
  ['388', 'Lemon-Berry Deodorizer'],
  ['408', 'Bright-N-Neutral Cleaner'],
  ['431', 'BotaniPRO Hard Surface Cleaner'],
  ['433', 'BotaniPRO Floor Cleaner'],
]

/**
 * A starting point for the supply cabinet, read off the labels in the cabinet
 * itself. Every one is renameable and deletable — correct these to match what
 * is really on each shelf.
 * [name, containerType, shelf, color?]
 */
const CABINET = [
  ['Ear Plugs', 'longBox', 'Masks & Plugs'],
  ['N95 Masks', 'longBox', 'Masks & Plugs'],
  ['Gloves - Medium', 'gloveBox', 'Gloves', '#2f6f9f'],
  ['Gloves - Large', 'gloveBox', 'Gloves', '#2f6f9f'],
  ['Gloves - XL', 'gloveBox', 'Gloves', '#2f6f9f'],
  ['Tyvek Suit - Medium', 'suit', 'Tyvek'],
  ['Tyvek Suit - Large', 'suit', 'Tyvek'],
  ['Tyvek Suit - XL', 'suit', 'Tyvek'],
  ['Floor Mop Head', 'mop', 'Floor Care'],
]

const CANS = [
  ['202', 'Glass Cleaner'],
  ['207', 'Furniture Polish'],
  ['442', 'Coil Cleaner'],
  ['490', 'Stainless Steel Cleaner/Polish'],
  ['', 'Kilz Red'],
  ['', 'Kilz Low Odor'],
  ['', 'Kilz Mold'],
]

/** Gallons fill shelves 1-3 of their bay; cans start on shelf 1 of theirs. */
const GALLONS_PER_SHELF = 6

/**
 * Builds a fresh copy of the seed catalog. Always returns new objects so
 * callers can never mutate the module-level template.
 */
export function createDefaultChemicals(now = new Date().toISOString()) {
  const gallons = GALLONS.map(([productNumber, name, color], index) => ({
    productNumber,
    name,
    color: color ?? '',
    containerType: 'gallon',
    shelf: String(Math.floor(index / GALLONS_PER_SHELF) + 1),
  }))

  const cans = CANS.map(([productNumber, name, color]) => ({
    productNumber,
    name,
    color: color ?? '',
    containerType: 'can',
    shelf: '1',
  }))

  const cabinet = CABINET.map(([name, containerType, shelf, color]) => ({
    productNumber: '',
    name,
    color: color ?? '',
    containerType,
    shelf,
    area: 'cabinet',
  }))

  return [...gallons, ...cans, ...cabinet].map((product, index) => ({
    id: `seed-${index + 1}`,
    productNumber: product.productNumber,
    name: product.name,
    containerType: product.containerType,
    quantity: 0,
    lowStockThreshold: 2,
    shelf: product.shelf,
    area: product.area ?? 'chemicals',
    color: product.color,
    createdAt: now,
    updatedAt: now,
  }))
}
