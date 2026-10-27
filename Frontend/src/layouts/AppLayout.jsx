/**
 * Authenticated shell: persistent sidebar, top bar with breadcrumbs and the
 * routed page content. Breadcrumb labels come from the navigation tree so they
 * match the sidebar wording exactly.
 */
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useParallax, useScrollReveal } from '../hooks/useDashboardAnimation'
import { humanise } from '../utils/formatters'

function useBreadcrumbs(navigation) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Home' }]

  const moduleDef = navigation?.modules?.find((item) => item.key === segments[1])

  if (segments[0] === 'm') {
    crumbs.push({ label: moduleDef?.name || humanise(segments[1] || '') })
    if (segments[2]) {
      const submodule = moduleDef?.submodules?.find((item) => item.key === segments[2])
      crumbs.push({ label: submodule?.name || humanise(segments[2]) })
    }
  } else if (segments[0] === 'reports') {
    crumbs.push({ label: moduleDef?.name || humanise(segments[1] || 'Reports') })
    if (segments[2]) {
      const page = moduleDef?.pages?.find((item) => item.key === segments[2])
      crumbs.push({ label: page?.name || humanise(segments[2]) })
    }
  } else if (segments[0]) {
    crumbs.push({ label: humanise(segments[0]) })
  }

  return crumbs
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, navigation } = useAuth()
  const crumbs = useBreadcrumbs(navigation)
  const location = useLocation()
  const mainRef = useRef(null)
  const pageRef = useRef(null)
  const lastPath = useRef(location.pathname)

  useScrollReveal(mainRef)
  useParallax(mainRef)

  // Subtle fade-and-slide between routes. Uses the Web Animations API on a wrapper
  // so the routed page is never remounted (state, forms and filters are untouched).
  useEffect(() => {
    if (lastPath.current === location.pathname) return undefined
    lastPath.current = location.pathname
    const page = pageRef.current
    if (!page || typeof page.animate !== 'function') return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const animation = page.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 280, easing: 'cubic-bezier(.22,.8,.25,1)' },
    )
    return () => animation.cancel()
  }, [location.pathname])

  return (
    <div className="app-shell flex h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sf-header sf-header-in sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-slate-300 p-1.5 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <nav className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              {crumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <span className="text-slate-300">/</span>}
                  <span className={index === crumbs.length - 1 ? 'font-medium text-slate-700' : ''}>{crumb.label}</span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-xs text-slate-500 sm:block">
              {user?.isSuperAdmin ? 'Super Admin' : user?.roles?.[0]?.name || 'User'}
            </span>
            <button type="button" onClick={logout} className="btn-secondary">
              Sign out
            </button>
          </div>
        </header>

        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div ref={pageRef}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
