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

6. Run the SQL in `supabase/migrations/` on your Supabase project (SQL Editor) if you have not already — **in order** (oldest first).

   If you already applied the first migration and see **`42P17` infinite recursion on `family_members`**, run only the patch file `20260403200000_fix_rls_recursion_family_members.sql` (adds `fl_user_family_ids`, `fl_coworker_user_ids`, `lookup_family_by_code`, and replaces affected RLS policies).

   **Existing database:** run only the files you haven't applied yet. The first migration starts with `DROP TABLE` and wipes all data if run again. To get the 2026-10 security fixes, run `20261014000000_harden_membership_and_transactions.sql` (joining by code moves into the database, members can no longer move themselves into another family, and transactions can only reference your own family's members). The app still works on databases without it.

`vercel.json` rewrites all routes to `index.html` so client-side routes (`/auth`, `/setup`, `/dashboard`, …) work after refresh.

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
npm run dev
```

```bash
npm run build
npm run preview
```

## Environment variables

| Name | Where to get it |
|------|-----------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |

If either is missing the app shows a setup message instead of a blank page.

## What changed (2026-10 fixes)

- **Settle up:** suggested settlements went the wrong way, so each "Settle" doubled the imbalance. They now go from the member holding money to the one out of pocket, and balances reach exactly zero (amounts are summed in paise).
- **Refresh / sign-in:** reloading any page or signing in no longer sends you to `/setup` before your family has loaded, and the setup page sends you to your dashboard if you already have a family (creating a second family used to lock the account out).
- **Dates:** "today" uses your local date, not UTC (expenses logged after midnight in India got yesterday's date), and expense dates no longer show a day early west of UTC.
- **Family codes:** new codes look like `FAM-7KQ2-M9XD` instead of `FAM-1234`; 4-digit codes could be guessed to join someone else's family.
- **Crashes and errors:** fixed a hooks-order crash on the member page, render-time redirects, unchecked errors when leaving a family or settling, amount validation (max 2 decimals), and the empty favicon.
- **Secrets:** `.env.example` now holds placeholders instead of a real project URL and key.
