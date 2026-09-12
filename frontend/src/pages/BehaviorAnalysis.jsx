import { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import { samplesApi } from '../lib/api'
import { ArrowLeft, Beaker, Wheat } from 'lucide-react'

const PRODUCTS = [
  {
    key: 'torta_cacao',
    label: 'Torta de cacao',
    match: (n) => n && n.toLowerCase() === 'torta de cacao',
    type: 'lot',
  },
  {
    key: 'torta_alcalino',
    label: 'Torta de cacao alcalino',
    match: (n) => n && n.toLowerCase().includes('torta de cacao alcalino'),
    type: 'lot',
  },
  {
    key: 'torta_trozada',
    label: 'Torta trozada estándar',
    match: (n) => n && n.toLowerCase().includes('trozada'),
    type: 'lot',
  },
  {
    key: 'cacao_alcalino',
    label: 'Cacao alcalino',
    match: (n) => n && n.toLowerCase().includes('cacao alcalino') && !n.toLowerCase().includes('torta'),
    type: 'lot',
  },
  {
    key: 'cacao_polvo',
    label: 'Cacao en polvo',
    match: (n) => n && n.toLowerCase().includes('polvo'),
    type: 'lot',
  },
  { key: 'grano', label: 'Grano de cacao', match: () => true, type: 'grain' },
]

const chartLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Roboto, sans-serif', size: 12, color: '#5f6368' },
  margin: { t: 40, r: 24, b: 80, l: 56 },
  xaxis: { gridcolor: '#e8eaed', zeroline: false },
  yaxis: { gridcolor: '#e8eaed', zeroline: false, title: 'Cd (mg/kg)' },
  hovermode: 'closest',
}

function stats(values) {
  if (!values.length) return { n: 0, avg: null, min: null, max: null, median: null }
  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  return {
    n: values.length,
    avg: +(sum / values.length).toFixed(3),
    min: +Math.min(...values).toFixed(3),
    max: +Math.max(...values).toFixed(3),
    median: +median.toFixed(3),
  }
}

function countFor(product, lotSamples, grainSamples) {
  if (product.type === 'grain') {
    return (grainSamples || []).filter((s) => s.has_sample && s.cadmium_mg_kg != null).length
  }
  return (lotSamples || []).filter(
    (s) => product.match(s.product_name) && s.has_sample && s.cadmium_mg_kg != null
  ).length
}

