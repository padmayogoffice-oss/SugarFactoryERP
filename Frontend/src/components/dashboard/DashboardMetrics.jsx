import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../ui'
import { CountUp } from './DashboardOverview'
import { TONES, TONE_ORDER } from './dashboardConstants'

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
            <circle className="text-slate-100" cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="14" />
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
        <span className="text-[10px] uppercase tracking-wide text-white/70">Recovery</span>
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

      <div className="sf-scene overflow-x-auto">
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
    { label: 'Bagasse', value: production.bagasseProducedMt, unit: 'MT', dot: 'bg-white/60' },
  ]
  return (
    <section className="sf-band sf-rise relative overflow-hidden rounded-2xl p-5 text-white shadow-lg sm:p-6" style={{ animationDelay: '200ms' }}>
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold">Season production</h2>
          <p className="text-xs text-white/70">Totals across all recorded shifts</p>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {items.map((item) => (
              <div key={item.label}>
                <p className="flex items-center gap-2 text-xs text-white/70">
                  <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  <CountUp value={item.value} /> <span className="text-xs font-normal text-white/55">{item.unit}</span>
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
            <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white shadow-lg opacity-0 transition group-hover:opacity-100">
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

export { ActivityFeed, CaneScene, ColumnChart, GrowBars, ModuleGlance, ProductionBand, QuickStart, RecordsDonut }
