/**
 * Users screen. Manages application accounts and their role assignments, with
 * password handling delegated to the backend and the super admin shown explicitly.
 */
import { useCallback, useEffect, useState } from 'react'
import { accessApi } from '../../api/endpoints'
import { apiError } from '../../api/client'
import { Alert, Card, EmptyState, Modal, Pagination, Spinner } from '../../components/ui'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatDate } from '../../components/ui/Cell'

const EMPTY = { employeeCode: '', firstName: '', lastName: '', email: '', phone: '', password: '', status: 'active', roles: [] }

export default function UsersPage() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: 10 }
      if (search.trim()) params.search = search.trim()
      const response = await accessApi.users(params)
      setRows(response.data || [])
      setMeta(response.meta || { page, total: 0, totalPages: 1 })
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    accessApi.roleOptions().then(setRoles).catch(() => setRoles([]))
  }, [])

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (form.id) await accessApi.updateUser(form.id, payload)
      else await accessApi.createUser(payload)
      setForm(null)
      setNotice({ tone: 'success', message: 'User saved' })
      load()
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete user ${row.email}?`)) return
    try {
      await accessApi.deleteUser(row._id)
      setNotice({ tone: 'success', message: 'User deleted' })
      load()
    } catch (requestError) {
      setError(apiError(requestError))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Users</h1>
          <p className="text-sm text-slate-500">Application accounts and their role assignments</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input w-56"
            placeholder="Search users…"
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
          <button type="button" className="btn-primary" onClick={() => setForm({ ...EMPTY })}>+ New user</button>
        </div>
      </div>

      {error && <Alert title={error.message} onClose={() => setError(null)} />}
      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.message}</Alert>}

      <Card>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Employee Code</th>
                  <th className="th">Name</th>
                  <th className="th">Email</th>
                  <th className="th">Roles</th>
                  <th className="th">Status</th>
                  <th className="th">Last Login</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50">
                    <td className="td font-medium">{row.employeeCode}</td>
                    <td className="td">{[row.firstName, row.lastName].filter(Boolean).join(' ')}</td>
                    <td className="td">{row.email}</td>
                    <td className="td">
                      {row.isSuperAdmin
                        ? 'Super Admin (all permissions)'
                        : (row.roles || []).map((role) => role.name || role.code).join(', ') || '—'}
                    </td>
                    <td className="td"><StatusBadge value={row.status} /></td>
                    <td className="td">{formatDate(row.lastLoginAt)}</td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs font-medium text-emerald-700 hover:underline"
                          onClick={() =>
                            setForm({
                              id: row._id,
                              employeeCode: row.employeeCode || '',
                              firstName: row.firstName || '',
                              lastName: row.lastName || '',
                              email: row.email || '',
                              phone: row.phone || '',
                              password: '',
                              status: row.status || 'active',
                              roles: (row.roles || []).map((role) => String(role._id || role.id)),
                            })
                          }
                        >
                          Edit
                        </button>
                        <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => remove(row)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length > 0 && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
      </Card>

      <Modal open={Boolean(form)} title={form?.id ? 'Edit user' : 'New user'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="employeeCode">Employee code *</label>
                <input id="employeeCode" className="input" required value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="email">Email *</label>
                <input id="email" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="firstName">First name *</label>
                <input id="firstName" className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="lastName">Last name</label>
                <input id="lastName" className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {['active', 'inactive', 'suspended'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="password">
                  Password {form.id ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  required={!form.id}
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="roles">Roles</label>
                <select
                  id="roles"
                  multiple
                  className="input h-32"
                  value={form.roles}
                  onChange={(e) => setForm({ ...form, roles: [...e.target.selectedOptions].map((option) => option.value) })}
                >
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save user'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
