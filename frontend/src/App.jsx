import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SamplesLot from './pages/SamplesLot'
import BehaviorAnalysis from './pages/BehaviorAnalysis'
import Products from './pages/Products'
import Settings from './pages/Settings'
import Help from './pages/Help'
import About from './pages/About'

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={setUser} />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser} />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="samples/lot" element={<SamplesLot />} />
        <Route path="analisis/comportamiento" element={<BehaviorAnalysis />} />
        <Route path="products" element={<Products />} />
        <Route path="configuracion" element={<Settings />} />
        <Route path="ayuda" element={<Help />} />
        <Route path="acerca" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
