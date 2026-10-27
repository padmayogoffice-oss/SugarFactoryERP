/**
 * Theme store shared by every toggle in the app.
 *
 * The active theme lives on <html data-theme="light|dark"> (set before first
 * paint by the script in index.html). A manual choice is saved to localStorage
 * and always wins; until the user chooses, the operating system preference is
 * followed. Nothing here touches routing or component state, so switching theme
 * never resets forms, filters or the current page.
 */
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'sf-theme'
const listeners = new Set()
let switchTimer = 0

const isTheme = (value) => value === 'dark' || value === 'light'

function readStored() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

function writeStored(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* storage unavailable (private mode): the choice lasts for this session only */
  }
}

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function currentTheme() {
  const attribute = document.documentElement.getAttribute('data-theme')
  return isTheme(attribute) ? attribute : readStored() || systemTheme()
}

function applyTheme(theme, animate) {
  const root = document.documentElement
  if (animate && !prefersReducedMotion()) {
    // Cross-fade colours for a moment only, so hover transitions stay snappy afterwards.
    root.classList.add('sf-theme-switching')
    window.clearTimeout(switchTimer)
    switchTimer = window.setTimeout(() => root.classList.remove('sf-theme-switching'), 420)
  }
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#071426' : '#F5F8F5')
  listeners.forEach((listener) => listener())
}

export function setTheme(theme) {
  if (!isTheme(theme)) return
  writeStored(theme)
  applyTheme(theme, true)
}

export function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
}

if (typeof window !== 'undefined') {
  if (!isTheme(document.documentElement.getAttribute('data-theme'))) applyTheme(readStored() || systemTheme(), false)

  // Follow the OS only while the user has not made a manual choice.
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', (event) => {
    if (!readStored()) applyTheme(event.matches ? 'dark' : 'light', true)
  })
  // Keep several open tabs in step.
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && isTheme(event.newValue)) applyTheme(event.newValue, false)
  })
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export default function useTheme() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => 'light')
  return { theme, isDark: theme === 'dark', setTheme, toggle: toggleTheme }
}
