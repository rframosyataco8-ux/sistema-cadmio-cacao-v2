import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { Leaf } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@cadmio.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      let msg = 'Error al iniciar sesión'
      if (!err.response) {
        msg = 'No se pudo conectar con el backend (http://localhost:8000). ¿Está corriendo docker compose?'
      } else if (typeof detail === 'string') {
        msg = detail
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
      } else if (detail) {
        msg = JSON.stringify(detail)
      } else {
        msg = `Error ${err.response.status}: ${err.response.statusText}`
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center mb-4">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-medium text-gray-900">Sistema Cadmio Cacao</h1>
          <p className="text-sm text-gray-500 mt-1">Trazabilidad y monitoreo V2</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-6">admin@cadmio.com / admin123</p>
      </div>
    </div>
  )
}
