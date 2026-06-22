# Grocery List

A mobile-first PWA for shared grocery lists. No login — create a list, share a short code, and shop together in real time.

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the migration in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. Copy your project URL and anon key from **Settings → API**

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open on your phone (same Wi‑Fi): use your machine's local IP, e.g. `http://192.168.1.x:5173`

## Deploy to Vercel (GitHub)

### 1. Push to GitHub

After creating your GitHub repo:

```bash
git add -A
git commit -m "Grocery List PWA — initial build"
git remote add origin https://github.com/YOUR_USERNAME/GroceryList.git
git push -u origin main
```

Ensure `.env.local` is **not** committed (it's gitignored).

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `GroceryList` GitHub repo
3. Confirm build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3. Environment variables

In Vercel **Settings → Environment Variables**, add for Production, Preview, and Development:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

Redeploy after adding env vars (Vite bakes them in at build time).

### 4. Verify

- Add an item — it should appear **immediately** (no refresh)
- Partner's changes appear within ~3 seconds (polling)

## Usage

1. **Create a list** — enter your name, get a share code
2. **Share the code** — your partner taps "Join with Code" and enters it
3. **Add items** — pick a category, type, tap +
4. **Check off** — tap the circle as you shop; changes sync instantly

### Add to Home Screen (iOS)

Safari → Share → **Add to Home Screen**

## Tech

- Vite + React + TypeScript
- Tailwind CSS
- Supabase (Postgres + Realtime)
- vite-plugin-pwa
