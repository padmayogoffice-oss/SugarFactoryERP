/**
 * Animated Sugar Factory ERP sidebar.
 * Preserves permission-filtered navigation supplied by AuthContext.
 *
 * Motion lives in src/styles/index.css (SIDEBAR section) and is driven entirely
 * by classes + the existing `data-theme` tokens, so it follows the current
 * light/dark switching logic without any extra theme code here.
 */
import { useCallback, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { humanise } from '../utils/formatters'

const COLLAPSE_KEY = 'sf-sidebar-collapsed'
const DESKTOP_QUERY = '(min-width: 1024px)'

function moduleHref(moduleKey, submoduleKey) {
  return `/m/${moduleKey}/${submoduleKey}`
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(value) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0')
  } catch {
    /* storage unavailable: the choice lasts for this session only */
  }
}

function matchesDesktop() {
  return Boolean(window.matchMedia?.(DESKTOP_QUERY).matches)
}

/** The collapsed rail only exists on desktop; below `lg` the sidebar stays an off-canvas drawer. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(matchesDesktop)
  useEffect(() => {
    const query = window.matchMedia?.(DESKTOP_QUERY)
    if (!query) return undefined
    const onChange = (event) => setDesktop(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return desktop
}

/** Line icons for the module `icon` names supplied by the navigation registry. */
const ICONS = {
  dashboard: (
    <>
      <rect x="4" y="4" width="6.5" height="8" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="4.5" rx="1.5" />
      <rect x="13.5" y="12" width="6.5" height="8" rx="1.5" />
      <rect x="4" y="15.5" width="6.5" height="4.5" rx="1.5" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5" />
      <path d="M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="8" cy="17" r="2.2" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6ZM12 15.5c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" />
    </>
  ),
  factory: (
    <>
      <path d="M3 21V10l6 4v-4l6 4V6h3v15M3 21h18" />
      <path d="M8 18h.01M12 18h.01M16 18h.01" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" />
      <circle cx="6.5" cy="18" r="1.7" />
      <circle cx="17.5" cy="18" r="1.7" />
    </>
  ),
  flask: <path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3M7.5 15h9" />,
  wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h12v3M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2Z" />
      <path d="M16 14h.01" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="7.5" r="3.5" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6" />
    </>
  ),
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />,
  cart: (
    <>
      <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
      <circle cx="9" cy="19.5" r="1.2" />
      <circle cx="17" cy="19.5" r="1.2" />
    </>
  ),
  box: <path d="M21 8l-9-5-9 5v8l9 5 9-5V8ZM3.3 7.5L12 12l8.7-4.5M12 12v9" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5ZM3 13l9 5 9-5" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
}

function NavIcon({ name }) {
  return (
    <span className="sidebar-icon-tile" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name] || ICONS.layers}
      </svg>
    </span>
  )
}

/** Small sugarcane stalk used as the active-page marker (replaces the old emoji). */
function CaneMark() {
  return (
    <span className="sidebar-active-cane" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 15V3" />
        <path d="M6 11h4M6.4 7.5h3.2" />
        <path d="M8 3c-.2-1.4-1.3-2.2-3-2.3.2 1.5 1.3 2.3 3 2.3ZM8 3c.2-1.4 1.3-2.2 3-2.3-.2 1.5-1.3 2.3-3 2.3Z" />
      </svg>
    </span>
  )
}

/** Stagger is capped so long submenus never feel slow. */
const cascadeDelay = (index) => `${Math.min(index, 8) * 45}ms`

function SubmoduleLink({ moduleKey, submodule, onNavigate, index }) {
  return (
    <li
      className="sidebar-cascade-item"
      style={{ animationDelay: cascadeDelay(index) }}
    >
      <NavLink
        to={moduleHref(moduleKey, submodule.key)}
        onClick={onNavigate}
        className={({ isActive }) =>
          `sidebar-child-link group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
            isActive
              ? 'sidebar-child-active bg-emerald-50 font-semibold text-emerald-800'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`
        }
      >
        <CaneMark />
        <span className="sidebar-label truncate">{submodule.name || humanise(submodule.key)}</span>
      </NavLink>
    </li>
  )
}