export default function BehaviorAnalysis() {
  const [selected, setSelected] = useState(null)
  const [lotSamples, setLotSamples] = useState([])
  const [grainSamples, setGrainSamples] = useState([])
  const [loading, setLoading] = useState(true)

  const current = PRODUCTS.find((t) => t.key === selected) || null

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [s, g] = await Promise.all([samplesApi.listLot(), samplesApi.listGrain()])
        setLotSamples(s.data || [])
        setGrainSamples(g.data || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const series = useMemo(() => {
    if (!current) return []
    if (current.type === 'grain') {
      return (grainSamples || [])
        .filter((s) => s.has_sample && s.cadmium_mg_kg != null)
        .map((s) => ({
          id: s.id,
          label: s.guia_code,
          secondary: s.origin_name,
          value: Number(s.cadmium_mg_kg),
          date: s.send_date,
        }))
        .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
    }
    return (lotSamples || [])
      .filter((s) => current.match(s.product_name) && s.has_sample && s.cadmium_mg_kg != null)
      .map((s) => ({
        id: s.id,
        label: s.lot_code,
        secondary: s.origins_text,
        value: Number(s.cadmium_mg_kg),
        date: s.send_date,
      }))
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
  }, [current, lotSamples, grainSamples])

  const st = stats(series.map((x) => x.value))

  const byOrigin = useMemo(() => {
    if (!current) return []
    if (current.type === 'grain') {
      const map = {}
      for (const s of grainSamples) {
        if (!s.has_sample || s.cadmium_mg_kg == null) continue
        const k = s.origin_name || 'SIN ORIGEN'
        if (!map[k]) map[k] = []
        map[k].push(Number(s.cadmium_mg_kg))
      }
      return Object.entries(map)
        .map(([name, vals]) => ({
          name,
          avg: vals.reduce((a, b) => a + b, 0) / vals.length,
          n: vals.length,
        }))
        .sort((a, b) => b.avg - a.avg)
    }
    const map = {}
    for (const s of series) {
      const origins = (s.secondary || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      for (const o of origins) {
        if (!map[o]) map[o] = []
        map[o].push(s.value)
      }
    }
    return Object.entries(map)
      .map(([name, vals]) => ({
        name,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        n: vals.length,
      }))
      .sort((a, b) => b.avg - a.avg)
  }, [current, series, grainSamples])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">Cargando análisis...</div>
    )
  }

  /* ——— Vista de selección (cuadrícula de productos) ——— */
  if (!current) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Análisis de comportamiento</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona un producto para ver sus gráficos de cadmio
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl">
          {PRODUCTS.map((p) => {
            const n = countFor(p, lotSamples, grainSamples)
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelected(p.key)}
                className="aspect-square min-h-[160px] rounded-2xl border-2 border-surface-200 bg-white
                  hover:border-primary-400 hover:shadow-md hover:bg-primary-50/40
                  transition-all flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center">
                  {p.type === 'grain' ? (
                    <Wheat className="w-6 h-6 text-primary-600" />
                  ) : (
                    <Beaker className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <span className="text-base font-medium text-gray-900 leading-snug">{p.label}</span>
                <span className="text-xs text-gray-500">{n} muestra{n === 1 ? '' : 's'}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ——— Vista de resultados del producto elegido ——— */
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-1 p-2 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 text-gray-600"
          title="Volver a productos"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-medium text-gray-900">{current.label}</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis de comportamiento del cadmio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Muestras', value: st.n },
          { label: 'Promedio', value: st.avg != null ? `${st.avg}` : '—' },
          { label: 'Mínimo', value: st.min != null ? `${st.min}` : '—' },
          { label: 'Máximo', value: st.max != null ? `${st.max}` : '—' },
          { label: 'Mediana', value: st.median != null ? `${st.median}` : '—' },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="text-xl font-medium text-gray-900 mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {!series.length ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          Sin datos de cadmio para <strong>{current.label}</strong>
        </div>
      ) : (
        <>
          <div className="card p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Tendencia de cadmio</h2>
            <Plot
              data={[
                {
                  type: 'scatter',
                  mode: 'lines+markers',
                  x: series.map((s) => s.date || s.label),
                  y: series.map((s) => s.value),
                  text: series.map((s) => s.label),
                  customdata: series.map((s) => s.secondary || ''),
                  marker: { color: '#1a73e8', size: 8 },
                  line: { color: '#1a73e8', width: 2 },
                  hovertemplate:
                    '%{text}<br>Fecha: %{x}<br>Cd: %{y:.3f} mg/kg<br>%{customdata}<extra></extra>',
                },
              ]}
              layout={{
                ...chartLayout,
                height: 360,
                shapes: [
                  {
                    type: 'line',
                    xref: 'paper',
                    x0: 0,
                    x1: 1,
                    y0: 1.0,
                    y1: 1.0,
                    line: { color: '#ea4335', width: 1, dash: 'dash' },
                  },
                ],
                annotations: [
                  {
                    xref: 'paper',
                    x: 1,
                    y: 1.0,
                    text: 'Umbral 1.0',
                    showarrow: false,
                    font: { size: 10, color: '#ea4335' },
                    xanchor: 'right',
                    yshift: 10,
                  },
                ],
              }}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%' }}
            />
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-2">
              Cadmio por {current.type === 'grain' ? 'guía' : 'lote'}
            </h2>
            <Plot
              data={[
                {
                  type: 'bar',
                  x: series.map((s) => s.label),
                  y: series.map((s) => s.value),
                  marker: {
                    color: series.map((s) => (s.value > 1.0 ? '#ea4335' : '#1a73e8')),
                  },
                  customdata: series.map((s) => s.secondary || ''),
                  hovertemplate:
                    '%{x}<br>Cd: %{y:.3f} mg/kg<br>%{customdata}<extra></extra>',
                },
              ]}
              layout={{
                ...chartLayout,
                height: 380,
                xaxis: { ...chartLayout.xaxis, tickangle: -45 },
              }}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%' }}
            />
          </div>

          {byOrigin.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Cadmio promedio por origen</h2>
              <Plot
                data={[
                  {
                    type: 'bar',
                    x: byOrigin.map((o) => o.name),
                    y: byOrigin.map((o) => +o.avg.toFixed(3)),
                    customdata: byOrigin.map((o) => o.n),
                    marker: { color: '#34a853' },
                    hovertemplate:
                      '%{x}<br>Promedio: %{y:.3f} mg/kg<br>n=%{customdata}<extra></extra>',
                  },
                ]}
                layout={{ ...chartLayout, height: 340 }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
