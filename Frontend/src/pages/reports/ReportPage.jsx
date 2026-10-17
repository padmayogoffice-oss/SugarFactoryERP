import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { reportApi } from '../../api/endpoints'
import { apiError } from '../../api/client'
import { Alert, BarList, Card, EmptyState, Spinner, StatTile } from '../../components/ui'
import { formatNumber } from '../../components/ui/Cell'
import { humanise } from '../../components/layout/Sidebar'

const ROW_KEYS = ['label', 'name', 'item', 'customer', 'vendor', 'supplier', 'account', 'equipment', 'grade', 'date', 'shift', 'status', 'reason', 'expenseHead', 'costHead', 'sampleType', 'result', 'accountType', 'paymentMode', 'paymentStatus', 'breakdownType', 'complianceType', 'transactionType', 'department', 'variety', 'month', 'transporter', 'voucherNo']
const NUMERIC_HINT = /(amount|total|value|qty|quantity|mt|kwh|hours|balance|percent|count|orders|invoices|entries|samples|trips|bags|tests|slips|debit|credit|employees|incidents|loss)/i

function firstRowKey(row) {
  const key = ROW_KEYS.find((candidate) => row[candidate] !== undefined)
  return key || Object.keys(row)[0]
}

function isChartable(rows) {
  if (!rows?.length) return false
  const sample = rows[0]
  const keys = Object.keys(sample)
  const numericKeys = keys.filter((key) => typeof sample[key] === 'number')
  return keys.length <= 5 && numericKeys.length >= 1 && keys.length >= 2
}

function toChartItems(rows) {
  return rows.map((row) => {
    const labelKey = firstRowKey(row)
    const valueKey = Object.keys(row).find((key) => typeof row[key] === 'number' && key !== labelKey) || 'value'
    return { label: row[labelKey], value: row[valueKey] }
  })
}

function DataTable({ rows }) {
  if (!rows?.length) return <EmptyState title="No rows for this range" />
  const columns = Object.keys(rows[0])
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="th">{humanise(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50">
              {columns.map((column) => {
                const value = row[column]
                if (value === null || value === undefined || value === '') return <td key={column} className="td text-slate-400">—</td>
                if (typeof value === 'number') return <td key={column} className="td tabular-nums">{formatNumber(value)}</td>
                if (typeof value === 'object') return <td key={column} className="td">{JSON.stringify(value)}</td>
                const text = String(value)
                if (/^\d{4}-\d{2}-\d{2}/.test(text)) return <td key={column} className="td whitespace-nowrap">{text.slice(0, 10)}</td>
                return <td key={column} className="td">{text}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Renders any report payload generically: `summary` objects become stat tiles,
 * flat arrays of objects become charts, and everything else becomes a table.
 */
export default function ReportPage({ moduleKey: moduleKeyProp, reportKey: reportKeyProp }) {
  const params = useParams()
  const moduleKey = moduleKeyProp ?? params.moduleKey
  const reportKey = reportKeyProp ?? params.reportKey
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState({ from: '', to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to) params.to = range.to
      setData(await reportApi.get(reportKey, params))
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [reportKey, range])

  useEffect(() => {
    load()
  }, [load])

  const sections = useMemo(() => {
    if (!data) return { summaries: [], tables: [] }

    const summaries = []
    const tables = []

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue

      if (key === 'summary' && typeof value === 'object') {
        summaries.push({ key, title: 'Summary', entries: Object.entries(value) })
      } else if (Array.isArray(value)) {
        tables.push({ key, rows: value, chart: isChartable(value) })
      } else if (typeof value === 'object') {
        summaries.push({ key, title: humanise(key), entries: Object.entries(value) })
      } else {
        summaries.push({ key, title: humanise(key), entries: [[key, value]] })
      }
    }

    return { summaries, tables }
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{humanise(reportKey)}</h1>
          <p className="text-sm text-slate-500">{moduleKey} › {reportKey}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor="from">From</label>
            <input id="from" type="date" className="input" value={range.from} onChange={(event) => setRange({ ...range, from: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="to">To</label>
            <input id="to" type="date" className="input" value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} />
          </div>
          <button type="button" className="btn-secondary" onClick={() => setRange({ from: '', to: '' })}>Clear</button>
          <button type="button" className="btn-primary" onClick={load}>Refresh</button>
        </div>
      </div>

      {error && <Alert title={error.message} onClose={() => setError(null)} />}

      {loading ? (
        <Spinner label="Running report…" />
      ) : (
        <>
          {sections.summaries.map((section) => (
            <div key={section.key} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {section.entries.map(([label, value]) => (
                <StatTile key={label} label={humanise(label)} value={typeof value === 'number' ? value : String(value)} />
              ))}
            </div>
          ))}

          {sections.tables.map((section) => (
            <Card key={section.key} title={humanise(section.key)} subtitle={`${section.rows.length} row(s)`}>
              {section.rows.length === 0 ? (
                <EmptyState title="No data for this range" />
              ) : section.chart ? (
                <BarList items={toChartItems(section.rows)} />
              ) : (
                <DataTable rows={section.rows} />
              )}
            </Card>
          ))}

          {!sections.summaries.length && !sections.tables.length && (
            <Card>
              <EmptyState title="Empty report" message="This report returned no data for the selected range." />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
