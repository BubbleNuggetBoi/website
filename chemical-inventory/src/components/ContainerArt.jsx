/**
 * SVG silhouettes for the three container types we stock: a gallon jug with a
 * moulded handle slot, a slim cylindrical can, and a drum for barrels.
 *
 * Each type is drawn in its own viewBox sized to the container itself (see
 * CONTAINER_ART in lib/inventory.js), so the shapes keep their real
 * proportions: every container stands the same height on the shelf and only
 * the widths differ. Product labels are overlaid in HTML by ChemicalContainer.
 */

const SHEEN_ID = 'container-sheen'
const SHADE_ID = 'container-shade'
const GLOSS_ID = 'container-gloss'

/** Neutral shading gradients, mounted once near the app root. */
export function ContainerArtDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id={SHEEN_ID} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="14%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="78%" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={SHADE_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.26" />
        </linearGradient>
        <linearGradient id={GLOSS_ID} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.28" />
          <stop offset="18%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="34%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const PLASTIC = '#e7ecf0'
const STEEL = '#b9c2cb'
const DRUM = '#4a5c68'
const OUTLINE = '#1a1f24'

/**
 * Body outline plus the handle slot as a second subpath: with evenodd the slot
 * is a real hole, so the shelf shows through it.
 */
const JUG_BODY =
  'M25.5 13.5 L4.2 41.5 Q1.5 44.8 1.5 49 L1.5 119 Q1.5 130.5 13 130.5 ' +
  'L63 130.5 Q74.5 130.5 74.5 119 L74.5 49 Q74.5 44.8 71.8 41.5 L50.5 13.5 Z ' +
  'M32.8 29 Q32.8 24 37.8 24 Q42.8 24 42.8 29 L42.8 57 Q42.8 62 37.8 62 ' +
  'Q32.8 62 32.8 57 Z'

/** The contents sit below the handle slot, following the body's lower edges. */
const JUG_CONTENTS =
  'M1.5 66 L74.5 66 L74.5 119 Q74.5 130.5 63 130.5 L13 130.5 Q1.5 130.5 1.5 119 Z'

export function GallonJug({ contents = '' }) {
  return (
    <svg
      className="art art--gallon"
      viewBox="0 0 76 132"
      role="img"
      aria-label="Gallon jug"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* cap */}
      <rect x="25.5" y="2" width="25" height="12" rx="2.5" fill={PLASTIC} />
      <rect x="25.5" y="2" width="25" height="12" rx="2.5" fill={`url(#${SHADE_ID})`} />
      <rect
        x="25.5"
        y="2"
        width="25"
        height="12"
        rx="2.5"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2"
      />

      {/* body */}
      <path d={JUG_BODY} fillRule="evenodd" fill={PLASTIC} />
      {contents ? (
        <>
          {/* translucent plastic: the color shows through the whole jug, and
              deeper below the fill line */}
          <path d={JUG_BODY} fillRule="evenodd" fill={contents} fillOpacity="0.42" />
          <path d={JUG_CONTENTS} fill={contents} fillOpacity="0.9" />
        </>
      ) : null}
      <path d={JUG_BODY} fillRule="evenodd" fill={`url(#${SHEEN_ID})`} />
      {/* fill line, only meaningful once there is something in the jug */}
      {contents ? (
        <path d="M1.5 66 H74.5" stroke="#000" strokeOpacity="0.18" strokeWidth="1.6" />
      ) : null}
      <path
        d={JUG_BODY}
        fillRule="evenodd"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChemicalCan({ contents = '' }) {
  const body = contents || STEEL
  return (
    <svg
      className="art art--can"
      viewBox="0 0 53 132"
      role="img"
      aria-label="Can"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* domed cap */}
      <path d="M5 32 L5 13 Q5 3 26.5 3 Q48 3 48 13 L48 32 Z" fill={STEEL} />
      <path d="M5 32 L5 13 Q5 3 26.5 3 Q48 3 48 13 L48 32 Z" fill={`url(#${GLOSS_ID})`} />
      <path
        d="M5 32 L5 13 Q5 3 26.5 3 Q48 3 48 13 L48 32 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.2"
      />

      {/* collar between cap and body */}
      <rect x="2" y="29.5" width="49" height="8" rx="2.5" fill={STEEL} />
      <rect x="2" y="29.5" width="49" height="8" rx="2.5" fill={`url(#${GLOSS_ID})`} />
      <rect
        x="2"
        y="29.5"
        width="49"
        height="8"
        rx="2.5"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.2"
      />

      {/* body */}
      <path d="M3.5 37 L49.5 37 L49.5 122 Q49.5 130 26.5 130 Q3.5 130 3.5 122 Z" fill={body} />
      <path
        d="M3.5 37 L49.5 37 L49.5 122 Q49.5 130 26.5 130 Q3.5 130 3.5 122 Z"
        fill={`url(#${GLOSS_ID})`}
      />
      {/* rolled bottom seam */}
      <path
        d="M3.5 120 Q3.5 127 26.5 127 Q49.5 127 49.5 120"
        fill="none"
        stroke={OUTLINE}
        strokeOpacity="0.55"
        strokeWidth="1.8"
      />
      <path
        d="M3.5 37 L49.5 37 L49.5 122 Q49.5 130 26.5 130 Q3.5 130 3.5 122 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChemicalBarrel({ contents = '' }) {
  const body = contents || DRUM
  return (
    <svg
      className="art art--barrel"
      viewBox="0 0 87 132"
      role="img"
      aria-label="Barrel"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* drum */}
      <path d="M4 16 L83 16 L83 122 Q83 129 43.5 129 Q4 129 4 122 Z" fill={body} />
      <path
        d="M4 16 L83 16 L83 122 Q83 129 43.5 129 Q4 129 4 122 Z"
        fill={`url(#${SHEEN_ID})`}
      />

      {/* lid */}
      <ellipse cx="43.5" cy="16" rx="39.5" ry="9" fill={body} />
      <ellipse cx="43.5" cy="16" rx="39.5" ry="9" fill={`url(#${SHADE_ID})`} />
      <ellipse
        cx="43.5"
        cy="16"
        rx="39.5"
        ry="9"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.2"
      />
      {/* bung caps */}
      <ellipse cx="29" cy="14.5" rx="5" ry="2.4" fill="#000" fillOpacity="0.28" />
      <ellipse cx="58" cy="14.5" rx="3.4" ry="1.8" fill="#000" fillOpacity="0.28" />

      {/* rolling hoops */}
      <rect x="1.5" y="52" width="84" height="9" fill={body} />
      <rect x="1.5" y="52" width="84" height="9" fill={`url(#${SHADE_ID})`} />
      <rect x="1.5" y="52" width="84" height="9" fill="none" stroke={OUTLINE} strokeWidth="2" />
      <rect x="1.5" y="92" width="84" height="9" fill={body} />
      <rect x="1.5" y="92" width="84" height="9" fill={`url(#${SHADE_ID})`} />
      <rect x="1.5" y="92" width="84" height="9" fill="none" stroke={OUTLINE} strokeWidth="2" />

      <path
        d="M4 16 L83 16 L83 122 Q83 129 43.5 129 Q4 129 4 122 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ART = { gallon: GallonJug, can: ChemicalCan, barrel: ChemicalBarrel }

export function ContainerIcon({ containerType, contents }) {
  const Art = ART[containerType] ?? GallonJug
  return <Art contents={contents} />
}
