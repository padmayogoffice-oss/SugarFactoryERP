import { useEffect, useState } from 'react'

/** Ticks once a second so the clock and shift progress stay live. */
export default function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}
