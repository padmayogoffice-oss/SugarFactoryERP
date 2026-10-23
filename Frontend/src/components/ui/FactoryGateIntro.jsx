import { useCallback, useEffect, useRef } from 'react'
import '../../styles/factoryGate.css'

/**
 * Intro animation for "New Factory": the sugar-factory gate opens from the middle,
 * the factory (chimneys, mill, silos, cane truck) is revealed, then `onOpen` fires so
 * the caller can show the form (which slides in). `onEnd` fires once the overlay has
 * faded out (unmount there). The motion itself is pure CSS (styles/factoryGate.css, 3.7s).
 */
const OPEN_CALLBACK_AT = 3000
const END_AT = 3700

const BAR_COUNT = 13

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function GateLeaf({ className, x0 }) {
  return (
    <g className={className}>
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const x = x0 + 6 + i * 20
        return (
          <g key={i}>
            <rect x={x} y="64" width="6" height="141" fill="#14532d" />
            <polygon points={`${x - 1},64 ${x + 3},50 ${x + 7},64`} fill="#d4a017" />
          </g>
        )
      })}
      <rect x={x0} y="78" width="260" height="8" fill="#166534" />
      <rect x={x0} y="128" width="260" height="7" fill="#166534" />
      <rect x={x0} y="185" width="260" height="8" fill="#166534" />
      <circle cx={x0 === 60 ? 312 : 328} cy="131" r="6" fill="#d4a017" stroke="#92400e" strokeWidth="1.5" />
    </g>
  )
}

