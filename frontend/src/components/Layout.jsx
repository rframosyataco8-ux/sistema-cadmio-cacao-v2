import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Beaker, Wheat, Package, LogOut, Leaf } from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/samples/lot', icon: Beaker, label: 'Análisis Producto' },
  { to: '/samples/grain', icon: Wheat, label: 'Análisis Grano' },
  { to: '/products', icon: Package, label: 'Productos & Orígenes' },
]

export default function Layout({ user, setUser }) {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

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
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-surface-100'
                }`
              }>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
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
