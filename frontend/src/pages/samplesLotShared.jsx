import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, ChevronDown, Clock, CheckCircle2 } from 'lucide-react'

export const PRODUCT_TABS = [
  { key: 'torta_cacao', label: 'Torta de cacao', match: (n) => n && n.toLowerCase() === 'torta de cacao' },
  { key: 'torta_alcalino', label: 'Torta de cacao alcalino', match: (n) => n && n.toLowerCase().includes('torta de cacao alcalino') },
  { key: 'cacao_alcalino', label: 'Cacao alcalino', match: (n) => n && n.toLowerCase().includes('cacao alcalino') && !n.toLowerCase().includes('torta') },
  { key: 'cacao_polvo', label: 'Cacao en polvo', match: (n) => n && n.toLowerCase().includes('polvo') },
  { key: 'grano', label: 'Grano de cacao', match: () => false, isGrain: true },
]

export function sampleStatus(s) {
  const obs = (s.observation || '').toUpperCase()
  if (obs.includes('SIN MUESTRA') && (s.cadmium_mg_kg == null || s.cadmium_mg_kg === '')) return 'sin_muestra'
  if (s.has_sample && s.cadmium_mg_kg != null) return 'resultado'
  return 'pendiente'
}

export function StatusBadge({ status }) {
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

export function LotCombobox({ lots, value, onChange, lotCode, onLotCodeChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return lots.slice(0, 40)
    return lots.filter((l) => l.lot_code.toLowerCase().includes(q)).slice(0, 40)
  }, [lots, query])
  const selected = lots.find((l) => String(l.id) === String(value))
  const display = selected ? selected.lot_code : lotCode || query
  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className="input pl-9 pr-9"
          placeholder="Buscar o escribir código de lote…"
          value={display}
          disabled={disabled}
          onChange={(e) => { const v = e.target.value; setQuery(v); onLotCodeChange(v); onChange(''); setOpen(true) }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {(value || lotCode) && !disabled && (
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-100" onClick={() => { onChange(''); onLotCodeChange(''); setQuery('') }}>
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-xl border bg-white shadow-lg border-surface-200">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500">
              {query.trim() ? (<>No hay lote <strong className="text-gray-800">{query.trim()}</strong>.<br /><span className="text-primary-600">Se creará como lote nuevo al guardar.</span></>) : 'Escribe para buscar o crear un lote'}
            </div>
          ) : (
            filtered.map((l) => (
              <button key={l.id} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 flex items-center justify-between gap-2" onClick={() => { onChange(String(l.id)); onLotCodeChange(l.lot_code); setQuery(''); setOpen(false) }}>
                <span className="font-medium font-mono text-xs">{l.lot_code}</span>
                <span className="text-xs text-gray-400 truncate">{l.product_name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function OriginsMultiSelect({ origins, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const toggle = (name) => {
    if (selected.includes(name)) onChange(selected.filter((x) => x !== name))
    else onChange([...selected, name])
  }
  const label = selected.length === 0 ? 'Seleccionar orígenes…' : selected.length <= 2 ? selected.join(', ') : `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="input w-full text-left flex items-center justify-between gap-2" onClick={() => setOpen(!open)}>
        <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-900 truncate'}>{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-xl border bg-white shadow-lg border-surface-200 p-2">
          {origins.length === 0 ? (
            <p className="text-sm text-gray-400 px-2 py-2">No hay orígenes en el catálogo</p>
          ) : (
            origins.map((o) => (
              <label key={o.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-50 cursor-pointer text-sm">
                <input type="checkbox" className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" checked={selected.includes(o.name)} onChange={() => toggle(o.name)} />
                <span>{o.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export const emptyForm = { lot_id: '', lot_code: '', send_date: '', origins: [], estado: 'pendiente', cadmium_mg_kg: '' }
export const grainEmptyForm = { origin_id: '', guia_code: '', send_date: '', estado: 'pendiente', cadmium_mg_kg: '' }
