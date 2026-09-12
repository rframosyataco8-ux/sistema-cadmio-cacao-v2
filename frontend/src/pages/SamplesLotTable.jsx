import { Pencil } from 'lucide-react'
import { sampleStatus, StatusBadge } from './samplesLotShared'

export default function SamplesLotTable({
  currentTab, loading, filteredSamples, openEdit, grainSamples, openEditGrain,
}) {
  return (
    <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-800">{currentTab.label}</h2>
          <span className="text-xs text-gray-500">{currentTab.isGrain ? grainSamples.length : filteredSamples.length} registro(s)</span>
        </div>

        {currentTab.isGrain ? (
          <table className="w-full text-sm">
            <thead className="bg-surface-100 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Guía</th>
                <th className="px-4 py-3 font-medium">Cadmio</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : grainSamples.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin muestras de grano</td></tr>
              ) : (
                grainSamples.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3 font-medium">{s.origin_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.guia_code}</td>
                    <td className="px-4 py-3">
                      {s.has_sample && s.cadmium_mg_kg != null ? (
                        <span className={s.cadmium_mg_kg > 1.0 ? 'text-red-600 font-medium' : ''}>{Number(s.cadmium_mg_kg).toFixed(3)}</span>
                      ) : (
                        <span className="text-gray-400 italic">SIN MUESTRA</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.send_date || '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600" title="Editar" onClick={() => openEditGrain(s)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
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
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : filteredSamples.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin resultados para {currentTab.label}</td></tr>
              ) : (
                filteredSamples.map((s) => {
                  const st = sampleStatus(s)
                  const originsDisplay = s.origins_text || s.observation || '—'
                  return (
                    <tr key={s.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 font-medium font-mono text-xs">{s.lot_code}</td>
                      <td className="px-4 py-3"><StatusBadge status={st} /></td>
                      <td className="px-4 py-3">
                        {st === 'resultado' ? (
                          <span className={s.cadmium_mg_kg > 1.0 ? 'text-red-600 font-medium' : ''}>{Number(s.cadmium_mg_kg).toFixed(3)}</span>
                        ) : st === 'sin_muestra' ? (
                          <span className="text-gray-400 italic">SIN MUESTRA</span>
                        ) : (
                          <span className="text-amber-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{originsDisplay}</td>
                      <td className="px-4 py-3 text-gray-600">{s.send_date || '—'}</td>
                      <td className="px-4 py-3">
                        <button type="button" className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600" title="Editar" onClick={() => openEdit(s)}>
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
  )
}
