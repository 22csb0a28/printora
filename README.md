# Campus Thread Store

A modern college merchandise storefront inspired by college event culture and campus lifestyle brands.

## Features

- Attractive marketplace UI for campus events, festivals, and daily wear
- WhatsApp buy button that sends product code, name, and price automatically
- Admin dashboard for adding, editing, and deleting products
- Netlify-compatible backend API with Supabase persistence
- Product updates without shipping a new frontend release

## Local setup

1. Install dependencies:
   npm install
2. Start the frontend:
   npm run dev
3. Start Netlify functions locally:
   npm run dev:netlify

## Netlify deployment

1. Push the repo to GitHub.
2. Import it in Netlify.
3. Set build command: npm run build
4. Set publish directory: dist
5. Add these environment variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - ADMIN_SECRET
   - VITE_ADMIN_PASSWORD
   - VITE_WHATSAPP_NUMBER
   - VITE_API_BASE_URL=/api

## Supabase schema

```sql
create table if not exists public.products (
  id text primary key,
  code text not null unique,
  name text not null,
  category text not null,
  price numeric not null,
  old_price numeric default 0,
  image text default '',
  description text default '',
  sizes text default 'S,M,L,XL',
  colors text default 'Black,White',
  featured boolean default false,
  stock integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Admin workflow

- Open the site and click Admin.
- Use the password configured as VITE_ADMIN_PASSWORD.
- Add, edit, and remove products from the dashboard.
- Product data is saved to Supabase so updates happen without a new frontend release.

## WhatsApp message behavior

The Buy now button opens WhatsApp with a message like:

Hello, I want to buy Campus League Tee (CT-1001). Price: ₹599. Please share size and delivery details.

This keeps the product code, name, and price visible in a customer-friendly message.
