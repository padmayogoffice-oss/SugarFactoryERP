/**
 * Sidebar navigation rendered from the permission-filtered navigation tree.
 * Only modules, submodules and report pages the caller may open are shown, and
 * `humanise` provides a readable fallback label for any unlabelled registry key.
 */
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { humanise } from '../utils/formatters'

function moduleHref(moduleKey, submoduleKey) {
  return `/m/${moduleKey}/${submoduleKey}`
}

function SubmoduleLink({ moduleKey, submodule, onNavigate }) {
  return (
    <NavLink
      to={moduleHref(moduleKey, submodule.key)}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition ${
          isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <span className="truncate">{submodule.name || humanise(submodule.key)}</span>
    </NavLink>
  )
}

function ModuleGroup({ moduleDef, onNavigate }) {
  const location = useLocation()
  const isActiveModule = location.pathname.startsWith(`/m/${moduleDef.key}/`)
  const [toggled, setToggled] = useState(false)
  const open = toggled || isActiveModule

  const total = moduleDef.submodules.length + moduleDef.pages.length

  return (
    <li>
      <button
        type="button"
        onClick={() => setToggled((value) => !value)}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
          isActiveModule ? 'text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
        }`}
        aria-expanded={open}
      >
        <span className="truncate">{moduleDef.name}</span>
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-slate-100 px-1.5 text-[10px] font-medium text-slate-500">{total}</span>
          <span className={`text-xs transition ${open ? 'rotate-90' : ''}`}>›</span>
        </span>
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5 border-l border-slate-200 pl-2">
          {moduleDef.submodules.map((submodule) => (
            <li key={submodule.key}>
              <SubmoduleLink moduleKey={moduleDef.key} submodule={submodule} onNavigate={onNavigate} />
            </li>
          ))}
          {moduleDef.pages.map((page) => (
            <li key={page.key}>
              <NavLink
                to={`/reports/${moduleDef.key}/${page.key}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <span className="truncate">{page.name}</span>
                <span className="text-[10px] uppercase opacity-70">report</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Sidebar({ open, onClose }) {
  const { navigation, user, logout } = useAuth()
  const modules = navigation?.modules || []

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
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

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
            {modules.map((moduleDef) => (
              <ModuleGroup key={moduleDef.key} moduleDef={moduleDef} onNavigate={onClose} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 px-4 py-3">
          <p className="truncate text-sm font-medium text-slate-800">{user?.fullName || user?.email}</p>
          <p className="truncate text-xs text-slate-500">
            {user?.roles?.map((role) => role.name).join(', ') || (user?.isSuperAdmin ? 'Super Admin' : 'No role')}
          </p>
          <button type="button" onClick={logout} className="btn-secondary mt-2 w-full">
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export { humanise, moduleHref }
