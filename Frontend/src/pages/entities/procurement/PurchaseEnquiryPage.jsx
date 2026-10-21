import { useMemo, useState } from 'react'
import { Alert, Card, EmptyState, Modal, Pagination, Spinner } from '../../../components/ui'
import Cell from '../../../components/ui/Cell'
import EntityFieldInput from '../../../components/forms/EntityFieldInput'
import { api, apiError } from '../../../api/client'
import { useAuth } from '../../../context/AuthContext'
import { buildEntityForm, buildEntityPayload, isBilingualField } from '../../../utils/entityForm'
import { humanise } from '../../../utils/formatters'
import { finalizeMarathi } from '../../../lib/transliteration'
import EntityReferenceOptions from '../../../components/forms/EntityReferenceOptions'
import useEntityList from '../../../hooks/useEntityList'

const moduleKey = "procurement"
const submoduleKey = "purchaseEnquiry"
const entityName = "Purchase Enquiry / RFQ"
const entityDescription = "Request for quotation sent to approved vendors."
const endpoint = `/` + moduleKey + '/' + submoduleKey
const fields =   [
    {
      "name": "enquiryNo",
      "label": "Enquiry No",
      "type": "string",
      "required": true,
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "enquiryDate",
      "label": "Enquiry Date",
      "type": "date",
      "required": true,
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "requisition",
      "label": "Requisition",
      "type": "ref",
      "required": false,
      "ref": "PurchaseRequisition",
      "refLabel": "requisitionNo",
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "item",
      "label": "Item",
      "type": "ref",
      "required": true,
      "ref": "Item",
      "refLabel": "name",
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "quantity",
      "label": "Quantity",
      "type": "number",
      "required": true,
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "uom",
      "label": "UOM",
      "type": "select",
      "required": true,
      "options": [
        "MT",
        "Quintal",
        "Kg",
        "Litre",
        "KL",
        "Nos",
        "Bag",
        "Box",
        "Bundle",
        "Meter"
      ],
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "suppliers",
      "label": "Vendors Invited",
      "type": "ref",
      "required": false,
      "ref": "Supplier",
      "refLabel": "name",
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "dueDate",
      "label": "Quotation Due Date",
      "type": "date",
      "required": true,
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "status",
      "label": "Status",
      "type": "select",
      "required": false,
      "options": [
        "draft",
        "sent",
        "received",
        "closed",
        "cancelled"
      ],
      "default": "draft",
      "inList": true,
      "inForm": true,
      "readOnly": false,
      "translit": false
    },
    {
      "name": "remarks",
      "label": "Remarks",
      "type": "text",
      "required": false,
      "inList": false,
      "inForm": true,
      "readOnly": false,
      "translit": true,
      "marathiName": "remarksMr"
    }
  ]

