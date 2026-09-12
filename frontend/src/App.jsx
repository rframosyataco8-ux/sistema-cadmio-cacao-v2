import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SamplesLot from './pages/SamplesLot'
import BehaviorAnalysis from './pages/BehaviorAnalysis'
import Products from './pages/Products'

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

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
