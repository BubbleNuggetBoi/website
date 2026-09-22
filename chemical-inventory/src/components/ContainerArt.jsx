/**
 * SVG silhouettes for everything we stock: a gallon jug with a moulded handle
 * slot, a slim cylindrical can, a drum, a glove dispenser box, a long flat
 * carton, a folded protective suit and a mop head.
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

/**
 * Mop head: socket and collar up top, then strands fanning out and down. The
 * strands are generated rather than hand-drawn so the fan stays even.
 * Every viewBox below is sized to its CONTAINER_ART aspect, so the drawing
 * fills the art box exactly and the product label lands where it should.
 */
const MOP_STRANDS = Array.from({ length: 13 }, (_, index) => {
  const t = index / 12
  const lean = (t - 0.5) * 2 // -1 at the left edge, +1 at the right
  return {
    top: 36 + t * 30, // leaves the collar
    bottom: 6 + t * 90, // hangs out here
    tip: 128 - lean ** 2 * 20, // outer strands hang shorter
    width: 4.3 - Math.abs(lean) * 0.7,
  }
})

export function MopHead({ contents = '' }) {
  const strands = contents || '#f2f5f7'
  return (
    <svg
      className="art art--mop"
      viewBox="0 0 106 132"
      role="img"
      aria-label="Mop head"
      preserveAspectRatio="xMidYMax meet"
    >
      {MOP_STRANDS.map((strand, index) => {
        const w = strand.width
        const d =
          `M${strand.top} 22 C${strand.top} 56 ${strand.bottom} 84 ${strand.bottom} ${strand.tip - 9} ` +
          `Q${strand.bottom} ${strand.tip} ${strand.bottom + w} ${strand.tip} ` +
          `Q${strand.bottom + w * 2} ${strand.tip} ${strand.bottom + w * 2} ${strand.tip - 9} ` +
          `C${strand.bottom + w * 2} 84 ${strand.top + w * 2} 56 ${strand.top + w * 2} 22 Z`
        return (
          <path
            key={index}
            d={d}
            fill={strands}
            stroke={OUTLINE}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )
      })}

      {/* collar clamping the strand tops */}
      <path d="M34 14 L72 14 L78 32 L28 32 Z" fill="#e4e9ed" />
      <path d="M34 14 L72 14 L78 32 L28 32 Z" fill={`url(#${SHADE_ID})`} />
      <path
        d="M34 14 L72 14 L78 32 L28 32 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* socket the handle screws into */}
      <rect x="41" y="3" width="24" height="12" rx="1.5" fill="#e4e9ed" />
      <rect x="41" y="3" width="24" height="12" rx="1.5" fill={`url(#${GLOSS_ID})`} />
      <rect
        x="41"
        y="3"
        width="24"
        height="12"
        rx="1.5"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.2"
      />
      <ellipse cx="53" cy="4" rx="12" ry="3.4" fill="#c3ccd4" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  )
}

/** Folded coverall, hood on top, as it sits stacked on the shelf. */
export function ProtectiveSuit({ contents = '' }) {
  const fabric = contents || '#eef2f5'
  const HOOD = 'M42 50 Q36 11 63.5 9 Q91 11 85 50 Z'
  const BODY =
    'M6 64 Q6 50 30 47 L97 47 Q121 50 121 64 L121 110 L6 110 Z'
  const FOLD = 'M4 110 Q4 124 18 124 L109 124 Q123 124 123 110 Z'
  return (
    <svg
      className="art art--suit"
      viewBox="0 0 127 132"
      role="img"
      aria-label="Protective suit"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* hood, with the face opening reading as a shadow */}
      <path d={HOOD} fill={fabric} stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      {/* face opening: a flatter oval, shaded rather than punched out */}
      <path
        d="M50 27 Q50 18 63.5 18 Q77 18 77 27 Q77 39 63.5 39 Q50 39 50 27 Z"
        fill="#2b343c"
        fillOpacity="0.7"
        stroke={OUTLINE}
        strokeWidth="2"
      />
      {/* hood seam */}
      <path d="M63.5 9 L63.5 18" stroke={OUTLINE} strokeWidth="2" strokeOpacity="0.6" />

      {/* folded body */}
      <path d={BODY} fill={fabric} />
      <path d={BODY} fill={`url(#${SHEEN_ID})`} />
      <path d={BODY} fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
      {/* zip seam down the middle */}
      <path d="M63.5 47 L63.5 110" stroke={OUTLINE} strokeWidth="2.2" strokeOpacity="0.65" />
      {/* sleeve folds */}
      <path
        d="M26 56 L26 106 M101 56 L101 106"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeOpacity="0.5"
      />

      {/* the rolled edge of the stack */}
      <path d={FOLD} fill={fabric} />
      <path d={FOLD} fill={`url(#${SHADE_ID})`} />
      <path d={FOLD} fill="none" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M4 117 L123 117" stroke={OUTLINE} strokeWidth="1.8" strokeOpacity="0.45" />
    </svg>
  )
}

