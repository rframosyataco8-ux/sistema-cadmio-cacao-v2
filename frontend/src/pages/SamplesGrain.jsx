import { useEffect, useState } from 'react'
import { samplesApi, catalogApi } from '../lib/api'
import { Plus } from 'lucide-react'

export default function SamplesGrain() {
  const [samples, setSamples] = useState([])
  const [origins, setOrigins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ origin_id: '', guia_code: '', cadmium_mg_kg: '', send_date: '' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, o] = await Promise.all([samplesApi.listGrain(), catalogApi.origins()])
      setSamples(s.data)
      setOrigins(o.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await samplesApi.createGrain({
        origin_id: Number(form.origin_id),
        guia_code: form.guia_code,
        cadmium_mg_kg: form.cadmium_mg_kg === '' ? null : Number(form.cadmium_mg_kg),
        has_sample: form.cadmium_mg_kg !== '',
        send_date: form.send_date || null,
      })
      setShowForm(false)
      setForm({ origin_id: '', guia_code: '', cadmium_mg_kg: '', send_date: '' })
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Análisis de Grano</h1>
          <p className="text-sm text-gray-500 mt-1">Identificado por Origen + Guía</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo análisis
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Origen</label>
              <select className="input" value={form.origin_id} onChange={(e) => setForm({ ...form, origin_id: e.target.value })} required>
                <option value="">Seleccionar</option>
                {origins.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Guía / Código</label>
              <input type="text" className="input" value={form.guia_code} onChange={(e) => setForm({ ...form, guia_code: e.target.value })} required />
            </div>
            <div>
              <label className="label">Cadmio (mg/kg)</label>
              <input type="number" step="0.001" className="input" value={form.cadmium_mg_kg} onChange={(e) => setForm({ ...form, cadmium_mg_kg: e.target.value })} />
            </div>
            <div>
              <label className="label">Fecha de envío</label>
              <input type="date" className="input" value={form.send_date} onChange={(e) => setForm({ ...form, send_date: e.target.value })} />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
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
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : samples.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin datos</td></tr>
            ) : samples.map((s) => (
              <tr key={s.id} className="hover:bg-surface-50">
                <td className="px-4 py-3 font-medium">{s.origin_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.guia_code}</td>
                <td className="px-4 py-3">{s.has_sample && s.cadmium_mg_kg != null ? s.cadmium_mg_kg.toFixed(3) : <span className="text-gray-400 italic">SIN MUESTRA</span>}</td>
                <td className="px-4 py-3 text-gray-600">{s.send_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
