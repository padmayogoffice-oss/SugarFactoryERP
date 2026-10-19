/**
 * Dashboard. KPI tiles, season production totals, trend charts, a module overview
 * and the recent activity feed are each rendered only when the API returned them,
 * which happens only when the caller holds the matching permission.
 *
 * Visual layer: gradient hero with floating sugar crystals, count-up numbers,
 * staggered card entrance, an animated recovery gauge and growing chart bars.
 * All animation is CSS (declared in <DashboardStyles />) and is switched off for
 * users who prefer reduced motion. No new packages are used.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/endpoints'
import { apiError } from '../api/client'
import { Alert, Card, EmptyState, Spinner } from '../components/ui'
import { formatNumber } from '../components/ui/Cell'
import { useAuth } from '../context/AuthContext'

/* ------------------------------------------------------------------ styles --- */

function DashboardStyles() {
  return (
    <style>{`
      @keyframes sf-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes sf-float { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 15% { opacity: .75; } 100% { transform: translateY(-150px) rotate(180deg); opacity: 0; } }
      @keyframes sf-wave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes sf-sweep { from { transform: translateX(-120%) skewX(-18deg); } to { transform: translateX(320%) skewX(-18deg); } }
      @keyframes sf-grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      @keyframes sf-grow-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes sf-ring { from { stroke-dashoffset: var(--sf-full); } to { stroke-dashoffset: var(--sf-target); } }
      @keyframes sf-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,.45); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } }
      @keyframes sf-sway { 0%, 100% { transform: rotate(-3.5deg); } 50% { transform: rotate(3.5deg); } }
      @keyframes sf-drive { 0% { transform: translateX(0); opacity: 0; } 8% { opacity: 1; } 68% { transform: translateX(300px); opacity: 1; } 78% { transform: translateX(300px); opacity: 0; } 100% { transform: translateX(0); opacity: 0; } }
      @keyframes sf-hero-truck { from { left: -130px; } to { left: 105%; } }
      @keyframes sf-spin { to { transform: rotate(360deg); } }
      @keyframes sf-spin-rev { to { transform: rotate(-360deg); } }
      @keyframes sf-smoke { 0% { transform: translateY(0) scale(.5); opacity: .8; } 100% { transform: translateY(-55px) scale(1.7); opacity: 0; } }
      @keyframes sf-flow { to { stroke-dashoffset: -26; } }
      @keyframes sf-bubble { 0% { transform: translateY(0) scale(.4); opacity: 0; } 30% { opacity: .9; } 100% { transform: translateY(-26px) scale(1); opacity: 0; } }
      @keyframes sf-pop { 0%, 8% { transform: scale(0); } 18% { transform: scale(1.18); } 26%, 88% { transform: scale(1); } 100% { transform: scale(0); } }
      @keyframes sf-cloud { from { transform: translateX(-30px); } to { transform: translateX(50px); } }
      @keyframes sf-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes sf-seg { from { stroke-dasharray: 0 var(--sf-c); } to { stroke-dasharray: var(--sf-len) var(--sf-c); } }
      .sf-marquee { display: flex; width: max-content; animation: sf-marquee 34s linear infinite; }
      .sf-marquee:hover { animation-play-state: paused; }
      .sf-seg { animation: sf-seg 1.1s cubic-bezier(.2,.7,.2,1) both; transition: opacity .2s ease, stroke-width .2s ease; }
      .sf-tilt { position: relative; transition: transform .18s ease-out, box-shadow .2s ease; transform: perspective(700px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); will-change: transform; }
      .sf-tilt:hover { box-shadow: 0 14px 28px -14px rgba(15,23,42,.4); }
      .sf-spot { pointer-events: none; position: absolute; inset: 0; opacity: 0; transition: opacity .2s ease; background: radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), rgba(16,185,129,.16), transparent 70%); }
      .sf-tilt:hover .sf-spot { opacity: 1; }
      @keyframes sf-belt { to { stroke-dashoffset: -24; } }
      @keyframes sf-carry { 0% { transform: translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(var(--sf-run, 520px)); opacity: 0; } }
      @keyframes sf-active { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
      .sf-trans { transition: transform 2s ease-in-out, opacity .6s ease, fill .6s ease; }
      .sf-level { transform-box: fill-box; transform-origin: 50% 100%; transition: transform 1.6s ease-in-out, fill .8s ease; }
      .sf-belt { stroke-dasharray: 10 14; animation: sf-belt .8s linear infinite; }
      .sf-carry { animation: sf-carry 4s linear infinite; }
      .sf-pill-active { animation: sf-active 1.2s ease-in-out infinite; }
      .sf-sway { transform-box: fill-box; transform-origin: 50% 100%; animation: sf-sway 3.6s ease-in-out infinite; }
      .sf-drive { animation: sf-drive 9s ease-in-out infinite; }
      .sf-hero-truck { position: absolute; bottom: 6px; animation: sf-hero-truck 16s linear infinite; }
      .sf-spin { transform-box: fill-box; transform-origin: center; animation: sf-spin 2.4s linear infinite; }
      .sf-spin-rev { transform-box: fill-box; transform-origin: center; animation: sf-spin-rev 2.4s linear infinite; }
      .sf-smoke { transform-box: fill-box; transform-origin: center; animation: sf-smoke 3.2s ease-out infinite; }
      .sf-flow { stroke-dasharray: 8 18; animation: sf-flow 1s linear infinite; }
      .sf-bubble { transform-box: fill-box; transform-origin: center; animation: sf-bubble 2.2s ease-in infinite; }
      .sf-pop { transform-box: fill-box; transform-origin: 50% 100%; animation: sf-pop 7s ease-in-out infinite; }
      .sf-cloud { animation: sf-cloud 14s ease-in-out infinite alternate; }
      .sf-rise { opacity: 0; animation: sf-rise .55s cubic-bezier(.2,.7,.2,1) forwards; }
      .sf-crystal { position: absolute; bottom: -10px; border-radius: 3px; background: rgba(255,255,255,.55); animation: sf-float linear infinite; }
      .sf-wave { animation: sf-wave 14s linear infinite; }
      .sf-sweep { animation: sf-sweep 5.5s ease-in-out infinite; }
      .sf-grow-y { transform-origin: bottom; animation: sf-grow-y .8s cubic-bezier(.2,.7,.2,1) both; }
      .sf-grow-x { transform-origin: left; animation: sf-grow-x .9s cubic-bezier(.2,.7,.2,1) both; }
      .sf-ring { animation: sf-ring 1.4s cubic-bezier(.2,.7,.2,1) .25s both; }
      .sf-live { animation: sf-pulse 2s ease-in-out infinite; }
      .sf-lift { transition: transform .2s ease, box-shadow .2s ease; }
      .sf-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 24px -12px rgba(15,23,42,.35); }
      @media (prefers-reduced-motion: reduce) {
        .sf-rise, .sf-crystal, .sf-wave, .sf-sweep, .sf-grow-y, .sf-grow-x, .sf-ring, .sf-live, .sf-sway, .sf-drive, .sf-hero-truck, .sf-spin, .sf-spin-rev, .sf-smoke, .sf-flow, .sf-bubble, .sf-pop, .sf-cloud, .sf-marquee, .sf-seg, .sf-belt, .sf-carry, .sf-pill-active { animation: none !important; opacity: 1; }
        .sf-trans, .sf-level { transition: none !important; }
        .sf-tilt { transform: none !important; }
        .sf-ring { stroke-dashoffset: var(--sf-target); }
        .sf-lift { transition: none; }
      }
    `}</style>
  )
}

