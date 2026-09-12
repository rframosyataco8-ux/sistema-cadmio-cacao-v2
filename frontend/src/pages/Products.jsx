import { useEffect, useState } from 'react'
import { catalogApi } from '../lib/api'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [origins, setOrigins] = useState([])
  const [newProduct, setNewProduct] = useState('')
  const [newOrigin, setNewOrigin] = useState('')
  const [editProductId, setEditProductId] = useState(null)
  const [editProductName, setEditProductName] = useState('')
  const [editOriginId, setEditOriginId] = useState(null)
  const [editOriginName, setEditOriginName] = useState('')

  const load = async () => {
    const [p, o] = await Promise.all([catalogApi.products(), catalogApi.origins()])
    setProducts(p.data || [])
    setOrigins(o.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const addProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.trim()) return
    try {
      await catalogApi.createProduct({ name: newProduct.trim() })
      setNewProduct('')
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  const addOrigin = async (e) => {
    e.preventDefault()
    if (!newOrigin.trim()) return
    try {
      await catalogApi.createOrigin({ name: newOrigin.trim() })
      setNewOrigin('')
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  const startEditProduct = (p) => {
    setEditProductId(p.id)
    setEditProductName(p.name)
  }

  const saveProduct = async (id) => {
    if (!editProductName.trim()) return
    try {
      await catalogApi.updateProduct(id, { name: editProductName.trim() })
      setEditProductId(null)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al editar')
    }
  }

  const removeProduct = async (id, name) => {
    if (!confirm(`¿Eliminar el producto "${name}"?`)) return
    try {
      await catalogApi.deleteProduct(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar')
    }
  }

  const startEditOrigin = (o) => {
    setEditOriginId(o.id)
    setEditOriginName(o.name)
  }

  const saveOrigin = async (id) => {
    if (!editOriginName.trim()) return
    try {
      await catalogApi.updateOrigin(id, { name: editOriginName.trim() })
      setEditOriginId(null)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al editar')
    }
  }

  const removeOrigin = async (id, name) => {
    if (!confirm(`¿Eliminar el origen "${name}"?`)) return
    try {
      await catalogApi.deleteOrigin(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Productos y Orígenes</h1>
        <p className="text-sm text-gray-500 mt-1">Catálogos maestros — puedes editar o eliminar cada ítem</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Productos</h2>
          <form onSubmit={addProduct} className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="Nombre"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((p) => (
              <li
                key={p.id}
                className="px-3 py-2 rounded-lg bg-surface-50 text-sm flex items-center gap-2 group"
              >
                {editProductId === p.id ? (
                  <>
                    <input
                      className="input flex-1 py-1 text-sm"
                      value={editProductName}
                      onChange={(e) => setEditProductName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), saveProduct(p.id))}
                    />
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                      onClick={() => saveProduct(p.id)}
                      title="Guardar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      onClick={() => setEditProductId(null)}
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{p.name}</span>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 opacity-70 group-hover:opacity-100"
                      onClick={() => startEditProduct(p)}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 opacity-70 group-hover:opacity-100"
                      onClick={() => removeProduct(p.id, p.name)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
            {products.length === 0 && (
              <li className="text-sm text-gray-400 px-3 py-4 text-center">Sin productos</li>
            )}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Orígenes / Zonas</h2>
          <form onSubmit={addOrigin} className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="Ej: Jaen"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {origins.map((o) => (
              <li
                key={o.id}
                className="px-3 py-2 rounded-lg bg-surface-50 text-sm flex items-center gap-2 group"
              >
                {editOriginId === o.id ? (
                  <>
                    <input
                      className="input flex-1 py-1 text-sm"
                      value={editOriginName}
                      onChange={(e) => setEditOriginName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), saveOrigin(o.id))}
                    />
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                      onClick={() => saveOrigin(o.id)}
                      title="Guardar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      onClick={() => setEditOriginId(null)}
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{o.name}</span>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 opacity-70 group-hover:opacity-100"
                      onClick={() => startEditOrigin(o)}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 opacity-70 group-hover:opacity-100"
                      onClick={() => removeOrigin(o.id, o.name)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
            {origins.length === 0 && (
              <li className="text-sm text-gray-400 px-3 py-4 text-center">Sin orígenes</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
