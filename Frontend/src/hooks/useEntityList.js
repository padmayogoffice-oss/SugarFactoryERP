import { useCallback, useEffect, useState } from 'react'
import { api, apiError } from '../api/client'

const PAGE_SIZE = 10

export default function useEntityList(endpoint) {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const response = await api.get(endpoint, {
        params: { page, limit: PAGE_SIZE, q: search.trim() || undefined },
      })
      setRows(response.data.data || [])
      setMeta(response.data.meta || { page, limit: PAGE_SIZE, total: 0, totalPages: 1 })
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, search])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) load()
    })
    return () => {
      active = false
    }
  }, [load])

  return {
    rows,
    meta,
    search,
    setSearch,
    page,
    setPage,
    loading,
    setLoading,
    error,
    setError,
    load,
  }
}
