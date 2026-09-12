import { useEffect, useMemo, useState } from 'react'
import { samplesApi, lotsApi, catalogApi } from '../lib/api'
import { Plus } from 'lucide-react'

/** Productos del Excel (orden fijo) */
const PRODUCT_TABS = [
  { key: 'torta_cacao', label: 'Torta de cacao', match: (n) => n && n.toLowerCase() === 'torta de cacao' },
  { key: 'torta_alcalino', label: 'Torta de cacao alcalino', match: (n) => n && n.toLowerCase().includes('torta de cacao alcalino') },
  { key: 'torta_trozada', label: 'Torta trozada estándar', match: (n) => n && n.toLowerCase().includes('trozada') },
  { key: 'cacao_alcalino', label: 'Cacao alcalino', match: (n) => n && n.toLowerCase().includes('cacao alcalino') && !n.toLowerCase().includes('torta') },
  { key: 'cacao_polvo', label: 'Cacao en polvo', match: (n) => n && n.toLowerCase().includes('polvo') },
  { key: 'grano', label: 'Grano de cacao', match: () => false, isGrain: true },
]

export default function SamplesLot() {
  const [tab, setTab] = useState('torta_cacao')
  const [samples, setSamples] = useState([])
  const [grainSamples, setGrainSamples] = useState([])
  const [lots, setLots] = useState([])
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ lot_id: '', cadmium_mg_kg: '', sample_weight_g: '300', send_date: '' })
  const [loading, setLoading] = useState(true)

  const currentTab = PRODUCT_TABS.find((t) => t.key === tab) || PRODUCT_TABS[0]

  const load = async () => {
    setLoading(true)
    try {
      const [s, g, l, p] = await Promise.all([
        samplesApi.listLot(),
        samplesApi.listGrain(),
        lotsApi.list(),
        catalogApi.products(),
      ])
      setSamples(s.data)
      setGrainSamples(g.data)
      setLots(l.data)
      setProducts(p.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredSamples = useMemo(() => {
    if (currentTab.isGrain) return []
    return samples.filter((s) => currentTab.match(s.product_name))
  }, [samples, currentTab])

  const filteredLots = useMemo(() => {
    if (currentTab.isGrain) return []
    return lots.filter((l) => currentTab.match(l.product_name))
  }, [lots, currentTab])

  const counts = useMemo(() => {
    const c = {}
    for (const t of PRODUCT_TABS) {
      if (t.isGrain) c[t.key] = grainSamples.length
      else c[t.key] = samples.filter((s) => t.match(s.product_name)).length
    }
    return c
  }, [samples, grainSamples])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await samplesApi.createLot({
        lot_id: Number(form.lot_id),
        cadmium_mg_kg: form.cadmium_mg_kg === '' ? null : Number(form.cadmium_mg_kg),
        has_sample: form.cadmium_mg_kg !== '',
        sample_weight_g: form.sample_weight_g ? Number(form.sample_weight_g) : null,
        send_date: form.send_date || null,
      })
      setShowForm(false)
      setForm({ lot_id: '', cadmium_mg_kg: '', sample_weight_g: '300', send_date: '' })
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Análisis por producto</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cada pestaña muestra solo los resultados de ese producto
          </p>
        </div>
        {!currentTab.isGrain && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nuevo análisis
          </button>
        )}
      </div>

      {/* Pestañas de producto */}
      <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-3">
        {PRODUCT_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key)
              setShowForm(false)
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
        <div className="card p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Lote ({currentTab.label})</label>
              <select
                className="input"
                value={form.lot_id}
                onChange={(e) => setForm({ ...form, lot_id: e.target.value })}
                required
              >
                <option value="">Seleccionar lote</option>
                {filteredLots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lot_code} — {l.product_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cadmio (mg/kg)</label>
              <input
                type="number"
                step="0.001"
                className="input"
                value={form.cadmium_mg_kg}
                onChange={(e) => setForm({ ...form, cadmium_mg_kg: e.target.value })}
                placeholder="Vacío = SIN MUESTRA"
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
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">
                Guardar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancelar
              </button>
            </div>
          </form>
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
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Cadmio</th>
                <th className="px-4 py-3 font-medium">Orígenes</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Sin resultados para {currentTab.label}
                  </td>
                </tr>
              ) : (
                filteredSamples.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3 font-medium">{s.lot_code}</td>
                    <td className="px-4 py-3">{s.product_name}</td>
                    <td className="px-4 py-3">
                      {s.has_sample && s.cadmium_mg_kg != null ? (
                        <span className={s.cadmium_mg_kg > 1.0 ? 'text-red-600 font-medium' : ''}>
                          {Number(s.cadmium_mg_kg).toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">SIN MUESTRA</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{s.origins_text || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.send_date || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
