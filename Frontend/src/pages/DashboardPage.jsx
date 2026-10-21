/**
 * Dashboard. KPI tiles, season production totals, trend charts, a module overview
 * and the recent activity feed are each rendered only when the API returned them,
 * which happens only when the caller holds the matching permission.
 *
 * Visual layer: gradient hero with floating sugar crystals, count-up numbers,
 * staggered card entrance, an animated recovery gauge and growing chart bars.
 * All animation is CSS (declared in dashboard.css) and is switched off for
 * users who prefer reduced motion. No new packages are used.
 */
import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/dashboardApi'
import { apiError } from '../api/client'
import { Alert, Card, EmptyState, Spinner } from '../components/ui'
import { ActivityFeed, CaneScene, ColumnChart, GrowBars, ModuleGlance, ProductionBand, QuickStart, RecordsDonut } from '../components/dashboard/DashboardMetrics'
import { FarmJourney, MillJourney, SugarJourney } from '../components/dashboard/DashboardJourneys'
import { Hero, KpiCard, QuickActions, Ticker } from '../components/dashboard/DashboardOverview'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

/* -------------------------------------------------------------------- page --- */

export default function DashboardPage() {
  const { user, navigation } = useAuth()
  const [data, setData] = useState(null)
  const [overview, setOverview] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setData)
      .catch((requestError) => setError(apiError(requestError)))
      .finally(() => setLoading(false))
    // The overview is decorative: a failure here must never break the dashboard.
    dashboardApi.overview().then((result) => setOverview(Array.isArray(result) ? result : [])).catch(() => setOverview([]))
  }, [])

  if (loading) return <Spinner label="Loading dashboard…" />
  if (error) return <Alert title={error.message} />

  const production = data?.production
  const charts = data?.charts || {}
  const hasData = Boolean(production?.entries) || (data?.kpis || []).some((kpi) => Number(kpi.value) > 0)
  const moduleCount = navigation?.modules?.length || overview.length

  return (
    <div className="space-y-6">
      <Hero name={user?.firstName} production={production} moduleCount={moduleCount} />

      {data?.kpis?.length > 0 && <Ticker kpis={data.kpis} />}

      {data?.kpis?.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi, index) => <KpiCard key={kpi.key} kpi={kpi} index={index} />)}
        </div>
      ) : (
        <Card>
          <EmptyState title="No dashboard cards available" message="Your role does not grant access to any dashboard metrics." />
        </Card>
      )}

      <QuickActions navigation={navigation} />

      {production && <ProductionBand production={production} />}

      <CaneScene production={production} />

      <FarmJourney farmers={data?.kpis?.find((kpi) => kpi.key === 'farmers')?.value} />
      <MillJourney caneCrushed={production?.caneCrushedMt} />
      <SugarJourney sugar={production?.sugarProducedMt} />

      {!hasData && <QuickStart navigation={navigation} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {charts.caneTrend?.length > 0 && (
          <Card title="Cane crushed — last 14 days" subtitle="Metric tonnes per day">
            <ColumnChart items={charts.caneTrend} unit=" MT" tone="from-emerald-600 to-emerald-300" />
          </Card>
        )}
        {charts.sugarTrend?.length > 0 && (
          <Card title="Sugar produced — last 14 days" subtitle="Metric tonnes per day">
            <ColumnChart items={charts.sugarTrend} unit=" MT" tone="from-sky-600 to-sky-300" />
          </Card>
        )}
        {charts.salesByGrade?.length > 0 && (
          <Card title="Sales by grade" subtitle="Invoice value">
            <GrowBars items={charts.salesByGrade} tone="from-violet-500 to-fuchsia-400" />
          </Card>
        )}
        {charts.purchasesByVendor?.length > 0 && (
          <Card title="Purchases by vendor" subtitle="Purchase order value">
            <GrowBars items={charts.purchasesByVendor} tone="from-amber-500 to-orange-400" />
          </Card>
        )}
        {charts.stock?.length > 0 && (
          <Card title="Stock on hand" subtitle="Balance quantity by item">
            <GrowBars items={charts.stock} />
          </Card>
        )}
        {overview.length > 0 && <RecordsDonut overview={overview} />}
        {data?.recentActivity?.length > 0 && <ActivityFeed entries={data.recentActivity} />}
      </div>

      {overview.length > 0 && <ModuleGlance overview={overview} />}
    </div>
  )
}