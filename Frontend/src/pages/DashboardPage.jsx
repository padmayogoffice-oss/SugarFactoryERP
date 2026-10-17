import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/endpoints'
import { apiError } from '../api/client'
import { Alert, BarList, Card, EmptyState, Spinner, StatTile } from '../components/ui'
import { formatDate, formatNumber } from '../components/ui/Cell'
import { useAuth } from '../context/AuthContext'

const KPI_TONES = ['emerald', 'sky', 'violet', 'amber', 'red', 'slate']

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setData)
      .catch((requestError) => setError(apiError(requestError)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading dashboard…" />
  if (error) return <Alert title={error.message} />

  const production = data?.production
  const charts = data?.charts || {}

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-800">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-sm text-slate-500">
          {production?.entries
            ? `Current season: ${formatNumber(production.caneCrushedMt)} MT cane crushed at ${production.recoveryPercent}% recovery.`
            : 'No crushing data recorded yet. Add shift production entries to populate this dashboard.'}
        </p>
      </header>

      {data?.kpis?.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi, index) => (
            <StatTile key={kpi.key} label={kpi.label} value={kpi.value} tone={KPI_TONES[index % KPI_TONES.length]} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="No dashboard cards available" message="Your role does not grant access to any dashboard metrics." />
        </Card>
      )}

      {production && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Cane Crushed (MT)" value={production.caneCrushedMt} tone="emerald" />
          <StatTile label="Sugar Produced (MT)" value={production.sugarProducedMt} tone="sky" />
          <StatTile label="Molasses (MT)" value={production.molassesProducedMt} tone="amber" />
          <StatTile label="Bagasse (MT)" value={production.bagasseProducedMt} tone="slate" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {charts.caneTrend?.length > 0 && (
          <Card title="Cane crushed — last 14 days" subtitle="Metric tonnes per day">
            <BarList items={charts.caneTrend} unit=" MT" />
          </Card>
        )}

        {charts.sugarTrend?.length > 0 && (
          <Card title="Sugar produced — last 14 days" subtitle="Metric tonnes per day">
            <BarList items={charts.sugarTrend} unit=" MT" tone="bg-sky-500" />
          </Card>
        )}

        {charts.salesByGrade?.length > 0 && (
          <Card title="Sales by grade" subtitle="Invoice value">
            <BarList items={charts.salesByGrade} unit="" tone="bg-violet-500" />
          </Card>
        )}

        {charts.purchasesByVendor?.length > 0 && (
          <Card title="Purchases by vendor" subtitle="Purchase order value">
            <BarList items={charts.purchasesByVendor} unit="" tone="bg-amber-500" />
          </Card>
        )}

        {charts.stock?.length > 0 && (
          <Card title="Stock on hand" subtitle="Balance quantity by item">
            <BarList items={charts.stock} unit="" tone="bg-emerald-500" />
          </Card>
        )}

        {data?.recentActivity?.length > 0 && (
          <Card title="Recent activity" subtitle="Latest audited actions">
            <ul className="divide-y divide-slate-100">
              {data.recentActivity.map((entry) => (
                <li key={entry._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-700">{entry.description || entry.action}</p>
                    <p className="truncate text-xs text-slate-400">
                      {entry.module}/{entry.submodule} · {entry.userEmail || 'system'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
