import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard,
  Beaker,
  Package,
  LogOut,
  Leaf,
  ChevronDown,
  Table2,
  LineChart,
  Settings,
  HelpCircle,
  User,
  Info,
} from 'lucide-react'
import SettingsModal from './SettingsModal'

export default function Layout({ user, setUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const analysisOpen =
    location.pathname.startsWith('/samples') || location.pathname.startsWith('/analisis')
  const [open, setOpen] = useState(analysisOpen)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('cuenta')
  const menuRef = useRef(null)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const openSettings = (tab) => {
    setSettingsTab(tab)
    setSettingsOpen(true)
    setMenuOpen(false)
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-50 text-primary-600' : ''
    }`

  const subLinkClass = ({ isActive }) =>
    `flex items-center gap-2 pl-11 pr-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? 'bg-primary-50 text-primary-600 font-medium' : ''
    }`

  const displayName = user?.full_name || user?.email || 'Usuario'
  const initials = (displayName || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <aside
        className="w-64 border-r flex flex-col fixed h-full z-20"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="px-5 py-6 flex items-center gap-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-sm">Cadmio Cacao</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              Trazabilidad V2
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink
            to="/"
            end
            className={linkClass}
            style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>

          <div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                analysisOpen ? 'bg-primary-50 text-primary-600' : ''
              }`}
              style={!analysisOpen ? { color: 'var(--muted)' } : undefined}
            >
              <Beaker className="w-5 h-5" />
              <span className="flex-1 text-left">Análisis Producto</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="mt-1 space-y-0.5">
                <NavLink
                  to="/samples/lot"
                  className={subLinkClass}
                  style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
                >
                  <Table2 className="w-4 h-4" />
                  Resultado
                </NavLink>
                <NavLink
                  to="/analisis/comportamiento"
                  className={subLinkClass}
                  style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
                >
                  <LineChart className="w-4 h-4" />
                  Análisis de comportamiento
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/products"
            className={linkClass}
            style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
          >
            <Package className="w-5 h-5" />
            Productos & Orígenes
          </NavLink>
        </nav>

        <div className="p-3 border-t relative" style={{ borderColor: 'var(--border)' }} ref={menuRef}>
          {menuOpen && (
            <div
              className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border shadow-lg overflow-hidden z-30"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openSettings('general')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                  >
                    <Settings className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                    Configuración
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openSettings('cuenta')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                >
                  <User className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  Cuenta
                </button>
                <button
                  type="button"
                  onClick={() => openSettings('ayuda')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                >
                  <HelpCircle className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  Ayuda
                </button>
                <button
                  type="button"
                  onClick={() => openSettings('acerca')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                >
                  <Info className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  Acerca del sistema
                </button>
              </div>
              <div className="border-t py-1" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:opacity-80"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors text-left hover:opacity-90"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-medium shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                {user?.email}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--muted)' }}
            />
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        setUser={setUser}
        initialTab={settingsTab}
      />
    </div>
  )
}
