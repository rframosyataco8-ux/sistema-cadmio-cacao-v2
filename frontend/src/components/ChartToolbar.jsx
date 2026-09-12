import { useState } from 'react'
import { ZoomIn, Move, RotateCcw, Download } from 'lucide-react'

/**
 * Barra minimalista para controlar gráficos Plotly.
 * Se coloca en el encabezado de la tarjeta (no encima del gráfico).
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

  const btn =
    'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-colors select-none'
  const idle = 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
  const active = 'bg-blue-50 text-blue-700'

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        className={`${btn} ${mode === 'zoom' ? active : idle}`}
        onClick={() => setDragMode('zoom')}
        title="Zoom"
      >
        <ZoomIn className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Zoom</span>
      </button>
      <button
        type="button"
        className={`${btn} ${mode === 'pan' ? active : idle}`}
        onClick={() => setDragMode('pan')}
        title="Mover"
      >
        <Move className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Mover</span>
      </button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <button type="button" className={`${btn} ${idle}`} onClick={reset} title="Reiniciar vista">
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Reiniciar</span>
      </button>
      <button type="button" className={`${btn} ${idle}`} onClick={download} title="Descargar PNG">
        <Download className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">PNG</span>
      </button>
    </div>
  )
}
