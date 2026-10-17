/**
 * Generic list screen for any registry submodule: searchable, filterable and
 * paginated table plus create/edit/delete actions. Columns, form fields and
 * permission gates all come from the submodule's registry metadata, so one
 * component serves every generated resource.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { resourceApi } from '../../api/endpoints'
import { apiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Alert, Card, EmptyState, Modal, Pagination, Spinner } from '../../components/ui'
import Cell from '../../components/ui/Cell'
import ResourceForm from './ResourceForm'
import { humanise } from '../../components/layout/Sidebar'

const PAGE_SIZE = 10

/**
 * Generic list/create/edit/delete page driven entirely by the registry
 * metadata returned by the navigation endpoint.
 */
export default function ResourcePage({ moduleKey: moduleKeyProp, submoduleKey: submoduleKeyProp }) {
  const params = useParams()
  const moduleKey = moduleKeyProp ?? params.moduleKey
  const submoduleKey = submoduleKeyProp ?? params.submoduleKey
  const { navigation, can } = useAuth()

  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [refOptions, setRefOptions] = useState({})

  const submodule = useMemo(() => {
    const moduleDef = navigation?.modules?.find((item) => item.key === moduleKey)
    return moduleDef?.submodules?.find((item) => item.key === submoduleKey) || null
  }, [navigation, moduleKey, submoduleKey])

  const api = useMemo(() => resourceApi(moduleKey, submoduleKey), [moduleKey, submoduleKey])

  const permissions = useMemo(
    () => ({
      create: can(`${moduleKey}:${submoduleKey}:create`),
      update: can(`${moduleKey}:${submoduleKey}:update`),
      delete: can(`${moduleKey}:${submoduleKey}:delete`),
    }),
    [can, moduleKey, submoduleKey],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: PAGE_SIZE }
      if (search.trim()) params.search = search.trim()
      const response = await api.list(params)
      setRows(response.data || [])
      setMeta(response.meta || { page, limit: PAGE_SIZE, total: 0, totalPages: 1 })
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [api, page, search])

  useEffect(() => {
    load()
  }, [load])

  // Load dropdown choices for every reference field on this submodule.
  useEffect(() => {
    if (!submodule) return
    let cancelled = false

    const refFields = submodule.fields.filter((field) => field.type === 'ref' || field.type === 'refs')
    if (!refFields.length) {
      setRefOptions({})
      return undefined
    }

    Promise.all(
      refFields.map(async (field) => {
        const target = findSubmodule(navigation, field.ref)
        if (!target) return [field.name, []]
        try {
          const options = await resourceApi(target.moduleKey, target.submodule.key).options()
          return [field.name, options]
        } catch {
          return [field.name, []]
        }
      }),
    ).then((entries) => {
      if (!cancelled) setRefOptions(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
  }, [submodule, navigation])

  const columns = useMemo(() => (submodule?.fields || []).filter((field) => field.inList !== false).slice(0, 7), [submodule])

  async function handleDelete(row) {
    const label = row.name || row.code || row.title || 'this record'
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    try {
      await api.remove(row._id)
      setNotice({ tone: 'success', message: 'Record deleted' })
      load()
    } catch (requestError) {
      setError(apiError(requestError))
    }
  }

  if (!submodule) {
    return (
      <Card title="Submodule not found">
        <EmptyState
          title="Unknown submodule"
          message={`No submodule "${submoduleKey}" in module "${moduleKey}", or you do not have access to it.`}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{submodule.name || humanise(submoduleKey)}</h1>
          <p className="text-sm text-slate-500">
            {submodule.description || `${moduleKey} › ${submoduleKey}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-56"
            placeholder="Search…"
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
          {permissions.create && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              + New
            </button>
          )}
        </div>
      </div>

      {error && <Alert title={error.message} onClose={() => setError(null)} />}
      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.message}</Alert>}

      <Card>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No records yet"
            message={permissions.create ? 'Create the first record to get started.' : 'You do not have permission to create records.'}
            action={
              permissions.create ? (
                <button
                  type="button"
                  className="btn-primary mt-2"
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(true)
                  }}
                >
                  + New record
                </button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((field) => (
                    <th key={field.name} className="th">{field.label}</th>
                  ))}
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50">
                    {columns.map((field) => (
                      <td key={field.name} className="td">
                        <Cell field={field} value={row[field.name]} />
                      </td>
                    ))}
                    <td className="td text-right">
                      <div className="flex justify-end gap-2">
                        {permissions.update && (
                          <button
                            type="button"
                            className="text-xs font-medium text-emerald-700 hover:underline"
                            onClick={() => {
                              setEditing(row)
                              setFormOpen(true)
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {permissions.delete && (
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:underline"
                            onClick={() => handleDelete(row)}
                          >
                            Delete
                          </button>
                        )}
                        {!permissions.update && !permissions.delete && <span className="text-xs text-slate-400">Read only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
        )}
      </Card>

      <Modal
        open={formOpen}
        wide
        title={`${editing ? 'Edit' : 'New'} ${submodule.name || humanise(submoduleKey)}`}
        onClose={() => setFormOpen(false)}
      >
        <ResourceForm
          submodule={submodule}
          record={editing}
          refOptions={refOptions}
          onCancel={() => setFormOpen(false)}
          onSubmit={async (payload) => {
            if (editing) await api.update(editing._id, payload)
            else await api.create(payload)
            setFormOpen(false)
            setNotice({ tone: 'success', message: editing ? 'Record updated' : 'Record created' })
            load()
          }}
        />
      </Modal>
    </div>
  )
}

/** Locates a submodule anywhere in the navigation tree by its model name. */
export function findSubmodule(navigation, modelName) {
  for (const moduleDef of navigation?.modules || []) {
    for (const submodule of moduleDef.submodules) {
      if (submodule.key === modelName || submodule.model === modelName) {
        return { moduleKey: moduleDef.key, submodule }
      }
    }
  }
  return null
}
