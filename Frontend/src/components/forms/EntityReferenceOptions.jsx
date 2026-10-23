import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { EntityBridgeProvider } from './EntityBridge'

/**
 * Wraps an entity form. Reference dropdowns no longer need every related record
 * loaded up front: each one searches the backend on demand (see RefSelect), so
 * `refOptions` is kept only for compatibility with the pages that call
 * `children(refOptions)`.
 *
 * It also identifies the entity from the route (/m/<module>/<submodule>) and
 * provides the bridge that links the form's fields (auto-fill, cascading clears).
 */
const NO_OPTIONS = {}

export default function EntityReferenceOptions({ navigation, children }) {
  const { pathname } = useLocation()

  const entity = useMemo(() => {
    const match = pathname.match(/^\/m\/([^/]+)\/([^/]+)/)
    if (!match) return null
    return navigation?.modules?.find((item) => item.key === match[1])?.submodules?.find((item) => item.key === match[2]) || null
  }, [navigation, pathname])

  return <EntityBridgeProvider entity={entity}>{children(NO_OPTIONS)}</EntityBridgeProvider>
}