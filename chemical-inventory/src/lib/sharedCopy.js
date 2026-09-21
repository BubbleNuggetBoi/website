/**
 * Publishing the inventory to a shared copy of the page.
 *
 * When the app is served from a host that lets the page save new versions of
 * itself, the inventory is embedded in the page it publishes. Anyone opening
 * the link then sees the counts as they were last saved — no account and no
 * database needed — while only someone who can edit the page can save new
 * ones. Everywhere else (local dev, your own web host) this all no-ops and the
 * app keeps using localStorage.
 *
 * The string builders below are pure so they can be unit tested.
 */

export const STATE_ELEMENT_ID = 'inventory-state'
export const STYLE_ELEMENT_ID = 'app-css'
export const SCRIPT_ELEMENT_ID = 'app-js'

/** JSON safe to sit inside a <script> block. */
export function serializeState(state) {
  return JSON.stringify({
    savedAt: new Date().toISOString(),
    chemicals: state.chemicals,
    history: state.history,
  })
    // `<` can never appear raw: it would end the block early.
    .replace(/</g, '\\u003c')
}

export function parseEmbeddedState(text) {
  if (!text || !text.trim()) return null
  try {
    const parsed = JSON.parse(text)
    if (!parsed || !Array.isArray(parsed.chemicals) || parsed.chemicals.length === 0) return null
    return { chemicals: parsed.chemicals, history: Array.isArray(parsed.history) ? parsed.history : [] }
  } catch {
    return null
  }
}

/**
 * Rebuilds the whole page from its own stylesheet, script and the current
 * inventory. Only the embedded data changes from version to version — the
 * markup below is the template, not a dump of the live DOM.
 */
export function renderDocument({ title, css, js, scriptUrls = [], state }) {
  const sources = scriptUrls.map((url) => `    <script src="${url}"></script>`).join('\n')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover"
    />
    <meta name="theme-color" content="#101418" />
    <title>${title}</title>
    <style id="${STYLE_ELEMENT_ID}">
${css}
    </style>
  </head>
  <body>
    <script id="${STATE_ELEMENT_ID}" type="application/json">
${serializeState(state)}
    </script>
    <div id="root"></div>
${sources}
    <script id="${SCRIPT_ELEMENT_ID}">
${js}
    </script>
  </body>
</html>
`
}

/**
 * True when this page is the shared copy (it carries the state block, which
 * only the published page has). Such a page is read-only until the host
 * confirms this visitor may save — a signed-out visitor gets no capability at
 * all, and must not be shown controls that would only write to their own
 * browser.
 */
export function isSharedCopy() {
  return typeof document !== 'undefined' && document.getElementById(STATE_ELEMENT_ID) !== null
}

/** Reads the inventory the current page was published with, if any. */
export function embeddedState() {
  if (typeof document === 'undefined') return null
  return parseEmbeddedState(document.getElementById(STATE_ELEMENT_ID)?.textContent)
}

async function capability(name) {
  const use = typeof window !== 'undefined' ? window.claude?.use : undefined
  if (typeof use !== 'function') return null
  try {
    return await use(name)
  } catch {
    return null
  }
}

/**
 * What this visit can do with the shared copy:
 *   'standalone' — no host publishing; localStorage is the store (dev, own host)
 *   'writer'     — can save new versions everyone else will see
 *   'reader'     — sees the published counts but cannot change them
 */
export async function resolveRole() {
  const shared = isSharedCopy()
  const artifact = await capability('artifact')
  if (!artifact) return { role: shared ? 'reader' : 'standalone', artifact: null }

  const user = await capability('user')
  // canEdit() needs no setup and tells us before the first save attempt.
  const canEdit = user ? Boolean(user.canEdit?.() || user.isOwner?.()) : false
  return { role: canEdit ? 'writer' : 'reader', artifact }
}

/**
 * Publishes the inventory as a new version of this page. Resolves true when
 * saved; false when this visit may not save or the host refused.
 */
export async function publishInventory(artifact, state) {
  if (!artifact || typeof document === 'undefined') return false

  const style = document.getElementById(STYLE_ELEMENT_ID)
  const script = document.getElementById(SCRIPT_ELEMENT_ID)
  if (!style || !script) return false

  const html = renderDocument({
    title: document.title || 'Warehouse Chemical Inventory',
    css: style.textContent,
    js: script.textContent,
    scriptUrls: [...document.querySelectorAll('script[src]')].map((tag) => tag.src),
    state,
  })

  try {
    await artifact.publish(html)
    return true
  } catch {
    // A rejected save means a read-only viewer or a lost race; either way the
    // page keeps working and the caller reports it.
    return false
  }
}
