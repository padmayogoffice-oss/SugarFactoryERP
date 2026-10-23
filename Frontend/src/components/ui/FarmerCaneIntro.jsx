import { useCallback, useEffect, useRef } from 'react'
import '../../styles/farmerAnimation.css'

/**
 * Intro animation for "New Farmer": a farmer (dhotar, topi, gamcha) walks with a
 * bundle of sugarcane on his shoulder, it slips and falls, he bends down and lifts
 * it again - and while he lifts it, `onLift` fires so the caller can open the
 * new-record form. `onEnd` fires once the overlay has faded out (unmount there).
 * The motion itself is pure CSS (see styles/farmerAnimation.css, 4.65s timeline).
 */
const LIFT_CALLBACK_AT = 3750
const END_AT = 4650

const SKIN = '#c68b59'
const STALKS = [-2, -1, 0, 1, 2]
const LEGS = [
  { id: 'a', x: -1 },
  { id: 'b', x: 2 },
]

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function Arm({ x, className }) {
  return (
    <g className={`fci-arm-move ${className}`}>
      <g className={className === 'fci-arm-back' ? 'fci-arm-swing' : undefined}>
        <line x1={x} y1="-125" x2={x} y2="-82" stroke="#d6d6d6" strokeWidth="12" strokeLinecap="round" />
        <line x1={x} y1="-125" x2={x} y2="-82" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
        <circle cx={x} cy="-77" r="5" fill={SKIN} />
      </g>
    </g>
  )
}

