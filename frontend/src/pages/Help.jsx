import { BookOpen, Beaker, LineChart, Package } from 'lucide-react'

const SECTIONS = [
  {
    icon: Beaker,
    title: 'Resultados de análisis',
    body: 'En Análisis Producto → Resultado verás las tablas por producto (torta, polvo, grano, etc.). Usa las pestañas para filtrar. El botón Nuevo análisis registra una muestra por peso de un lote.',
  },
  {
    icon: LineChart,
    title: 'Análisis de comportamiento',
    body: 'Elige un producto en la cuadrícula. Verás tendencia de cadmio en el tiempo, barras por lote/guía y promedio por origen. Los valores sobre el umbral se marcan en rojo.',
  },
  {
    icon: Package,
    title: 'Productos y orígenes',
    body: 'Catálogo de productos terminados y zonas de origen del grano. Un lote puede tener varios orígenes. Las muestras de grano se identifican por origen + número de guía.',
  },
  {
    icon: BookOpen,
    title: 'Umbral de cadmio',
    body: 'Por defecto 1.0 mg/kg. Puedes cambiarlo en Configuración → Alertas cadmio. Sirve para resaltar resultados fuera de especificación en tablas y gráficos.',
  },
]

export default function Help() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Ayuda</h1>
        <p className="text-sm text-gray-500 mt-1">Guía rápida del sistema de trazabilidad de cadmio</p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className="card p-5 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">{s.title}</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-1">Soporte</p>
        <p>
          Para incidencias técnicas o nuevos usuarios, contacta al administrador del sistema en tu
          planta.
        </p>
      </div>
    </div>
  )
}
