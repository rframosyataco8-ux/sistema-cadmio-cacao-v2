import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Settings as SettingsIcon, Shield, Download, Bell } from 'lucide-react'

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'cuenta', label: 'Cuenta', icon: User },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
  { id: 'alertas', label: 'Alertas cadmio', icon: Bell },
  { id: 'exportar', label: 'Exportar', icon: Download },
]

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'general'
  const setTab = (id) => setParams(id === 'general' ? {} : { tab: id })

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch {
      return {}
    }
  }, [])

  const [threshold, setThreshold] = useState(() => localStorage.getItem('cd_threshold') || '1.0')
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [msg, setMsg] = useState('')

  const saveThreshold = () => {
    const v = parseFloat(threshold)
    if (Number.isNaN(v) || v <= 0) {
      setMsg('Umbral inválido')
      return
    }
    localStorage.setItem('cd_threshold', String(v))
    setMsg('Umbral guardado. Se usará en gráficos y resaltados.')
  }

  const savePassword = (e) => {
    e.preventDefault()
    if (passwordForm.next.length < 6) {
      setMsg('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setMsg('Las contraseñas no coinciden')
      return
    }
    setMsg('Cambio de contraseña: conecta el endpoint del backend cuando esté disponible.')
    setPasswordForm({ current: '', next: '', confirm: '' })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Opciones del sistema de trazabilidad de cadmio</p>
      </div>

      <div className="flex gap-6">
        <aside className="w-48 shrink-0 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setMsg('')
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                tab === t.id
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-surface-100'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </aside>

        <div className="flex-1 card p-6 space-y-5">
          {msg && (
            <div className="text-sm px-3 py-2 rounded-lg bg-surface-100 text-gray-700">{msg}</div>
          )}

          {tab === 'general' && (
            <>
              <h2 className="text-base font-medium text-gray-900">General</h2>
              <p className="text-sm text-gray-500">
                Preferencias de visualización del sistema de cadmio en cacao.
              </p>
              <div>
                <label className="label">Idioma de la interfaz</label>
                <select className="input max-w-xs" defaultValue="es" disabled>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="label">Formato de fecha</label>
                <select className="input max-w-xs" defaultValue="iso">
                  <option value="iso">AAAA-MM-DD</option>
                  <option value="dmY">DD/MM/AAAA</option>
                </select>
              </div>
            </>
          )}

          {tab === 'cuenta' && (
            <>
              <h2 className="text-base font-medium text-gray-900">Mi cuenta</h2>
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="label">Nombre</label>
                  <input className="input" value={user.full_name || ''} readOnly />
                </div>
                <div>
                  <label className="label">Correo</label>
                  <input className="input" value={user.email || ''} readOnly />
                </div>
                <div>
                  <label className="label">Rol</label>
                  <input className="input" value={user.role || '—'} readOnly />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Para cambiar nombre o correo, contacta al administrador del sistema.
              </p>
            </>
          )}

          {tab === 'seguridad' && (
            <>
              <h2 className="text-base font-medium text-gray-900">Seguridad</h2>
              <form onSubmit={savePassword} className="grid gap-4 max-w-md">
                <div>
                  <label className="label">Contraseña actual</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Nueva contraseña</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-fit">
                  Guardar contraseña
                </button>
              </form>
            </>
          )}

          {tab === 'alertas' && (
            <>
              <h2 className="text-base font-medium text-gray-900">Alertas de cadmio</h2>
              <p className="text-sm text-gray-500">
                Valor a partir del cual se resalta en rojo en tablas y gráficos.
              </p>
              <div className="flex items-end gap-3 max-w-sm">
                <div className="flex-1">
                  <label className="label">Umbral Cd (mg/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                </div>
                <button type="button" onClick={saveThreshold} className="btn-primary">
                  Guardar
                </button>
              </div>
              <p className="text-xs text-gray-400">Valor por defecto en la industria: 1.0 mg/kg</p>
            </>
          )}

          {tab === 'exportar' && (
            <>
              <h2 className="text-base font-medium text-gray-900">Exportar datos</h2>
              <p className="text-sm text-gray-500">
                Descarga de resultados de análisis para reportes o respaldo.
              </p>
              <div className="space-y-3 max-w-md">
                <button
                  type="button"
                  className="btn-secondary w-full justify-start"
                  onClick={() => setMsg('Exportación CSV de lotes: disponible en una próxima versión.')}
                >
                  <Download className="w-4 h-4" />
                  Exportar análisis de producto (CSV)
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full justify-start"
                  onClick={() => setMsg('Exportación CSV de grano: disponible en una próxima versión.')}
                >
                  <Download className="w-4 h-4" />
                  Exportar análisis de grano (CSV)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
