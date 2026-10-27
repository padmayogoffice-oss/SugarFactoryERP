export const TONES = {
  emerald: { icon: 'from-emerald-500 to-teal-500', bar: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700' },
  sky: { icon: 'from-sky-500 to-cyan-500', bar: 'bg-sky-500', soft: 'bg-sky-50 text-sky-700' },
  violet: { icon: 'from-violet-500 to-fuchsia-500', bar: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700' },
  amber: { icon: 'from-amber-500 to-orange-500', bar: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700' },
  red: { icon: 'from-rose-500 to-red-500', bar: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700' },
  // Fixed greys (not theme tokens): this tone must stay mid-grey in both themes.
  slate: { icon: 'from-[#64748b] to-[#334155]', bar: 'bg-[#64748b]', soft: 'bg-slate-100 text-slate-700' },
}

export const TONE_ORDER = ['emerald', 'sky', 'violet', 'amber', 'red', 'slate']
