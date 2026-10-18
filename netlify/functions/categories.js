import { createClient } from '@supabase/supabase-js'

const process = globalThis.process || { env: {} }

const defaultCategories = [
  'College Events',
  'Festivals',
  'Daily Wear',
  'Hackathons',
  'Cultural Clubs',
  'Limited Edition',
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
  const secret = process.env.ADMIN_SECRET || 'campusadmin'
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

  const client = getSupabaseClient()

  if (event.httpMethod === 'GET') {
    if (client) {
      try {
        const { data, error } = await client
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true })

        if (!error && data) {
          return json(
            200,
            data.map((item) => (typeof item.name === 'string' ? item.name : item)),
          )
        }
      } catch (error) {
        console.error('Supabase category fetch error', error)
      }
    }

    return json(200, defaultCategories)
  }

  if (!isAuthorized(event)) {
    return json(401, { message: 'Admin key missing or invalid.' })
  }

  const body = JSON.parse(event.body || '{}')

  if (event.httpMethod === 'POST') {
    const name = String(body.name || '').trim()
    if (!name) {
      return json(400, { message: 'Category name is required.' })
    }

    const categoryPayload = { name, created_at: new Date().toISOString() }

    if (client) {
      const { data, error } = await client.from('categories').insert([categoryPayload]).select().single()
      if (!error && data) {
        return json(201, data)
      }
    }

    return json(201, categoryPayload)
  }

  if (event.httpMethod === 'PUT') {
    const name = String(body.name || '').trim()
    if (!name) {
      return json(400, { message: 'Category name is required.' })
    }

    if (client) {
      const { data, error } = await client
        .from('categories')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('name', body.id || body.name)
        .select()
        .single()

      if (!error && data) {
        return json(200, data)
      }
    }

    return json(200, { name })
  }

  if (event.httpMethod === 'DELETE') {
    const name = String(body.name || '').trim()
    if (!name) {
      return json(400, { message: 'Category name is required.' })
    }

    if (client) {
      const { error } = await client.from('categories').delete().eq('name', name)
      if (!error) {
        return json(200, { success: true, name })
      }
    }

    return json(200, { success: true, name })
  }

  return json(405, { message: 'Method not allowed' })
}
