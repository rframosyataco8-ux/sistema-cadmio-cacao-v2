import { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { analyticsApi } from '../lib/api'
import { Activity, FlaskConical, MapPin, AlertTriangle } from 'lucide-react'

const chartLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Roboto, sans-serif', size: 12, color: '#5f6368' },
  margin: { t: 30, r: 20, b: 60, l: 50 },
  xaxis: { gridcolor: '#e8eaed', zeroline: false },
  yaxis: { gridcolor: '#e8eaed', zeroline: false, title: 'Cd (mg/kg)' },
  hovermode: 'closest',
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [byProduct, setByProduct] = useState(null)
  const [byOrigin, setByOrigin] = useState(null)
  const [trend, setTrend] = useState(null)
  const [lots, setLots] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando dashboard...</div>

  const kpiCards = [
    { label: 'Muestras producto', value: kpis?.product_samples?.count ?? 0, sub: kpis?.product_samples?.avg != null ? `Promedio ${kpis.product_samples.avg} mg/kg` : '—', icon: FlaskConical, color: 'text-primary-500' },
    { label: 'Muestras grano', value: kpis?.grain_samples?.count ?? 0, sub: kpis?.grain_samples?.avg != null ? `Promedio ${kpis.grain_samples.avg} mg/kg` : '—', icon: Activity, color: 'text-emerald-600' },
    { label: 'Orígenes', value: kpis?.origins_count ?? 0, sub: `${kpis?.products_count ?? 0} productos`, icon: MapPin, color: 'text-amber-600' },
    { label: 'Lotes > 1.0 mg/kg', value: kpis?.high_cadmium_lots ?? 0, sub: 'Umbral de atención', icon: AlertTriangle, color: 'text-red-500' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Dashboard de Cadmio</h1>
          <p className="text-sm text-gray-500 mt-1">Los gráficos se actualizan al registrar nuevos análisis</p>
        </div>
        <button onClick={load} className="btn-primary text-sm">Actualizar</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-2xl font-medium text-gray-900 mt-1">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Cadmio promedio por producto</h2>
          {byProduct?.labels?.length ? (
            <Plot data={[{ type: 'bar', x: byProduct.labels, y: byProduct.avg, marker: { color: '#1a73e8' },
              hovertemplate: '%{x}<br>Promedio: %{y:.3f} mg/kg<br>n=%{customdata}<extra></extra>', customdata: byProduct.count }]}
              layout={{ ...chartLayout, height: 320 }} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%' }} />
          ) : <p className="text-sm text-gray-400 py-12 text-center">Sin datos — ejecuta el seed</p>}
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Cadmio promedio por origen (grano)</h2>
          {byOrigin?.labels?.length ? (
            <Plot data={[{ type: 'bar', x: byOrigin.labels, y: byOrigin.avg, marker: { color: '#34a853' },
              hovertemplate: '%{x}<br>Promedio: %{y:.3f} mg/kg<br>n=%{customdata}<extra></extra>', customdata: byOrigin.count }]}
              layout={{ ...chartLayout, height: 320 }} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%' }} />
          ) : <p className="text-sm text-gray-400 py-12 text-center">Sin datos</p>}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Tendencia de cadmio en productos</h2>
        {trend?.dates?.length ? (
          <Plot data={[{ type: 'scatter', mode: 'lines+markers', x: trend.dates, y: trend.values, text: trend.lot_codes,
            marker: { color: '#1a73e8', size: 8 }, line: { color: '#1a73e8', width: 2 },
            hovertemplate: 'Lote: %{text}<br>Fecha: %{x}<br>Cd: %{y:.3f} mg/kg<br>%{customdata}<extra></extra>', customdata: trend.products }]}
            layout={{ ...chartLayout, height: 360, xaxis: { ...chartLayout.xaxis, title: 'Fecha de envío' } }}
            config={{ responsive: true, displayModeBar: true }} style={{ width: '100%' }} />
        ) : <p className="text-sm text-gray-400 py-12 text-center">Sin datos de tendencia</p>}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Cadmio por lote</h2>
        {lots?.labels?.length ? (
          <Plot data={[{ type: 'bar', x: lots.labels, y: lots.values,
            marker: { color: lots.values.map((v) => (v > 1.0 ? '#ea4335' : '#1a73e8')) },
            hovertemplate: 'Lote: %{x}<br>Cd: %{y:.3f} mg/kg<br>Orígenes: %{customdata}<extra></extra>', customdata: lots.origins }]}
            layout={{ ...chartLayout, height: 380, xaxis: { ...chartLayout.xaxis, tickangle: -45 } }}
            config={{ responsive: true, displayModeBar: true }} style={{ width: '100%' }} />
        ) : <p className="text-sm text-gray-400 py-12 text-center">Sin lotes</p>}
      </div>
    </div>
  )
}
