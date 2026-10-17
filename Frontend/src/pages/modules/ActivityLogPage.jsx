/**
 * Activity log viewer. Read-only audit trail with search, filters and pagination
 * over the actions recorded by the backend audit middleware.
 */
import { useCallback, useEffect, useState } from 'react'
import { accessApi } from '../../api/endpoints'
import { apiError } from '../../api/client'
import { Alert, Card, EmptyState, Pagination, Spinner } from '../../components/ui'
import StatusBadge from '../../components/ui/StatusBadge'

const METHOD_TONES = { POST: 'success', PUT: 'info', PATCH: 'info', DELETE: 'danger', GET: 'neutral' }

export default function ActivityLogPage() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [moduleFilter, setModuleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: 20 }
      if (moduleFilter) params.module = moduleFilter
      const response = await accessApi.activityLogs(params)
      setRows(response.data || [])
      setMeta(response.meta || { page, total: 0, totalPages: 1 })
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, moduleFilter])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Activity Log</h1>
          <p className="text-sm text-slate-500">Immutable audit trail of every create, update and delete</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input w-48"
            value={moduleFilter}
            onChange={(event) => {
              setPage(1)
              setModuleFilter(event.target.value)
            }}
          >
            <option value="">All modules</option>
            {['organization', 'access', 'masters', 'cane', 'production', 'quality', 'stores', 'procurement', 'sales', 'finance', 'hr', 'maintenance'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
        </div>
      </div>

      {error && <Alert title={error.message} onClose={() => setError(null)} />}

      <Card>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No activity recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">When</th>
                  <th className="th">User</th>
                  <th className="th">Action</th>
                  <th className="th">Resource</th>
                  <th className="th">Description</th>
                  <th className="th">Status</th>
                  <th className="th">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50">
                    <td className="td whitespace-nowrap">{new Date(row.createdAt).toLocaleString('en-IN')}</td>
                    <td className="td">
                      <span className="block text-slate-700">{row.userName || 'system'}</span>
                      <span className="block text-xs text-slate-400">{row.userEmail}</span>
                    </td>
                    <td className="td"><StatusBadge value={row.method} tone={METHOD_TONES[row.method]} /></td>
                    <td className="td">
                      <span className="block">{row.module}/{row.submodule}</span>
                      {row.resourceLabel && <span className="block text-xs text-slate-400">{row.resourceLabel}</span>}
                    </td>
                    <td className="td max-w-sm truncate">{row.description}</td>
                    <td className="td"><StatusBadge value={row.statusCode} tone={row.statusCode < 400 ? 'success' : 'danger'} /></td>
                    <td className="td text-xs text-slate-400">{row.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length > 0 && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
      </Card>
    </div>
  )
}