export default function FarmerCaneIntro({ onLift, onEnd }) {
  const callbacks = useRef({ onLift, onEnd })
  const lifted = useRef(false)
  const ended = useRef(false)

  useEffect(() => {
    callbacks.current = { onLift, onEnd }
  })

  const fireLift = useCallback(() => {
    if (lifted.current) return
    lifted.current = true
    callbacks.current.onLift?.()
  }, [])

  const fireEnd = useCallback(() => {
    if (ended.current) return
    ended.current = true
    callbacks.current.onEnd?.()
  }, [])

  const skip = useCallback(() => {
    fireLift()
    fireEnd()
  }, [fireLift, fireEnd])

  useEffect(() => {
    if (prefersReducedMotion()) {
      skip()
      return undefined
    }
    const timers = [setTimeout(fireLift, LIFT_CALLBACK_AT), setTimeout(fireEnd, END_AT)]
    return () => timers.forEach(clearTimeout)
  }, [skip, fireLift, fireEnd])

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') skip() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip])

  return (
    <div className="fci-overlay" role="dialog" aria-label="Farmer registration">
      <div className="fci-card">
        <button type="button" className="fci-skip" onClick={skip}>Skip ›</button>
        <svg className="fci-svg" viewBox="0 0 640 280" aria-hidden="true">
          <defs>
            <linearGradient id="fci-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#bfe6ff" />
              <stop offset="1" stopColor="#fff4d6" />
            </linearGradient>
          </defs>
          <rect width="640" height="280" fill="url(#fci-sky)" />
          <circle cx="560" cy="55" r="26" fill="#ffd45c" />
          <path d="M0 170 Q120 120 240 165 T480 160 T640 150 V210 H0Z" fill="#9ccf7a" />
          {Array.from({ length: 14 }, (_, i) => {
            const x = 20 + i * 46
            return (
              <g key={i} opacity="0.75">
                <line x1={x} y1="205" x2={x + 4} y2="140" stroke="#5f9a33" strokeWidth="5" strokeLinecap="round" />
                <path d={`M${x + 4},146 q18,-6 30,8 q-18,2 -30,-8z`} fill="#7cb342" />
                <path d={`M${x + 4},158 q-18,-6 -28,8 q18,2 28,-8z`} fill="#7cb342" />
              </g>
            )
          })}
          <rect y="205" width="640" height="75" fill="#8c6a43" />
          <rect y="205" width="640" height="10" fill="#6fa83f" />

          <g transform="translate(0,205)">
            <g className="fci-walker">
              <ellipse cx="0" cy="2" rx="28" ry="5" fill="rgba(0,0,0,.18)" />

              {/* dhotar (white dhoti) with pleats, bare ankles, kolhapuri chappals */}
              <g className="fci-leg-crouch">
                {LEGS.map(({ id, x }) => (
                  <g key={id} className={`fci-leg-swing fci-leg-swing-${id}`}>
                    <path d={`M${x - 9},-84 L${x + 9},-84 L${x + 7},-20 L${x - 7},-20Z`} fill="#f7f1e1" stroke="#d9cdb0" strokeWidth="1.2" />
                    <line x1={x - 2} y1="-80" x2={x - 2} y2="-22" stroke="#e3d9bf" strokeWidth="1.2" />
                    <line x1={x + 3} y1="-80" x2={x + 3} y2="-22" stroke="#e3d9bf" strokeWidth="1.2" />
                    <rect x={x - 4} y="-22" width="8" height="15" fill={SKIN} />
                    <path d={`M${x - 8},-6 L${x + 12},-6 Q${x + 14},-2 ${x + 10},-1 L${x - 8},-1Z`} fill="#6b4423" />
                  </g>
                ))}
              </g>

              {/* upper body */}
              <g className="fci-body-move">
                <g className="fci-body-bob">
                  <Arm x="0" className="fci-arm-back" />
                  {/* white long shirt (pandhra shirt) */}
                  <path d="M-16,-133 Q0,-141 16,-133 L20,-62 Q0,-56 -20,-62Z" fill="#ffffff" stroke="#d6d6d6" strokeWidth="1.5" />
                  <line x1="0" y1="-136" x2="0" y2="-60" stroke="#e5e5e5" strokeWidth="1.2" />
                  <circle cx="3" cy="-118" r="1.2" fill="#c9c9c9" />
                  <circle cx="3" cy="-104" r="1.2" fill="#c9c9c9" />
                  <circle cx="3" cy="-90" r="1.2" fill="#c9c9c9" />
                  {/* gamcha (checked towel) around the neck */}
                  <path d="M-14,-136 Q0,-127 14,-136 L16,-128 Q0,-117 -16,-128Z" fill="#c2410c" />
                  <path d="M-13,-127 l-5,36 l10,2 l5,-35z" fill="#c2410c" />
                  <line x1="-16" y1="-110" x2="-9" y2="-109" stroke="#fed7aa" strokeWidth="1.5" />
                  <line x1="-17" y1="-100" x2="-10" y2="-99" stroke="#fed7aa" strokeWidth="1.5" />
                  {/* head */}
                  <rect x="-4" y="-148" width="8" height="13" fill={SKIN} />
                  <circle cx="0" cy="-158" r="14" fill={SKIN} />
                  <circle cx="-9" cy="-157" r="3" fill="#b87a4b" />
                  <circle cx="7" cy="-159" r="1.8" fill="#222" />
                  <path d="M3,-164 q5,-2 9,0" stroke="#2b1d12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  <path d="M2,-153 q7,-3 13,1 q-7,4 -13,-1z" fill="#2b1d12" />
                  {/* Gandhi topi */}
                  <path d="M-15.5,-162 Q-15,-183 0,-183 Q15,-183 15.5,-162 Q0,-158 -15.5,-162Z" fill="#ffffff" stroke="#d6d6d6" strokeWidth="1.2" />
                  <path d="M-15.5,-162 Q0,-158 15.5,-162 L15.5,-167 Q0,-163 -15.5,-167Z" fill="#f0f0f0" stroke="#d6d6d6" strokeWidth="1.2" />
                  <path d="M-6,-182 Q0,-187 6,-182" stroke="#d6d6d6" strokeWidth="1.2" fill="none" />
                  <Arm x="3" className="fci-arm-reach" />
                </g>
              </g>

              {/* sugarcane bundle carried over the shoulder, centre at (10,-140) */}
              <g transform="translate(10,-140)">
                <g className="fci-body-bob">
                  <g className="fci-cane">
                    {STALKS.map((k) => {
                      const dx = k * 3.5
                      const dy = k * 5.5
                      const colour = k % 2 === 0 ? '#7b3f98' : '#9fbf2a'
                      return (
                        <g key={k} className="fci-stalk">
                          <line x1={-60 + dx} y1={40 + dy} x2={60 + dx} y2={-40 + dy} stroke={colour} strokeWidth="7" strokeLinecap="round" />
                          <line x1={-60 + dx} y1={40 + dy} x2={60 + dx} y2={-40 + dy} stroke="rgba(0,0,0,.25)" strokeWidth="7" strokeDasharray="1.5 14" />
                        </g>
                      )
                    })}
                    <path d="M60,-40 q10,-22 26,-26 q-6,16 -26,26z" fill="#6fae2e" />
                    <path d="M60,-40 q22,-8 34,2 q-16,8 -34,-2z" fill="#7cb342" />
                    <path d="M60,-40 q-2,-24 6,-36 q8,18 -6,36z" fill="#558b2f" />
                  </g>
                </g>
              </g>

              {/* hand gripping the bundle while walking */}
              <g className="fci-body-bob">
                <g className="fci-arm-carry">
                  <line x1="2" y1="-125" x2="20" y2="-142" stroke="#d6d6d6" strokeWidth="12" strokeLinecap="round" />
                  <line x1="2" y1="-125" x2="20" y2="-142" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="21" cy="-143" r="5" fill={SKIN} />
                </g>
              </g>

              <circle className="fci-dust" cx="30" cy="-6" r="8" fill="#d7c4a0" />
              <circle className="fci-dust" cx="50" cy="-4" r="10" fill="#d7c4a0" />
              <circle className="fci-dust" cx="72" cy="-6" r="8" fill="#d7c4a0" />

              <g className="fci-bubble">
                <rect x="-118" y="-196" width="76" height="30" rx="12" fill="#fff" stroke="#e2b857" strokeWidth="2" />
                <path d="M-42,-188 l12,8 l-12,6z" fill="#fff" stroke="#e2b857" strokeWidth="2" strokeLinejoin="round" />
                <rect x="-45" y="-189" width="6" height="14" fill="#fff" />
                <text x="-80" y="-175" textAnchor="middle" fontSize="18" fontWeight="700" fill="#b45309">अरे!</text>
              </g>
            </g>
          </g>
        </svg>
        <div className="fci-caption">
          <strong>शेतकरी नोंदणी</strong>
          <span>Farmer Registration · नवीन नोंद उघडत आहे…</span>
        </div>
      </div>
    </div>
  )
}