/**
 * Login screen. Submits credentials through the auth context and surfaces
 * validation or lockout errors returned by the API.
 *
 * After a successful sign-in a short (3.8 s) welcome animation plays before the
 * dashboard opens. It is mounted only by an interactive login, so restoring a
 * session, refreshing the page or navigating between screens never replays it.
 * The scene is pure SVG + CSS (styles: "WELCOME INTRO" in styles/index.css).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiError } from '../../api/client'
import { Alert } from '../../components/ui'
import ThemeToggle from '../../components/ui/ThemeToggle'

/* -------------------------------------------------------------------------- */
/* Welcome intro                                                               */
/* -------------------------------------------------------------------------- */

/** Total length of the intro. Keep in sync with the 3800ms timelines in index.css. */
const INTRO_MS = 3800

/** Small deterministic pseudo-random so the scene is identical on every render. */
const rand = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

const LEAF_L = 'M0 0C-6-18-30-28-52-10C-34-16-14-8 0 0Z'
const LEAF_R = 'M0 0C6-18 30-28 52-10C34-16 14-8 0 0Z'
const LEAF_M = 'M0 0C-5-14-3-28 5-38C9-24 6-10 0 0Z'

function buildRow({ count, from, to, baseY, hMin, hMax, w, scale, nodes, delay0, delaySpan, seed }) {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    return {
      x: from + (to - from) * t + (rand(seed + i) - 0.5) * 14,
      baseY: baseY + (rand(seed + i * 5) - 0.5) * 6,
      h: hMin + rand(seed + i * 3) * (hMax - hMin),
      w,
      scale,
      nodes,
      delay: Math.round(delay0 + rand(seed + i * 7) * delaySpan),
      sway: (2.4 + rand(seed + i * 11) * 1.6).toFixed(2),
      phase: (-rand(seed + i * 13) * 2).toFixed(2),
    }
  })
}

/** Three depth rows of cane, back to front. They sprout one after another (scene 1). */
const CANE_ROWS = [
  buildRow({ count: 26, from: -10, to: 810, baseY: 292, hMin: 40, hMax: 56, w: 3.4, scale: 0.55, nodes: 0, delay0: 150, delaySpan: 500, seed: 1 }),
  buildRow({ count: 15, from: 10, to: 790, baseY: 340, hMin: 78, hMax: 104, w: 6, scale: 0.85, nodes: 2, delay0: 300, delaySpan: 550, seed: 40 }),
  buildRow({ count: 9, from: 30, to: 770, baseY: 396, hMin: 118, hMax: 150, w: 9, scale: 1.15, nodes: 3, delay0: 450, delaySpan: 600, seed: 90 }),
]

const FURROWS = [-380, -260, -150, -70, 0, 70, 150, 260, 380]

const RAYS = Array.from({ length: 10 }, (_, i) => {
  const a = (i * 36 * Math.PI) / 180
  const d = (1.7 * Math.PI) / 180
  const R = 760
  const p = (angle) => `${(Math.cos(angle) * R).toFixed(1)},${(Math.sin(angle) * R).toFixed(1)}`
  return `0,0 ${p(a - d)} ${p(a + d)}`
})

