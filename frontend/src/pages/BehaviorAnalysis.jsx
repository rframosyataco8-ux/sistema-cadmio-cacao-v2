import { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import { samplesApi } from '../lib/api'
import { ArrowLeft, Beaker, Wheat } from 'lucide-react'
import { canSeeProduct } from '../lib/permissions'

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

function isDark() {
  return document.documentElement.classList.contains('dark')
}

function useChartTheme() {
  const [dark, setDark] = useState(isDark)
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDark()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  const grid = dark ? '#3c4043' : '#e8eaed'
  const text = dark ? '#e8eaed' : '#5f6368'
  return {
    dark,
    layout: {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0)',
      font: { family: 'Roboto, sans-serif', size: 12, color: text },
      margin: { t: 32, r: 32, b: 96, l: 60 },
      xaxis: {
        gridcolor: grid,
        zeroline: false,
        linecolor: grid,
        tickfont: { color: text, size: 11 },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
      },
      yaxis: {
        gridcolor: grid,
        zeroline: false,
        linecolor: grid,
        title: { text: 'Cd (mg/kg)', font: { color: text, size: 12 } },
        tickfont: { color: text, size: 11 },
        showspikes: true,
      },
      hovermode: 'x unified',
      legend: { font: { color: text }, bgcolor: 'rgba(0,0,0,0)' },
    },
    colors: {
      primary: dark ? '#8ab4f8' : '#1a73e8',
      danger: dark ? '#f28b82' : '#ea4335',
      success: dark ? '#81c995' : '#34a853',
      muted: dark ? '#9aa0a6' : '#80868b',
      text,
    },
  }
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

function threshold() {
  const v = parseFloat(localStorage.getItem('cd_threshold') || '1.0')
  return Number.isFinite(v) ? v : 1.0
}

export default function BehaviorAnalysis() {
  const [selected, setSelected] = useState(null)
  const [lotSamples, setLotSamples] = useState([])
  const [grainSamples, setGrainSamples] = useState([])
  const [loading, setLoading] = useState(true)
  const theme = useChartTheme()
  const thr = threshold()

  const allowedProducts = useMemo(() => PRODUCTS.filter((p) => canSeeProduct(p.key)), [])
  const current = allowedProducts.find((t) => t.key === selected) || null

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
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted)' }}>
        Cargando análisis...
      </div>
    )
  }

  /* Título a la izquierda; tarjetas centradas */
  if (!current) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>
            Análisis de comportamiento
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Selecciona un producto para ver sus gráficos de cadmio
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-3xl">
            {allowedProducts.map((p) => {
              const n = countFor(p, lotSamples, grainSamples)
              return (
                <button key={p.key} type="button" onClick={() => setSelected(p.key)} className="product-card">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--hover)' }}
                  >
                    {p.type === 'grain' ? (
                      <Wheat className="w-6 h-6 text-primary-500" />
                    ) : (
                      <Beaker className="w-6 h-6 text-primary-500" />
                    )}
                  </div>
                  <span className="text-base font-medium leading-snug">{p.label}</span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {n} muestra{n === 1 ? '' : 's'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const plotConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  }

  const avgLine = st.avg != null
    ? [
        {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          y0: st.avg,
          y1: st.avg,
          line: { color: theme.colors.muted, width: 1, dash: 'dot' },
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-1 p-2 rounded-lg border"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
          title="Volver a productos"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>
            {current.label}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Análisis de comportamiento del cadmio
          </p>
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
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {k.label}
            </p>
            <p className="text-xl font-medium mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {!series.length ? (
        <div className="card p-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Sin datos de cadmio para <strong style={{ color: 'var(--text)' }}>{current.label}</strong>
        </div>
      ) : (
        <>
          <div className="card p-5">
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              Tendencia de cadmio
            </h2>
            <Plot
              data={[
                {
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'Cd',
                  x: series.map((s) => s.date || s.label),
                  y: series.map((s) => s.value),
                  text: series.map((s) => s.label),
                  customdata: series.map((s) => s.secondary || ''),
                  marker: {
                    color: series.map((s) =>
                      s.value > thr ? theme.colors.danger : theme.colors.primary
                    ),
                    size: 10,
                    line: { color: theme.dark ? '#1a1a1c' : '#fff', width: 1.5 },
                  },
                  line: { color: theme.colors.primary, width: 2.5, shape: 'spline', smoothing: 0.6 },
                  hovertemplate:
                    '<b>%{text}</b><br>Fecha: %{x}<br>Cd: <b>%{y:.3f}</b> mg/kg<br>%{customdata}<extra></extra>',
                },
              ]}
              layout={{
                ...theme.layout,
                height: 400,
                shapes: [
                  {
                    type: 'line',
                    xref: 'paper',
                    x0: 0,
                    x1: 1,
                    y0: thr,
                    y1: thr,
                    line: { color: theme.colors.danger, width: 1.5, dash: 'dash' },
                  },
                  ...avgLine,
                ],
                annotations: [
                  {
                    xref: 'paper',
                    x: 1,
                    y: thr,
                    text: `Umbral ${thr}`,
                    showarrow: false,
                    font: { size: 11, color: theme.colors.danger },
                    xanchor: 'right',
                    yshift: 12,
                  },
                  st.avg != null
                    ? {
                        xref: 'paper',
                        x: 0,
                        y: st.avg,
                        text: `Prom. ${st.avg}`,
                        showarrow: false,
                        font: { size: 10, color: theme.colors.muted },
                        xanchor: 'left',
                        yshift: 12,
                      }
                    : null,
                ].filter(Boolean),
              }}
              config={plotConfig}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              Cadmio por {current.type === 'grain' ? 'guía' : 'lote'}
            </h2>
            <Plot
              data={[
                {
                  type: 'bar',
                  x: series.map((s) => s.label),
                  y: series.map((s) => s.value),
                  marker: {
                    color: series.map((s) =>
                      s.value > thr ? theme.colors.danger : theme.colors.primary
                    ),
                    opacity: 0.92,
                    line: { width: 0 },
                  },
                  customdata: series.map((s) => s.secondary || ''),
                  hovertemplate:
                    '<b>%{x}</b><br>Cd: <b>%{y:.3f}</b> mg/kg<br>%{customdata}<extra></extra>',
                },
              ]}
              layout={{
                ...theme.layout,
                height: 420,
                bargap: 0.25,
                xaxis: { ...theme.layout.xaxis, tickangle: -40 },
                shapes: [
                  {
                    type: 'line',
                    xref: 'paper',
                    x0: 0,
                    x1: 1,
                    y0: thr,
                    y1: thr,
                    line: { color: theme.colors.danger, width: 1.5, dash: 'dash' },
                  },
                ],
              }}
              config={plotConfig}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>

          {byOrigin.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                Cadmio promedio por origen
              </h2>
              <Plot
                data={[
                  {
                    type: 'bar',
                    orientation: 'h',
                    y: byOrigin.map((o) => o.name),
                    x: byOrigin.map((o) => +o.avg.toFixed(3)),
                    customdata: byOrigin.map((o) => o.n),
                    marker: {
                      color: byOrigin.map((o) =>
                        o.avg > thr ? theme.colors.danger : theme.colors.success
                      ),
                      opacity: 0.92,
                    },
                    hovertemplate:
                      '<b>%{y}</b><br>Promedio: <b>%{x:.3f}</b> mg/kg<br>n=%{customdata}<extra></extra>',
                  },
                ]}
                layout={{
                  ...theme.layout,
                  height: Math.max(300, byOrigin.length * 38 + 90),
                  margin: { t: 24, r: 32, b: 48, l: 130 },
                  bargap: 0.3,
                  xaxis: {
                    ...theme.layout.xaxis,
                    title: { text: 'Cd promedio (mg/kg)', font: { color: theme.colors.text } },
                  },
                  yaxis: { ...theme.layout.yaxis, title: undefined, automargin: true },
                }}
                config={{ ...plotConfig, displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
