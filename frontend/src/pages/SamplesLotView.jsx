import { Plus, FlaskConical } from 'lucide-react'
import {
  PRODUCT_TABS,
  LotCombobox,
  OriginsMultiSelect,
} from './samplesLotShared'
import SamplesLotTable from './SamplesLotTable'

export default function SamplesLotView(p) {
  const {
    tab, setTab, currentTab, counts, pendingCount, openNew, showForm,
    editingGrainId, grainForm, setGrainForm, handleGrainSubmit, saving,
    setShowForm, setEditingGrainId, originsList,
    editingId, form, setForm, handleSubmit, filteredLots, filteredSamples,
    filterStatus, setFilterStatus, loading, openEdit, grainSamples, openEditGrain,
  } = p

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Análisis por producto</h1>
          <p className="text-sm text-gray-500 mt-1">Registra lotes y completa el cadmio cuando llegue el resultado</p>
        </div>
        <div className="flex items-center gap-2">
          {!currentTab.isGrain && pendingCount > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
            </span>
          )}
          <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            {currentTab.isGrain ? 'Añadir muestra de grano' : 'Añadir nuevo lote'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-3">
        {PRODUCT_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setShowForm(false); setFilterStatus('all') }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs ${tab === t.key ? 'text-white/80' : 'text-gray-400'}`}>({counts[t.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {showForm && currentTab.isGrain && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-900">{editingGrainId ? 'Editar muestra de grano' : 'Añadir muestra de grano'}</h2>
          </div>
          <p className="text-xs text-gray-500">Puedes registrar varias muestras de la misma zona; se identifican por el código de guía.</p>
          <form onSubmit={handleGrainSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Origen / Zona</label>
              <select className="input" value={grainForm.origin_id} onChange={(e) => setGrainForm({ ...grainForm, origin_id: e.target.value })} required>
                <option value="">Seleccionar zona…</option>
                {originsList.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
              </select>
            </div>
            <div>
              <label className="label">Guía / Código</label>
              <input type="text" className="input font-mono" value={grainForm.guia_code} onChange={(e) => setGrainForm({ ...grainForm, guia_code: e.target.value })} placeholder="Ej. EG07-3609" required />
            </div>
            <div>
              <label className="label">Fecha de envío</label>
              <input type="date" className="input" value={grainForm.send_date} onChange={(e) => setGrainForm({ ...grainForm, send_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={grainForm.estado} onChange={(e) => setGrainForm({ ...grainForm, estado: e.target.value, cadmium_mg_kg: e.target.value === 'pendiente' ? '' : grainForm.cadmium_mg_kg })}>
                <option value="pendiente">Pendiente de resultado</option>
                <option value="resultado">Con resultado</option>
              </select>
            </div>
            {grainForm.estado === 'resultado' && (
              <div>
                <label className="label">Cadmio (mg/kg)</label>
                <input type="number" step="0.001" className="input" value={grainForm.cadmium_mg_kg} onChange={(e) => setGrainForm({ ...grainForm, cadmium_mg_kg: e.target.value })} placeholder="Resultado del laboratorio" required />
              </div>
            )}
            <div className="md:col-span-2 flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingGrainId(null) }} className="btn-ghost">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showForm && !currentTab.isGrain && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-900">{editingId ? 'Editar lote' : 'Añadir nuevo lote'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Lote ({currentTab.label})</label>
              <LotCombobox lots={filteredLots} value={form.lot_id} lotCode={form.lot_code} disabled={!!editingId} onChange={(id) => setForm((f) => ({ ...f, lot_id: id }))} onLotCodeChange={(code) => setForm((f) => ({ ...f, lot_code: code, lot_id: '' }))} />
            </div>
            <div>
              <label className="label">Fecha de envío</label>
              <input type="date" className="input" value={form.send_date} onChange={(e) => setForm({ ...form, send_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Orígenes</label>
              <OriginsMultiSelect origins={originsList} selected={form.origins} onChange={(names) => setForm({ ...form, origins: names })} />
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value, cadmium_mg_kg: e.target.value === 'pendiente' ? '' : form.cadmium_mg_kg })}>
                <option value="pendiente">Pendiente de resultado</option>
                <option value="resultado">Con resultado</option>
              </select>
            </div>
            {form.estado === 'resultado' && (
              <div>
                <label className="label">Cadmio (mg/kg)</label>
                <input type="number" step="0.001" className="input" value={form.cadmium_mg_kg} onChange={(e) => setForm({ ...form, cadmium_mg_kg: e.target.value })} placeholder="Resultado del laboratorio" required />
              </div>
            )}
            <div className="md:col-span-2 flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {!currentTab.isGrain && (
        <div className="flex gap-2 flex-wrap">
          {[{ key: 'all', label: 'Todos' }, { key: 'pendiente', label: 'Pendiente de resultado' }, { key: 'resultado', label: 'Con resultado' }].map((f) => (
            <button key={f.key} type="button" onClick={() => setFilterStatus(f.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterStatus === f.key ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-surface-200 hover:bg-surface-50'
            }`}>{f.label}</button>
          ))}
        </div>
      )}

      <SamplesLotTable
        currentTab={currentTab}
        loading={loading}
        filteredSamples={filteredSamples}
        openEdit={openEdit}
        grainSamples={grainSamples}
        openEditGrain={openEditGrain}
      />
    </div>
  )
}