const STARBURST = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 ? 11 : 28
  const a = (Math.PI * 2 * i) / 16 - Math.PI / 2
  return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`
}).join(' ')

/** Sugar crystals drifting down around Sugar Buddy (cast viewBox coordinates). */
const CRYSTALS = Array.from({ length: 14 }, (_, i) => ({
  x: Math.round(335 + rand(200 + i) * 150),
  y: Math.round(110 + rand(230 + i) * 80),
  fall: Math.round(150 + rand(260 + i) * 90),
  dx: Math.round((rand(290 + i) - 0.5) * 34),
  rot: Math.round((rand(320 + i) - 0.5) * 260),
  delay: 1850 + i * 95,
  dur: Math.round(1700 + rand(350 + i) * 700),
  scale: (0.8 + rand(380 + i) * 0.55).toFixed(2),
}))

/** Golden motes floating through the whole scene. */
const MOTES = Array.from({ length: 26 }, (_, i) => ({
  left: (3 + rand(500 + i) * 94).toFixed(1),
  bottom: (rand(530 + i) * 55).toFixed(1),
  size: Math.round(3 + rand(560 + i) * 7),
  dur: (2.8 + rand(590 + i) * 1.8).toFixed(2),
  delay: (rand(620 + i) * 2.2).toFixed(2),
  dx: Math.round((rand(650 + i) - 0.5) * 80),
  rise: Math.round(14 + rand(680 + i) * 22),
}))

/** Final burst of gold dust and sugar crystals that fills the screen. */
const BURST = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2 + (rand(700 + i) - 0.5) * 0.4
  const dist = 0.55 + rand(740 + i) * 0.45
  return {
    dx: (Math.cos(a) * dist * 82).toFixed(1),
    dy: (Math.sin(a) * dist * 78).toFixed(1),
    size: Math.round(9 + rand(780 + i) * 14),
    s: (0.9 + rand(820 + i) * 1.3).toFixed(2),
    delay: 2900 + Math.round(rand(860 + i) * 220),
    gem: i % 3 === 0,
  }
})

function CaneStalk({ s }) {
  const top = s.baseY - s.h
  return (
    <g className="wi-stalk" style={{ '--d': `${s.delay}ms` }}>
      <rect x={s.x - s.w / 2} y={top} width={s.w} height={s.h} rx={s.w / 2} fill="url(#wi-cane)" />
      {Array.from({ length: s.nodes }, (_, k) => (
        <rect
          key={k}
          x={s.x - s.w / 2}
          y={s.baseY - (s.h * (k + 1)) / (s.nodes + 1)}
          width={s.w}
          height={Math.max(1.2, s.w * 0.22)}
          fill="var(--wi-node)"
          opacity="0.5"
        />
      ))}
      <g transform={`translate(${s.x.toFixed(1)} ${top.toFixed(1)}) scale(${s.scale})`}>
        <g className="wi-leaves" style={{ '--sw': `${s.sway}s`, '--ph': `${s.phase}s` }}>
          <path d={LEAF_L} fill="url(#wi-leaf)" />
          <path d={LEAF_R} fill="url(#wi-leaf)" />
          <path d={LEAF_M} fill="url(#wi-leaf)" />
        </g>
      </g>
    </g>
  )
}

/** Scene 1: sunrise over the cane field (sky, sun, rays, hills, three rows of growing cane). */
function FieldScene() {
  return (
    <svg className="wi-field-svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wi-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--wi-sky-1)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--wi-sky-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--wi-sky-3)' }} />
        </linearGradient>
        <radialGradient id="wi-sunglow">
          <stop offset="0" stopColor="#fff6c8" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#ffd36b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb940" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wi-ray" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="760">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wi-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--wi-ground-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--wi-ground-2)' }} />
        </linearGradient>
        <linearGradient id="wi-cane" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--wi-cane-l)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--wi-cane-m)' }} />
          <stop offset="1" style={{ stopColor: 'var(--wi-cane-d)' }} />
        </linearGradient>
        <linearGradient id="wi-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--wi-leaf-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--wi-leaf-2)' }} />
        </linearGradient>
        <linearGradient id="wi-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0" />
          <stop offset="0.55" stopColor="#ffd98a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="800" height="300" fill="url(#wi-sky)" />

      <g className="wi-cloud wi-cloud-a">
        <ellipse cx="160" cy="70" rx="58" ry="13" />
        <ellipse cx="195" cy="62" rx="36" ry="11" />
      </g>
      <g className="wi-cloud wi-cloud-b">
        <ellipse cx="620" cy="104" rx="64" ry="12" />
        <ellipse cx="590" cy="97" rx="34" ry="10" />
      </g>

      <g className="wi-sun">
        <circle cx="400" cy="226" r="150" fill="url(#wi-sunglow)" />
        <circle cx="400" cy="226" r="30" fill="#fff6c6" />
      </g>
      <g transform="translate(400 226)">
        <g className="wi-rays">
          {RAYS.map((points) => (
            <polygon key={points} points={points} fill="url(#wi-ray)" />
          ))}
        </g>
      </g>

      <path d="M0 250Q100 215 220 240T440 232T660 238T800 226V290H0Z" style={{ fill: 'var(--wi-hill-1)' }} />
      <path d="M0 262Q140 236 300 258T560 252T800 250V300H0Z" style={{ fill: 'var(--wi-hill-2)' }} />
      <rect y="254" width="800" height="196" fill="url(#wi-ground)" />
      {FURROWS.map((f) => (
        <path key={f} d={`M400 254L${400 + f * 2.4} 452`} stroke="rgba(8,50,18,.14)" strokeWidth="2" fill="none" />
      ))}

      {CANE_ROWS.map((row, r) => (
        <g key={r}>
          {row.map((s) => (
            <CaneStalk key={s.x} s={s} />
          ))}
        </g>
      ))}

      <rect className="wi-haze" y="196" width="800" height="120" fill="url(#wi-haze)" />
    </svg>
  )
}

/** Squinting "^ ^" eyes shown while the characters celebrate. */
function HappyEyes({ left, right, y, color, width }) {
  return (
    <g className="wi-eyes-happy" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
      <path d={`M${left - 10} ${y}Q${left} ${y - 14} ${left + 10} ${y}`} />
      <path d={`M${right - 10} ${y}Q${right} ${y - 14} ${right + 10} ${y}`} />
    </g>
  )
}

function CaneEyes() {
  return (
    <>
      <g className="wi-eyes-open">
        <g className="wi-blink">
          {[-18, 18].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy="-150" rx="12" ry="14" fill="#fff" />
              <circle cx={cx + 1} cy="-148" r="7.5" fill="#173326" />
              <circle cx={cx + 3.5} cy="-154" r="2.8" fill="#fff" />
              <circle cx={cx - 1.5} cy="-142" r="1.4" fill="#fff" />
            </g>
          ))}
        </g>
      </g>
      <HappyEyes left={-18} right={18} y={-148} color="#173326" width={4} />
    </>
  )
}

function SugarEyes() {
  return (
    <>
      <g className="wi-eyes-open">
        <g className="wi-blink">
          {[-19, 19].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy="-104" rx="8" ry="10.5" fill="#1d2b46" />
              <circle cx={cx + 2.5} cy="-108" r="3.2" fill="#fff" />
              <circle cx={cx - 2} cy="-99" r="1.5" fill="#fff" />
            </g>
          ))}
        </g>
      </g>
      <HappyEyes left={-19} right={19} y={-100} color="#1d2b46" width={3.6} />
    </>
  )
}

function Sparkle({ x, y, delay }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className="wi-star"
        style={{ '--dl': `${delay}ms` }}
        d="M0-7Q1-1 7 0Q1 1 0 7Q-1 1-7 0Q-1-1 0-7Z"
        fill="#fff"
        stroke="#bfe1ff"
        strokeWidth="0.8"
      />
    </g>
  )
}

/** Scene 2: Cane Buddy and Sugar Buddy, their high five, and the sparkles around them. */
function CastScene() {
  return (
    <svg className="wi-cast-svg" viewBox="0 0 640 400" aria-hidden="true">
      <defs>
        <linearGradient id="wi-cb-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a4ea7a" />
          <stop offset="0.45" stopColor="#58bd4c" />
          <stop offset="1" stopColor="#2b8a40" />
        </linearGradient>
        <linearGradient id="wi-cb-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7be466" />
          <stop offset="1" stopColor="#2c9a45" />
        </linearGradient>
        <linearGradient id="wi-sb-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3effc" />
        </linearGradient>
        <linearGradient id="wi-sb-top" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f0f8ff" />
        </linearGradient>
        <linearGradient id="wi-sb-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3e5f8" />
          <stop offset="1" stopColor="#b4cdea" />
        </linearGradient>
        <linearGradient id="wi-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#bfe2ff" />
          <stop offset="0.62" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9fd0ff" />
        </linearGradient>
        <linearGradient id="wi-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="wi-gemglow">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wi-shadow">
          <stop offset="0" stopColor="#0a2a12" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0a2a12" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wi-char-glow">
          <stop offset="0" style={{ stopColor: 'var(--wi-char-glow)' }} />
          <stop offset="1" style={{ stopColor: 'var(--wi-char-glow)', stopOpacity: 0 }} />
        </radialGradient>
        <clipPath id="wi-sb-clip">
          <rect x="-48" y="-148" width="96" height="96" rx="12" />
        </clipPath>
      </defs>

      <ellipse cx="320" cy="260" rx="300" ry="140" fill="url(#wi-char-glow)" />

      {/* ------------------------------ Cane Buddy ------------------------------ */}
      <g transform="translate(235 372)">
        <g className="cb-pop">
          <ellipse cx="0" cy="3" rx="54" ry="10" fill="url(#wi-shadow)" />
          <g className="cb-jump">
            <g className="cb-bounce">
              {/* legs */}
              <g className="cb-leg cb-leg-l">
                <rect x="-26" y="-40" width="15" height="38" rx="7" fill="#2f8f4c" />
                <ellipse cx="-19" cy="-3" rx="15" ry="7.5" fill="#1f6f3a" />
              </g>
              <g className="cb-leg cb-leg-r">
                <rect x="11" y="-40" width="15" height="38" rx="7" fill="#2f8f4c" />
                <ellipse cx="19" cy="-3" rx="15" ry="7.5" fill="#1f6f3a" />
              </g>

              {/* arms (drawn behind the body) */}
              <g transform="translate(-42 -118)">
                <g className="wi-arm cb-arm-l">
                  <path d="M0 0V38" stroke="#2f8f4c" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="0" cy="43" r="8.5" fill="#9de775" stroke="#2f8f4c" strokeWidth="2" />
                </g>
              </g>
              <g transform="translate(42 -118)">
                <g className="wi-arm cb-arm-r">
                  <path d="M0 0V38" stroke="#2f8f4c" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="0" cy="43" r="8.5" fill="#9de775" stroke="#2f8f4c" strokeWidth="2" />
                </g>
              </g>

              {/* body */}
              <rect x="-42" y="-200" width="84" height="164" rx="40" fill="url(#wi-cb-body)" />
              <rect x="-31" y="-184" width="9" height="108" rx="4.5" fill="#fff" opacity="0.28" />
              <path d="M-42 -98Q0 -86 42 -98" fill="none" stroke="#1d6b2f" strokeOpacity="0.4" strokeWidth="3.5" />
              <path d="M-41 -94Q0 -82 41 -94" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
              <path d="M-42 -64Q0 -52 42 -64" fill="none" stroke="#1d6b2f" strokeOpacity="0.4" strokeWidth="3.5" />
              <path d="M-41 -60Q0 -48 41 -60" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />

              {/* face */}
              <g className="cb-brows" fill="none" stroke="#1f6f3a" strokeWidth="3.2" strokeLinecap="round">
                <path d="M-29 -171Q-18 -177 -8 -171" />
                <path d="M8 -171Q18 -177 29 -171" />
              </g>
              <CaneEyes />
              <ellipse cx="-31" cy="-130" rx="7" ry="4.5" fill="#ff8fa3" opacity="0.55" />
              <ellipse cx="31" cy="-130" rx="7" ry="4.5" fill="#ff8fa3" opacity="0.55" />
              <g className="wi-mouth cb-mouth">
                <path d="M-15 -133Q0 -128 15 -133Q12 -112 0 -111Q-12 -112 -15 -133Z" fill="#7a2d3a" />
                <path d="M-7 -118Q0 -122 7 -118Q4 -112 0 -112Q-4 -112 -7 -118Z" fill="#ff7f93" />
              </g>

              {/* crown of leaves */}
              <g transform="translate(0 -196)">
                <g className="cb-leaf cb-leaf-l2">
                  <path d="M0 0C-4-24-26-46-58-44C-38-34-18-18 0 0Z" fill="url(#wi-cb-leaf)" />
                </g>
                <g className="cb-leaf cb-leaf-r2">
                  <path d="M0 0C4-24 26-46 58-44C38-34 18-18 0 0Z" fill="url(#wi-cb-leaf)" />
                </g>
                <g className="cb-leaf cb-leaf-l">
                  <path d="M0 0C-10-34-52-62-96-46C-64-42-30-24 0 0Z" fill="url(#wi-cb-leaf)" />
                  <path d="M0 0Q-40-30-90-45" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.5" />
                </g>
                <g className="cb-leaf cb-leaf-r">
                  <path d="M0 0C10-34 52-62 96-46C64-42 30-24 0 0Z" fill="url(#wi-cb-leaf)" />
                  <path d="M0 0Q40-30 90-45" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.5" />
                </g>
                <g className="cb-leaf cb-leaf-m">
                  <path d="M0 0C-12-30-8-64 12-88C22-54 16-26 0 0Z" fill="url(#wi-cb-leaf)" />
                  <path d="M0 0Q-2-44 11-84" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.5" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* ------------------------------ Sugar Buddy ------------------------------ */}
      <g transform="translate(405 372)">
        <g className="sb-slide">
          <ellipse cx="0" cy="3" rx="56" ry="10" fill="url(#wi-shadow)" />
          <g className="sb-hop">
            <g className="cb-bounce sb-bounce">
              <g className="cb-leg cb-leg-l">
                <rect x="-28" y="-56" width="14" height="48" rx="7" fill="#bcd6f2" />
                <ellipse cx="-21" cy="-4" rx="14" ry="7" fill="#8fb2dc" />
              </g>
              <g className="cb-leg cb-leg-r">
                <rect x="14" y="-56" width="14" height="48" rx="7" fill="#bcd6f2" />
                <ellipse cx="21" cy="-4" rx="14" ry="7" fill="#8fb2dc" />
              </g>

              <g transform="translate(-50 -100)">
                <g className="wi-arm sb-arm-l">
                  <path d="M0 0V34" stroke="#c3d9f4" strokeWidth="9" strokeLinecap="round" />
                  <circle cx="0" cy="39" r="8" fill="#fff" stroke="#a9c6e8" strokeWidth="2" />
                </g>
              </g>
              <g transform="translate(64 -104)">
                <g className="wi-arm sb-arm-r">
                  <path d="M0 0V34" stroke="#c3d9f4" strokeWidth="9" strokeLinecap="round" />
                  <circle cx="0" cy="39" r="8" fill="#fff" stroke="#a9c6e8" strokeWidth="2" />
                </g>
              </g>

              {/* crystal cube */}
              <path d="M48 -148L68 -168V-72L48 -52Z" fill="url(#wi-sb-right)" stroke="#c4daf3" strokeWidth="5" strokeLinejoin="round" />
              <path d="M-48 -148L-28 -168H68L48 -148Z" fill="url(#wi-sb-top)" stroke="#f5faff" strokeWidth="5" strokeLinejoin="round" />
              <rect x="-48" y="-148" width="96" height="96" rx="12" fill="url(#wi-sb-front)" stroke="#dbe9fb" strokeWidth="2" />
              <g clipPath="url(#wi-sb-clip)">
                <path d="M-48 -148L-6 -148L-48 -104Z" fill="#fff" opacity="0.75" />
                <path d="M48 -148V-118L12 -148Z" fill="#bedcff" opacity="0.4" />
                <path d="M-48 -52H-20L-48 -78Z" fill="#bedcff" opacity="0.4" />
                <path d="M48 -52V-86L14 -52Z" fill="#fff" opacity="0.7" />
                <path d="M-48 -118L-14 -148M12 -52L48 -92" stroke="#9fc4ee" strokeOpacity="0.45" strokeWidth="1.2" fill="none" />
                <path className="sb-sheen" d="M0 -150L22 -150L8 -50L-14 -50Z" fill="url(#wi-sheen)" />
              </g>
              <path d="M-26 -166L66 -166" stroke="#fff" strokeWidth="2" opacity="0.9" strokeLinecap="round" />
              <Sparkle x={-40} y={-139} delay={0} />
              <Sparkle x={38} y={-62} delay={420} />
              <Sparkle x={60} y={-152} delay={820} />
              <Sparkle x={-30} y={-62} delay={1150} />

              {/* face */}
              <SugarEyes />
              <ellipse cx="-32" cy="-88" rx="7" ry="4.5" fill="#ff9fb4" opacity="0.6" />
              <ellipse cx="32" cy="-88" rx="7" ry="4.5" fill="#ff9fb4" opacity="0.6" />
              <g className="wi-mouth sb-mouth">
                <path d="M-12 -91Q0 -88 12 -91Q9 -75 0 -75Q-9 -75 -12 -91Z" fill="#c9435f" />
                <path d="M-5 -80Q0 -84 5 -80Q3 -76 0 -76Q-3 -76 -5 -80Z" fill="#ff8fa5" />
              </g>

              {/* presented crystal cluster */}
              <g transform="translate(99 -152)">
                <g className="sb-cluster">
                  <circle r="28" fill="url(#wi-gemglow)" className="wi-gemglow" />
                  <path d="M0-16L12-6L8 12H-8L-12-6Z" fill="url(#wi-gem)" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
                  <path d="M-12-6H12M0-16L-2 12M0-16L2 12" stroke="#9fd0ff" strokeWidth="0.7" fill="none" />
                  <path d="M-17 4L-12 0L-9 10H-17Z" fill="url(#wi-gem)" stroke="#fff" strokeWidth="0.8" strokeLinejoin="round" />
                  <path d="M17 6L12 2L9 12H17Z" fill="url(#wi-gem)" stroke="#fff" strokeWidth="0.8" strokeLinejoin="round" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* ----------------------------- high-five spark ----------------------------- */}
      <g transform="translate(322 242)">
        <circle className="wi-spark-ring" r="16" fill="none" stroke="#ffd45c" strokeWidth="3" />
        <g className="wi-spark">
          <polygon points={STARBURST} fill="#fff7c4" stroke="#ffc83d" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </g>

      {/* ------------------------- falling sugar crystals ------------------------- */}
      {CRYSTALS.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y})`}>
          <g
            className="wi-fall"
            style={{ '--fall': `${c.fall}px`, '--dx': `${c.dx}px`, '--rot': `${c.rot}deg`, animationDelay: `${c.delay}ms`, animationDuration: `${c.dur}ms` }}
          >
            <circle r="12" fill="url(#wi-gemglow)" className="wi-gemglow" />
            <g transform={`scale(${c.scale})`}>
              <path d="M0-8L6-3L4.5 7H-4.5L-6-3Z" fill="url(#wi-gem)" stroke="#fff" strokeWidth="0.8" strokeLinejoin="round" />
              <path d="M-6-3H6M0-8L-1.5 7M0-8L1.5 7" stroke="#9fd0ff" strokeWidth="0.5" fill="none" opacity="0.8" />
            </g>
          </g>
        </g>
      ))}
    </svg>
  )
}

