import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiError } from '../../api/client'
import { Alert } from '../../components/ui'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) navigate('/', { replace: true })

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(form)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-xl font-bold">SF</span>
          <h1 className="text-2xl font-semibold">Sugar Factory ERP</h1>
          <p className="text-sm text-emerald-50">Cane to cash, in one system</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          {error && (
            <Alert title={error.message} onClose={() => setError(null)}>
              {error.details?.length ? <ul className="mt-1 list-inside list-disc text-xs">{error.details.map((d) => <li key={d}>{d}</li>)}</ul> : null}
            </Alert>
          )}

          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="username"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Demo super admin: <span className="font-medium text-slate-700">admin@sugarfactory.com</span> /{' '}
            <span className="font-medium text-slate-700">Admin@12345</span>
          </p>
        </form>
      </div>
    </div>
  )
}
