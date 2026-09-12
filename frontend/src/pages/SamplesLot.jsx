import { useEffect, useMemo, useRef, useState } from 'react'
import { samplesApi, lotsApi, catalogApi } from '../lib/api'
import { Plus, Search, X, Pencil, FlaskConical, Clock, CheckCircle2, ChevronDown } from 'lucide-react'

const PRODUCT_TABS = [
  { key: 'torta_cacao', label: 'Torta de cacao', match: (n) => n && n.toLowerCase() === 'torta de cacao' },
  { key: 'torta_alcalino', label: 'Torta de cacao alcalino', match: (n) => n && n.toLowerCase().includes('torta de cacao alcalino') },
  { key: 'torta_trozada', label: 'Torta trozada estándar', match: (n) => n && n.toLowerCase().includes('trozada') },
  { key: 'cacao_alcalino', label: 'Cacao alcalino', match: (n) => n && n.toLowerCase().includes('cacao alcalino') && !n.toLowerCase().includes('torta') },
  { key: 'cacao_polvo', label: 'Cacao en polvo', match: (n) => n && n.toLowerCase().includes('polvo') },
  { key: 'grano', label: 'Grano de cacao', match: () => false, isGrain: true },
]

function sampleStatus(s) {
  const obs = (s.observation || '').toUpperCase()
  if (obs.includes('SIN MUESTRA') && (s.cadmium_mg_kg == null || s.cadmium_mg_kg === '')) {
    return 'sin_muestra'
  }
  if (s.has_sample && s.cadmium_mg_kg != null) return 'resultado'
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
  if (status === 'sin_muestra') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
        Sin muestra
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Pendiente de resultado
    </span>
  )
}

