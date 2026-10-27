import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatNumber } from '../../utils/formatters'
import { useCountUp } from '../../hooks/useDashboardAnimation'
import useNow from '../../hooks/useNow'
import { TONES, TONE_ORDER } from './dashboardConstants'

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

/** Decorative sugarcane silhouettes; `data-parallax` makes the layer drift at its own speed (see useParallax). */
function CaneLayer({ speed, count, minHeight, maxHeight, seed, className, style }) {
  const stalks = useMemo(
    () => Array.from({ length: count }, (_, index) => ({
      x: 16 + index * (1168 / count) + ((index * seed) % 5) * 3,
      height: minHeight + ((index * seed) % 7) * ((maxHeight - minHeight) / 6),
    })),
    [count, minHeight, maxHeight, seed],
  )
  return (
    <div className={`sf-cane-layer ${className}`} style={style} data-parallax={speed} aria-hidden="true">
      <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="block h-full w-full" fill="currentColor">
        {stalks.map((stalk) => (
          <g key={stalk.x}>
            <rect x={stalk.x} y={140 - stalk.height} width="5" height={stalk.height} rx="2.5" />
            <path d={`M${stalk.x + 2.5} ${140 - stalk.height} q-16 -4 -22 -18 q14 1 22 18z M${stalk.x + 2.5} ${140 - stalk.height} q16 -6 24 -20 q-16 3 -24 20z`} />
          </g>
        ))}
      </svg>
    </div>
  )
}

function CountUp({ value }) {
  const shown = useCountUp(value)
  return typeof shown === 'number'
    ? shown.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : (shown ?? '—')
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

/* -------------------------------------------------------------- components --- */

/** Live clock with the current shift and how far through it we are. */
function LiveClock() {
  const now = useNow()
  const shift = shiftInfo(now)
  return (
    <div className="min-w-[150px] rounded-xl bg-white/15 px-4 py-2 backdrop-blur" title="Shift timings assumed: A 06-14, B 14-22, C 22-06">
      <p className="text-xl font-semibold tabular-nums">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
      <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/80">
        <span>Shift {shift.name}</span>
        <span>{Math.round(shift.progress * 100)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-emerald-300 transition-all duration-1000" style={{ width: `${Math.round(shift.progress * 100)}%` }} />
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
    <header className="sf-hero sf-rise relative overflow-hidden rounded-2xl px-6 pb-14 pt-6 text-white shadow-lg sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* two sugarcane layers at different depths: the far one drifts more than the near one */}
        <CaneLayer speed={0.34} count={34} minHeight={52} maxHeight={112} seed={5} className="text-white/10" style={{ bottom: '-12px', height: '118px' }} />
        <CaneLayer speed={0.12} count={22} minHeight={34} maxHeight={82} seed={3} className="text-white/[0.14]" style={{ bottom: '-18px', height: '86px' }} />
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
            {greeting()}{name ? `, ${name}` : ''}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/90">
            {production?.entries
              ? `Current season: ${formatNumber(production.caneCrushedMt)} MT cane crushed at ${production.recoveryPercent}% recovery.`
              : 'No crushing data recorded yet. Add shift production entries to populate this dashboard.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LiveClock />
          <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur">
            <p className="text-xl font-semibold tabular-nums"><CountUp value={moduleCount} /></p>
            <p className="text-[11px] uppercase tracking-wide text-white/80">Modules</p>
          </div>
          <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur">
            <p className="text-xl font-semibold tabular-nums">{production?.entries ? <CountUp value={production.entries} /> : '0'}</p>
            <p className="text-[11px] uppercase tracking-wide text-white/80">Shift entries</p>
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
          <span className={`sf-kpi-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${tone.icon}`}>
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
    <div className="sf-rise sticky -top-2 z-10 overflow-hidden lg:-top-4 rounded-full border border-slate-200 bg-white py-2 shadow-sm" style={{ animationDelay: '80ms' }} aria-label="Key figures">
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

export { CountUp, Hero, KpiCard, QuickActions, Ticker }
