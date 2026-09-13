import { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { analyticsApi } from '../lib/api'
import { Activity, FlaskConical, MapPin, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react'

const chartLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Roboto, sans-serif', size: 12, color: '#5f6368' },
  margin: { t: 24, r: 16, b: 56, l: 48 },
  xaxis: { gridcolor: '#e8eaed', zeroline: false, tickangle: -25 },
  yaxis: { gridcolor: '#e8eaed', zeroline: false, title: 'Cd (mg/kg)' },
  hovermode: 'closest',
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [byProduct, setByProduct] = useState(null)
  const [byOrigin, setByOrigin] = useState(null)
  const [trend, setTrend] = useState(null)
  const [lots, setLots] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [k, bp, bo, t, l] = await Promise.all([
        analyticsApi.kpis(),
        analyticsApi.byProduct(),
        analyticsApi.byOriginGrain(),
        analyticsApi.trend(),
        analyticsApi.lots(),
      ])
      setKpis(k.data)
      setByProduct(bp.data)
      setByOrigin(bo.data)
      setTrend(t.data)
      setLots(l.data)
      setUpdatedAt(new Date())
    } catch (e) {
      console.error(e)
      setError('No se pudo cargar el dashboard. Verifica el backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const kpiCards = [
    {
      label: 'Muestras producto',
      value: kpis?.product_samples?.count ?? 0,
      sub: kpis?.product_samples?.avg != null ? `Promedio ${kpis.product_samples.avg} mg/kg` : 'Sin promedio',
      icon: FlaskConical,
      tone: 'bg-blue-50 text-primary-600',
    },
    {
      label: 'Muestras grano',
      value: kpis?.grain_samples?.count ?? 0,
      sub: kpis?.grain_samples?.avg != null ? `Promedio ${kpis.grain_samples.avg} mg/kg` : 'Sin promedio',
      icon: Activity,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Orígenes activos',
      value: kpis?.origins_count ?? 0,
      sub: `${kpis?.products_count ?? 0} productos catalogados`,
      icon: MapPin,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Lotes > 1.0 mg/kg',
      value: kpis?.high_cadmium_lots ?? 0,
      sub: 'Umbral de atención',
      icon: AlertTriangle,
      tone: 'bg-red-50 text-red-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Resumen de cadmio ·{' '}
            {updatedAt
              ? `Actualizado ${updatedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
              : 'Cargando datos…'}
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="btn-secondary text-sm inline-flex items-center gap-2 self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      {loading && !kpis ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((c) => (
            <div key={c.label} className="card p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-1.5 tabular-nums">{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1.5 truncate">{c.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.tone}`}>
                  <c.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-800">Cadmio promedio por producto</h2>
          </div>
          {byProduct?.labels?.length ? (
            <Plot
              data={[{
                type: 'bar',
                x: byProduct.labels,
                y: byProduct.avg,
                marker: { color: '#1a73e8' },
                hovertemplate: '%{x}<br>Promedio: %{y:.3f} mg/kg<br>n=%{customdata}<extra></extra>',
                customdata: byProduct.count,
              }]}
              layout={{ ...chartLayout, height: 300 }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">Sin datos de producto</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-800">Cadmio promedio por origen (grano)</h2>
          </div>
          {byOrigin?.labels?.length ? (
            <Plot
              data={[{
                type: 'bar',
                x: byOrigin.labels,
                y: byOrigin.avg,
                marker: { color: '#34a853' },
                hovertemplate: '%{x}<br>Promedio: %{y:.3f} mg/kg<br>n=%{customdata}<extra></extra>',
                customdata: byOrigin.count,
              }]}
              layout={{ ...chartLayout, height: 300 }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">Sin datos de grano</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Tendencia temporal</h2>
          {trend?.dates?.length ? (
            <Plot
              data={[{
                type: 'scatter',
                mode: 'lines+markers',
                x: trend.dates,
                y: trend.values,
                line: { color: '#1a73e8', width: 2 },
                marker: { size: 6 },
                hovertemplate: '%{x}<br>%{y:.3f} mg/kg<extra></extra>',
              }]}
              layout={{ ...chartLayout, height: 280 }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="text-sm text-gray-400 py-14 text-center">Sin serie temporal</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Últimos lotes analizados</h2>
          {lots?.labels?.length ? (
            <Plot
              data={[{
                type: 'bar',
                x: lots.labels,
                y: lots.values,
                marker: {
                  color: (lots.values || []).map((v) => (v > 1 ? '#ea4335' : '#1a73e8')),
                },
                hovertemplate: 'Lote %{x}<br>%{y:.3f} mg/kg<extra></extra>',
              }]}
              layout={{ ...chartLayout, height: 280 }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="text-sm text-gray-400 py-14 text-center">Sin lotes recientes</p>
          )}
        </div>
      </div>
    </div>
  )
}
