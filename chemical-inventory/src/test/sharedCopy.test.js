import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  STATE_ELEMENT_ID,
  SCRIPT_ELEMENT_ID,
  STYLE_ELEMENT_ID,
  parseEmbeddedState,
  renderDocument,
  serializeState,
} from '../lib/sharedCopy.js'
import { createInitialState, inventoryReducer } from '../lib/inventoryReducer.js'

const sample = () =>
  inventoryReducer(createInitialState(), { type: 'setQuantity', id: 'seed-1', quantity: 18 })

describe('serializing the shared inventory', () => {
  it('round trips the counts and history', () => {
    const state = sample()
    const restored = parseEmbeddedState(serializeState(state).replace(/\\u003c/g, '<'))
    assert.equal(restored.chemicals.length, 25)
    assert.equal(restored.chemicals.find((c) => c.id === 'seed-1').quantity, 18)
    assert.equal(restored.history.length, 1)
  })

  it('escapes < so a product name can never end the script block early', () => {
    const state = {
      chemicals: [{ id: 'x', name: '</script><img src=x>', quantity: 1 }],
      history: [],
    }
    const json = serializeState(state)
    assert.ok(!json.includes('<'), 'raw < must not survive serialization')
    assert.ok(json.includes('\\u003c'))
  })

  it('records when the counts were saved', () => {
    assert.ok(JSON.parse(serializeState(sample()).replace(/\\u003c/g, '<')).savedAt)
  })
})

describe('reading an embedded inventory', () => {
  it('ignores missing, blank, malformed and empty payloads', () => {
    for (const bad of [null, undefined, '', '   ', 'not json', '{}', '{"chemicals":[]}']) {
      assert.equal(parseEmbeddedState(bad), null)
    }
  })

  it('tolerates a payload with no history', () => {
    const parsed = parseEmbeddedState('{"chemicals":[{"id":"a","name":"A"}]}')
    assert.equal(parsed.chemicals.length, 1)
    assert.deepEqual(parsed.history, [])
  })
})

describe('rebuilding the page', () => {
  const built = () =>
    renderDocument({
      title: 'Warehouse Chemical Inventory',
      css: '.rack { color: red }',
      js: 'console.log(1)',
      scriptUrls: ['https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js'],
      state: sample(),
    })

  it('is a complete document', () => {
    const html = built()
    assert.ok(html.startsWith('<!doctype html>'))
    assert.ok(html.includes('<html lang="en">'))
    assert.ok(html.trimEnd().endsWith('</html>'))
  })

  it('carries the stylesheet, script and external sources forward', () => {
    const html = built()
    assert.ok(html.includes(`id="${STYLE_ELEMENT_ID}"`))
    assert.ok(html.includes('.rack { color: red }'))
    assert.ok(html.includes(`id="${SCRIPT_ELEMENT_ID}"`))
    assert.ok(html.includes('console.log(1)'))
    assert.ok(html.includes('react.production.min.js'))
  })

  it('embeds the inventory where the next load will find it', () => {
    const html = built()
    assert.ok(html.includes(`id="${STATE_ELEMENT_ID}" type="application/json"`))
    const json = html.split(`id="${STATE_ELEMENT_ID}" type="application/json">`)[1].split('</script>')[0]
    const restored = parseEmbeddedState(json.replace(/\\u003c/g, '<'))
    assert.equal(restored.chemicals.find((c) => c.id === 'seed-1').quantity, 18)
  })

  it('keeps the viewport meta so the rebuilt page still fits a phone', () => {
    assert.ok(built().includes('viewport-fit=cover'))
  })

  it('produces a document that can be rebuilt again from its own parts', () => {
    // second generation: what the page would emit after one save
    const first = built()
    const css = first.split(`<style id="${STYLE_ELEMENT_ID}">`)[1].split('</style>')[0]
    const js = first.split(`<script id="${SCRIPT_ELEMENT_ID}">`)[1].split('</script>')[0]
    const second = renderDocument({ title: 'T', css, js, scriptUrls: [], state: sample() })
    assert.ok(second.includes('.rack { color: red }'))
    assert.ok(second.includes('console.log(1)'))
  })
})
