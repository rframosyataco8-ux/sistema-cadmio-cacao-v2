import { Leaf } from 'lucide-react'

export default function About() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Acerca del sistema</h1>
        <p className="text-sm text-gray-500 mt-1">Cadmio Cacao — Trazabilidad V2</p>
      </div>

      <div className="card p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto">
          <Leaf className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-900">Sistema de control de cadmio</h2>
          <p className="text-sm text-gray-500 mt-1">Versión 2.0</p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
          Plataforma para registrar y analizar niveles de cadmio en productos de cacao y grano por
          lote, origen y guía. Pensada para uso en planta: resultados, comportamiento y trazabilidad.
        </p>
        <div className="pt-2 text-xs text-gray-400 space-y-1">
          <p>Productos: torta de cacao, torta alcalina, torta trozada, cacao alcalino, cacao en polvo, grano</p>
          <p>Base de datos PostgreSQL · API FastAPI · Interfaz React</p>
        </div>
      </div>
    </div>
  )
}
