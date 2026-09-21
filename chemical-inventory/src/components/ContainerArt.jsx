/**
 * Hand-drawn SVG silhouettes for the two container types we stock.
 * They are decorative only: the product label text is overlaid in HTML by
 * ChemicalContainer so it stays selectable and easy to size responsively.
 */

const SHEEN_ID = 'container-sheen'
const SHADE_ID = 'container-shade'

/** One shared <defs> block, mounted once near the app root. */
export function ContainerArtDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id={SHEEN_ID} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="22%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="82%" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={SHADE_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function GallonJug({ tint = '#d8dee4' }) {
  return (
    <svg
      className="art art--gallon"
      viewBox="0 0 100 132"
      role="img"
      aria-label="Gallon jug"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* handle loop, drawn behind the body */}
      <path
        d="M70 44 C88 47 95 55 95 64 C95 74 88 81 70 84"
        fill="none"
        stroke={tint}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M70 44 C88 47 95 55 95 64 C95 74 88 81 70 84"
        fill="none"
        stroke="#000"
        strokeOpacity="0.18"
        strokeWidth="10"
        strokeLinecap="round"
        transform="translate(1.5 2)"
      />
      {/* cap + neck */}
      <rect x="35" y="4" width="30" height="13" rx="3" fill={tint} />
      <rect x="35" y="4" width="30" height="13" rx="3" fill={`url(#${SHADE_ID})`} />
      <rect x="38" y="16" width="24" height="14" fill={tint} />
      {/* body */}
      <path
        d="M36 26 L36 31 C36 35 31 37 25 41 C16 47 11 56 11 68 L11 114 C11 123 17 129 26 129 L72 129 C81 129 87 123 87 114 L87 68 C87 56 82 47 73 41 C67 37 62 35 62 31 L62 26 Z"
        fill={tint}
      />
      <path
        d="M36 26 L36 31 C36 35 31 37 25 41 C16 47 11 56 11 68 L11 114 C11 123 17 129 26 129 L72 129 C81 129 87 123 87 114 L87 68 C87 56 82 47 73 41 C67 37 62 35 62 31 L62 26 Z"
        fill={`url(#${SHEEN_ID})`}
      />
      {/* moulded ribs across the shoulder */}
      <path
        d="M16 56 H82 M14 63 H84"
        stroke="#000"
        strokeOpacity="0.12"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ChemicalCan({ tint = '#b9c2cb' }) {
  return (
    <svg
      className="art art--can"
      viewBox="0 0 100 132"
      role="img"
      aria-label="Chemical can"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* bail handle */}
      <path
        d="M22 26 C24 8 76 8 78 26"
        fill="none"
        stroke="#6d7580"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* lid */}
      <ellipse cx="50" cy="30" rx="37" ry="10" fill={tint} />
      <ellipse cx="50" cy="30" rx="37" ry="10" fill={`url(#${SHADE_ID})`} />
      <ellipse cx="50" cy="29" rx="26" ry="6.5" fill="#000" fillOpacity="0.14" />
      {/* cylinder body */}
      <path d="M13 30 L13 116 C13 124 30 129 50 129 C70 129 87 124 87 116 L87 30 Z" fill={tint} />
      <path
        d="M13 30 L13 116 C13 124 30 129 50 129 C70 129 87 124 87 116 L87 30 Z"
        fill={`url(#${SHEEN_ID})`}
      />
      {/* rolled seams top and bottom */}
      <path
        d="M13 40 C13 47 30 51 50 51 C70 51 87 47 87 40"
        fill="none"
        stroke="#000"
        strokeOpacity="0.16"
        strokeWidth="2.5"
      />
      <path
        d="M13 112 C13 119 30 123 50 123 C70 123 87 119 87 112"
        fill="none"
        stroke="#000"
        strokeOpacity="0.16"
        strokeWidth="2.5"
      />
    </svg>
  )
}

export function ContainerIcon({ containerType, tint }) {
  return containerType === 'can' ? <ChemicalCan tint={tint} /> : <GallonJug tint={tint} />
}
