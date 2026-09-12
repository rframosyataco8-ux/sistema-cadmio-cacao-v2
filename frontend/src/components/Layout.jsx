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

export default function Layout({ user, setUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const analysisOpen =
    location.pathname.startsWith('/samples') || location.pathname.startsWith('/analisis')
  const [open, setOpen] = useState(analysisOpen)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

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

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-surface-100'
    }`

  const subLinkClass = ({ isActive }) =>
    `flex items-center gap-2 pl-11 pr-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-600 font-medium'
        : 'text-gray-500 hover:bg-surface-100 hover:text-gray-700'
    }`

  const displayName = user?.full_name || user?.email || 'Usuario'
  const initials = (displayName || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex bg-surface-50">
      <aside className="w-64 bg-white border-r border-surface-200 flex flex-col fixed h-full z-20">
        <div className="px-5 py-6 flex items-center gap-3 border-b border-surface-200">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">Cadmio Cacao</div>
            <div className="text-xs text-gray-500">Trazabilidad V2</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink to="/" end className={linkClass}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>

          <div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                analysisOpen ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-surface-100'
              }`}
            >
              <Beaker className="w-5 h-5" />
              <span className="flex-1 text-left">Análisis Producto</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="mt-1 space-y-0.5">
                <NavLink to="/samples/lot" className={subLinkClass}>
                  <Table2 className="w-4 h-4" />
                  Resultado
                </NavLink>
                <NavLink to="/analisis/comportamiento" className={subLinkClass}>
                  <LineChart className="w-4 h-4" />
                  Análisis de comportamiento
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/products" className={linkClass}>
            <Package className="w-5 h-5" />
            Productos & Orígenes
          </NavLink>
        </nav>

        {/* Menú de usuario */}
        <div className="p-3 border-t border-surface-200 relative" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden z-30">
              <div className="px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.role && (
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-100 text-gray-600">
                    {user.role}
                  </span>
                )}
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/configuracion')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface-50"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  Configuración
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/configuracion?tab=cuenta')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface-50"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  Mi cuenta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/ayuda')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface-50"
                >
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  Ayuda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/acerca')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface-50"
                >
                  <Info className="w-4 h-4 text-gray-500" />
                  Acerca del sistema
                </button>
              </div>
              <div className="border-t border-surface-100 py-1">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-100 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-medium shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