function LotCombobox({ lots, value, onChange, lotCode, onLotCodeChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return lots.slice(0, 40)
    return lots.filter((l) => l.lot_code.toLowerCase().includes(q)).slice(0, 40)
  }, [lots, query])

  const selected = lots.find((l) => String(l.id) === String(value))
  const display = selected ? selected.lot_code : lotCode || query

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className="input pl-9 pr-9"
          placeholder="Buscar o escribir código de lote…"
          value={display}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            onLotCodeChange(v)
            onChange('')
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {(value || lotCode) && !disabled && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-100"
            onClick={() => {
              onChange('')
              onLotCodeChange('')
              setQuery('')
            }}
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-xl border bg-white shadow-lg border-surface-200">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500">
              {query.trim() ? (
                <>
                  No hay lote <strong className="text-gray-800">{query.trim()}</strong>.
                  <br />
                  <span className="text-primary-600">Se creará como lote nuevo al guardar.</span>
                </>
              ) : (
                'Escribe para buscar o crear un lote'
              )}
            </div>
          ) : (
            filtered.map((l) => (
              <button
                key={l.id}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 flex items-center justify-between gap-2"
                onClick={() => {
                  onChange(String(l.id))
                  onLotCodeChange(l.lot_code)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span className="font-medium font-mono text-xs">{l.lot_code}</span>
                <span className="text-xs text-gray-400 truncate">{l.product_name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function OriginsMultiSelect({ origins, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter((x) => x !== name))
    } else {
      onChange([...selected, name])
    }
  }

  const label =
    selected.length === 0
      ? 'Seleccionar orígenes…'
      : selected.length <= 2
        ? selected.join(', ')
        : `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input w-full text-left flex items-center justify-between gap-2"
        onClick={() => setOpen(!open)}
      >
        <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-900 truncate'}>{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-xl border bg-white shadow-lg border-surface-200 p-2">
          {origins.length === 0 ? (
            <p className="text-sm text-gray-400 px-2 py-2">No hay orígenes en el catálogo</p>
          ) : (
            origins.map((o) => (
              <label
                key={o.id}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  checked={selected.includes(o.name)}
                  onChange={() => toggle(o.name)}
                />
                <span>{o.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const emptyForm = {
  lot_id: '',
  lot_code: '',
  send_date: '',
  origins: [],
  estado: 'pendiente',
  cadmium_mg_kg: '',
}

export default function SamplesLot() {
  const [tab, setTab] = useState('torta_cacao')
  const [samples, setSamples] = useState([])
  const [grainSamples, setGrainSamples] = useState([])
  const [lots, setLots] = useState([])
  const [products, setProducts] = useState([])
  const [originsList, setOriginsList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const currentTab = PRODUCT_TABS.find((t) => t.key === tab) || PRODUCT_TABS[0]

  const load = async () => {
    setLoading(true)
    try {
      const [s, g, l, p, o] = await Promise.all([
        samplesApi.listLot(),
        samplesApi.listGrain(),
        lotsApi.list(),
        catalogApi.products(),
        catalogApi.origins(),
      ])
      setSamples(s.data || [])
      setGrainSamples(g.data || [])
      setLots(l.data || [])
      setProducts(p.data || [])
      setOriginsList(o.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredSamples = useMemo(() => {
    if (currentTab.isGrain) return []
    let list = samples.filter((s) => currentTab.match(s.product_name))
    if (filterStatus === 'pendiente') list = list.filter((s) => sampleStatus(s) === 'pendiente')
    if (filterStatus === 'resultado') list = list.filter((s) => sampleStatus(s) === 'resultado')
    return list
  }, [samples, currentTab, filterStatus])

  const filteredLots = useMemo(() => {
    if (currentTab.isGrain) return []
    return lots.filter((l) => currentTab.match(l.product_name))
  }, [lots, currentTab])

  const productIdForTab = useMemo(() => {
    const p = products.find((pr) => currentTab.match(pr.name))
    return p?.id || null
  }, [products, currentTab])

  const counts = useMemo(() => {
    const c = {}
    for (const t of PRODUCT_TABS) {
      if (t.isGrain) c[t.key] = grainSamples.length
      else c[t.key] = samples.filter((s) => t.match(s.product_name)).length
    }
    return c
  }, [samples, grainSamples])

  const pendingCount = useMemo(
    () => samples.filter((s) => currentTab.match(s.product_name) && sampleStatus(s) === 'pendiente').length,
    [samples, currentTab]
  )

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (sample) => {
    const st = sampleStatus(sample)
    const originNames = (sample.origins_text || sample.observation || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    setEditingId(sample.id)
    setForm({
      lot_id: String(sample.lot_id),
      lot_code: sample.lot_code || '',
      send_date: sample.send_date || '',
      origins: originNames,
      estado: st === 'resultado' ? 'resultado' : 'pendiente',
      cadmium_mg_kg: sample.cadmium_mg_kg != null ? String(sample.cadmium_mg_kg) : '',
    })
    setShowForm(true)
  }

  const resolveLotId = async () => {
    if (form.lot_id) return Number(form.lot_id)
    const code = (form.lot_code || '').trim()
    if (!code) throw new Error('Indica un código de lote')
    if (!productIdForTab) throw new Error('No se encontró el producto de esta pestaña')
    const existing = lots.find((l) => l.lot_code.toLowerCase() === code.toLowerCase())
    if (existing) return existing.id
    const res = await lotsApi.create({
      product_id: productIdForTab,
      lot_code: code,
      origins: [],
    })
    return res.data.id
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const isResultado = form.estado === 'resultado'
      const cd = form.cadmium_mg_kg === '' ? null : Number(form.cadmium_mg_kg)
      const originsText = form.origins.join(', ')
      const payload = {
        cadmium_mg_kg: isResultado ? cd : null,
        has_sample: isResultado && cd != null,
        send_date: form.send_date || null,
        observation: originsText || null,
      }

      if (editingId) {
        await samplesApi.updateLot(editingId, payload)
      } else {
        const lotId = await resolveLotId()
        await samplesApi.createLot({
          lot_id: lotId,
          ...payload,
        })
      }
      setShowForm(false)
      resetForm()
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Análisis por producto</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registra lotes y completa el cadmio cuando llegue el resultado
          </p>
        </div>
        {!currentTab.isGrain && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
              </span>
            )}
            <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Añadir nuevo lote
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-3">
        {PRODUCT_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key)
              setShowForm(false)
              setFilterStatus('all')
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs ${tab === t.key ? 'text-white/80' : 'text-gray-400'}`}>
              ({counts[t.key] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {showForm && !currentTab.isGrain && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-900">
              {editingId ? 'Editar lote' : 'Añadir nuevo lote'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Lote ({currentTab.label})</label>
              <LotCombobox
                lots={filteredLots}
                value={form.lot_id}
                lotCode={form.lot_code}
                disabled={!!editingId}
                onChange={(id) => setForm((f) => ({ ...f, lot_id: id }))}
                onLotCodeChange={(code) => setForm((f) => ({ ...f, lot_code: code, lot_id: '' }))}
              />
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
              <label className="label">Orígenes</label>
              <OriginsMultiSelect
                origins={originsList}
                selected={form.origins}
                onChange={(names) => setForm({ ...form, origins: names })}
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
                    cadmium_mg_kg: e.target.value === 'pendiente' ? '' : form.cadmium_mg_kg,
                  })
                }
              >
                <option value="pendiente">Pendiente de resultado</option>
                <option value="resultado">Con resultado</option>
              </select>
            </div>

            {form.estado === 'resultado' && (
              <div>
                <label className="label">Cadmio (mg/kg)</label>
                <input
                  type="number"
                  step="0.001"
                  className="input"
                  value={form.cadmium_mg_kg}
                  onChange={(e) => setForm({ ...form, cadmium_mg_kg: e.target.value })}
                  placeholder="Resultado del laboratorio"
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

      {!currentTab.isGrain && (
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pendiente', label: 'Pendiente de resultado' },
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
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-800">{currentTab.label}</h2>
          <span className="text-xs text-gray-500">
            {currentTab.isGrain ? grainSamples.length : filteredSamples.length} registro(s)
          </span>
        </div>

        {currentTab.isGrain ? (
          <table className="w-full text-sm">
            <thead className="bg-surface-100 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Guía</th>
                <th className="px-4 py-3 font-medium">Cadmio</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : grainSamples.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Sin muestras de grano
                  </td>
                </tr>
              ) : (
                grainSamples.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3 font-medium">{s.origin_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.guia_code}</td>
                    <td className="px-4 py-3">
                      {s.has_sample && s.cadmium_mg_kg != null ? (
                        <span className={s.cadmium_mg_kg > 1.0 ? 'text-red-600 font-medium' : ''}>
                          {Number(s.cadmium_mg_kg).toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">SIN MUESTRA</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.send_date || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-100 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Cadmio</th>
                <th className="px-4 py-3 font-medium">Orígenes</th>
                <th className="px-4 py-3 font-medium">Envío</th>
                <th className="px-4 py-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Sin resultados para {currentTab.label}
                  </td>
                </tr>
              ) : (
                filteredSamples.map((s) => {
                  const st = sampleStatus(s)
                  const originsDisplay = s.origins_text || s.observation || '—'
                  return (
                    <tr key={s.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 font-medium font-mono text-xs">{s.lot_code}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={st} />
                      </td>
                      <td className="px-4 py-3">
                        {st === 'resultado' ? (
                          <span className={s.cadmium_mg_kg > 1.0 ? 'text-red-600 font-medium' : ''}>
                            {Number(s.cadmium_mg_kg).toFixed(3)}
                          </span>
                        ) : st === 'sin_muestra' ? (
                          <span className="text-gray-400 italic">SIN MUESTRA</span>
                        ) : (
                          <span className="text-amber-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{originsDisplay}</td>
                      <td className="px-4 py-3 text-gray-600">{s.send_date || '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600"
                          title="Editar"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
