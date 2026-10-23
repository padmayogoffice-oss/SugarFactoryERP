/**
 * Connects the fields of an entity form to each other without every page having
 * to know about relationships.
 *
 * Each entity page already renders its inputs through EntityFieldInput and wraps
 * them in EntityReferenceOptions. The wrapper creates this bridge; every input
 * registers its current value and change handler with it. When a related record
 * is picked, the bridge uses the entity's relation rules (from the navigation
 * tree, built from the backend registry) to
 *
 *   - auto-fill other fields from the picked record (a PO fills supplier, item,
 *     warehouse, UOM and rate),
 *   - clear selections the previous parent no longer permits (a new farmer
 *     invalidates the old farmer's contract),
 *   - tell a dropdown which parent selections should narrow its list.
 */
import { createContext, useContext, useMemo, useRef } from 'react'

const EntityBridgeContext = createContext(null)

export function useEntityBridge() {
  return useContext(EntityBridgeContext)
}

export function EntityBridgeProvider({ entity, children }) {
  const registered = useRef({}) // field name -> { value, onChange }

  const bridge = useMemo(() => {
    const relations = entity?.relations || {}

    return {
      entity,
      registered,

      /** Parent selections that currently narrow `fieldName`'s dropdown. */
      filtersFor(fieldName) {
        const filters = {}
        for (const parent of relations.filterBy?.[fieldName] || []) {
          const value = registered.current[parent]?.value
          if (value) filters[parent] = value
        }
        return filters
      },

      /** Called by a reference input after the user picks (or clears) a record. */
      applySelection(fieldName, value, option) {
        const fill = relations.autofill?.[fieldName] || {}
        const previous = registered.current[fieldName]?.value

        if (value && option?.values) {
          for (const [target, source] of Object.entries(fill)) {
            const entry = registered.current[target]
            if (entry && option.values[source] !== undefined) entry.onChange(option.values[source])
          }
        }

        if (JSON.stringify(previous ?? '') !== JSON.stringify(value ?? '')) {
          for (const [child, parents] of Object.entries(relations.filterBy || {})) {
            if (child === fieldName || child in fill || !parents.includes(fieldName)) continue
            const entry = registered.current[child]
            if (entry?.value) entry.onChange('')
          }
        }
      },
    }
  }, [entity])

  return <EntityBridgeContext.Provider value={bridge}>{children}</EntityBridgeContext.Provider>
}