/* ----------------------------------------------------------------- helpers --- */

const TONES = {
  emerald: { icon: 'from-emerald-500 to-teal-500', bar: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700' },
  sky: { icon: 'from-sky-500 to-cyan-500', bar: 'bg-sky-500', soft: 'bg-sky-50 text-sky-700' },
  violet: { icon: 'from-violet-500 to-fuchsia-500', bar: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700' },
  amber: { icon: 'from-amber-500 to-orange-500', bar: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700' },
  red: { icon: 'from-rose-500 to-red-500', bar: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700' },
  slate: { icon: 'from-slate-500 to-slate-700', bar: 'bg-slate-500', soft: 'bg-slate-100 text-slate-700' },
}
const TONE_ORDER = ['emerald', 'sky', 'violet', 'amber', 'red', 'slate']

const ICON_PATHS = {
  sprout: 'M12 21v-8m0 0c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Zm0 0c0-3 2-5 5-5 0 3-2 5-5 5Z',
  box: 'M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5',
  cart: 'M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6M9 19.5h.01M17 19.5h.01',
  truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18.5h.01M17 18.5h.01',
  wallet: 'M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12M16 13.5h.01',
  users: 'M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 8v-1a4 4 0 0 0-3-3.9M15 5.2a3 3 0 0 1 0 5.6',
  wrench: 'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6 2.6-2.2Z',
  flask: 'M9 3h6M10 3v6L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3M7.5 15h9',
  default: 'M4 19V9m6 10V5m6 14v-7m4 7H2',
}

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICON_PATHS[name] || ICON_PATHS.default} />
    </svg>
  )
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Counts from 0 up to `value` once it is known. Non-numeric values are returned as is. */
function useCountUp(value, duration = 1100) {
  const target = typeof value === 'number' && Number.isFinite(value) ? value : null
  const [display, setDisplay] = useState(target === null || prefersReducedMotion() ? target : 0)
  const frame = useRef(0)

  useEffect(() => {
    if (target === null || prefersReducedMotion()) {
      frame.current = requestAnimationFrame(() => setDisplay(target))
      return () => cancelAnimationFrame(frame.current)
    }
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(target * eased)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return target === null ? value : display
}

function CountUp({ value }) {
  const shown = useCountUp(value)
  return typeof shown === 'number'
    ? shown.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : (shown ?? '—')
}

/** Ticks once a second so the clock and shift progress stay live. */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

/** Typical three-shift pattern: A 06-14, B 14-22, C 22-06. */
function shiftInfo(now) {
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes >= 360 && minutes < 840) return { name: 'A', progress: (minutes - 360) / 480 }
  if (minutes >= 840 && minutes < 1320) return { name: 'B', progress: (minutes - 840) / 480 }
  return { name: 'C', progress: (minutes >= 1320 ? minutes - 1320 : minutes + 120) / 480 }
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(value) {
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days < 30 ? `${days} d ago` : new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function activityTone(entry) {
  const text = `${entry.description || ''} ${entry.action || ''}`.toLowerCase()
  if (text.includes('delet')) return 'bg-rose-500'
  if (text.includes('creat')) return 'bg-emerald-500'
  if (text.includes('updat') || text.includes('edit')) return 'bg-sky-500'
  if (text.includes('login')) return 'bg-violet-500'
  return 'bg-slate-400'
}

/* -------------------------------------------------------------- components --- */

/** Live clock with the current shift and how far through it we are. */
function LiveClock() {
  const now = useNow()
  const shift = shiftInfo(now)
  return (
    <div className="min-w-[150px] rounded-xl bg-white/15 px-4 py-2 backdrop-blur" title="Shift timings assumed: A 06-14, B 14-22, C 22-06">
      <p className="text-xl font-semibold tabular-nums">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
      <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-emerald-50/80">
        <span>Shift {shift.name}</span>
        <span>{Math.round(shift.progress * 100)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-emerald-200 transition-all duration-1000" style={{ width: `${Math.round(shift.progress * 100)}%` }} />
      </div>
    </div>
  )
}

/** Gradient welcome banner with drifting sugar crystals and a moving wave. */
function Hero({ name, production, moduleCount }) {
  const crystals = useMemo(
    () => Array.from({ length: 14 }, (_, index) => ({
      left: `${4 + ((index * 7.3) % 92)}%`,
      size: 5 + ((index * 5) % 9),
      duration: 7 + ((index * 1.7) % 6),
      delay: -((index * 1.3) % 9),
    })),
    [],
  )
  const today = useMemo(() => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), [])

  return (
    <header className="sf-rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 px-6 pb-14 pt-6 text-white shadow-lg sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {crystals.map((crystal, index) => (
          <span
            key={index}
            className="sf-crystal"
            style={{ left: crystal.left, width: crystal.size, height: crystal.size, animationDuration: `${crystal.duration}s`, animationDelay: `${crystal.delay}s` }}
          />
        ))}
        <div className="sf-sweep absolute inset-y-0 left-0 w-24 bg-white/10" />
        <div className="sf-hero-truck">
          <svg viewBox="0 0 120 50" className="h-9 w-[86px]">
            <g fill="#f8fafc" fillOpacity=".9">
              <rect x="4" y="18" width="70" height="20" rx="2" />
              <path d="M78 22h16l12 10v6H78z" />
            </g>
            {[10, 22, 34, 46, 58].map((x, i) => (
              <rect key={x} x={x} y={4 + (i % 2) * 3} width="5" height="16" rx="2.5" fill="#bbf7d0" transform={`rotate(${i % 2 ? 8 : -8} ${x + 2} 20)`} />
            ))}
            {[24, 92].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="40" r="7" fill="#0f172a" />
                <g className="sf-spin"><circle cx={cx} cy="40" r="3" fill="#94a3b8" /><path d={`M${cx - 3} 40h6`} stroke="#0f172a" strokeWidth="1.2" /></g>
              </g>
            ))}
          </svg>
        </div>
        <svg className="sf-wave absolute -bottom-px left-0 h-10 w-[200%] text-white/15" viewBox="0 0 1200 40" preserveAspectRatio="none">
          <path d="M0 20 Q150 0 300 20 T600 20 T900 20 T1200 20 V40 H0Z" fill="currentColor" />
        </svg>
        <svg className="sf-wave absolute -bottom-px left-0 h-6 w-[200%] text-white/20" style={{ animationDuration: '9s' }} viewBox="0 0 1200 40" preserveAspectRatio="none">
          <path d="M0 24 Q150 8 300 24 T600 24 T900 24 T1200 24 V40 H0Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="sf-live h-2 w-2 rounded-full bg-emerald-300" />
            {today}
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}{name ? `, ${name}` : ''} 👋
          </h1>
          <p className="mt-1 max-w-xl text-sm text-emerald-50/90">
            {production?.entries
              ? `Current season: ${formatNumber(production.caneCrushedMt)} MT cane crushed at ${production.recoveryPercent}% recovery.`
              : 'No crushing data recorded yet. Add shift production entries to populate this dashboard.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LiveClock />
          <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur">
            <p className="text-xl font-semibold tabular-nums"><CountUp value={moduleCount} /></p>
            <p className="text-[11px] uppercase tracking-wide text-emerald-50/80">Modules</p>
          </div>
          <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur">
            <p className="text-xl font-semibold tabular-nums">{production?.entries ? <CountUp value={production.entries} /> : '0'}</p>
            <p className="text-[11px] uppercase tracking-wide text-emerald-50/80">Shift entries</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function KpiCard({ kpi, index }) {
  const tone = TONES[TONE_ORDER[index % TONE_ORDER.length]]
  const cardRef = useRef(null)

  function handleMove(event) {
    const el = cardRef.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    el.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${((0.5 - y) * 8).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
  }

  function handleLeave() {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div className="sf-rise" style={{ animationDelay: `${120 + index * 60}ms` }}>
      <div ref={cardRef} onMouseMove={handleMove} onMouseLeave={handleLeave} className="sf-tilt card overflow-hidden px-4 py-4">
        <span className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`} />
        <span className="sf-spot" />
        <div className="relative flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${tone.icon}`}>
            <Icon name={kpi.icon} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-800"><CountUp value={kpi.value} /></p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Scrolling strip of live KPI values; pauses on hover. */
function Ticker({ kpis }) {
  const items = [...kpis, ...kpis]
  return (
    <div className="sf-rise overflow-hidden rounded-full border border-slate-200 bg-white py-2 shadow-sm" style={{ animationDelay: '80ms' }} aria-label="Key figures">
      <div className="sf-marquee">
        {items.map((kpi, index) => (
          <span key={`${kpi.key}-${index}`} className="mx-5 flex shrink-0 items-center gap-2 text-xs text-slate-500">
            <span className={`h-2 w-2 rounded-full ${TONES[TONE_ORDER[index % kpis.length % TONE_ORDER.length]].bar}`} />
            {kpi.label}
            <strong className="tabular-nums text-slate-800">{typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : kpi.value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

const QUICK_LINKS = [
  { module: 'cane', key: 'farmer', label: 'Farmers', icon: 'sprout' },
  { module: 'production', key: 'shiftProduction', label: 'Shift production', icon: 'box' },
  { module: 'procurement', key: 'purchaseOrder', label: 'Purchase orders', icon: 'cart' },
  { module: 'sales', key: 'salesOrder', label: 'Sales orders', icon: 'truck' },
  { module: 'stores', key: 'stockLedger', label: 'Stock ledger', icon: 'box' },
  { module: 'hr', key: 'employee', label: 'Employees', icon: 'users' },
  { module: 'maintenance', key: 'breakdownMaintenance', label: 'Breakdowns', icon: 'wrench' },
  { module: 'quality', key: 'labTest', label: 'Lab tests', icon: 'flask' },
]

/** One-click shortcuts to the screens this user can open. */
function QuickActions({ navigation }) {
  const links = QUICK_LINKS.filter((link) =>
    navigation?.modules?.some((moduleDef) => moduleDef.key === link.module && moduleDef.submodules.some((submodule) => submodule.key === link.key)),
  )
  if (!links.length) return null
  return (
    <section className="sf-rise" style={{ animationDelay: '140ms' }}>
      <h2 className="mb-2 text-sm font-semibold text-slate-800">Quick access</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => (
          <Link key={link.key} to={`/m/${link.module}/${link.key}`} className="sf-lift group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${TONES[TONE_ORDER[index % TONE_ORDER.length]].soft}`}>
              <Icon name={link.icon} className="h-3.5 w-3.5" />
            </span>
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

const DONUT_COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e', '#64748b', '#14b8a6', '#6366f1', '#ec4899', '#84cc16', '#06b6d4', '#f97316', '#a855f7', '#22c55e']

/** Animated donut of stored records per module; hovering a legend row highlights its slice. */
function RecordsDonut({ overview }) {
  const [active, setActive] = useState(null)
  const total = overview.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <Card title="Records by module" subtitle="Share of stored records">
      <div className="flex flex-wrap items-center gap-6 px-5 py-5">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
            {total > 0 && overview.map((item, index) => {
              const length = Math.max((item.total / total) * circumference - 1.2, 0)
              const segment = (
                <circle
                  key={item.module}
                  className="sf-seg"
                  cx="50" cy="50" r={radius} fill="none"
                  stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
                  strokeWidth={active === index ? 17 : 14}
                  strokeDashoffset={-offset}
                  opacity={active === null || active === index ? 1 : 0.3}
                  style={{ '--sf-len': length, '--sf-c': circumference, strokeDasharray: `${length} ${circumference}`, animationDelay: `${index * 60}ms` }}
                />
              )
              offset += (item.total / total) * circumference
              return segment
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tabular-nums text-slate-800"><CountUp value={total} /></span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Records</span>
          </div>
        </div>
        <ul className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {overview.map((item, index) => (
            <li
              key={item.module}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              className="flex cursor-default items-center justify-between gap-2 rounded-md px-2 py-1 text-xs hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-semibold tabular-nums text-slate-800">{Number(item.total).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

/** Circular gauge whose stroke draws itself on load. */
function RecoveryRing({ percent }) {
  const radius = 42
  const full = 2 * Math.PI * radius
  const target = full * (1 - Math.min(Math.max(Number(percent) || 0, 0) / 15, 1))
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="9" />
        <circle
          className="sf-ring"
          cx="50" cy="50" r={radius} fill="none" stroke="url(#sf-gauge)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={full}
          style={{ '--sf-full': full, '--sf-target': target, strokeDashoffset: target }}
        />
        <defs>
          <linearGradient id="sf-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums"><CountUp value={Number(percent) || 0} />%</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-300">Recovery</span>
      </div>
    </div>
  )
}

/** Animated "cane to sugar" process scene: field -> truck -> mill -> boiling pan -> sugar bags. */
function CaneScene({ production }) {
  const stalks = [
    { x: 24, h: 104 }, { x: 44, h: 128 }, { x: 64, h: 96 }, { x: 84, h: 136 },
    { x: 104, h: 112 }, { x: 124, h: 124 }, { x: 144, h: 100 }, { x: 164, h: 130 },
  ]
  const stages = [
    { title: 'Cane crushed', value: production?.caneCrushedMt, unit: 'MT', tone: 'text-emerald-700' },
    { title: 'Recovery', value: production?.recoveryPercent, unit: '%', tone: 'text-sky-700' },
    { title: 'Molasses', value: production?.molassesProducedMt, unit: 'MT', tone: 'text-amber-700' },
    { title: 'Sugar produced', value: production?.sugarProducedMt, unit: 'MT', tone: 'text-violet-700' },
  ]
  return (
    <section className="sf-rise overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ animationDelay: '260ms' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">From cane to sugar</h2>
          <p className="text-xs text-slate-500">Field → crushing mill → boiling house → sugar bags</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="sf-live h-2 w-2 rounded-full bg-emerald-500" /> Season in progress
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 960 230" className="mx-auto block h-auto w-full min-w-[640px]" role="img" aria-label="Animated illustration: sugarcane is trucked to the mill, crushed, boiled and bagged as sugar">
          <defs>
            <linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#ecfdf5" />
            </linearGradient>
          </defs>
          <rect width="960" height="230" fill="url(#sf-sky)" />

          {/* sun and clouds */}
          <circle cx="880" cy="42" r="20" fill="#fde68a" />
          <g className="sf-spin" style={{ animationDuration: '30s' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1="880" y1="8" x2="880" y2="14" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 45} 880 42)`} />
            ))}
          </g>
          <g className="sf-cloud" fill="#fff" fillOpacity=".9">
            <ellipse cx="300" cy="40" rx="34" ry="11" /><ellipse cx="324" cy="33" rx="22" ry="10" />
          </g>
          <g className="sf-cloud" style={{ animationDuration: '19s' }} fill="#fff" fillOpacity=".8">
            <ellipse cx="640" cy="60" rx="30" ry="9" /><ellipse cx="660" cy="54" rx="20" ry="8" />
          </g>

          {/* ground and road */}
          <rect y="180" width="960" height="50" fill="#bbf7d0" />
          <rect y="182" width="960" height="14" fill="#64748b" />
          <line x1="0" y1="189" x2="960" y2="189" stroke="#f8fafc" strokeWidth="2" strokeDasharray="14 12" />

          {/* 1. cane field: swaying stalks */}
          {stalks.map((stalk, index) => (
            <g key={stalk.x} className="sf-sway" style={{ animationDelay: `${index * -0.45}s` }}>
              <rect x={stalk.x} y={180 - stalk.h} width="7" height={stalk.h} rx="3" fill="#4d7c0f" />
              {[0.25, 0.5, 0.75].map((t) => (
                <line key={t} x1={stalk.x} x2={stalk.x + 7} y1={180 - stalk.h * t} y2={180 - stalk.h * t} stroke="#bef264" strokeWidth="1.4" />
              ))}
              <path d={`M${stalk.x + 3} ${180 - stalk.h} q-18 -6 -24 -22 q16 2 24 22z`} fill="#65a30d" />
              <path d={`M${stalk.x + 4} ${180 - stalk.h} q18 -8 26 -24 q-18 4 -26 24z`} fill="#84cc16" />
            </g>
          ))}

          {/* 2. truck carrying cane to the mill */}
          <g className="sf-drive">
            <g transform="translate(40 142)">
              <rect x="0" y="12" width="74" height="22" rx="2" fill="#f59e0b" />
              {[6, 17, 28, 39, 50, 61].map((x, i) => (
                <rect key={x} x={x} y={-6 + (i % 2) * 4} width="6" height="22" rx="3" fill="#65a30d" transform={`rotate(${i % 2 ? 10 : -10} ${x + 3} 14)`} />
              ))}
              <path d="M78 16h16l12 11v7H78z" fill="#ef4444" />
              <rect x="86" y="19" width="9" height="7" rx="1" fill="#e0f2fe" />
              {[20, 92].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy="36" r="9" fill="#0f172a" />
                  <g className="sf-spin" style={{ animationDuration: '0.7s' }}>
                    <circle cx={cx} cy="36" r="4" fill="#94a3b8" />
                    <path d={`M${cx - 4} 36h8M${cx} 32v8`} stroke="#0f172a" strokeWidth="1.3" />
                  </g>
                </g>
              ))}
            </g>
          </g>

          {/* 3. crushing mill with chimney smoke and turning rollers */}
          <rect x="420" y="96" width="150" height="84" rx="4" fill="#64748b" />
          <rect x="420" y="88" width="150" height="12" rx="3" fill="#475569" />
          <rect x="530" y="40" width="22" height="52" fill="#475569" />
          <rect x="526" y="36" width="30" height="7" rx="2" fill="#334155" />
          {[0, 1, 2].map((i) => (
            <circle key={i} className="sf-smoke" cx="541" cy="32" r="9" fill="#e2e8f0" style={{ animationDelay: `${i * -1.05}s` }} />
          ))}
          <rect x="436" y="112" width="60" height="22" rx="3" fill="#cbd5e1" />
          <text x="466" y="127" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">MILL</text>
          {[{ cx: 454, rev: false }, { cx: 494, rev: true }].map((roller) => (
            <g key={roller.cx}>
              <circle cx={roller.cx} cy="156" r="18" fill="#1e293b" />
              <g className={roller.rev ? 'sf-spin-rev' : 'sf-spin'}>
                <circle cx={roller.cx} cy="156" r="14" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6 5" />
                <line x1={roller.cx - 12} y1="156" x2={roller.cx + 12} y2="156" stroke="#cbd5e1" strokeWidth="2" />
                <line x1={roller.cx} y1="144" x2={roller.cx} y2="168" stroke="#cbd5e1" strokeWidth="2" />
              </g>
            </g>
          ))}

          {/* juice pipe */}
          <path d="M570 160 H650" stroke="#92400e" strokeOpacity=".25" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path className="sf-flow" d="M570 160 H650" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* 4. boiling pan with bubbles */}
          <path d="M650 128 h110 v38 q0 14 -14 14 h-82 q-14 0 -14 -14z" fill="#b45309" />
          <rect x="646" y="122" width="118" height="9" rx="4" fill="#78350f" />
          <rect x="656" y="132" width="98" height="10" rx="5" fill="#fbbf24" />
          {[672, 700, 728, 744].map((cx, i) => (
            <circle key={cx} className="sf-bubble" cx={cx} cy="128" r="5" fill="#fde68a" style={{ animationDelay: `${i * -0.55}s` }} />
          ))}
          <path d="M696 122 q-5 -12 0 -22 M720 122 q-5 -12 0 -22" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" fill="none" className="sf-flow" />

          {/* 5. sugar bags popping in one after another */}
          {[790, 826, 862, 898].map((x, i) => (
            <g key={x} className="sf-pop" style={{ animationDelay: `${i * 0.6}s` }}>
              <rect x={x} y={i % 2 ? 140 : 152} width="30" height={i % 2 ? 40 : 28} rx="5" fill="#f8fafc" stroke="#cbd5e1" />
              <rect x={x + 4} y={(i % 2 ? 140 : 152) + 8} width="22" height="10" rx="2" fill="#a78bfa" />
              <text x={x + 15} y={(i % 2 ? 140 : 152) + 16} textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff">SUGAR</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-4 sm:divide-y-0">
        {stages.map((stage) => (
          <div key={stage.title} className="px-4 py-3">
            <p className="text-xs text-slate-500">{stage.title}</p>
            <p className={`text-lg font-semibold tabular-nums ${stage.tone}`}>
              {stage.value === undefined || stage.value === null ? '—' : <CountUp value={Number(stage.value) || 0} />}
              {stage.value !== undefined && stage.value !== null && <span className="ml-1 text-xs font-normal text-slate-400">{stage.unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProductionBand({ production }) {
  const items = [
    { label: 'Cane crushed', value: production.caneCrushedMt, unit: 'MT', dot: 'bg-emerald-400' },
    { label: 'Sugar produced', value: production.sugarProducedMt, unit: 'MT', dot: 'bg-sky-400' },
    { label: 'Molasses', value: production.molassesProducedMt, unit: 'MT', dot: 'bg-amber-400' },
    { label: 'Bagasse', value: production.bagasseProducedMt, unit: 'MT', dot: 'bg-slate-300' },
  ]
  return (
    <section className="sf-rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-5 text-white shadow-lg sm:p-6" style={{ animationDelay: '200ms' }}>
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold">Season production</h2>
          <p className="text-xs text-slate-300">Totals across all recorded shifts</p>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {items.map((item) => (
              <div key={item.label}>
                <p className="flex items-center gap-2 text-xs text-slate-300">
                  <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  <CountUp value={item.value} /> <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        <RecoveryRing percent={production.recoveryPercent} />
      </div>
    </section>
  )
}

/** Vertical column chart for daily trends; columns grow in with a stagger. */
function ColumnChart({ items, unit, tone }) {
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1)
  return (
    <div className="flex h-44 items-end gap-1.5 px-4 pb-3 pt-6">
      {items.map((item, index) => {
        const value = Number(item.value) || 0
        return (
          <div key={`${item.label}-${index}`} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${item.label}: ${value.toLocaleString('en-IN')}${unit}`}>
            <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
              {value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{unit}
            </span>
            <div className={`sf-grow-y w-full rounded-t-md bg-gradient-to-t opacity-90 transition group-hover:opacity-100 ${tone}`} style={{ height: `${Math.max((value / max) * 100, 3)}%`, animationDelay: `${index * 45}ms` }} />
            <span className="mt-1 truncate text-center text-[9px] text-slate-400">{String(item.label).slice(-5)}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Horizontal bar list whose bars grow in with a stagger. */
function GrowBars({ items, unit = '', tone = 'from-emerald-500 to-teal-400' }) {
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1)
  return (
    <ul className="space-y-3 px-4 py-4">
      {items.map((item, index) => {
        const value = Number(item.value) || 0
        return (
          <li key={`${item.label}-${index}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-slate-600">{item.label ?? 'Unknown'}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-800">{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}{unit}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`sf-grow-x h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${Math.max((value / max) * 100, 2)}%`, animationDelay: `${index * 70}ms` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ModuleGlance({ overview }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Modules at a glance</h2>
          <p className="text-xs text-slate-500">Records stored in each area of the ERP</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {overview.map((item, index) => {
          const tone = TONES[TONE_ORDER[index % TONE_ORDER.length]]
          const first = item.submodules[0]
          return (
            <div key={item.module} className="sf-rise sf-lift card flex flex-col px-4 py-4" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${tone.soft}`}>
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.submodules.length} sections</p>
                  </div>
                </div>
                <span className="text-lg font-semibold tabular-nums text-slate-700"><CountUp value={item.total} /></span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.submodules.slice(0, 4).map((submodule) => (
                  <Link key={submodule.key} to={`/m/${item.module}/${submodule.key}`} className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition hover:opacity-80 ${tone.soft}`}>
                    {submodule.name}
                  </Link>
                ))}
                {item.submodules.length > 4 && <span className="px-1 py-0.5 text-[11px] text-slate-400">+{item.submodules.length - 4} more</span>}
              </div>
              {first && (
                <Link to={`/m/${item.module}/${first.key}`} className="mt-3 text-xs font-medium text-emerald-700 hover:underline">
                  Open {item.name} →
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

const QUICK_START = [
  { module: 'organization', key: 'factoryRegistration', title: 'Register your factory', text: 'Add the statutory details of your sugar factory.' },
  { module: 'cane', key: 'farmer', title: 'Add cane farmers', text: 'Register the farmers who supply cane.' },
  { module: 'production', key: 'shiftProduction', title: 'Record a shift', text: 'Log crushing and sugar output to light up the charts.' },
]

function QuickStart({ navigation }) {
  const steps = QUICK_START.filter((step) =>
    navigation?.modules?.some((moduleDef) => moduleDef.key === step.module && moduleDef.submodules.some((submodule) => submodule.key === step.key)),
  )
  if (!steps.length) return null
  return (
    <Card title="Get started" subtitle="Three quick steps to bring this dashboard to life">
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <Link key={step.key} to={`/m/${step.module}/${step.key}`} className="sf-lift group flex gap-3 rounded-xl border border-slate-200 p-3 hover:border-emerald-300">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">{index + 1}</span>
            <span>
              <span className="block text-sm font-semibold text-slate-800 group-hover:text-emerald-700">{step.title}</span>
              <span className="block text-xs text-slate-500">{step.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function ActivityFeed({ entries }) {
  return (
    <Card title="Recent activity" subtitle="Latest audited actions">
      <ol className="relative space-y-4 px-5 py-4">
        <span className="absolute bottom-6 left-[27px] top-6 w-px bg-slate-200" aria-hidden="true" />
        {entries.map((entry, index) => (
          <li key={entry._id} className="sf-rise relative flex items-start gap-3" style={{ animationDelay: `${index * 60}ms` }}>
            <span className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white ${activityTone(entry)}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-700">{entry.description || entry.action}</p>
              <p className="truncate text-xs text-slate-400">{entry.module}/{entry.submodule} · {entry.userEmail || 'system'}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">{timeAgo(entry.createdAt)}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/* ------------------------------------------------------------- journeys --- */

/** Advances 0..count every `ms`; `count` is a "finished" beat before the loop restarts. */
function useCycle(count, ms = 2600) {
  const [step, setStep] = useState(() => (prefersReducedMotion() ? count : 0))
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const timer = setInterval(() => setStep((current) => (current + 1) % (count + 1)), ms)
    return () => clearInterval(timer)
  }, [count, ms])
  return step
}

/** Skips the CSS transition on the loop restart so items snap back instead of reversing. */
const snap = (step) => (step === 0 ? { transition: 'none' } : {})

function Glow({ id, x, y, w, h, on }) {
  return <rect className="sf-trans" x={x} y={y} width={w} height={h} rx="12" fill="#34d399" opacity={on ? 0.6 : 0} filter={`url(#${id})`} />
}

function Wheel({ cx, cy, r = 9, spin }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0f172a" />
      <g className={spin ? 'sf-spin' : ''} style={{ animationDuration: '0.7s' }}>
        <circle cx={cx} cy={cy} r={r / 2} fill="#94a3b8" />
        <path d={`M${cx - r / 2} ${cy}h${r}M${cx} ${cy - r / 2}v${r}`} stroke="#0f172a" strokeWidth="1.3" />
      </g>
    </g>
  )
}

function CaneBundle({ x, y, count = 6, tilt = 10 }) {
  return Array.from({ length: count }, (_, i) => (
    <rect key={i} x={x + i * 11} y={y + (i % 2) * 4} width="6" height="22" rx="3" fill="#65a30d" transform={`rotate(${i % 2 ? tilt : -tilt} ${x + i * 11 + 3} ${y + 14})`} />
  ))
}

function JourneyShell({ title, marathi, subtitle, steps, step, stat, delay, children }) {
  return (
    <section className="sf-rise overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <p lang="mr" className="text-lg font-semibold text-emerald-700">{marathi}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {stat}
      </div>
      <div className="overflow-x-auto">{children}</div>
      <ol className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 sm:grid-cols-5">
        {steps.map((label, index) => {
          const state = step === steps.length || step > index ? 'done' : step === index ? 'active' : 'todo'
          const look = { done: 'bg-emerald-50 text-emerald-700', active: 'bg-emerald-600 text-white sf-pill-active', todo: 'bg-slate-100 text-slate-400' }[state]
          return (
            <li key={label} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-500 ${look}`}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold text-slate-700">{state === 'done' ? '✓' : index + 1}</span>
              {label}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StatChip({ label, value, unit }) {
  if (value === undefined || value === null) return null
  return (
    <div className="rounded-xl bg-emerald-50 px-3 py-1.5 text-right">
      <p className="text-[11px] uppercase tracking-wide text-emerald-700/70">{label}</p>
      <p className="text-base font-semibold tabular-nums text-emerald-800"><CountUp value={Number(value) || 0} />{unit && <span className="ml-1 text-xs font-normal">{unit}</span>}</p>
    </div>
  )
}

/** 1. Farm to factory: registration, harvest, loading, weighbridge, arrival. */
function FarmJourney({ farmers }) {
  const step = useCycle(5)
  const truckX = [-140, 226, 226, 610, 735, 735][step]
  const tractorX = step >= 1 ? 110 : 30
  const rolling = step === 1 || step === 3 || step === 4
  const weighed = step >= 3
  return (
    <JourneyShell
      title="Farm-to-Factory Journey" marathi="शेतापासून फॅक्टरीपर्यंत" delay={320} step={step}
      subtitle="Farmer registration → harvesting → truck loading → weighbridge → factory arrival"
      steps={['Farmer registered', 'Harvesting', 'Truck loading', 'Weighbridge entry', 'Factory arrival']}
      stat={<StatChip label="Registered farmers" value={farmers} />}
    >
      <svg viewBox="0 0 960 230" className="mx-auto block h-auto w-full min-w-[640px]" role="img" aria-label="Animated illustration of sugarcane travelling from farm to factory">
        <defs>
          <linearGradient id="j1-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0f2fe" /><stop offset="100%" stopColor="#f0fdf4" /></linearGradient>
          <filter id="j1-glow"><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        <rect width="960" height="230" fill="url(#j1-sky)" />
        <rect y="180" width="960" height="50" fill="#bbf7d0" />
        <rect y="182" width="960" height="14" fill="#64748b" />
        <line x1="0" y1="189" x2="960" y2="189" stroke="#f8fafc" strokeWidth="2" strokeDasharray="14 12" />

        {/* farmer registration card */}
        <g className="sf-trans" style={{ opacity: 1 }}>
          <rect x="22" y="14" width="92" height="46" rx="8" fill="#fff" stroke={step >= 0 ? '#10b981' : '#cbd5e1'} strokeWidth="2" />
          <circle cx="44" cy="31" r="7" fill="#10b981" /><path d="M32 50q12-14 24 0z" fill="#10b981" />
          <rect x="64" y="24" width="40" height="5" rx="2" fill="#cbd5e1" /><rect x="64" y="34" width="28" height="5" rx="2" fill="#cbd5e1" />
          <text x="68" y="52" fontSize="8" fontWeight="700" fill="#059669">ID ✓</text>
        </g>

        {/* cane field: first stalks are cut at the harvesting step */}
        {[24, 46, 68, 90, 112, 134, 156, 178].map((x, i) => (
          <g key={x} className="sf-trans" style={{ opacity: step >= 1 && i < 5 ? 0.18 : 1, ...snap(step) }}>
            <g className="sf-sway" style={{ animationDelay: `${i * -0.4}s` }}>
              <rect x={x} y={180 - (96 + (i % 3) * 14)} width="7" height={96 + (i % 3) * 14} rx="3" fill="#4d7c0f" />
              <path d={`M${x + 3} ${180 - (96 + (i % 3) * 14)} q-16 -6 -22 -20 q15 2 22 20z`} fill="#65a30d" />
              <path d={`M${x + 4} ${180 - (96 + (i % 3) * 14)} q16 -8 24 -22 q-16 4 -24 22z`} fill="#84cc16" />
            </g>
          </g>
        ))}

        {/* tractor with trolley */}
        <g className="sf-trans" style={{ transform: `translateX(${tractorX}px)`, ...snap(step) }}>
          <g transform="translate(0 134)">
            <rect x="30" y="12" width="44" height="24" rx="3" fill="#b45309" />
            <g style={{ opacity: step === 1 ? 1 : 0 }} className="sf-trans"><CaneBundle x={32} y={-4} count={4} /></g>
            <path d="M-26 22h24v-14h14l6 14v14h-44z" fill="#16a34a" />
            <rect x="-14" y="2" width="16" height="12" rx="2" fill="#e0f2fe" />
            <Wheel cx={-10} cy={42} r={13} spin={rolling && step === 1} />
            <Wheel cx={14} cy={44} r={8} spin={rolling && step === 1} />
            <Wheel cx={44} cy={44} r={8} spin={rolling && step === 1} />
          </g>
        </g>

        {/* weighbridge */}
        <rect x="596" y="176" width="150" height="8" rx="2" fill="#475569" />
        <rect x="610" y="184" width="122" height="5" fill="#334155" />
        <g transform="translate(640 36)">
          <rect width="92" height="62" rx="8" fill="#1e293b" />
          <circle cx="46" cy="38" r="22" fill="#f8fafc" />
          {[-60, -30, 0, 30, 60].map((deg) => <line key={deg} x1="46" y1="19" x2="46" y2="24" stroke="#94a3b8" strokeWidth="2" transform={`rotate(${deg} 46 38)`} />)}
          <line className="sf-trans" x1="46" y1="38" x2="46" y2="22" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: '46px 38px', transform: `rotate(${weighed ? 58 : -58}deg)`, transition: step === 0 ? 'none' : 'transform 1.6s cubic-bezier(.3,1.6,.5,1)' }} />
          <rect x="6" y="6" width="80" height="11" rx="3" fill="#052e16" />
          <text x="46" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4ade80">{weighed ? '42.8 T' : '0.0 T'}</text>
        </g>
        <text x="670" y="214" fontSize="10" fill="#475569">WEIGHBRIDGE</text>

        {/* truck */}
        <g className="sf-trans" style={{ transform: `translateX(${truckX}px)`, opacity: step === 0 ? 0 : 1, ...snap(step) }}>
          <g transform="translate(0 142)">
            <rect x="0" y="12" width="74" height="22" rx="2" fill="#f59e0b" />
            <g className="sf-trans" style={{ opacity: step >= 2 ? 1 : 0 }}><CaneBundle x={6} y={-6} /></g>
            <path d="M78 16h16l12 11v7H78z" fill="#ef4444" /><rect x="86" y="19" width="9" height="7" rx="1" fill="#e0f2fe" />
            <Wheel cx={20} cy={36} spin={rolling} /><Wheel cx={92} cy={36} spin={rolling} />
          </g>
        </g>

        {/* factory with arrival light */}
        <g transform="translate(850 70)">
          <rect x="0" y="40" width="96" height="70" rx="4" fill="#64748b" /><rect x="64" y="0" width="18" height="44" fill="#475569" />
          <rect x="10" y="56" width="26" height="22" rx="2" fill="#cbd5e1" /><rect x="46" y="56" width="26" height="22" rx="2" fill="#cbd5e1" />
          <circle cx="48" cy="24" r="9" className="sf-trans" fill={step >= 4 ? '#22c55e' : '#ef4444'} />
          <circle cx="48" cy="24" r="16" className="sf-trans" fill="#22c55e" opacity={step >= 4 ? 0.35 : 0} filter="url(#j1-glow)" />
          <text x="48" y="130" textAnchor="middle" fontSize="10" fontWeight="700" fill={step >= 4 ? '#15803d' : '#94a3b8'}>{step >= 4 ? 'ARRIVED' : 'FACTORY'}</text>
        </g>
      </svg>
    </JourneyShell>
  )
}

/** 2. Inside the mill: unloading, cutting, shredding, crushing, juice extraction. */
function MillJourney({ caneCrushed }) {
  const step = useCycle(5)
  const machines = [
    { x: 250, label: 'Cutter', idx: 1 },
    { x: 410, label: 'Shredder', idx: 2 },
    { x: 580, label: 'Crusher mill', idx: 3 },
  ]
  return (
    <JourneyShell
      title="Inside the Sugar Mill" marathi="ऊसापासून रसापर्यंत" delay={380} step={step}
      subtitle="Cane unloading → cutting → shredding → crushing → juice extraction"
      steps={['Cane unloading', 'Cutting', 'Shredding', 'Crushing', 'Juice extraction']}
      stat={<StatChip label="Cane crushed" value={caneCrushed} unit="MT" />}
    >
      <svg viewBox="0 0 960 230" className="mx-auto block h-auto w-full min-w-[640px]" role="img" aria-label="Animated illustration of cane being cut, shredded and crushed to juice">
        <defs>
          <linearGradient id="j2-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f1f5f9" /><stop offset="100%" stopColor="#e2e8f0" /></linearGradient>
          <filter id="j2-glow"><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        <rect width="960" height="230" fill="url(#j2-bg)" />
        <rect y="190" width="960" height="40" fill="#cbd5e1" />

        {/* tipping truck */}
        <g transform="translate(20 120)">
          <g className="sf-trans" style={{ transformOrigin: '76px 40px', transform: `rotate(${step === 0 ? -24 : 0}deg)`, transition: step === 0 ? 'transform 1.2s ease-out' : 'transform 1.2s ease-in' }}>
            <rect x="0" y="20" width="76" height="22" rx="2" fill="#f59e0b" />
            <CaneBundle x={6} y={2} />
          </g>
          <path d="M80 36h16l12 11v7H80z" fill="#ef4444" />
          <Wheel cx={24} cy={56} spin={false} /><Wheel cx={94} cy={56} spin={false} />
        </g>

        {/* conveyor belt with cane pieces riding along it */}
        <rect x="140" y="156" width="590" height="12" rx="6" fill="#334155" />
        <line className="sf-belt" x1="150" y1="162" x2="720" y2="162" stroke="#94a3b8" strokeWidth="3" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} className="sf-carry" x="150" y="148" width="22" height="7" rx="3" fill="#65a30d" style={{ animationDelay: `${i * -1}s`, '--sf-run': '500px' }} />
        ))}
        {[160, 330, 500, 680].map((x) => <rect key={x} x={x} y="168" width="8" height="22" fill="#475569" />)}

        {/* machines: glow and spin only while their stage is active */}
        {machines.map(({ x, label, idx }) => {
          const on = step === idx
          return (
            <g key={label}>
              <Glow id="j2-glow" x={x - 62} y={72} w={124} h={82} on={on} />
              <rect x={x - 56} y="78" width="112" height="76" rx="8" fill={on ? '#0f766e' : '#475569'} className="sf-trans" />
              <text x={x} y="72" textAnchor="middle" fontSize="11" fontWeight="700" fill={on ? '#047857' : '#64748b'}>{label}</text>
              {idx === 1 && [0, 1].map((k) => (
                <g key={k} className={on ? 'sf-spin' : ''} style={{ animationDuration: '0.9s' }}>
                  <circle cx={x - 22 + k * 44} cy="116" r="17" fill="#1e293b" />
                  {[0, 60, 120].map((deg) => <rect key={deg} x={x - 22 + k * 44 - 1.5} y="100" width="3" height="32" fill="#e2e8f0" transform={`rotate(${deg} ${x - 22 + k * 44} 116)`} />)}
                </g>
              ))}
              {idx === 2 && (
                <g className={on ? 'sf-spin' : ''} style={{ animationDuration: '1.4s' }}>
                  <circle cx={x} cy="116" r="30" fill="#1e293b" />
                  {Array.from({ length: 8 }, (_, k) => <rect key={k} x={x - 2} y="88" width="4" height="12" fill="#f1f5f9" transform={`rotate(${k * 45} ${x} 116)`} />)}
                </g>
              )}
              {idx === 3 && [-1, 1].map((dir) => (
                <g key={dir} className={on ? (dir > 0 ? 'sf-spin' : 'sf-spin-rev') : ''} style={{ animationDuration: '1.6s' }}>
                  <circle cx={x + dir * 21} cy="116" r="22" fill="#1e293b" />
                  <circle cx={x + dir * 21} cy="116" r="16" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="7 6" />
                </g>
              ))}
            </g>
          )
        })}

        {/* juice pipe and tank */}
        <path d="M580 154 V196 H770" stroke="#92400e" strokeOpacity=".25" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path className="sf-flow" d="M580 154 V196 H770" stroke={step >= 4 ? '#f59e0b' : 'transparent'} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(770 128)">
          <rect width="120" height="72" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <rect className="sf-level" x="4" y="6" width="112" height="62" rx="5" fill="#f59e0b" style={{ transform: `scaleY(${step >= 4 ? 0.85 : 0.08})`, ...snap(step) }} />
          <text x="60" y="-6" textAnchor="middle" fontSize="11" fontWeight="700" fill={step >= 4 ? '#b45309' : '#64748b'}>Juice tank</text>
        </g>
      </svg>
    </JourneyShell>
  )
}

/** 3. Juice to sugar: clarification, evaporation, crystallization, centrifuge, drying. */
function SugarJourney({ sugar }) {
  const step = useCycle(5, 2800)
  const xs = [95, 285, 475, 665, 855]
  const levels = [step >= 1 ? 0.7 : 0.85, step >= 2 ? 0.35 : 0.7, 0.55, 0.45, 0.4]
  const colours = [step >= 1 ? '#fcd34d' : '#a16207', step >= 2 ? '#b45309' : '#f59e0b', '#fde68a', '#f1f5f9', '#ffffff']
  return (
    <JourneyShell
      title="Juice-to-Sugar Journey" marathi="रसापासून साखरेपर्यंत" delay={440} step={step}
      subtitle="Clarification → evaporation → crystallization → centrifuging → drying"
      steps={['Clarification', 'Evaporation', 'Crystallization', 'Centrifuging', 'Drying & output']}
      stat={<StatChip label="Sugar produced" value={sugar} unit="MT" />}
    >
      <svg viewBox="0 0 960 250" className="mx-auto block h-auto w-full min-w-[640px]" role="img" aria-label="Animated illustration of juice becoming sugar crystals">
        <defs>
          <linearGradient id="j3-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fffbeb" /><stop offset="100%" stopColor="#fef3c7" /></linearGradient>
          <filter id="j3-glow"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <rect width="960" height="250" fill="url(#j3-bg)" />
        <rect y="214" width="960" height="36" fill="#e7e5e4" />

        {/* pipes between vessels */}
        {xs.slice(0, 4).map((x, i) => (
          <g key={x}>
            <path d={`M${x + 50} 176 H${xs[i + 1] - 50}`} stroke="#78350f" strokeOpacity=".2" strokeWidth="8" strokeLinecap="round" />
            <path className="sf-flow" d={`M${x + 50} 176 H${xs[i + 1] - 50}`} stroke={step > i ? '#f59e0b' : 'transparent'} strokeWidth="4" strokeLinecap="round" />
          </g>
        ))}

        {xs.map((x, i) => {
          const on = step === i
          const bodyTop = 70
          return (
            <g key={x}>
              <Glow id="j3-glow" x={x - 62} y={bodyTop - 14} w={124} h={150} on={on} />
              {/* vessel shell */}
              {i === 2
                ? <path d={`M${x - 48} 190 V110 Q${x - 48} 64 ${x} 64 Q${x + 48} 64 ${x + 48} 110 V190 Z`} fill="#e2e8f0" stroke={on ? '#10b981' : '#94a3b8'} strokeWidth="3" className="sf-trans" />
                : <rect x={x - 48} y={bodyTop} width="96" height="120" rx={i === 3 ? 48 : 10} fill="#e2e8f0" stroke={on ? '#10b981' : '#94a3b8'} strokeWidth="3" className="sf-trans" />}
              {/* liquid level */}
              {i < 3 && <rect className="sf-level" x={x - 43} y={bodyTop + 6} width="86" height="108" rx="6" fill={colours[i]} style={{ transform: `scaleY(${levels[i]})`, ...snap(step) }} />}
              {i === 0 && [-24, 0, 24].map((dx, k) => <circle key={dx} className="sf-bubble" cx={x + dx} cy="150" r="3" fill="#78350f" opacity=".6" style={{ animationDelay: `${k * -0.7}s` }} />)}
              {i === 1 && [-26, 0, 26].map((dx) => <line key={dx} x1={x + dx} x2={x + dx} y1={bodyTop + 8} y2={bodyTop + 112} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 5" />)}
              {i === 1 && on && <path className="sf-flow" d={`M${x - 20} ${bodyTop - 4} q-6 -14 0 -26 M${x + 20} ${bodyTop - 4} q-6 -14 0 -26`} stroke="#94a3b8" strokeWidth="3" fill="none" strokeLinecap="round" />}
              {/* crystals appear in the pan */}
              {i === 2 && Array.from({ length: 10 }, (_, k) => (
                <rect key={k} className="sf-trans" x={x - 34 + (k % 5) * 15} y={118 + Math.floor(k / 5) * 22} width="8" height="8" rx="1.5" fill="#fff" stroke="#cbd5e1" opacity={step >= 2 ? 1 : 0} transform={`rotate(${k * 17} ${x - 30 + (k % 5) * 15} ${122 + Math.floor(k / 5) * 22})`} style={{ transitionDelay: `${k * 90}ms`, ...snap(step) }} />
              ))}
              {/* centrifuge drum */}
              {i === 3 && (
                <g className={on ? 'sf-spin' : ''} style={{ animationDuration: '0.6s' }}>
                  <circle cx={x} cy="130" r="36" fill={colours[3]} stroke="#64748b" strokeWidth="3" />
                  <circle cx={x} cy="130" r="26" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="5 6" />
                  <line x1={x - 30} y1="130" x2={x + 30} y2="130" stroke="#94a3b8" strokeWidth="2" /><line x1={x} y1="100" x2={x} y2="160" stroke="#94a3b8" strokeWidth="2" />
                </g>
              )}
              {i === 3 && step >= 3 && [0, 1, 2].map((k) => <circle key={k} className="sf-bubble" cx={x + 52} cy={150 + k * 4} r="3" fill="#78350f" style={{ animationDelay: `${k * -0.6}s` }} />)}
              {/* dryer drum with warm air */}
              {i === 4 && (
                <g>
                  <rect x={x - 44} y="104" width="88" height="48" rx="24" fill="#fff" stroke="#94a3b8" strokeWidth="3" />
                  <g className={on ? 'sf-spin' : ''} style={{ animationDuration: '1.8s' }}>
                    <circle cx={x} cy="128" r="16" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="6 5" />
                  </g>
                  {on && [-24, 0, 24].map((dx, k) => <path key={dx} className="sf-flow" d={`M${x + dx} 96 q-5 -10 0 -20`} stroke="#fb923c" strokeWidth="3" fill="none" strokeLinecap="round" style={{ animationDelay: `${k * -0.3}s` }} />)}
                </g>
              )}
              <text x={x} y="232" textAnchor="middle" fontSize="11" fontWeight="700" fill={on ? '#047857' : '#78716c'}>
                {['Clarifier', 'Evaporator', 'Vacuum pan', 'Centrifuge', 'Dryer'][i]}
              </text>
            </g>
          )
        })}

        {/* final sugar output is revealed at the end */}
        <g className="sf-trans" style={{ opacity: step >= 4 ? 1 : 0, transformOrigin: '855px 200px', transform: `scale(${step >= 4 ? 1 : 0.4})`, ...snap(step) }}>
          <path d="M812 212 Q855 170 898 212 Z" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
          {[[832, 196], [858, 184], [880, 198], [850, 206]].map(([cx, cy], k) => <path key={k} className="sf-bubble" d={`M${cx} ${cy - 5}v10M${cx - 5} ${cy}h10`} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ animationDelay: `${k * -0.5}s` }} />)}
        </g>
      </svg>
    </JourneyShell>
  )
}

/* -------------------------------------------------------------------- page --- */

export default function DashboardPage() {
  const { user, navigation } = useAuth()
  const [data, setData] = useState(null)
  const [overview, setOverview] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setData)
      .catch((requestError) => setError(apiError(requestError)))
      .finally(() => setLoading(false))
    // The overview is decorative: a failure here must never break the dashboard.
    dashboardApi.overview().then((result) => setOverview(Array.isArray(result) ? result : [])).catch(() => setOverview([]))
  }, [])

  if (loading) return <Spinner label="Loading dashboard…" />
  if (error) return <Alert title={error.message} />

  const production = data?.production
  const charts = data?.charts || {}
  const hasData = Boolean(production?.entries) || (data?.kpis || []).some((kpi) => Number(kpi.value) > 0)
  const moduleCount = navigation?.modules?.length || overview.length

  return (
    <div className="space-y-6">
      <DashboardStyles />
      <Hero name={user?.firstName} production={production} moduleCount={moduleCount} />

      {data?.kpis?.length > 0 && <Ticker kpis={data.kpis} />}

      {data?.kpis?.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi, index) => <KpiCard key={kpi.key} kpi={kpi} index={index} />)}
        </div>
      ) : (
        <Card>
          <EmptyState title="No dashboard cards available" message="Your role does not grant access to any dashboard metrics." />
        </Card>
      )}

      <QuickActions navigation={navigation} />

      {production && <ProductionBand production={production} />}

      <CaneScene production={production} />

      <FarmJourney farmers={data?.kpis?.find((kpi) => kpi.key === 'farmers')?.value} />
      <MillJourney caneCrushed={production?.caneCrushedMt} />
      <SugarJourney sugar={production?.sugarProducedMt} />

      {!hasData && <QuickStart navigation={navigation} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {charts.caneTrend?.length > 0 && (
          <Card title="Cane crushed — last 14 days" subtitle="Metric tonnes per day">
            <ColumnChart items={charts.caneTrend} unit=" MT" tone="from-emerald-600 to-emerald-300" />
          </Card>
        )}
        {charts.sugarTrend?.length > 0 && (
          <Card title="Sugar produced — last 14 days" subtitle="Metric tonnes per day">
            <ColumnChart items={charts.sugarTrend} unit=" MT" tone="from-sky-600 to-sky-300" />
          </Card>
        )}
        {charts.salesByGrade?.length > 0 && (
          <Card title="Sales by grade" subtitle="Invoice value">
            <GrowBars items={charts.salesByGrade} tone="from-violet-500 to-fuchsia-400" />
          </Card>
        )}
        {charts.purchasesByVendor?.length > 0 && (
          <Card title="Purchases by vendor" subtitle="Purchase order value">
            <GrowBars items={charts.purchasesByVendor} tone="from-amber-500 to-orange-400" />
          </Card>
        )}
        {charts.stock?.length > 0 && (
          <Card title="Stock on hand" subtitle="Balance quantity by item">
            <GrowBars items={charts.stock} />
          </Card>
        )}
        {overview.length > 0 && <RecordsDonut overview={overview} />}
        {data?.recentActivity?.length > 0 && <ActivityFeed entries={data.recentActivity} />}
      </div>

      {overview.length > 0 && <ModuleGlance overview={overview} />}
    </div>
  )
}