/**
 * Roles screen. Lists roles with their granted-permission counts and provides an
 * editor that assigns permissions from the grouped registry catalog (module ->
 * submodule / report page -> action).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { accessApi } from '../../api/endpoints'
import { apiError } from '../../api/client'
import { Alert, Card, EmptyState, Modal, Spinner } from '../../components/ui'
import StatusBadge from '../../components/ui/StatusBadge'

const EMPTY = { code: '', name: '', description: '', status: 'active', permissions: [] }

/**
 * Role administration. Permissions are grouped by module and submodule so a
 * 368-entry catalogue stays navigable, with per-submodule select-all helpers.
 */
export default function RolesPage() {
  const [rows, setRows] = useState([])
  const [catalogue, setCatalogue] = useState({ total: 0, groups: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rolesResponse, permissions] = await Promise.all([accessApi.roles({ limit: 100 }), accessApi.permissions()])
      setRows(rolesResponse.data || [])
      setCatalogue(permissions || { total: 0, groups: [] })
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Groups catalogue entries: module -> submodule/page -> actions. */
  const grouped = useMemo(() => {
    const tree = new Map()
    for (const group of catalogue.groups || []) {
      const entries = [
        ...(group.submodules || []),
        ...(group.pages || []).map((page) => ({ key: page.key, name: `${page.name} (report)`, permissions: page.permissions || [] })),
      ]
      for (const submodule of entries) {
        const actions = (submodule.permissions || [])
          .filter((key) => !filter || key.toLowerCase().includes(filter.toLowerCase()))
          .map((key) => ({ key, action: key.split(':')[2] || key }))
        if (actions.length === 0) continue
        if (!tree.has(group.name)) tree.set(group.name, new Map())
        tree.get(group.name).set(submodule.name, actions)
      }
    }
    return tree
  }, [catalogue, filter])

  function toggle(permissionKey) {
    setForm((current) => {
      const set = new Set(current.permissions)
      if (set.has(permissionKey)) set.delete(permissionKey)
      else set.add(permissionKey)
      return { ...current, permissions: [...set] }
    })
  }

  function toggleSubmodule(permissions, checked) {
    setForm((current) => {
      const set = new Set(current.permissions)
      for (const permission of permissions) {
        if (checked) set.add(permission.key)
        else set.delete(permission.key)
      }
      return { ...current, permissions: [...set] }
    })
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = { code: form.code, name: form.name, description: form.description, status: form.status, permissions: form.permissions }
      if (form.id) await accessApi.updateRole(form.id, payload)
      else await accessApi.createRole(payload)
      setForm(null)
      setNotice({ tone: 'success', message: 'Role saved' })
      load()
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete role ${row.name}?`)) return
    try {
      await accessApi.deleteRole(row._id)
      setNotice({ tone: 'success', message: 'Role deleted' })
      load()
    } catch (requestError) {
      setError(apiError(requestError))
    }
  }

  const isWildcard = form?.permissions?.includes('*')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Roles &amp; Permissions</h1>
          <p className="text-sm text-slate-500">Define what each type of user can see and do across {catalogue.total} permissions</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setForm({ ...EMPTY, permissions: [] })}>+ New role</button>
      </div>

      {error && <Alert title={error.message} onClose={() => setError(null)} />}
      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.message}</Alert>}

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          {rows.length === 0 ? (
            <EmptyState title="No roles defined" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Code</th>
                    <th className="th">Name</th>
                    <th className="th">Description</th>
                    <th className="th">Permissions</th>
                    <th className="th">Status</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50">
                      <td className="td font-medium">{row.code}</td>
                      <td className="td">
                        {row.name}
                        {row.isSystem && <span className="ml-2 badge bg-slate-100 text-slate-500">system</span>}
                      </td>
                      <td className="td max-w-md truncate">{row.description || '—'}</td>
                      <td className="td tabular-nums">
                        {row.permissions?.includes('*') ? <span className="badge bg-emerald-100 text-emerald-700">all</span> : row.permissions?.length || 0}
                      </td>
                      <td className="td"><StatusBadge value={row.status} /></td>
                      <td className="td text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-emerald-700 hover:underline"
                            onClick={() => setForm({
                              id: row._id,
                              code: row.code,
                              name: row.name,
                              description: row.description || '',
                              status: row.status || 'active',
                              permissions: row.permissions || [],
                            })}
                          >
                            Edit
                          </button>
                          {!row.isSystem && (
                            <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => remove(row)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={Boolean(form)} wide title={form?.id ? `Edit role — ${form.name}` : 'New role'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="code">Role code *</label>
                <input id="code" className="input uppercase" required disabled={Boolean(form.id)} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })} />
              </div>
              <div>
                <label className="label" htmlFor="name">Role name *</label>
                <input id="name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {['active', 'inactive'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="label" htmlFor="description">Description</label>
                <input id="description" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div className="rounded-md border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-700">Permissions</h3>
                  <span className="badge bg-slate-100 text-slate-600">{isWildcard ? 'all permissions' : `${form.permissions.length} selected`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input className="input w-44" placeholder="Filter permissions…" value={filter} onChange={(e) => setFilter(e.target.value)} />
                  <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, permissions: ['*'] })}>Grant all</button>
                  <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, permissions: [] })}>Clear</button>
                </div>
              </div>

              {isWildcard ? (
                <p className="px-3 py-4 text-sm text-emerald-700">
                  This role holds the <code className="rounded bg-slate-100 px-1">*</code> wildcard: unrestricted access to every module.
                </p>
              ) : (
                <div className="max-h-80 space-y-3 overflow-y-auto px-3 py-3">
                  {[...grouped.entries()].map(([moduleKey, submodules]) => (
                    <div key={moduleKey}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{moduleKey}</p>
                      <div className="space-y-1.5">
                        {[...submodules.entries()].map(([submoduleKey, permissions]) => {
                          const selected = permissions.filter((permission) => form.permissions.includes(permission.key)).length
                          return (
                            <div key={submoduleKey} className="rounded border border-slate-100 px-2 py-1.5">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-600">
                                  {submoduleKey}
                                  {selected > 0 && <span className="ml-1.5 text-emerald-600">{selected}/{permissions.length}</span>}
                                </span>
                                <span className="flex gap-2">
                                  <button type="button" className="text-[11px] text-emerald-700 hover:underline" onClick={() => toggleSubmodule(permissions, true)}>all</button>
                                  <button type="button" className="text-[11px] text-slate-500 hover:underline" onClick={() => toggleSubmodule(permissions, false)}>none</button>
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {permissions.map((permission) => (
                                  <label key={permission.key} className="flex items-center gap-1 text-xs text-slate-600">
                                    <input
                                      type="checkbox"
                                      checked={form.permissions.includes(permission.key)}
                                      onChange={() => toggle(permission.key)}
                                    />
                                    {permission.action}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {grouped.size === 0 && <p className="py-4 text-center text-sm text-slate-500">No permissions match this filter.</p>}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save role'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
