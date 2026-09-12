import { useEffect, useMemo, useRef, useState } from 'react'
import { samplesApi, lotsApi, catalogApi } from '../lib/api'
import { Plus, Search, X, Pencil, FlaskConical, Clock, CheckCircle2, ChevronDown } from 'lucide-react'

const PRODUCT_TABS = [
  { key: 'torta_cacao', label: 'Torta de cacao', match: (n) => n && n.toLowerCase() === 'torta de cacao' },
  { key: 'torta_alcalino', label: 'Torta de cacao alcalino', match: (n) => n && n.toLowerCase().includes('torta de cacao alcalino') },
  { key: 'cacao_alcalino', label: 'Cacao alcalino', match: (n) => n && n.toLowerCase().includes('cacao alcalino') && !n.toLowerCase().includes('torta') },
  { key: 'cacao_polvo', label: 'Cacao en polvo', match: (n) => n && n.toLowerCase().includes('polvo') },
  { key: 'grano', label: 'Grano de cacao', match: () => false, isGrain: true },
]

function sampleStatus(s) {
  const obs = (s.observation || '').toUpperCase()
  if (obs.includes('SIN MUESTRA') && (s.cadmium_mg_kg == null || s.cadmium_mg_kg === '')) return 'sin_muestra'
  if (s.has_sample && s.cadmium_mg_kg != null) return 'resultado'
  return 'pendiente'
}

function StatusBadge({ status }) {
  if (status === 'resultado') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Con resultado
      </span>
    )
  }
  if (status === 'sin_muestra') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
        Sin muestra
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Pendiente de resultado
    </span>
  )
}
