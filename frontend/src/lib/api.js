import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 20000,
  maxContentLength: 2_000_000,
  maxBodyLength: 2_000_000,
})

const GET_TTL_MS = 20_000
const getCache = new Map()
const inflight = new Map()

function cacheKey(config) {
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${config.method || 'get'}:${config.url}:${params}`
}

function getCached(key) {
  const hit = getCache.get(key)
  if (!hit) return null
  if (Date.now() > hit.exp) {
    getCache.delete(key)
    return null
  }
  return hit.data
}

function setCached(key, data) {
  getCache.set(key, { exp: Date.now() + GET_TTL_MS, data })
  if (getCache.size > 80) {
    const first = getCache.keys().next().value
    getCache.delete(first)
  }
}

export function invalidateApiCache() {
  getCache.clear()
  inflight.clear()
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function humanMessage(err) {
  if (!err.response) {
    if (err.code === 'ECONNABORTED') return 'Tiempo de espera agotado. Inténtalo de nuevo.'
    if (err.message === 'canceled' || err.code === 'ERR_CANCELED') return null
    return 'No se pudo conectar con el servidor.'
  }
  const data = err.response.data
  const status = err.response.status
  if (status === 429) return data?.detail || 'Demasiadas peticiones. Espera un momento.'
  if (status === 413) return data?.detail || 'Datos demasiado grandes.'
  if (status === 422) return data?.errors?.[0]?.message || data?.detail || 'Datos inválidos.'
  if (status === 409) return data?.detail || 'Conflicto: registro duplicado o en uso.'
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
    const msg = humanMessage(err)
    if (msg) err.userMessage = msg
    return Promise.reject(err)
  }
)

async function smartGet(url, config = {}) {
  const key = cacheKey({ method: 'get', url, params: config.params })
  const cached = getCached(key)
  if (cached) return cached
  if (inflight.has(key)) return inflight.get(key)
  const promise = api
    .get(url, config)
    .then((res) => {
      setCached(key, res)
      return res
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

async function mutating(method, url, data, config) {
  const res = await api.request({ method, url, data, ...config })
  invalidateApiCache()
  return res
}

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
  me: () => smartGet('/auth/me'),
  updateProfile: (data) => mutating('patch', '/auth/me', data),
  changePassword: (data) => mutating('post', '/auth/me/password', data),
  register: (data) => mutating('post', '/auth/register', data),
  listUsers: () => smartGet('/auth/users'),
  updateUser: (userId, data) => mutating('patch', `/auth/users/${userId}`, data),
  setActive: (userId, active) =>
    mutating('patch', `/auth/users/${userId}/active`, null, { params: { active } }),
}

export const catalogApi = {
  products: () => smartGet('/products'),
  origins: () => smartGet('/origins'),
  createProduct: (data) => mutating('post', '/products', data),
  updateProduct: (id, data) => mutating('patch', `/products/${id}`, data),
  deleteProduct: (id) => mutating('delete', `/products/${id}`),
  createOrigin: (data) => mutating('post', '/origins', data),
  updateOrigin: (id, data) => mutating('patch', `/origins/${id}`, data),
  deleteOrigin: (id) => mutating('delete', `/origins/${id}`),
}

export const lotsApi = {
  list: (productId) => smartGet('/lots', { params: { product_id: productId } }),
  create: (data) => mutating('post', '/lots', data),
}

export const samplesApi = {
  listLot: (params) => smartGet('/samples/lot', { params }),
  createLot: (data) => mutating('post', '/samples/lot', data),
  updateLot: (id, data) => mutating('patch', `/samples/lot/${id}`, data),
  deleteLot: (id) => mutating('delete', `/samples/lot/${id}`),
  listGrain: (params) => smartGet('/samples/grain', { params }),
  createGrain: (data) => mutating('post', '/samples/grain', data),
  updateGrain: (id, data) => mutating('patch', `/samples/grain/${id}`, data),
  deleteGrain: (id) => mutating('delete', `/samples/grain/${id}`),
}

export const analyticsApi = {
  kpis: () => smartGet('/analytics/kpis'),
  byProduct: () => smartGet('/analytics/charts/by-product'),
  byOriginGrain: () => smartGet('/analytics/charts/by-origin-grain'),
  trend: (productId) => smartGet('/analytics/charts/trend', { params: { product_id: productId } }),
  lots: (productId) => smartGet('/analytics/charts/lots', { params: { product_id: productId } }),
}

export default api
