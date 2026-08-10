# Mike's Window Cleaners

Marketing site for Mike Galioto's window washing business — built with Vite, React, TypeScript, and Tailwind CSS.

Inspired by the section flow of the NexGentics site (hero → pain points → services → about → quote CTA), redesigned for a local window cleaning brand.

## Run locally

```sh
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Build

```sh
npm run build
npm run preview
```

## Customize

- Service area / copy in the section components under `src/components/`

## Follow (`/Follow`)

Public journey hub: city-level map, destinations, updates, community wall, support links, and name-on-car claims. Admin at `/Follow/admin`.

### Setup

1. Create a [Supabase](https://supabase.com) project
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor
3. Auth → URL configuration: add redirect URL `https://your-domain/Follow/auth/callback` (and local `http://localhost:5173/Follow/auth/callback`)
4. Auth → Email: enable magic link / OTP
5. Copy env vars from [`.env.example`](.env.example) into `.env.local` and Vercel
6. Sign up once with your email, then promote yourself:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

7. In `/Follow/admin` → Support, paste Buy Me a Coffee, Cash App, Amazon wishlist, and mailbox copy

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for follower emails |
| `SITE_URL` | Used in notification email links |
| `RESEND_API_KEY` / `EMAIL_FROM` | Same as quote form (follower emails) |

## Quote form (Resend)

Quote requests POST to `/api/quote` and are emailed via [Resend](https://resend.com).

1. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
2. Verify your sending domain at [resend.com/domains](https://resend.com/domains)
3. Copy `.env.example` → `.env.local` (local) and set the same vars in [Vercel env settings](https://vercel.com/michael-dominic-galiotos-projects/mikes-window-cleaners/settings/environment-variables):

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Inbox that receives quote requests |
| `EMAIL_FROM` | Verified sender, e.g. `Mike's Window Cleaners <quotes@mikeswindowcleaners.com>` |

Local API testing needs Vercel’s runtime (plain `npm run dev` only serves the Vite app):

```sh
npx vercel env pull .env.local
npx vercel dev
```

## Deploy (Vercel)

**Live site:** https://mikes-window-cleaners.vercel.app

This project is linked to Vercel (`mikes-window-cleaners`). Redeploy from the project folder:

```sh
npx vercel deploy --prod
```

### Connect GitHub (auto-deploy on push)

1. Log in to GitHub CLI once: `gh auth login`
2. Create the repo and push:

```sh
gh repo create mikes-window-cleaners --public --source=. --remote=origin --push
npx vercel git connect
```

Or connect the repo in the [Vercel project settings](https://vercel.com/michael-dominic-galiotos-projects/mikes-window-cleaners/settings/git).

Build settings (auto-detected): **Vite**, `npm run build`, output `dist`. SPA routing is handled by [`vercel.json`](vercel.json).

## Custom domain

Recommended domain: **mikeswindowcleaners.com** (available on Vercel, ~$11.25/yr).

Both `mikeswindowcleaners.com` and `www.mikeswindowcleaners.com` are already attached to the Vercel project. Finish setup with one of these:

**Option A — Buy on Vercel (easiest)**

1. Open [Vercel Domains](https://vercel.com/dashboard/domains)
2. Purchase `mikeswindowcleaners.com` — DNS is configured automatically

**Option B — Buy elsewhere (IONOS, Namecheap, Cloudflare, etc.)**

At your registrar’s DNS panel, add:

| Type  | Name | Value                         |
|-------|------|-------------------------------|
| A     | `@`  | `76.76.21.21`                 |
| CNAME | `www`| `cname.vercel-dns.com`        |

Then verify:

```sh
npx vercel domains verify mikeswindowcleaners.com
npx vercel domains verify www.mikeswindowcleaners.com
```

HTTPS is issued automatically once DNS propagates (usually minutes, up to 48 hours).
