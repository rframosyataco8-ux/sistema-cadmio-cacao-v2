import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  maxContentLength: 2_000_000,
  maxBodyLength: 2_000_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function humanMessage(err) {
  if (!err.response) {
    if (err.code === 'ECONNABORTED') return 'Tiempo de espera agotado. Inténtalo de nuevo.'
    return 'No se pudo conectar con el servidor.'
  }
  const data = err.response.data
  const status = err.response.status
  if (status === 429) return data?.detail || 'Demasiadas peticiones. Espera un momento.'
  if (status === 413) return data?.detail || 'Archivo o datos demasiado grandes.'
  if (status === 422) {
    const first = data?.errors?.[0]?.message
    return first || data?.detail || 'Datos inválidos.'
  }
  if (status === 409) return data?.detail || 'Conflicto: el registro ya existe o está en uso.'
  if (status === 503) return data?.detail || 'Servicio temporalmente no disponible.'
  if (typeof data?.detail === 'string') return data.detail
  return 'Error al procesar la solicitud.'
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    err.userMessage = humanMessage(err)
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', String(email || '').trim().slice(0, 200))
    form.append('password', String(password || '').slice(0, 200))
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    })
  },
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.post('/auth/me/password', data),
  register: (data) => api.post('/auth/register', data),
  listUsers: () => api.get('/auth/users'),
  updateUser: (userId, data) => api.patch(`/auth/users/${userId}`, data),
  setActive: (userId, active) => api.patch(`/auth/users/${userId}/active`, null, { params: { active } }),
}

export const catalogApi = {
  products: () => api.get('/products'),
  origins: () => api.get('/origins'),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.patch(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  createOrigin: (data) => api.post('/origins', data),
  updateOrigin: (id, data) => api.patch(`/origins/${id}`, data),
  deleteOrigin: (id) => api.delete(`/origins/${id}`),
}

export const lotsApi = {
  list: (productId) => api.get('/lots', { params: { product_id: productId } }),
  create: (data) => api.post('/lots', data),
}

export const samplesApi = {
  listLot: (params) => api.get('/samples/lot', { params }),
  createLot: (data) => api.post('/samples/lot', data),
  updateLot: (id, data) => api.patch(`/samples/lot/${id}`, data),
  deleteLot: (id) => api.delete(`/samples/lot/${id}`),
  listGrain: (params) => api.get('/samples/grain', { params }),
  createGrain: (data) => api.post('/samples/grain', data),
  updateGrain: (id, data) => api.patch(`/samples/grain/${id}`, data),
  deleteGrain: (id) => api.delete(`/samples/grain/${id}`),
}

export const analyticsApi = {
  kpis: () => api.get('/analytics/kpis'),
  byProduct: () => api.get('/analytics/charts/by-product'),
  byOriginGrain: () => api.get('/analytics/charts/by-origin-grain'),
  trend: (productId) => api.get('/analytics/charts/trend', { params: { product_id: productId } }),
  lots: (productId) => api.get('/analytics/charts/lots', { params: { product_id: productId } }),
}

export default api
