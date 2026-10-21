import { useCycle } from '../../hooks/useDashboardAnimation'
import { CountUp } from './DashboardOverview'

/** Skips the CSS transition on the loop restart so items snap back instead of reversing. */
const snap = (step) => (step === 0 ? { transitionProperty: 'none', transitionDuration: '0s' } : {})

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

export { FarmJourney, MillJourney, SugarJourney }
