import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import {
  FlaskConical,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Shield,
} from 'lucide-react'

export default function Login({ onLogin }) {
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@cadmio.com')
  const [password, setPassword] = useState('admin123')
  const [showPass, setShowPass] = useState(false)
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
      if (typeof onLogin === 'function') onLogin(data.user)
      nav('/')
    } catch (err) {
      setError(err.userMessage || err.response?.data?.detail || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* ——— PANEL IZQUIERDO ——— */}
      <aside className="login-left">
        <div
          className="login-left-bg"
          style={{ backgroundImage: "url('/images/login/login.png')" }}
          aria-hidden
        />
        <div className="login-left-overlay" aria-hidden />

        <div className="login-left-content">
          {/* Identidad */}
          <header className="login-brand">
            <div className="login-brand-icon">
              <FlaskConical className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="login-brand-title">
                <span className="text-white">Cadmio</span>{' '}
                <span className="login-brand-accent">Cacao</span>
              </p>
              <p className="login-brand-sub">Control de cadmio y plaguicidas</p>
            </div>
          </header>

          {/* Badge */}
          <div className="login-badge">
            <Shield className="w-3.5 h-3.5" />
            <span>Sistema de Gestión y Control</span>
          </div>

          {/* Título */}
          <h1 className="login-hero-title">
            Control de cadmio y
            <br />
            plaguicidas con
            <br />
            <span className="login-hero-accent">datos reales</span>
          </h1>

          <p className="login-hero-desc">
            Registra lotes, orígenes y resultados de laboratorio.
            <br />
            Visualiza tendencias y toma decisiones con datos reales.
          </p>

          {/* Solo Cadmio + Plaguicidas */}
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                <FlaskConical className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="login-feature-title">Cadmio</p>
                <p className="login-feature-text">
                  Control de niveles
                  <br />
                  en el cacao.
                </p>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">
                <Leaf className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="login-feature-title">Plaguicidas</p>
                <p className="login-feature-text">
                  Análisis y monitoreo
                  <br />
                  de residuos.
                </p>
              </div>
            </div>
          </div>

          <footer className="login-left-foot">
            <span className="login-left-line" />
            <span>AGRICULTURA SEGURA · CACAO DE CALIDAD</span>
          </footer>
        </div>
      </aside>

      {/* ——— PANEL DERECHO ——— */}
      <main className="login-right">
        <p className="login-right-top">
          <Leaf className="w-3.5 h-3.5" />
          Calidad · Seguridad · Futuro
        </p>

        <div className="login-card animate-slide-up">
          <div className="login-card-icon">
            <FlaskConical className="w-7 h-7 text-white" strokeWidth={2} />
          </div>

          <h2 className="login-card-title">Iniciar sesión</h2>
          <p className="login-card-sub">Accede al panel de control de calidad</p>

          <form onSubmit={submit} className="login-form">
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                Correo
              </label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="login-pass">
                Contraseña
              </label>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" />
                <input
                  id="login-pass"
                  type={showPass ? 'text' : 'password'}
                  className="login-input login-input-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                'Entrando…'
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="login-card-foot">
            <span className="login-foot-line" />
            Sistema interno · Uso autorizado
            <span className="login-foot-line" />
          </p>
        </div>
      </main>
    </div>
  )
}