function ModuleGroup({ moduleDef, onNavigate, moduleIndex, rail, onExpand }) {
  const location = useLocation()
  const isActiveModule = location.pathname.startsWith(`/m/${moduleDef.key}/`) ||
    location.pathname.startsWith(`/reports/${moduleDef.key}/`)
  const [toggled, setToggled] = useState(false)
  const open = toggled || isActiveModule
  const total = moduleDef.submodules.length + moduleDef.pages.length
  const items = [
    ...moduleDef.submodules.map((submodule) => ({ type: 'submodule', item: submodule })),
    ...moduleDef.pages.map((page) => ({ type: 'page', item: page })),
  ]

  // In the collapsed rail a click first widens the sidebar, then reveals this module's menu.
  const handleToggle = () => {
    if (rail) {
      onExpand()
      setToggled(true)
      return
    }
    setToggled((value) => !value)
  }

  return (
    <li
      className={`sidebar-module-group ${open ? 'is-open' : ''}`}
      style={{ '--i': Math.min(moduleIndex, 12) }}
    >
      <button
        type="button"
        onClick={handleToggle}
        title={rail ? moduleDef.name : undefined}
        className={`sidebar-module-button flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors ${
          isActiveModule ? 'is-current text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
        }`}
        aria-expanded={open && !rail}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <NavIcon name={moduleDef.icon} />
          <span className="sidebar-module-name sf-nav-text truncate">{moduleDef.name}</span>
        </span>
        <span className="sf-nav-text flex shrink-0 items-center gap-1.5">
          <span className="sidebar-count rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{total}</span>
          <svg className={`sidebar-chevron ${open ? 'is-rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>

      <div className={`sidebar-submenu-clip ${open ? 'submenu-open' : ''}`} aria-hidden={!open} inert={!open}>
        <ul className="sidebar-submenu mt-1 space-y-0.5 border-l border-emerald-100 pl-2">
          {items.map(({ type, item }, index) => (
            type === 'submodule' ? (
              <SubmoduleLink
                key={item.key}
                moduleKey={moduleDef.key}
                submodule={item}
                onNavigate={onNavigate}
                index={index}
              />
            ) : (
              <li
                key={item.key}
                className="sidebar-cascade-item"
                style={{ animationDelay: cascadeDelay(index) }}
              >
                <NavLink
                  to={`/reports/${moduleDef.key}/${item.key}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `sidebar-child-link group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'sidebar-child-active bg-emerald-50 font-semibold text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CaneMark />
                    <span className="sidebar-label truncate">{item.name}</span>
                  </span>
                  <span className="text-[10px] uppercase opacity-70">report</span>
                </NavLink>
              </li>
            )
          ))}
        </ul>
      </div>
    </li>
  )
}

export default function Sidebar({ open, onClose }) {
  const { navigation, user, logout } = useAuth()
  const modules = navigation?.modules || []
  const desktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const rail = collapsed && desktop

  const updateCollapsed = useCallback((next) => {
    setCollapsed(next)
    writeCollapsed(next)
  }, [])
  const expand = useCallback(() => updateCollapsed(false), [updateCollapsed])

  return (
    <>
      <div
        className={`sf-sidebar-backdrop fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${open ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`sf-sidebar sf-sidebar-in fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-slate-200 bg-white lg:relative lg:translate-x-0 ${
          rail ? 'is-collapsed' : ''
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          type="button"
          onClick={() => updateCollapsed(!collapsed)}
          className="sidebar-collapse-toggle"
          aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!rail}
          title={rail ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div className="sidebar-brand flex items-center gap-2.5 border-b border-slate-200 px-[18px] py-3">
          <span className="sf-logo flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">SF</span>
          <div className="sf-nav-text min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">Sugar Factory ERP</p>
            <p className="truncate text-xs text-slate-500">Integrated management suite</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3" aria-label="Main navigation">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/"
                end
                onClick={onClose}
                title={rail ? 'Dashboard' : undefined}
                className={({ isActive }) =>
                  `sidebar-dashboard-link relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <NavIcon name="dashboard" />
                <span className="sf-nav-text">Dashboard</span>
              </NavLink>
            </li>
            {modules.map((moduleDef, index) => (
              <ModuleGroup
                key={moduleDef.key}
                moduleDef={moduleDef}
                onNavigate={onClose}
                moduleIndex={index}
                rail={rail}
                onExpand={expand}
              />
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer border-t border-slate-200 px-4 py-3">
          <div className="sidebar-footer-info">
            <div>
              <div className="pb-2">
                <p className="truncate text-sm font-medium text-slate-800">{user?.fullName || user?.email}</p>
                <p className="truncate text-xs text-slate-500">
                  {user?.roles?.map((role) => role.name).join(', ') || (user?.isSuperAdmin ? 'Super Admin' : 'No role')}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title={rail ? 'Sign out' : undefined}
            className="btn-secondary sidebar-signout w-full gap-0"
          >
            <svg viewBox="0 0 24 24" className="sidebar-signout-icon h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS.logout}
            </svg>
            <span className="sidebar-signout-text">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export { humanise, moduleHref }