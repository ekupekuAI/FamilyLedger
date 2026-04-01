# FamilyLedger

Family expense tracking with **Supabase** (auth, Postgres, RLS, realtime) and **React + Vite**.

## Deploy on Vercel

1. **Import** this repo in Vercel (Framework Preset: **Vite**).

2. **Root directory** if the app lives in a subfolder: set it to the folder that contains `package.json` (e.g. `FamilyLedger-main`).

3. **Environment variables** (Project → Settings → Environment Variables), for **Production**, **Preview**, and **Development**:

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Project **anon** `public` key (Settings → API) |

4. **Redeploy** after adding variables (Deployments → … → Redeploy).

5. **Supabase** (Authentication → URL configuration):

   - **Site URL** = your Vercel URL (e.g. `https://your-app.vercel.app`).
   - **Redirect URLs** = same URL plus `http://localhost:5173` for local dev.

6. Run the SQL in `supabase/migrations/` on your Supabase project (SQL Editor) if you have not already.

`vercel.json` rewrites all routes to `index.html` so client-side routes (`/auth`, `/setup`, `/dashboard`, …) work after refresh.

## Local development

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm run dev
```

```bash
npm run build
npm run preview
```
