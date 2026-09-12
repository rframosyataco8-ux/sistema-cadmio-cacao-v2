import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard,
  Beaker,
  Package,
  LogOut,
  Leaf,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Table2,
  LineChart,
  Settings,
  HelpCircle,
  User,
  Info,
  Moon,
} from 'lucide-react'
import SettingsModal from './SettingsModal'
import { canAccess } from '../lib/permissions'

export default function Layout({ user, setUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const analysisOpen =
    location.pathname.startsWith('/samples') || location.pathname.startsWith('/analisis')
  const [open, setOpen] = useState(analysisOpen)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === '1')
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('cuenta')
  const menuRef = useRef(null)
  const isAdmin = user?.role === 'admin'
  const showDash = canAccess('dashboard', user)
  const showResults = canAccess('results', user)
  const showBehavior = canAccess('behavior', user)
  const showCatalog = canAccess('products_catalog', user)
  const showAnalysis = showResults || showBehavior

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0')
  }, [collapsed])

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

  const toggleCollapse = () => {
    setCollapsed((v) => !v)
    setMenuOpen(false)
    setOpen(false)
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'nav-active' : ''
    } ${collapsed ? 'justify-center px-2' : ''}`

  const subLinkClass = ({ isActive }) =>
    `flex items-center gap-2 pl-11 pr-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? 'nav-active font-medium' : ''
    }`

  const displayName = user?.full_name || user?.email || 'Usuario'
  const initials = (displayName || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const sideW = collapsed ? 'w-[72px]' : 'w-64'
  const mainMl = collapsed ? 'ml-[72px]' : 'ml-64'

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <aside
        className={`${sideW} border-r flex flex-col fixed h-full z-20 transition-all duration-200`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className={`border-b flex items-center ${collapsed ? 'flex-col gap-2 py-4 px-2' : 'px-4 py-5 gap-3'}`}
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">Cadmio Cacao</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                Trazabilidad V2
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            title={collapsed ? 'Expandir menú' : 'Contraer menú'}
            className="p-1.5 rounded-lg hover:opacity-80 shrink-0"
            style={{ color: 'var(--muted)' }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {showDash && (
            <NavLink
              to="/"
              end
              title="Dashboard"
              className={linkClass}
              style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!collapsed && 'Dashboard'}
            </NavLink>
          )}

          {showAnalysis && (
            <div>
              <button
                type="button"
                title="Análisis Producto"
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false)
                    setOpen(true)
                  } else {
                    setOpen((v) => !v)
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  analysisOpen ? 'nav-active' : ''
                } ${collapsed ? 'justify-center px-2' : ''}`}
                style={!analysisOpen ? { color: 'var(--muted)' } : undefined}
              >
                <Beaker className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Análisis Producto</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </>
                )}
              </button>
              {open && !collapsed && (
                <div className="mt-1 space-y-0.5">
                  {showResults && (
                    <NavLink
                      to="/samples/lot"
                      className={subLinkClass}
                      style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
                    >
                      <Table2 className="w-4 h-4" />
                      Resultado
                    </NavLink>
                  )}
                  {showBehavior && (
                    <NavLink
                      to="/analisis/comportamiento"
                      className={subLinkClass}
                      style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
                    >
                      <LineChart className="w-4 h-4" />
                      Análisis de comportamiento
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

          {showCatalog && (
            <NavLink
              to="/products"
              title="Productos & Orígenes"
              className={linkClass}
              style={({ isActive }) => (!isActive ? { color: 'var(--muted)' } : undefined)}
            >
              <Package className="w-5 h-5 shrink-0" />
              {!collapsed && 'Productos & Orígenes'}
            </NavLink>
          )}
        </nav>

        <div className="p-2 border-t relative" style={{ borderColor: 'var(--border)' }} ref={menuRef}>
          {menuOpen && (
            <div
              className={`absolute bottom-full mb-2 rounded-xl border shadow-lg overflow-hidden z-30 ${
                collapsed ? 'left-2 w-56' : 'left-2 right-2'
              }`}
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
                    style={{ color: 'var(--text)' }}
                  >
                    <Settings className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                    Configuración
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openSettings('cuenta')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                  style={{ color: 'var(--text)' }}
                >
                  <User className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  Cuenta
                </button>
                <button
                  type="button"
                  onClick={() => openSettings('apariencia')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                  style={{ color: 'var(--text)' }}
                >
                  <Moon className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  Apariencia
                </button>
                <button
                  type="button"
                  onClick={() => openSettings('ayuda')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                  style={{ color: 'var(--text)' }}
                >
                  <HelpCircle className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  Ayuda
                </button>
                <button
                  type="button"
                  onClick={() => openSettings('acerca')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80"
                  style={{ color: 'var(--text)' }}
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
            title={displayName}
            className={`w-full flex items-center gap-3 rounded-xl transition-colors text-left hover:opacity-90 ${
              collapsed ? 'justify-center p-2' : 'px-2 py-2'
            }`}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-medium shrink-0">
                {initials}
              </div>
            )}
            {!collapsed && (
              <>
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
              </>
            )}
          </button>
        </div>
      </aside>

      <main className={`flex-1 ${mainMl} transition-all duration-200`}>
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
