import { createClient } from '@supabase/supabase-js'

const process = globalThis.process || { env: {} }

const defaultProducts = [
  {
    id: 'T-1001',
    code: 'CT-1001',
    name: 'Campus League Tee',
    category: 'College Events',
    price: 599,
    oldPrice: 799,
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    description:
      'A premium cotton tee built for campus events, clubs, and everyday wear with a sharp oversized fit.',
    sizes: 'S,M,L,XL,XXL',
    colors: 'Black,White,Maroon',
    featured: true,
    stock: 18,
  },
  {
    id: 'T-1002',
    code: 'CT-1002',
    name: 'Fest Crew Graphic Tee',
    category: 'Festivals',
    price: 649,
    oldPrice: 899,
    image:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
    description:
      'Statement graphic tee for fests and inter-college competitions. Lightweight and photogenic on every frame.',
    sizes: 'S,M,L,XL',
    colors: 'Navy,White,Coral',
    featured: true,
    stock: 12,
  },
  {
    id: 'T-1003',
    code: 'CT-1003',
    name: 'Street Pulse Tee',
    category: 'Daily Wear',
    price: 549,
    oldPrice: 749,
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    description:
      'Minimal design with soft-touch fabric ideal for everyday campus life and casual outings.',
    sizes: 'XS,S,M,L,XL',
    colors: 'Ash,Black,Olive',
    featured: false,
    stock: 22,
  },
  {
    id: 'T-1004',
    code: 'CT-1004',
    name: 'CodeFest Edition',
    category: 'Hackathons',
    price: 699,
    oldPrice: 999,
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    description:
      'Built for tech events, coding challenges, and club meets with a clean, premium silhouette.',
    sizes: 'M,L,XL,XXL',
    colors: 'Blue,Black,White',
    featured: true,
    stock: 9,
  },
  {
    id: 'T-1005',
    code: 'CT-1005',
    name: 'Cultural Night Oversized',
    category: 'Cultural Clubs',
    price: 749,
    oldPrice: 1049,
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    description:
      'A bold oversized fit for workshops, cultural nights, and club performances with a standout look.',
    sizes: 'S,M,L,XL',
    colors: 'Red,Black,Gold',
    featured: true,
    stock: 16,
  },
  {
    id: 'T-1006',
    code: 'CT-1006',
    name: 'Merch Drop Unisex Tee',
    category: 'Limited Edition',
    price: 799,
    oldPrice: 1099,
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    description:
      'Limited stock release with premium cotton and a street-ready finish for collectors and event squads.',
    sizes: 'S,M,L,XL,XXL',
    colors: 'Cream,Peach,Ink',
    featured: false,
    stock: 7,
  },
]

const json = (statusCode, data) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  body: JSON.stringify(data),
})

const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key)
}

const isAuthorized = (event) => {
  const secret = process.env.ADMIN_SECRET || '#lee#lee&'
  const headerValue =
    event.headers?.['x-admin-key'] ||
    event.headers?.['X-Admin-Key'] ||
    event.headers?.authorization ||
    ''

  return !secret || headerValue.includes(secret)
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true })
  }

  if (event.httpMethod === 'GET') {
    const client = getSupabaseClient()

    if (client) {
      try {
        const { data, error } = await client
          .from('products')
          .select('*')
          .order('updated_at', { ascending: false })

        if (!error && data) {
          return json(200, data)
        }
      } catch (error) {
        console.error('Supabase fetch error', error)
      }
    }

    return json(200, defaultProducts)
  }

  if (!isAuthorized(event)) {
    return json(401, { message: 'Admin key missing or invalid.' })
  }

  const product = JSON.parse(event.body || '{}')

  if (event.httpMethod === 'POST') {
    const client = getSupabaseClient()
    const body = {
      id: product.id || product.code || `CT-${Date.now()}`,
      code: product.code || `CT-${Date.now()}`,
      name: product.name,
      category: product.category || 'General',
      price: Number(product.price || 0),
      old_price: Number(product.oldPrice || 0),
      image: product.image || '',
      description: product.description || '',
      sizes: product.sizes || 'S,M,L,XL',
      colors: product.colors || 'Black,White',
      featured: Boolean(product.featured),
      stock: Number(product.stock || 1),
      updated_at: new Date().toISOString(),
    }

    if (client) {
      const { data, error } = await client.from('products').insert([body]).select().single()
      if (!error && data) {
        return json(201, data)
      }
    }

    return json(201, body)
  }

  if (event.httpMethod === 'PUT') {
    const client = getSupabaseClient()
    const body = {
      ...product,
      price: Number(product.price || 0),
      old_price: Number(product.oldPrice || product.old_price || 0),
      featured: Boolean(product.featured),
      stock: Number(product.stock || 1),
      updated_at: new Date().toISOString(),
    }

    if (client) {
      const { data, error } = await client
        .from('products')
        .update(body)
        .eq('id', product.id)
        .select()
        .single()

      if (!error && data) {
        return json(200, data)
      }
    }

    return json(200, body)
  }

  if (event.httpMethod === 'DELETE') {
    const { id } = JSON.parse(event.body || '{}')
    const client = getSupabaseClient()

    if (client && id) {
      const { error } = await client.from('products').delete().eq('id', id)
      if (!error) {
        return json(200, { success: true, id })
      }
    }

    return json(200, { success: true, id })
  }

  return json(405, { message: 'Method not allowed' })
}
