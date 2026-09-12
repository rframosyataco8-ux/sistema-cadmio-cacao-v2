/** Claves de producto usadas en permisos */
export const PRODUCT_KEYS = [
  { key: 'torta_cacao', label: 'Torta de cacao' },
  { key: 'torta_alcalino', label: 'Torta de cacao alcalino' },
  { key: 'torta_trozada', label: 'Torta trozada estándar' },
  { key: 'cacao_alcalino', label: 'Cacao alcalino' },
  { key: 'cacao_polvo', label: 'Cacao en polvo' },
  { key: 'grano', label: 'Grano de cacao' },
]

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {}
  } catch {
    return {}
  }
}

export function getPerms(user = getUser()) {
  if (user?.role === 'admin') {
    return {
      dashboard: true,
      results: true,
      behavior: true,
      products_catalog: true,
      can_create_samples: true,
      products: [],
    }
  }
  return (
    user?.permissions || {
      dashboard: true,
      results: true,
      behavior: true,
      products_catalog: true,
      can_create_samples: false,
      products: [],
    }
  )
}

/** Si products está vacío, tiene acceso a todos */
export function canSeeProduct(productKey, user = getUser()) {
  const p = getPerms(user)
  if (!p.products || p.products.length === 0) return true
  return p.products.includes(productKey)
}

export function canAccess(section, user = getUser()) {
  const p = getPerms(user)
  return !!p[section]
}