export default function FactoryGateIntro({ onOpen, onEnd }) {
  const callbacks = useRef({ onOpen, onEnd })
  const opened = useRef(false)
  const ended = useRef(false)

  useEffect(() => {
    callbacks.current = { onOpen, onEnd }
  })

  const fireOpen = useCallback(() => {
    if (opened.current) return
    opened.current = true
    callbacks.current.onOpen?.()
  }, [])

  const fireEnd = useCallback(() => {
    if (ended.current) return
    ended.current = true
    callbacks.current.onEnd?.()
  }, [])

  const skip = useCallback(() => {
    fireOpen()
    fireEnd()
  }, [fireOpen, fireEnd])

  useEffect(() => {
    if (prefersReducedMotion()) {
      skip()
      return undefined
    }
    const timers = [setTimeout(fireOpen, OPEN_CALLBACK_AT), setTimeout(fireEnd, END_AT)]
    return () => timers.forEach(clearTimeout)
  }, [skip, fireOpen, fireEnd])

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') skip() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip])

  return (
    <div className="fgi-overlay" role="dialog" aria-label="Factory registration">
      <div className="fgi-card">
        <button type="button" className="fgi-skip" onClick={skip}>Skip ›</button>
        <svg className="fgi-svg" viewBox="0 0 640 280" aria-hidden="true">
          <defs>
            <linearGradient id="fgi-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9fd8ff" />
              <stop offset="1" stopColor="#ffe9b8" />
            </linearGradient>
          </defs>
          <rect width="640" height="280" fill="url(#fgi-sky)" />
          <circle cx="540" cy="70" r="24" fill="#ffd45c" />
          <ellipse cx="150" cy="75" rx="34" ry="10" fill="#fff" opacity="0.8" />
          <ellipse cx="172" cy="68" rx="24" ry="9" fill="#fff" opacity="0.8" />

          {/* ---- the factory, seen through the gate ---- */}
          <g className="fgi-scene">
            <path d="M0 170 Q120 140 240 168 T480 160 T640 156 V210 H0Z" fill="#9ccf7a" />
            <rect y="205" width="640" height="75" fill="#7aa84a" />
            <polygon points="270,205 370,205 470,280 170,280" fill="#9ca3af" />
            <line x1="320" y1="210" x2="320" y2="280" stroke="#f9fafb" strokeWidth="3" strokeDasharray="10 10" />

            {/* cane yard + carrier */}
            <polygon points="100,205 215,150 215,162 112,205" fill="#475569" />
            <ellipse cx="108" cy="203" rx="32" ry="12" fill="#9fbf2a" />
            <line x1="84" y1="200" x2="132" y2="192" stroke="#7b3f98" strokeWidth="5" strokeLinecap="round" />
            <line x1="88" y1="206" x2="134" y2="198" stroke="#7b3f98" strokeWidth="5" strokeLinecap="round" />

            {/* chimneys */}
            <rect x="248" y="62" width="22" height="48" fill="#b91c1c" />
            <rect x="248" y="72" width="22" height="7" fill="#fff" />
            <rect x="382" y="72" width="20" height="38" fill="#b91c1c" />
            <rect x="382" y="82" width="20" height="7" fill="#fff" />

            {/* main mill building */}
            <polygon points="205,108 317,82 430,108" fill="#6b7280" />
            <rect x="215" y="108" width="205" height="97" fill="#c8754b" />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <rect x={228 + i * 38} y="120" width="22" height="18" fill="#fde68a" stroke="#92400e" strokeWidth="1" />
                <rect x={228 + i * 38} y="148" width="22" height="18" fill="#fde68a" stroke="#92400e" strokeWidth="1" />
              </g>
            ))}
            <rect x="298" y="168" width="38" height="37" fill="#4b5563" />
            <line x1="317" y1="168" x2="317" y2="205" stroke="#374151" strokeWidth="2" />

            {/* sugar silos */}
            <rect x="440" y="128" width="36" height="77" fill="#cbd5e1" />
            <ellipse cx="458" cy="128" rx="18" ry="8" fill="#e2e8f0" />
            <rect x="484" y="138" width="34" height="67" fill="#cbd5e1" />
            <ellipse cx="501" cy="138" rx="17" ry="7" fill="#e2e8f0" />

            {/* smoke */}
            <circle className="fgi-smoke" cx="259" cy="58" r="9" fill="#e5e7eb" />
            <circle className="fgi-smoke" cx="259" cy="58" r="9" fill="#e5e7eb" />
            <circle className="fgi-smoke" cx="259" cy="58" r="9" fill="#e5e7eb" />
            <circle className="fgi-smoke" cx="392" cy="68" r="8" fill="#e5e7eb" />
            <circle className="fgi-smoke" cx="392" cy="68" r="8" fill="#e5e7eb" />
            <circle className="fgi-smoke" cx="392" cy="68" r="8" fill="#e5e7eb" />

            {/* cane truck driving in */}
            <g className="fgi-truck">
              <rect x="430" y="176" width="62" height="20" fill="#a16207" />
              <line x1="436" y1="176" x2="500" y2="160" stroke="#7b3f98" strokeWidth="5" strokeLinecap="round" />
              <line x1="440" y1="178" x2="496" y2="166" stroke="#9fbf2a" strokeWidth="5" strokeLinecap="round" />
              <line x1="436" y1="180" x2="486" y2="170" stroke="#7b3f98" strokeWidth="5" strokeLinecap="round" />
              <rect x="494" y="170" width="26" height="26" rx="3" fill="#dc2626" />
              <rect x="506" y="174" width="12" height="10" fill="#bfdbfe" />
              {[444, 470, 508].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy="199" r="7" fill="#111827" />
                  <circle cx={cx} cy="199" r="2.5" fill="#9ca3af" />
                </g>
              ))}
            </g>
          </g>

          {/* ---- the gate: two leaves that open from the middle ---- */}
          <GateLeaf className="fgi-gate-left" x0={60} />
          <GateLeaf className="fgi-gate-right" x0={320} />

          {/* pillars, lamps and name board */}
          <rect x="0" y="44" width="60" height="161" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
          <rect x="580" y="44" width="60" height="161" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
          <rect x="-4" y="38" width="68" height="10" fill="#78716c" />
          <rect x="576" y="38" width="68" height="10" fill="#78716c" />
          <circle cx="30" cy="30" r="8" fill="#fde68a" stroke="#d4a017" strokeWidth="2" />
          <circle cx="610" cy="30" r="8" fill="#fde68a" stroke="#d4a017" strokeWidth="2" />
          <rect x="60" y="8" width="520" height="34" rx="6" fill="#14532d" stroke="#d4a017" strokeWidth="2.5" />
          <text x="320" y="32" textAnchor="middle" fontSize="19" fontWeight="700" fill="#fde68a">साखर कारखाना · SUGAR FACTORY</text>
        </svg>
        <div className="fgi-caption">
          <strong>कारखाना नोंदणी</strong>
          <span>Factory Registration · गेट उघडत आहे…</span>
        </div>
      </div>
    </div>
  )
}