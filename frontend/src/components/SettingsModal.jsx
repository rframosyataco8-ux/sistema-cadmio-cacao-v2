import { useEffect, useState } from 'react'
import {
  X,
  User,
  Settings,
  Moon,
  Sun,
  Users,
  HelpCircle,
  Info,
  Camera,
} from 'lucide-react'
import { authApi } from '../lib/api'

export default function SettingsModal({ open, onClose, user, setUser, initialTab = 'cuenta' }) {
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState(initialTab)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [msg, setMsg] = useState('')
  const [name, setName] = useState(user?.full_name || '')
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'viewer',
  })
  const [threshold, setThreshold] = useState(() => localStorage.getItem('cd_threshold') || '1.0')

  useEffect(() => {
    if (open) {
      setTab(initialTab)
      setName(user?.full_name || '')
      setAvatar(user?.avatar || null)
      setMsg('')
      setDark(document.documentElement.classList.contains('dark'))
    }
  }, [open, initialTab, user])

  useEffect(() => {
    if (open && isAdmin && tab === 'usuarios') {
      authApi.listUsers().then((r) => setUsers(r.data)).catch(() => {})
    }
  }, [open, isAdmin, tab])

  if (!open) return null

  // Apariencia (tema oscuro) disponible para TODOS
  const tabs = isAdmin
    ? [
        { id: 'cuenta', label: 'Cuenta', icon: User },
        { id: 'apariencia', label: 'Apariencia', icon: dark ? Moon : Sun },
        { id: 'general', label: 'General', icon: Settings },
        { id: 'usuarios', label: 'Usuarios', icon: Users },
        { id: 'ayuda', label: 'Ayuda', icon: HelpCircle },
        { id: 'acerca', label: 'Acerca', icon: Info },
      ]
    : [
        { id: 'cuenta', label: 'Cuenta', icon: User },
        { id: 'apariencia', label: 'Apariencia', icon: dark ? Moon : Sun },
        { id: 'ayuda', label: 'Ayuda', icon: HelpCircle },
        { id: 'acerca', label: 'Acerca', icon: Info },
      ]

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const onAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1_200_000) {
      setMsg('La imagen debe ser menor a 1.2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    try {
      const { data } = await authApi.updateProfile({ full_name: name, avatar })
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      setMsg('Perfil guardado')
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error al guardar')
    }
  }

  const createUser = async (e) => {
    e.preventDefault()
    try {
      await authApi.register(newUser)
      setMsg('Usuario creado')
      setNewUser({ email: '', full_name: '', password: '', role: 'viewer' })
      const { data } = await authApi.listUsers()
      setUsers(data)
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error al crear usuario')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div
          className="w-48 shrink-0 border-r p-3 space-y-1 overflow-y-auto"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>
            {isAdmin ? 'Administrador' : 'Usuario'}
          </p>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setMsg('')
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                tab === t.id ? 'nav-active font-medium' : 'hover:opacity-80'
              }`}
              style={tab !== t.id ? { color: 'var(--muted)' } : undefined}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-base font-medium">
              {tabs.find((t) => t.id === tab)?.label}
            </h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70">
              <X className="w-5 h-5" style={{ color: 'var(--muted)' }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {msg && (
              <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--hover)' }}>
                {msg}
              </div>
            )}

            {tab === 'cuenta' && (
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-lg font-medium">
                        {(user?.full_name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center cursor-pointer shadow">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                    </label>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>
                    Foto de perfil (se guarda en la base de datos)
                  </div>
                </div>

                <div>
                  <label className="label">Nombre</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Correo</label>
                  <input className="input" value={user?.email || ''} readOnly />
                </div>
                {isAdmin && (
                  <div>
                    <label className="label">Rol</label>
                    <input className="input" value="Administrador" readOnly />
                  </div>
                )}
                <button type="button" className="btn-primary" onClick={saveProfile}>
                  Guardar cambios
                </button>
              </div>
            )}

            {/* Tema oscuro — TODOS los usuarios */}
            {tab === 'apariencia' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Tema oscuro</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Cambia el aspecto de toda la aplicación
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDark}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      dark ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                    aria-label="Alternar tema oscuro"
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        dark ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {tab === 'general' && isAdmin && (
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="label">Umbral de cadmio (mg/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    localStorage.setItem('cd_threshold', threshold)
                    setMsg('Umbral guardado')
                  }}
                >
                  Guardar umbral
                </button>
              </div>
            )}

            {tab === 'usuarios' && isAdmin && (
              <div className="space-y-6">
                <form onSubmit={createUser} className="grid gap-3 max-w-md">
                  <p className="text-sm font-medium">Crear usuario</p>
                  <input
                    className="input"
                    placeholder="Nombre completo"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    required
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="Correo"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                  <input
                    className="input"
                    type="password"
                    placeholder="Contraseña"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <select
                    className="input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="viewer">Visualizador (solo lectura)</option>
                    <option value="analyst">Analista (registrar muestras)</option>
                  </select>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    No se puede crear otro administrador. Solo existe uno.
                  </p>
                  <button type="submit" className="btn-primary w-fit">
                    Crear usuario
                  </button>
                </form>

                <div>
                  <p className="text-sm font-medium mb-2">Usuarios del sistema</p>
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div>
                          <p className="font-medium">{u.full_name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {u.email} · {u.role}
                            {!u.is_active && ' · inactivo'}
                          </p>
                        </div>
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded border"
                            style={{ borderColor: 'var(--border)' }}
                            onClick={async () => {
                              await authApi.setActive(u.id, !u.is_active)
                              const { data } = await authApi.listUsers()
                              setUsers(data)
                            }}
                          >
                            {u.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ayuda' && (
              <div className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                <p>
                  <strong style={{ color: 'var(--text)' }}>Resultado:</strong> tablas de análisis por
                  producto y grano.
                </p>
                <p>
                  <strong style={{ color: 'var(--text)' }}>Comportamiento:</strong> gráficos de
                  cadmio por producto.
                </p>
                <p>Las muestras se registran por peso (lote o guía de origen).</p>
              </div>
            )}

            {tab === 'acerca' && (
              <div className="text-sm space-y-2" style={{ color: 'var(--muted)' }}>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  Cadmio Cacao — Trazabilidad V2
                </p>
                <p>Sistema de control de cadmio en productos de cacao y grano.</p>
                <p className="text-xs">PostgreSQL · FastAPI · React</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
