import { useEffect, useMemo, useState } from 'react'
import { samplesApi, lotsApi, catalogApi } from '../lib/api'
import { Plus, Search, X, Pencil, Bug, Clock, CheckCircle2 } from 'lucide-react'

/** Solo productos con análisis de plaguicidas */
const PRODUCT_TABS = [
  {
    key: 'torta_cacao',
    label: 'Torta de cacao',
    match: (n) => n && n.toLowerCase() === 'torta de cacao',
  },
  {
    key: 'torta_trozada',
    label: 'Torta trozada estándar',
    match: (n) => n && n.toLowerCase().includes('trozada'),
  },
]

function pestStatus(s) {
  const p = (s.pesticides || '').trim()
  if (p) return 'resultado'
  return 'pendiente'
}

function StatusBadge({ status }) {
  if (status === 'resultado') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Con resultado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Pendiente
    </span>
  )
}

const emptyForm = {
  lot_id: '',
  lot_code: '',
  send_date: '',
  estado: 'pendiente',
  pesticides: '',
}

export default function SamplesPesticides() {
  const [tab, setTab] = useState('torta_cacao')
  const [samples, setSamples] = useState([])
  const [lots, setLots] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentTab = PRODUCT_TABS.find((t) => t.key === tab) || PRODUCT_TABS[0]

  const load = async () => {
    setLoading(true)
    try {
      const [s, l, p] = await Promise.all([
        samplesApi.listLot(),
        lotsApi.list(),
        catalogApi.products(),
      ])
      setSamples(s.data || [])
      setLots(l.data || [])
      setProducts(p.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const productIdForTab = useMemo(() => {
    const p = products.find((pr) => currentTab.match(pr.name))
    return p?.id || null
  }, [products, currentTab])

  const filteredLots = useMemo(
    () => lots.filter((l) => currentTab.match(l.product_name)),
    [lots, currentTab]
  )

  const tabSamples = useMemo(() => {
    let list = samples.filter((s) => currentTab.match(s.product_name))
    if (filterStatus !== 'all') {
      list = list.filter((s) => pestStatus(s) === filterStatus)
    }
    if (q.trim()) {
      const qq = q.trim().toLowerCase()
      list = list.filter(
        (s) =>
          (s.lot_code || '').toLowerCase().includes(qq) ||
          (s.pesticides || '').toLowerCase().includes(qq) ||
          (s.origins_text || '').toLowerCase().includes(qq)
      )
    }
    return list.sort((a, b) => String(b.send_date || '').localeCompare(String(a.send_date || '')))
  }, [samples, currentTab, filterStatus, q])

  const counts = useMemo(() => {
    const c = {}
    for (const t of PRODUCT_TABS) {
      c[t.key] = samples.filter((s) => t.match(s.product_name)).length
    }
    return c
  }, [samples])

  const pendingCount = useMemo(
    () => samples.filter((s) => currentTab.match(s.product_name) && pestStatus(s) === 'pendiente').length,
    [samples, currentTab]
  )

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setError('')
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (sample) => {
    setEditingId(sample.id)
    setForm({
      lot_id: String(sample.lot_id),
      lot_code: sample.lot_code || '',
      send_date: sample.send_date || '',
      estado: pestStatus(sample) === 'resultado' ? 'resultado' : 'pendiente',
      pesticides: sample.pesticides || '',
    })
    setShowForm(true)
    setError('')
  }

  const resolveLotId = async () => {
    if (form.lot_id) return Number(form.lot_id)
    const code = (form.lot_code || '').trim()
    if (!code) throw new Error('Indica un código de lote')
    if (!productIdForTab) throw new Error('No se encontró el producto')
    const existing = lots.find((l) => l.lot_code.toLowerCase() === code.toLowerCase())
    if (existing) return existing.id
    const res = await lotsApi.create({ product_id: productIdForTab, lot_code: code, origins: [] })
    return res.data.id
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const isResultado = form.estado === 'resultado'
      const pest = isResultado ? (form.pesticides || '').trim() || null : null
      if (isResultado && !pest) {
        throw new Error('Ingresa el resultado de plaguicidas')
      }

      if (editingId) {
        await samplesApi.updateLot(editingId, {
          pesticides: pest,
          send_date: form.send_date || null,
        })
      } else {
        const lotId = await resolveLotId()
        const existing = samples.find((s) => s.lot_id === lotId)
        if (existing) {
          await samplesApi.updateLot(existing.id, {
            pesticides: pest,
            send_date: form.send_date || existing.send_date || null,
          })
        } else {
          await samplesApi.createLot({
            lot_id: lotId,
            has_sample: true,
            cadmium_mg_kg: null,
            pesticides: pest,
            send_date: form.send_date || null,
            observation: null,
          })
        }
      }
      setShowForm(false)
      resetForm()
      await load()
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted)' }}>
        Cargando plaguicidas…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Bug className="w-6 h-6 text-primary-500" />
            Plaguicidas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Resultados de plaguicidas — solo Torta de cacao y Torta trozada. Separado del análisis de cadmio.
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Registrar / actualizar
        </button>
      </div>

      <div className="flex gap-2 flex-wrap border-b pb-0" style={{ borderColor: 'var(--border)' }}>
        {PRODUCT_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key)
              setShowForm(false)
              setFilterStatus('all')
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">({counts[t.key] || 0})</span>
          </button>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="text-sm px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
          {pendingCount} lote{pendingCount === 1 ? '' : 's'} de {currentTab.label} sin resultado de plaguicidas
        </div>
      )}

      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {editingId ? 'Editar plaguicidas' : 'Registrar plaguicidas'} — {currentTab.label}
            </h2>
            <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="p-1 rounded hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Lote</label>
              {editingId ? (
                <input className="input" value={form.lot_code} disabled />
              ) : (
                <select
                  className="input"
                  value={form.lot_id}
                  onChange={(e) => {
                    const id = e.target.value
                    const lot = filteredLots.find((l) => String(l.id) === id)
                    setForm({
                      ...form,
                      lot_id: id,
                      lot_code: lot?.lot_code || '',
                    })
                  }}
                  required
                >
                  <option value="">Seleccionar lote existente…</option>
                  {filteredLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.lot_code}
                    </option>
                  ))}
                </select>
              )}
              {!editingId && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Usa un lote ya creado en Muestras (cadmio). Si no existe muestra, se crea solo para plaguicidas.
                </p>
              )}
            </div>
            <div>
              <label className="label">Fecha de envío</label>
              <input
                type="date"
                className="input"
                value={form.send_date}
                onChange={(e) => setForm({ ...form, send_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={form.estado}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estado: e.target.value,
                    pesticides: e.target.value === 'pendiente' ? '' : form.pesticides,
                  })
                }
              >
                <option value="pendiente">Pendiente de resultado</option>
                <option value="resultado">Con resultado</option>
              </select>
            </div>
            {form.estado === 'resultado' && (
              <div className="md:col-span-2">
                <label className="label">Resultado de plaguicidas</label>
                <textarea
                  className="input min-h-[88px]"
                  value={form.pesticides}
                  onChange={(e) => setForm({ ...form, pesticides: e.target.value })}
                  placeholder="Ej. No detectado / valores del laboratorio"
                  required
                />
              </div>
            )}
            <div className="md:col-span-2 flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pendiente', label: 'Pendiente' },
            { key: 'resultado', label: 'Con resultado' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterStatus === f.key
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-white text-gray-600 border-surface-200 hover:bg-surface-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar lote o resultado…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ background: 'var(--hover)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {currentTab.label}
          </h2>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {tabSamples.length} registro{tabSamples.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide border-b" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Fecha envío</th>
                <th className="px-4 py-3 font-medium">Orígenes</th>
                <th className="px-4 py-3 font-medium">Plaguicidas</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium w-20" />
              </tr>
            </thead>
            <tbody>
              {tabSamples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center" style={{ color: 'var(--muted)' }}>
                    No hay registros de plaguicidas para este producto.
                  </td>
                </tr>
              ) : (
                tabSamples.map((s) => {
                  const st = pestStatus(s)
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-surface-50" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>
                        {s.lot_code || '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                        {s.send_date || '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate" style={{ color: 'var(--muted)' }} title={s.origins_text || ''}>
                        {s.origins_text || '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        {st === 'resultado' ? (
                          <span className="line-clamp-2" title={s.pesticides}>
                            {s.pesticides}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={st} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                          title="Editar plaguicidas"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
