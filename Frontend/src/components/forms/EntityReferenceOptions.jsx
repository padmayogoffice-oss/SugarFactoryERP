import { useEffect, useState } from 'react'
import { Alert } from '../ui'
import { api, apiError } from '../../api/client'

function normalizeReferenceKey(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export default function EntityReferenceOptions({ fields, navigation, children }) {
  const [refOptions, setRefOptions] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const references = fields.filter((field) => field.type === 'ref' || field.type === 'refs')
    if (!references.length || !navigation?.modules) return undefined

    Promise.all(references.map(async (field) => {
      const target = navigation?.modules
        ?.flatMap((item) => item.submodules.map((submodule) => ({ moduleKey: item.key, submodule })))
        .find((item) => normalizeReferenceKey(item.submodule.key) === normalizeReferenceKey(field.ref))
      if (!target) return [field.name, [], `Reference target "${field.ref}" is unavailable`]
      try {
        const response = await api.get('/' + target.moduleKey + '/' + target.submodule.key + '/options')
        return [field.name, response.data.data || [], null]
      } catch (requestError) {
        return [field.name, [], apiError(requestError).message]
      }
    })).then((entries) => {
      if (cancelled) return
      setRefOptions(Object.fromEntries(entries.map(([name, options]) => [name, options])))
      const failures = entries.filter(([, , message]) => message).map(([name, , message]) => `${name}: ${message}`)
      setError(failures.length ? { message: 'Some reference choices could not be loaded', details: failures } : null)
    })

    return () => {
      cancelled = true
    }
  }, [fields, navigation])

  return (
    <>
      {error && fields.some((field) => field.type === 'ref' || field.type === 'refs') && (
        <Alert title={error.message}>
          <ul className="mt-1 list-inside list-disc text-xs">
            {(error.details || []).map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        </Alert>
      )}
      {children(refOptions)}
    </>
  )
}