/** Big foreground leaves that frame the scene and move faster than the background (depth). */
function ForegroundLeaves({ side }) {
  const flip = side === 'right'
  return (
    <svg className={`wi-fg wi-fg-${side}`} viewBox="0 0 200 260" aria-hidden="true">
      <g transform={flip ? 'matrix(-1 0 0 1 200 0)' : undefined}>
        <g className="wi-fg-sway">
          <path d="M-10 270C10 160 40 90 120 30C90 110 70 190 40 270Z" style={{ fill: 'var(--wi-fg-1)' }} />
          <path d="M-4 270C20 170 50 100 112 40" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
          <path d="M20 270C40 190 90 140 170 110C130 170 100 220 70 270Z" style={{ fill: 'var(--wi-fg-2)' }} />
          <path d="M30 270C60 200 100 150 160 118" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" />
        </g>
      </g>
    </svg>
  )
}

function WelcomeIntro({ onDone }) {
  const [leaving, setLeaving] = useState(false)
  const skipRef = useRef(null)
  const doneRef = useRef(false)
  const doneCallback = useRef(onDone)
  const skipTimer = useRef(0)

  useEffect(() => {
    doneCallback.current = onDone
  })

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    doneCallback.current?.()
  }, [])

  const skip = useCallback(() => {
    if (doneRef.current || skipTimer.current) return
    setLeaving(true)
    skipTimer.current = window.setTimeout(finish, 240)
  }, [finish])

  useEffect(() => {
    // Reduced motion: no animation at all, go straight to the dashboard.
    if (prefersReducedMotion()) {
      finish()
      return undefined
    }
    const timer = window.setTimeout(finish, INTRO_MS)
    const onKey = (event) => {
      if (event.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    skipRef.current?.focus({ preventScroll: true })
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(skipTimer.current)
      skipTimer.current = 0
      window.removeEventListener('keydown', onKey)
    }
  }, [finish, skip])

  return (
    <div className={`wi-overlay ${leaving ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label="Welcome to Sugar Factory ERP">
      <div className="wi-bg">
        <FieldScene />
      </div>

      <div className="wi-cast-wrap">
        <div className="wi-cast">
          <CastScene />
        </div>
      </div>

      <ForegroundLeaves side="left" />
      <ForegroundLeaves side="right" />

      <div className="wi-motes" aria-hidden="true">
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="wi-mote"
            style={{
              left: `${m.left}%`,
              bottom: `${m.bottom}%`,
              width: m.size,
              height: m.size,
              '--du': `${m.dur}s`,
              '--dl': `${m.delay}s`,
              '--dx': `${m.dx}px`,
              '--rise': `-${m.rise}vh`,
            }}
          />
        ))}
      </div>
      <div className="wi-vignette" aria-hidden="true" />

      <div className="wi-title-wrap">
        <h2 className="wi-title">Welcome to our website!</h2>
        <span className="wi-rule" aria-hidden="true" />
        <p className="wi-sub">Cane to cash, in one system</p>
      </div>

      <div className="wi-flash" aria-hidden="true" />
      <div className="wi-bursts" aria-hidden="true">
        {BURST.map((b, i) => (
          <span
            key={i}
            className={`wi-burst ${b.gem ? 'is-gem' : ''}`}
            style={{ width: b.size, height: b.size, '--dx': `${b.dx}vw`, '--dy': `${b.dy}vh`, '--s': b.s, animationDelay: `${b.delay}ms` }}
          />
        ))}
      </div>
      <div className="wi-wash" aria-hidden="true" />
      {leaving && <div className="wi-wash-skip" aria-hidden="true" />}

      <button ref={skipRef} type="button" className="wi-skip" onClick={skip}>
        Skip Intro <span aria-hidden="true">›</span>
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Login page                                                                  */
/* -------------------------------------------------------------------------- */

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  // True only for an interactive sign-in started on this screen; an already
  // restored session skips the intro and redirects straight away.
  const [welcome, setWelcome] = useState(false)

  const openDashboard = useCallback(() => navigate('/', { replace: true }), [navigate])

  if (isAuthenticated && !welcome) return <Navigate to="/" replace />

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setWelcome(true)
    try {
      await login(form)
      // The welcome animation now plays and then calls openDashboard().
    } catch (requestError) {
      setWelcome(false)
      setError(apiError(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sf-login relative flex min-h-full items-center justify-center overflow-hidden p-4">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-white/[0.07]" viewBox="0 0 1200 140" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
        {Array.from({ length: 40 }, (_, index) => {
          const x = 14 + index * 29 + ((index * 5) % 5) * 3
          const height = 46 + ((index * 5) % 7) * 11
          return (
            <g key={x}>
              <rect x={x} y={140 - height} width="5" height={height} rx="2.5" />
              <path d={`M${x + 2.5} ${140 - height} q-16 -4 -22 -18 q14 1 22 18z M${x + 2.5} ${140 - height} q16 -6 24 -20 q-16 3 -24 20z`} />
            </g>
          )
        })}
      </svg>
      <div className="sf-rise relative w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-xl font-bold">SF</span>
          <h1 className="text-2xl font-semibold">Sugar Factory ERP</h1>
          <p className="text-sm text-white/85">Cane to cash, in one system</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          {error && (
            <Alert title={error.message} onClose={() => setError(null)}>
              {error.details?.length ? <ul className="mt-1 list-inside list-disc text-xs">{error.details.map((d) => <li key={d}>{d}</li>)}</ul> : null}
            </Alert>
          )}

          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="username"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Demo super admin: <span className="font-medium text-slate-700">admin@sugarfactory.com</span> /{' '}
            <span className="font-medium text-slate-700">Admin@12345</span>
          </p>
        </form>
      </div>

      {welcome && isAuthenticated && <WelcomeIntro onDone={openDashboard} />}
    </div>
  )
}