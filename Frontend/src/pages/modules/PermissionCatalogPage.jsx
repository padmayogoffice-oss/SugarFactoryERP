/**
 * Permission catalog. Lists every permission generated from the registry grouped
 * by module, then by submodule and report page, with the total count.
 */
import { useEffect, useMemo, useState } from 'react'
import { accessApi } from '../../api/accessApi'
import { apiError } from '../../api/client'
import { Alert, Card, Spinner } from '../../components/ui'

/**
 * Read-only view of the permission catalogue. Mirrors the grouping used by the
 * role editor so the two screens describe permissions the same way.
 */
export default function PermissionCatalogPage() {
  const [catalogue, setCatalogue] = useState({ total: 0, groups: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await accessApi.permissions()
        if (!cancelled) setCatalogue(data || { total: 0, groups: [] })
      } catch (requestError) {
        if (!cancelled) setError(apiError(requestError))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    const match = (key) => !needle || key.toLowerCase().includes(needle)
    return (catalogue.groups || [])
      .map((group) => ({
        ...group,
        submodules: [
          ...(group.submodules || []),
          ...(group.pages || []).map((page) => ({ key: page.key, name: `${page.name} (report)`, permissions: page.permissions || [] })),
        ]
          .map((submodule) => ({
            ...submodule,
            permissions: (submodule.permissions || []).filter(match),
          }))
          .filter((submodule) => submodule.permissions.length),
      }))
      .filter((group) => group.submodules.length)
  }, [catalogue, filter])

  const shown = groups.reduce(
    (total, group) => total + group.submodules.reduce((sum, submodule) => sum + submodule.permissions.length, 0),
    0,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Permission Catalog</h1>
          <p className="text-sm text-slate-500">
            {shown} of {catalogue.total} permissions across {groups.length} modules
          </p>
        </div>
        <input
          className="input w-full sm:w-72"
          placeholder="Filter permissions…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      {error && <Alert title={error.message} onClose={() => setError(null)} />}

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.module}>
              <div className="border-b border-slate-200 px-4 py-2">
                <h2 className="text-sm font-semibold text-slate-700">{group.name}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {group.submodules.map((submodule) => (
                  <div key={submodule.key} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-2.5">
                    <span className="w-56 shrink-0 text-sm font-medium text-slate-600">{submodule.name}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {submodule.permissions.map((key) => (
                        <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                          {key.split(':')[2]}
                        </code>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {groups.length === 0 && (
            <Card>
              <p className="px-4 py-6 text-center text-sm text-slate-500">No permissions match this filter.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
