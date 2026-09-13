import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { FlaskConical, Lock, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@cadmio.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      nav('/')
    } catch (err) {
      setError(err.userMessage || err.response?.data?.detail || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-blue-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-300/30 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-lg leading-tight">Cadmio Cacao</p>
              <p className="text-xs text-white/70">Trazabilidad V2</p>
            </div>
          </div>
          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Control de cadmio y plaguicidas con trazabilidad completa
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Registra lotes, orígenes y resultados de laboratorio. Visualiza tendencias y toma decisiones con datos reales.
            </p>
            <div className="flex gap-6 pt-4 text-sm text-white/70">
              <div>
                <p className="text-2xl font-semibold text-white">Cd</p>
                <p>Cadmio</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-semibold text-white">P</p>
                <p>Plaguicidas</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-semibold text-white">∞</p>
                <p>Trazabilidad</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/50">Exportadora · Laboratorio · Calidad</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[var(--bg)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Cadmio Cacao</p>
              <p className="text-xs text-gray-500">Trazabilidad V2</p>
            </div>
          </div>

          <div className="card p-8 shadow-lg border-0 ring-1 ring-black/5">
            <h2 className="text-xl font-semibold text-gray-900">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">Accede al panel de control de calidad</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Correo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" className="input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
                </div>
              </div>
              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" className="input pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                </div>
              </div>

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100">{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {loading ? 'Entrando…' : (<><span>Entrar</span><ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Sistema interno · Uso autorizado</p>
        </div>
      </div>
    </div>
  )
}
