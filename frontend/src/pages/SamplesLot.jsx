import { useEffect, useState } from 'react'
import { samplesApi, lotsApi } from '../lib/api'
import { Plus } from 'lucide-react'

export default function SamplesLot() {
  const [samples, setSamples] = useState([])
  const [lots, setLots] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ lot_id: '', cadmium_mg_kg: '', sample_weight_g: '300', send_date: '' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, l] = await Promise.all([samplesApi.listLot(), lotsApi.list()])
      setSamples(s.data)
      setLots(l.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Análisis de Producto (Lotes)</h1>
          <p className="text-sm text-gray-500 mt-1">Muestras por peso de cada lote de producto terminado</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo análisis
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Lote</label>
              <select className="input" value={form.lot_id} onChange={(e) => setForm({ ...form, lot_id: e.target.value })} required>
                <option value="">Seleccionar lote</option>
                {lots.map((l) => <option key={l.id} value={l.id}>{l.lot_code} — {l.product_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cadmio (mg/kg)</label>
              <input type="number" step="0.001" className="input" value={form.cadmium_mg_kg}
                onChange={(e) => setForm({ ...form, cadmium_mg_kg: e.target.value })} placeholder="Vacío = SIN MUESTRA" />
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
              <th className="px-4 py-3 font-medium">Lote</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Cadmio</th>
              <th className="px-4 py-3 font-medium">Orígenes</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : samples.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin datos — ejecuta el seed</td></tr>
            ) : samples.map((s) => (
              <tr key={s.id} className="hover:bg-surface-50">
                <td className="px-4 py-3 font-medium">{s.lot_code}</td>
                <td className="px-4 py-3">{s.product_name}</td>
                <td className="px-4 py-3">
                  {s.has_sample && s.cadmium_mg_kg != null ? (
                    <span className={s.cadmium_mg_kg > 1.0 ? 'text-red-600 font-medium' : ''}>{s.cadmium_mg_kg.toFixed(3)}</span>
                  ) : <span className="text-gray-400 italic">SIN MUESTRA</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{s.origins_text || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{s.send_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
