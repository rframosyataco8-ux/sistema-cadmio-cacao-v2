import { useState, useRef, useEffect } from 'react'
import { Eye, ZoomIn, Move, RotateCcw, Download, ChevronDown, Maximize2 } from 'lucide-react'

/**
 * Barra de herramientas personalizada para gráficos Plotly.
 * Reemplaza el modebar nativo con un diseño más limpio y profesional.
 */
export default function ChartToolbar({ plotRef, filename = 'grafico-cadmio' }) {
  const [mode, setMode] = useState('zoom')
  const [viewOpen, setViewOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setViewOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getGraph = () => {
    const el = plotRef?.current
    if (!el) return null
    if (el.el) return el.el
    if (el.querySelector) {
      const plot = el.querySelector('.js-plotly-plot')
      return plot || el
    }
    return el
  }

  const getPlotly = () => window.Plotly

  const setDragMode = (dragmode) => {
    setMode(dragmode === 'pan' ? 'pan' : 'zoom')
    const gd = getGraph()
    const Plotly = getPlotly()
    if (gd && Plotly) Plotly.relayout(gd, { dragmode })
  }

  const resetView = () => {
    const gd = getGraph()
    const Plotly = getPlotly()
    if (gd && Plotly) {
      Plotly.relayout(gd, {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
        dragmode: 'zoom',
      })
      setMode('zoom')
    }
  }

  const fitView = () => {
    const gd = getGraph()
    const Plotly = getPlotly()
    if (gd && Plotly) {
      Plotly.relayout(gd, {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
      })
    }
    setViewOpen(false)
  }

  const downloadPng = () => {
    const gd = getGraph()
    const Plotly = getPlotly()
    if (gd && Plotly) {
      Plotly.downloadImage(gd, {
        format: 'png',
        filename,
        height: 720,
        width: 1280,
        scale: 2,
      })
    }
    setViewOpen(false)
  }

  const btnBase =
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 select-none'
  const btnIdle = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  const btnActive = 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'

  return (
    <div className="chart-toolbar" ref={menuRef}>
      <div className="relative">
        <button
          type="button"
          className={`${btnBase} ${viewOpen ? btnActive : btnIdle}`}
          onClick={() => setViewOpen((v) => !v)}
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={2} />
          Vista
          <ChevronDown className={`w-3 h-3 transition-transform ${viewOpen ? 'rotate-180' : ''}`} />
        </button>
        {viewOpen && (
          <div className="chart-toolbar-menu">
            <button type="button" onClick={fitView} className="chart-toolbar-menu-item">
              <Maximize2 className="w-3.5 h-3.5" />
              Ajustar a datos
            </button>
            <button type="button" onClick={downloadPng} className="chart-toolbar-menu-item">
              <Download className="w-3.5 h-3.5" />
              Descargar PNG
            </button>
          </div>
        )}
      </div>

      <span className="chart-toolbar-sep" />

      <button
        type="button"
        className={`${btnBase} ${mode === 'zoom' ? btnActive : btnIdle}`}
        onClick={() => setDragMode('zoom')}
        title="Zoom (arrastra para ampliar)"
      >
        <ZoomIn className="w-3.5 h-3.5" strokeWidth={2} />
        Zoom
      </button>

      <button
        type="button"
        className={`${btnBase} ${mode === 'pan' ? btnActive : btnIdle}`}
        onClick={() => setDragMode('pan')}
        title="Desplazar el gráfico"
      >
        <Move className="w-3.5 h-3.5" strokeWidth={2} />
        Pan
      </button>

      <span className="chart-toolbar-sep" />

      <button
        type="button"
        className={`${btnBase} ${btnIdle}`}
        onClick={resetView}
        title="Restablecer vista"
      >
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
        Reiniciar
      </button>
    </div>
  )
}
