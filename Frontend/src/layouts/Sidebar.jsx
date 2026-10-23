/**
 * Animated Sugar Factory ERP sidebar.
 * Preserves permission-filtered navigation supplied by AuthContext.
 */
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { humanise } from '../utils/formatters'

function moduleHref(moduleKey, submoduleKey) {
  return `/m/${moduleKey}/${submoduleKey}`
}

function SubmoduleLink({ moduleKey, submodule, onNavigate, index }) {
  return (
    <li
      className="sidebar-cascade-item"
      style={{ animationDelay: `${index * 65}ms` }}
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
        <span className="sidebar-active-cane" aria-hidden="true">🌿</span>
        <span className="truncate">{submodule.name || humanise(submodule.key)}</span>
      </NavLink>
    </li>
  )
}

function ModuleGroup({ moduleDef, onNavigate, moduleIndex }) {
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

  return (
    <li className={`sidebar-module-group ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        onClick={() => setToggled((value) => !value)}
        className={`sidebar-module-button flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors ${
          isActiveModule ? 'text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
        }`}
        aria-expanded={open}
      >
        <span className="truncate">{moduleDef.name}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{total}</span>
          <span className={`sidebar-chevron text-xs ${open ? 'is-rotated' : ''}`} aria-hidden="true">›</span>
        </span>
      </button>

      <div className={`sidebar-submenu-clip ${open ? 'submenu-open' : ''}`} aria-hidden={!open}>
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
                style={{ animationDelay: `${index * 65}ms` }}
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
                    <span className="sidebar-active-cane" aria-hidden="true">🌿</span>
                    <span className="truncate">{item.name}</span>
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

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">SF</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">Sugar Factory ERP</p>
            <p className="truncate text-xs text-slate-500">Integrated management suite</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-dashboard-link relative block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
            {modules.map((moduleDef, index) => (
              <ModuleGroup key={moduleDef.key} moduleDef={moduleDef} onNavigate={onClose} moduleIndex={index} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 px-4 py-3">
          <p className="truncate text-sm font-medium text-slate-800">{user?.fullName || user?.email}</p>
          <p className="truncate text-xs text-slate-500">
            {user?.roles?.map((role) => role.name).join(', ') || (user?.isSuperAdmin ? 'Super Admin' : 'No role')}
          </p>
          <button type="button" onClick={logout} className="btn-secondary mt-2 w-full">Sign out</button>
        </div>
      </aside>
    </>
  )
}

export { humanise, moduleHref }
