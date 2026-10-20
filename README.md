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

Add your Supabase URL and anon key to `.env.local`, then run the migrations in [`supabase/migrations/`](supabase/migrations/) via the Supabase SQL Editor (in order: `001_initial_schema.sql`, then `002_ai_usage.sql`).

```bash
npm run dev
```

Open `http://localhost:5173` — or your local IP on your phone if you're on the same Wi‑Fi.

### Smart parse (optional AI)

The app can parse pasted recipes and messy shopping lists using Claude Haiku 4.5 via a Supabase Edge Function. Tier 0 features (category learning, bulk paste, quantity stripping) work without AI.

**Setup:**

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project: `supabase link`
2. Set your Anthropic API key as a Supabase secret (never in `.env.local`):
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Deploy the edge function:
   ```bash
   supabase functions deploy parse-items
   ```

Smart parse is rate-limited to 30 calls per list per day. Without the edge function deployed, paste and local parsing still work — only the **Smart parse** button will fail gracefully.

### Deploy to Vercel

1. Push the repo to GitHub (or fork this one)
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add two environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (the publishable/anon key — safe to expose in the browser)
4. Deploy. Every push to `main` redeploys **production** automatically.

Build settings Vercel should auto-detect: **Vite**, `npm run build`, output `dist`.

### Beta branch (try UI before your partner gets it)

Use a long-lived **`beta`** branch so you can dogfood new UI on a Preview URL while production (`main`) stays stable for your partner.

| | Production | Beta |
|---|---|---|
| Git branch | `main` | `beta` |
| Vercel | Production deployment | Preview deployment |
| Who uses it | Partner’s Home Screen icon | Your second Home Screen icon |
| Data | Same Supabase project / list code | Same (frontend-only split) |

**First-time setup**

1. Create and push the branch (already done in this repo if `origin/beta` exists):
   ```bash
   git checkout main
   git pull
   git checkout -b beta
   git push -u origin beta
   ```
2. In the [Vercel dashboard](https://vercel.com/dashboard) → your project → **Deployments**, open the latest deployment for branch `beta`. Copy the Preview URL (often looks like `…-git-beta-….vercel.app`).
3. Optional but nice: Project → **Settings** → **Domains** → assign a stable hostname (e.g. `beta.yourdomain.com`) to the **`beta`** branch so the URL never changes.
4. On your iPhone only: open the Preview URL in Safari → Share → **Add to Home Screen** → name it something like “Groceries β”. Leave your partner’s production icon alone.

**Day-to-day**

```bash
# Start from latest production
git checkout main && git pull
git checkout beta
git merge main          # keep beta up to date with production
# …hack, commit…
git push origin beta    # Vercel rebuilds the Preview; production unchanged
```

When the beta feels good:

```bash
git checkout main
git merge beta
git push origin main    # production redeploys; partner gets the update
```

**Notes**

- Same list code on beta and production means you both still shop the same list; only the **app shell** differs.
- After a beta deploy, use Settings → **Check for updates** (or a hard refresh) if the PWA is stubborn about caching.
- Pushing `beta` does **not** deploy Supabase Edge Functions. If you change `parse-items`, run `supabase functions deploy parse-items` separately — that hits the shared backend for everyone.
- Prefer throwaway risky DB experiments on a spare list code (or a second Supabase project) before merging to `main`.

---

## Under the hood

React · TypeScript · Tailwind · Supabase · PWA

List access is code-based — no user accounts. Row Level Security in Postgres makes sure you can only see and edit the list matching your code.

---

Built with love (and mild frustration at the dairy aisle). 🛒
