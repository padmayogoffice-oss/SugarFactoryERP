import useTheme from '../../hooks/useTheme'

const Flowers = ({ className }) => (
  <svg className={`sf-switch-flowers ${className}`} viewBox="0 0 34 26" fill="none" aria-hidden="true">
    <g stroke="#2f8f55" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 24c0-5 1-9 1-13" /><path d="M17 24c0-4-1-7-1-10" /><path d="M26 24c0-5-1-8-1-12" />
    </g>
    <g fill="#ffd23f">
      <circle cx="9" cy="9" r="2.6" /><circle cx="6" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" />
      <circle cx="16" cy="12" r="2.4" /><circle cx="25" cy="10" r="2.6" /><circle cx="28" cy="13" r="1.6" />
    </g>
  </svg>
)

const Sprout = ({ className }) => (
  <svg className={`sf-switch-sprout ${className}`} viewBox="0 0 16 18" aria-hidden="true">
    <path d="M8 17C7 11 8 5 11 1c3 5 2 11-3 16Z" fill="currentColor" />
    <path d="M7 17C3 14 1 10 1 6c4 1 7 5 6 11Z" fill="currentColor" opacity=".75" />
  </svg>
)

/**
 * Leaf-style theme switch: green pill, round leaf knob, flowers and sprouting
 * leaves. A native <button>, so Enter/Space work and focus is visible;
 * aria-pressed reports whether dark mode is on.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label="Dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`sf-switch ${isDark ? 'is-dark' : ''} ${className}`.trim()}
    >
      <Sprout className="sf-switch-sprout-l" />
      <Sprout className="sf-switch-sprout-r" />
      <Flowers className="sf-flowers-l" />
      <Flowers className="sf-flowers-r" />
      <span className="sf-switch-knob" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19c-1-9 4-14 14-14 0 10-5 15-14 14Z" />
          <path d="M5 19c3-5 6-8 10-10" />
        </svg>
      </span>
    </button>
  )
}