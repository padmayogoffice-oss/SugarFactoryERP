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

/* ------------------------------------------------------------------ scroll --- */

// Cards that are not already part of an entrance sequence fade/rise in once.
const REVEAL_SELECTOR = '.card, .sf-rise'
const REVEAL_CLEANUP_MS = 900

/**
 * Scroll-triggered reveal for everything inside `rootRef`.
 *
 *  - `.card` elements fade and rise once when they first enter the viewport.
 *  - `.sf-rise` sections (the dashboard entrance animation) that start below the
 *    fold have their CSS animation held until they scroll into view, so charts
 *    and illustrations play when the user can actually see them.
 *
 * One IntersectionObserver is shared; a MutationObserver (throttled with rAF)
 * picks up content that arrives after an API call. Reveals run once, only use
 * opacity/transform, and every class this adds is removed again afterwards (and
 * on unmount) so nothing can be left hidden. Skipped for reduced-motion users.
 */
export function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined

    const seen = new WeakSet()
    const pending = new Set()
    const timers = new Set()
    let batch = 0
    let batchTimer = 0
    let scanFrame = 0

    const release = (el, delay) => {
      el.style.transitionDelay = delay ? `${delay}ms` : ''
      el.classList.add('is-revealed')
      // Content held inside this card (nested .sf-rise items) starts playing too.
      el.querySelectorAll('.sf-hold').forEach((child) => child.classList.remove('sf-hold'))
      el.classList.remove('sf-hold')
      const timer = window.setTimeout(() => {
        el.classList.remove('sf-reveal', 'is-revealed')
        el.style.transitionDelay = ''
        pending.delete(el)
        timers.delete(timer)
      }, REVEAL_CLEANUP_MS + delay)
      timers.add(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          release(entry.target, Math.min(batch++ * 70, 280))
        }
        window.clearTimeout(batchTimer)
        batchTimer = window.setTimeout(() => { batch = 0 }, 140)
      },
      { threshold: 0.05 },
    )

    const scan = () => {
      scanFrame = 0
      const viewport = window.innerHeight
      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        if (el.closest('[role="dialog"], .fixed, .sf-no-reveal')) return

        if (el.classList.contains('sf-rise') || el.closest('.sf-rise')) {
          // Only the outermost entrance element is held; it plays when visible.
          if (!el.classList.contains('sf-rise')) return
          const host = el.parentElement?.closest('.sf-reveal:not(.is-revealed)')
          if (host) {
            el.classList.add('sf-hold') // released together with its card
            return
          }
          if (el.parentElement?.closest('.sf-rise')) return
          if (el.getBoundingClientRect().top > viewport) {
            el.classList.add('sf-hold')
            pending.add(el)
            observer.observe(el)
          }
          return
        }

        el.classList.add('sf-reveal')
        pending.add(el)
        observer.observe(el)
      })
    }

    const schedule = () => {
      if (!scanFrame) scanFrame = requestAnimationFrame(scan)
    }

    const mutations = new MutationObserver(schedule)
    mutations.observe(root, { childList: true, subtree: true })
    scan()

    return () => {
      mutations.disconnect()
      observer.disconnect()
      cancelAnimationFrame(scanFrame)
      window.clearTimeout(batchTimer)
      timers.forEach((timer) => window.clearTimeout(timer))
      pending.forEach((el) => {
        el.classList.remove('sf-reveal', 'is-revealed', 'sf-hold')
        el.style.transitionDelay = ''
      })
    }
  }, [rootRef])
}

/**
 * Depth effect for decorative layers: any element with `data-parallax="0.3"`
 * drifts against the scroll direction by that fraction of the distance its
 * parent has travelled. Writes a single CSS variable (--sf-py) per layer from one
 * rAF-throttled passive scroll listener; layers far off-screen are skipped.
 */
export function useParallax(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return undefined

    const origin = new WeakMap()
    let frame = 0

    const update = () => {
      frame = 0
      const viewport = window.innerHeight
      root.querySelectorAll('[data-parallax]').forEach((layer) => {
        const host = layer.parentElement
        if (!host) return
        const top = host.getBoundingClientRect().top
        if (!origin.has(layer)) origin.set(layer, top)
        if (top > viewport + 160 || top < -host.offsetHeight - 160) return
        const speed = Number(layer.dataset.parallax) || 0
        const shift = Math.max(-48, Math.min(48, (origin.get(layer) - top) * speed))
        layer.style.setProperty('--sf-py', `${shift.toFixed(1)}px`)
      })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const mutations = new MutationObserver(schedule)
    mutations.observe(root, { childList: true, subtree: true })
    root.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()

    return () => {
      mutations.disconnect()
      root.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [rootRef])
}
