import { defaultProducts } from './defaultProducts.js'

const API_BASE = '/api'

const defaultCategories = [
  'College Events',
  'Festivals',
  'Daily Wear',
  'Hackathons',
  'Cultural Clubs',
  'Limited Edition',
]

export async function getProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`, { method: 'GET' })
    if (!response.ok) {
      throw new Error('Products API unavailable')
    }
    const data = await response.json()
    return Array.isArray(data) && data.length > 0 ? data : defaultProducts
  } catch (error) {
    console.warn('Falling back to demo data:', error)
    return defaultProducts
  }
}

export async function getCategories() {
  try {
    const response = await fetch(`${API_BASE}/categories`, { method: 'GET' })
    if (!response.ok) {
      throw new Error('Categories API unavailable')
    }
    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean)
    }
    return defaultCategories
  } catch (error) {
    console.warn('Falling back to default categories:', error)
    return defaultCategories
  }
}

export async function saveProduct(product, adminKey = '') {
  const isUpdate = Boolean(product.id)
  const response = await fetch(`${API_BASE}/products`, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    },
    body: JSON.stringify(product),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Unable to save product')
  }

  return response.json()
}

export async function deleteProduct(productId, adminKey = '') {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    },
    body: JSON.stringify({ id: productId }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Unable to delete product')
  }

  return response.json()
}

export async function saveCategory(category, adminKey = '') {
  const response = await fetch(`${API_BASE}/categories`, {
    method: category?.id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    },
    body: JSON.stringify(category),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Unable to save category')
  }

  return response.json()
}

export async function deleteCategory(categoryName, adminKey = '') {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    },
    body: JSON.stringify({ name: categoryName }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Unable to delete category')
  }

  return response.json()
}
