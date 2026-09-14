import { useState } from 'react'
import { ZoomIn, Move, RotateCcw, Download } from 'lucide-react'

/**
 * Barra minimalista para controlar gráficos Plotly.
 * Colocada en el encabezado de la tarjeta (no encima del gráfico).
 */
export default function ChartToolbar({ graphDiv, filename = 'grafico-cadmio' }) {
  const [mode, setMode] = useState('zoom')

  const plotly = () => window.Plotly
  const gd = () => graphDiv

  const setDragMode = (dragmode) => {
    setMode(dragmode === 'pan' ? 'pan' : 'zoom')
    const g = gd()
    const P = plotly()
    if (g && P) P.relayout(g, { dragmode })
  }

  const reset = () => {
    const g = gd()
    const P = plotly()
    if (g && P) {
      P.relayout(g, {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
        dragmode: 'zoom',
      })
      setMode('zoom')
    }
  }

  const download = () => {
    const g = gd()
    const P = plotly()
    if (g && P) {
      P.downloadImage(g, {
        format: 'png',
        filename,
        height: 720,
        width: 1280,
        scale: 2,
      })
    }
  }

  return (
    <div className="chart-toolbar">
      <button
        type="button"
        className={`chart-toolbar-btn ${mode === 'zoom' ? 'active' : ''}`}
        onClick={() => setDragMode('zoom')}
        title="Zoom"
      >
        <ZoomIn className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Zoom</span>
      </button>
      <button
        type="button"
        className={`chart-toolbar-btn ${mode === 'pan' ? 'active' : ''}`}
        onClick={() => setDragMode('pan')}
        title="Mover"
      >
        <Move className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Mover</span>
      </button>
      <span className="chart-toolbar-sep" />
      <button type="button" className="chart-toolbar-btn" onClick={reset} title="Reiniciar vista">
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Reiniciar</span>
      </button>
      <button type="button" className="chart-toolbar-btn" onClick={download} title="Descargar PNG">
        <Download className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">PNG</span>
      </button>
    </div>
  )
}
