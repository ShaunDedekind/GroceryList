# Grocery List

A tiny shared grocery list app for two people who got tired of fighting over Apple Notes.

Create a list, share a short code, and you're shopping together — no accounts, no App Store, no fuss.

---

## Hello, stranger

If you found this on GitHub: welcome! This is a personal project I built for me and my wife. We wanted something as simple as a shared note, but a little nicer — items grouped by aisle, check things off as you shop, and see each other's changes within a few seconds.

It's a mobile-first web app you can add to your Home Screen like a real app. No login — just a list code you share with the one other person who needs it.

Feel free to poke around, fork it, or build your own version. It's not a product; it's a nice little tool that works.

---

## How it works

1. **Create a list** — enter your name, get a 6-character code
2. **Share the code** — your partner opens the app and taps "Join with Code"
3. **Add items** — pick a category (Fruit & Veg, Meat, Dairy…), type, tap +
4. **Shop** — check things off as you go; changes sync automatically

On iPhone: open in Safari → Share → **Add to Home Screen** for the full app experience.

---

## For developers

Want to run this yourself? Here's the short version.

**You'll need:** Node.js, a free [Supabase](https://supabase.com) project, and optionally a [Vercel](https://vercel.com) account to host it.

### Run locally

```bash
git clone https://github.com/ShaunDedekind/GroceryList.git
cd GroceryList
npm install
cp .env.example .env.local
```

Add your Supabase URL and anon key to `.env.local`, then run the migration in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) via the Supabase SQL Editor.

```bash
npm run dev
```

Open `http://localhost:5173` — or your local IP on your phone if you're on the same Wi‑Fi.

### Deploy to Vercel

1. Push the repo to GitHub (or fork this one)
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add two environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (the publishable/anon key — safe to expose in the browser)
4. Deploy. Every push to `main` redeploys automatically.

Build settings Vercel should auto-detect: **Vite**, `npm run build`, output `dist`.

---

## Under the hood

React · TypeScript · Tailwind · Supabase · PWA

List access is code-based — no user accounts. Row Level Security in Postgres makes sure you can only see and edit the list matching your code.

---

Built with love (and mild frustration at the dairy aisle). 🛒