export default function PurchaseEnquiryPage() {
  const { navigation, can } = useAuth()
  const { rows, meta, search, setSearch, setPage, loading, setLoading, error, setError, load } = useEntityList(endpoint)
  const [notice, setNotice] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => buildEntityForm(fields, null).form)
  const [manualMarathi, setManualMarathi] = useState(() => buildEntityForm(fields, null).manualMarathi)
  const entity = useMemo(() => navigation?.modules?.find((item) => item.key === moduleKey)?.submodules?.find((item) => item.key === submoduleKey), [navigation])
  const permissions = useMemo(() => ({
    create: can(moduleKey + ':' + submoduleKey + ':create'),
    update: can(moduleKey + ':' + submoduleKey + ':update'),
    delete: can(moduleKey + ':' + submoduleKey + ':delete'),
  }), [can])
  const columns = useMemo(() => fields.filter((field) => field.inList !== false).slice(0, 7), [])



  function startCreate() {
    setEditing(null)
    const initial = buildEntityForm(fields, null)
    setForm(initial.form)
    setManualMarathi(initial.manualMarathi)
    setFormOpen(true)
  }

  function startEdit(row) {
    setEditing(row)
    const initial = buildEntityForm(fields, row)
    setForm(initial.form)
    setManualMarathi(initial.manualMarathi)
    setFormOpen(true)
  }

  async function handleDelete(row) {
    const label = row.name || row.code || row.title || entityName
    if (!window.confirm('Delete ' + label + '? This cannot be undone.')) return
    setError(null)
    try {
      await api.delete(endpoint + '/' + row._id)
      setNotice({ tone: 'success', message: 'Record deleted' })
      setLoading(true)
      await load()
    } catch (requestError) {
      setError(apiError(requestError))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const bilingualNames = fields.filter(isBilingualField).map((field) => field.name)
      const finalForm = bilingualNames.length ? await finalizeMarathi(form, manualMarathi, bilingualNames) : form
      if (finalForm !== form) setForm(finalForm)
      const payload = buildEntityPayload(fields, finalForm)
      if (editing) await api.put(endpoint + '/' + editing._id, payload)
      else await api.post(endpoint, payload)
      setFormOpen(false)
      setNotice({ tone: 'success', message: editing ? 'Record updated' : 'Record created' })
      setLoading(true)
      await load()
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const editableFields = fields.filter((field) => !field.readOnly)
  return (
    <EntityReferenceOptions fields={fields} navigation={navigation}>
      {(refOptions) => (
        <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{entity?.name || entityName || humanise(submoduleKey)}</h1>
          <p className="text-sm text-slate-500">{entity?.description || entityDescription || moduleKey + ' › ' + submoduleKey}</p>
        </div>
        <div className="flex items-center gap-2">
          <input className="input w-56" placeholder="Search…" value={search} onChange={(event) => { setError(null); setLoading(true); setPage(1); setSearch(event.target.value) }} />
          {permissions.create && <button type="button" className="btn-primary" onClick={startCreate}>+ New</button>}
        </div>
      </div>

      {error && <Alert title={error.message} onClose={() => setError(null)} />}
      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.message}</Alert>}

      <Card>
        {loading ? <Spinner /> : rows.length === 0 ? (
          <EmptyState title="No records yet" message={permissions.create ? 'Create the first record to get started.' : 'You do not have permission to create records.'} action={permissions.create ? <button type="button" className="btn-primary mt-2" onClick={startCreate}>+ New record</button> : null} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>{columns.map((field) => <th key={field.name} className="th">{field.label}</th>)}<th className="th text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => <tr key={row._id} className="hover:bg-slate-50">
                  {columns.map((field) => <td key={field.name} className="td"><Cell field={field} value={row[field.name]} /></td>)}
                  <td className="td text-right"><div className="flex justify-end gap-2">
                    {permissions.update && <button type="button" className="text-xs font-medium text-emerald-700 hover:underline" onClick={() => startEdit(row)}>Edit</button>}
                    {permissions.delete && <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => handleDelete(row)}>Delete</button>}
                    {!permissions.update && !permissions.delete && <span className="text-xs text-slate-400">Read only</span>}
                  </div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length > 0 && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={(nextPage) => { setError(null); setLoading(true); setPage(nextPage) }} />}
      </Card>

      <Modal open={formOpen} wide title={(editing ? 'Edit ' : 'New ') + (entity?.name || entityName)} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert title={error.message} onClose={() => setError(null)}>{error.details?.length ? <ul className="mt-1 list-inside list-disc text-xs">{error.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editableFields.map((field) => <div key={field.name} className={['multiselect', 'tags', 'refs'].includes(field.type) || isBilingualField(field) ? 'sm:col-span-2' : ''}>
              {field.type !== 'boolean' && !isBilingualField(field) && <label className="label" htmlFor={field.name}>{field.label}{field.required && <span className="ml-0.5 text-red-500">*</span>}{field.unit && <span className="ml-1 font-normal text-slate-400">({field.unit})</span>}</label>}
              <EntityFieldInput
                field={field}
                value={form[field.name]}
                options={refOptions[field.name] || []}
                manual={Boolean(manualMarathi[field.name])}
                marathiValue={form[field.marathiName]}
                onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
                onMarathiChange={(value) => setForm((current) => ({ ...current, [field.marathiName]: value }))}
                onManualChange={(value) => setManualMarathi((current) => ({ ...current, [field.name]: value }))}
              />
              {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
            </div>)}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}</button>
          </div>
        </form>
      </Modal>
        </div>
      )}
    </EntityReferenceOptions>
  )
}
