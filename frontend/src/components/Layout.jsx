import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Beaker, Package, LogOut, Leaf, ChevronDown, Table2, LineChart } from 'lucide-react'

export default function Layout({ user, setUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const analysisOpen =
    location.pathname.startsWith('/samples') || location.pathname.startsWith('/analisis')
  const [open, setOpen] = useState(analysisOpen)

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
      isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-500 hover:bg-surface-100 hover:text-gray-700'
    }`

  return (
    <div className="min-h-screen flex bg-surface-50">
      <aside className="w-64 bg-white border-r border-surface-200 flex flex-col fixed h-full">
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

          {/* Análisis Producto — desplegable */}
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

        <div className="p-4 border-t border-surface-200">
          <div className="text-xs text-gray-500 mb-2 truncate">{user?.email}</div>
          <button onClick={logout} className="btn-ghost w-full flex items-center gap-2 text-sm">
            <LogOut className="w-4 h-4" /> Cerrar sesión
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
