import { useEffect, useState } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Counts from 0 up to `value` once it is known. Non-numeric values are returned as is. */
export function useCountUp(value, duration = 1100) {
  const target = typeof value === 'number' && Number.isFinite(value) ? value : null
  const [display, setDisplay] = useState(target === null || prefersReducedMotion() ? target : 0)

  useEffect(() => {
    let frame = 0
    if (target === null || prefersReducedMotion()) {
      frame = requestAnimationFrame(() => setDisplay(target))
      return () => cancelAnimationFrame(frame)
    }

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return target === null ? value : display
}

export function useCycle(count, ms = 2600) {
  const [step, setStep] = useState(() => (prefersReducedMotion() ? count : 0))
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const timer = setInterval(() => setStep((current) => (current + 1) % (count + 1)), ms)
    return () => clearInterval(timer)
  }, [count, ms])
  return step
}