/** Dispenser box with a glove pulled through the slot on top. */
export function GloveBox({ contents = '' }) {
  const box = contents || '#eceff2'
  const FRONT = 'M8 62 L96 62 L96 122 L8 122 Z'
  const TOP = 'M8 62 L30 44 L118 44 L96 62 Z'
  const SIDE = 'M96 62 L118 44 L118 104 L96 122 Z'
  return (
    <svg
      className="art art--glovebox"
      viewBox="0 0 139 132"
      role="img"
      aria-label="Box of gloves"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* the glove, drawn first so the box top overlaps its cuff */}
      <path
        d="M58 54 L58 34 Q58 27 63 27 Q68 27 68 34 L68 21 Q68 13 73.5 13 Q79 13 79 21 L79 24
           Q79 15 84 15 Q89 15 89 24 L89 34 Q92 28 96 30 Q100 33 97 39 L90 55 Z"
        fill="#f6f8fa"
        stroke={OUTLINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      <path d={TOP} fill={box} />
      <path d={TOP} fill="#ffffff" fillOpacity="0.14" />
      <path d={TOP} fill="none" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={SIDE} fill={box} />
      <path d={SIDE} fill="#000000" fillOpacity="0.22" />
      <path d={SIDE} fill="none" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={FRONT} fill={box} />
      <path d={FRONT} fill={`url(#${SHEEN_ID})`} />
      <path d={FRONT} fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />

      {/* dispensing slot the glove comes through */}
      <path
        d="M52 55 Q73 49 92 54"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.2"
        strokeOpacity="0.75"
      />
    </svg>
  )
}

/** Long flat carton, the way tape, blades, plugs and masks come boxed. */
export function LongBox({ contents = '' }) {
  const box = contents || '#eceff2'
  const FRONT = 'M8 74 L176 74 L176 120 L8 120 Z'
  const TOP = 'M8 74 L40 48 L208 48 L176 74 Z'
  const SIDE = 'M176 74 L208 48 L208 94 L176 120 Z'
  return (
    <svg
      className="art art--longbox"
      viewBox="0 0 224 132"
      role="img"
      aria-label="Long box"
      preserveAspectRatio="xMidYMax meet"
    >
      <path d={TOP} fill={box} />
      <path d={TOP} fill="#ffffff" fillOpacity="0.14" />
      <path d={TOP} fill="none" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={SIDE} fill={box} />
      <path d={SIDE} fill="#000000" fillOpacity="0.22" />
      <path d={SIDE} fill="none" stroke={OUTLINE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={FRONT} fill={box} />
      <path d={FRONT} fill={`url(#${SHEEN_ID})`} />
      <path d={FRONT} fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
      {/* lid seam along the top edge */}
      <path d="M8 82 L176 82" stroke={OUTLINE} strokeWidth="1.8" strokeOpacity="0.3" />
    </svg>
  )
}

const ART = {
  gallon: GallonJug,
  can: ChemicalCan,
  barrel: ChemicalBarrel,
  gloveBox: GloveBox,
  longBox: LongBox,
  suit: ProtectiveSuit,
  mop: MopHead,
}

export function ContainerIcon({ containerType, contents }) {
  const Art = ART[containerType] ?? GallonJug
  return <Art contents={contents} />
}
