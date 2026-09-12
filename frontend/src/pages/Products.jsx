import { useEffect, useState } from 'react'
import { catalogApi } from '../lib/api'
import { Plus } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [origins, setOrigins] = useState([])
  const [newProduct, setNewProduct] = useState('')
  const [newOrigin, setNewOrigin] = useState('')

  const load = async () => {
    const [p, o] = await Promise.all([catalogApi.products(), catalogApi.origins()])
    setProducts(p.data)
    setOrigins(o.data)
  }

  useEffect(() => { load() }, [])

  const addProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.trim()) return
    try {
      await catalogApi.createProduct({ name: newProduct.trim() })
      setNewProduct('')
      await load()
    } catch (err) { alert(err.response?.data?.detail || 'Error') }
  }

  const addOrigin = async (e) => {
    e.preventDefault()
    if (!newOrigin.trim()) return
    try {
      await catalogApi.createOrigin({ name: newOrigin.trim() })
      setNewOrigin('')
      await load()
    } catch (err) { alert(err.response?.data?.detail || 'Error') }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Productos y Orígenes</h1>
        <p className="text-sm text-gray-500 mt-1">Catálogos maestros</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Productos</h2>
          <form onSubmit={addProduct} className="flex gap-2 mb-4">
            <input className="input flex-1" placeholder="Nombre" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} />
            <button type="submit" className="btn-primary"><Plus className="w-4 h-4" /></button>
          </form>
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {products.map((p) => <li key={p.id} className="px-3 py-2 rounded-lg bg-surface-50 text-sm">{p.name}</li>)}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Orígenes / Zonas</h2>
          <form onSubmit={addOrigin} className="flex gap-2 mb-4">
            <input className="input flex-1" placeholder="Ej: Jaen" value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)} />
            <button type="submit" className="btn-primary"><Plus className="w-4 h-4" /></button>
          </form>
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {origins.map((o) => <li key={o.id} className="px-3 py-2 rounded-lg bg-surface-50 text-sm">{o.name}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
