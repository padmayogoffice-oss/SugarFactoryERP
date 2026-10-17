import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ResourcePage from './pages/modules/ResourcePage'
import UsersPage from './pages/modules/UsersPage'
import RolesPage from './pages/modules/RolesPage'
import ActivityLogPage from './pages/modules/ActivityLogPage'
import ReportPage from './pages/reports/ReportPage'
import PermissionCatalogPage from './pages/modules/PermissionCatalogPage'
import { Spinner } from './components/ui'
import { useAuth } from './context/AuthContext'

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label="Restoring session…" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

/** Custom pages that replace the generic resource page for specific submodules. */
const CUSTOM_PAGES = {
  'access/user': UsersPage,
  'access/role': RolesPage,
}

/**
 * Report pages backed by a bespoke screen instead of the generic report
 * renderer, because the access module exposes audit data rather than aggregates.
 */
const CUSTOM_REPORT_PAGES = {
  'access/permission': PermissionCatalogPage,
  'access/activityLog': ActivityLogPage,
}

function NotFound() {
  return (
    <div className="card p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-800">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">
        The page you asked for does not exist or you do not have access to it.
      </p>
    </div>
  )
}

export default function App() {
  const { navigation, isAuthenticated } = useAuth()

  // The route table is generated from the permission-filtered registry tree, so
  // the sidebar and the router always agree and hidden modules get no route.
  const resourceRoutes = []
  const reportRoutes = []

  for (const moduleDef of navigation?.modules || []) {
    for (const submodule of moduleDef.submodules) {
      const path = `/m/${moduleDef.key}/${submodule.key}`
      const Custom = CUSTOM_PAGES[`${moduleDef.key}/${submodule.key}`]
      resourceRoutes.push(
        <Route
          key={path}
          path={path}
          element={
            Custom ? (
              <Custom />
            ) : (
              <ResourcePage moduleKey={moduleDef.key} submoduleKey={submodule.key} />
            )
          }
        />,
      )
    }
    for (const page of moduleDef.pages) {
      const path = `/reports/${moduleDef.key}/${page.key}`
      const Custom = CUSTOM_REPORT_PAGES[`${moduleDef.key}/${page.key}`]
      reportRoutes.push(
        <Route
          key={path}
          path={path}
          element={Custom ? <Custom /> : <ReportPage moduleKey={moduleDef.key} reportKey={page.key} />}
        />,
      )
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        {isAuthenticated && resourceRoutes}
        {isAuthenticated && reportRoutes}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
