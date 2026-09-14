import { useEffect, useState, useCallback } from 'react'
import { samplesApi } from '../lib/api'
import {
  Beaker,
  RefreshCw,
  CheckCircle2,
  Clock,
  FlaskConical,
  X,
  Save,
  AlertCircle,
} from 'lucide-react'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function LabPending() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState({
    cadmium_mg_kg: '',
    pesticides: '',
    sample_weight_g: '',
    analysis_date: todayISO(),
    lab_name: '',
    observation: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await samplesApi.listLot({ pending_only: true })
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.userMessage || 'No se pudieron cargar los lotes pendientes')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openForm = (row) => {
    setSelected(row)
    setFormError('')
    setSuccessMsg('')
    setForm({
      cadmium_mg_kg: row.cadmium_mg_kg != null ? String(row.cadmium_mg_kg) : '',
      pesticides: row.pesticides || '',
      sample_weight_g: row.sample_weight_g != null ? String(row.sample_weight_g) : '',
      analysis_date: row.analysis_date || todayISO(),
      lab_name: row.lab_name || '',
      observation: row.observation || '',
    })
  }

  const closeForm = () => {
    setSelected(null)
    setFormError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!selected) return
    setFormError('')
    setSaving(true)
    try {
      const payload = {
        has_sample: true,
        analysis_date: form.analysis_date || null,
        lab_name: form.lab_name.trim() || null,
        observation: form.observation.trim() || null,
        pesticides: form.pesticides.trim() || null,
      }
      if (form.cadmium_mg_kg !== '') {
        const n = Number(form.cadmium_mg_kg)
        if (Number.isNaN(n) || n < 0) {
          setFormError('El valor de cadmio debe ser un número ≥ 0')
          setSaving(false)
          return
        }
        payload.cadmium_mg_kg = n
      } else {
        setFormError('Indica el resultado de cadmio (mg/kg)')
        setSaving(false)
        return
      }
      if (form.sample_weight_g !== '') {
        const w = Number(form.sample_weight_g)
        if (!Number.isNaN(w) && w >= 0) payload.sample_weight_g = w
      }

      await samplesApi.updateLot(selected.id, payload)
      setSuccessMsg(`Resultado registrado para lote ${selected.lot_code}`)
      closeForm()
      await load()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setFormError(err.userMessage || 'No se pudo guardar el resultado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Beaker className="w-7 h-7 text-primary-600" />
            Laboratorio — Pendientes
          </h1>
          <p className="page-subtitle">
            Lotes sin resultado de cadmio. Completa el análisis y guarda.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Clock className="w-4 h-4" style={{ color: 'var(--muted)' }} />
          <span className="text-sm font-medium">
            {loading ? 'Cargando…' : `${items.length} lote${items.length === 1 ? '' : 's'} pendiente${items.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-80" />
            <p className="font-medium">No hay lotes pendientes</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Todos los lotes tienen resultado de laboratorio.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                  <th className="px-5 py-3 font-semibold">Lote</th>
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-5 py-3 font-semibold">Orígenes</th>
                  <th className="px-5 py-3 font-semibold">Envío</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-black/[0.02] transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-5 py-3.5 font-medium">{row.lot_code || '—'}</td>
                    <td className="px-5 py-3.5">{row.product_name || '—'}</td>
                    <td className="px-5 py-3.5 max-w-[180px] truncate" title={row.origins_text || ''}>
                      {row.origins_text || '—'}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--muted)' }}>
                      {row.send_date || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-2.5 py-0.5 text-xs font-medium border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openForm(row)}
                        className="btn-primary text-sm py-1.5 px-3 inline-flex items-center gap-1.5"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        Completar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div
            className="w-full max-w-md rounded-2xl border shadow-xl animate-slide-up"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lab-form-title"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 id="lab-form-title" className="font-semibold text-lg">
                  Registrar resultado
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                  Lote <strong>{selected.lot_code}</strong>
                  {selected.product_name ? ` · ${selected.product_name}` : ''}
                </p>
              </div>
              <button type="button" onClick={closeForm} className="p-2 rounded-lg hover:opacity-70" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="px-5 py-4 space-y-4">
              <div>
                <label className="label" htmlFor="lab-cd">Cadmio (mg/kg) *</label>
                <input id="lab-cd" type="number" step="0.001" min="0" className="input" value={form.cadmium_mg_kg}
                  onChange={(e) => setForm((f) => ({ ...f, cadmium_mg_kg: e.target.value }))} placeholder="0.000" required autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="lab-pest">Plaguicidas</label>
                <input id="lab-pest" type="text" className="input" value={form.pesticides}
                  onChange={(e) => setForm((f) => ({ ...f, pesticides: e.target.value }))} placeholder="Ej. No detectado / valores" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="lab-weight">Peso muestra (g)</label>
                  <input id="lab-weight" type="number" step="0.1" min="0" className="input" value={form.sample_weight_g}
                    onChange={(e) => setForm((f) => ({ ...f, sample_weight_g: e.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="lab-date">Fecha análisis</label>
                  <input id="lab-date" type="date" className="input" value={form.analysis_date}
                    onChange={(e) => setForm((f) => ({ ...f, analysis_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="lab-name">Laboratorio</label>
                <input id="lab-name" type="text" className="input" value={form.lab_name}
                  onChange={(e) => setForm((f) => ({ ...f, lab_name: e.target.value }))} placeholder="Nombre del lab" />
              </div>
              <div>
                <label className="label" htmlFor="lab-obs">Observación</label>
                <textarea id="lab-obs" className="input min-h-[72px] resize-y" value={form.observation}
                  onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))} rows={2} />
              </div>
              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeForm} className="btn-secondary flex-1" disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 inline-flex items-center justify-center gap-2" disabled={saving}>
                  {saving ? 'Guardando…' : (<><Save className="w-4 h-4" />Guardar resultado</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
