# LunaRay Studio 🎬✨

Official website for **LunaRay Studio** — premier video editing service for YouTube creators, anime/AMV editors, gaming reels, and commercial brands.

---

## 🌟 Highlights & Features

- **Dynamic Interactive Landing Page (`index.html`)**: Cinematic video frame canvas animation, live editing calculator, customer testimonials, and direct booking inquiry form.
- **Client Project Booking Form**: Full validation, multi-platform selection, budget range tiers, and dual upload options (direct chunked MP4 upload up to 500 MB into private Supabase Storage + Google Drive integration).
- **Contact & Support Portal (`contact.html`)**: Dedicated support ticketing interface with topic categorization and direct client communication.
- **Restricted Administrator Dashboard (`admin.html`)**:
  - Protected by Supabase Auth and server-side Row Level Security (RLS) + Edge Function token verification against `public.admin_users`.
  - Discrete access link integrated seamlessly into footer branding.
  - Live clock and grouped submissions in Asia/Kolkata (IST) timezone.
  - Top View Mode switcher: **All Submissions**, **Client Project Bookings**, and **Contact & Support Messages**.
  - **View Full Details** modals for comprehensive record inspection with exact labels.
  - Secure in-dashboard inline video clip playback and cryptographically signed MP4 downloads.
  - Direct email reply shortcuts.
- **Legal & Compliance Pages**:
  - `terms.html`: Terms & Conditions
  - `privacy.html`: Privacy Policy
  - `refund-policy.html`: Revision & Refund Policies

---

## 🚀 Deploying on Vercel

This repository is optimized for zero-config, flexible deployment on [Vercel](https://vercel.com):

1. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select **Import Git Repository**.
   - Choose `luna00l/lunaray-website`.
2. **Build & Output Settings**:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: *(leave blank — pure static deployment)*
   - Output Directory: `./` *(or leave default)*
3. **Configuration**:
   - The included [`vercel.json`](file:///c:/LunaRay/vercel.json) automatically configures clean URLs (e.g. `/admin`, `/contact`, `/terms`), asset caching headers, and route rewrites.
4. **Supabase Auth Redirect Configuration**:
   - Once your Vercel deployment URL is generated (e.g. `https://lunaray-website.vercel.app`), go to your **Supabase Dashboard**:
     - Navigate to **Authentication** &rarr; **URL Configuration**.
     - Add `https://<your-project>.vercel.app/**` and `https://<your-project>.vercel.app/admin.html` to **Redirect URLs**.
     - Set **Site URL** to your production URL.

---

## 💻 Local Testing

To run the local development server:
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1 3000
```
Then visit `http://localhost:3000` in your web browser.

---

## 🔒 Security & Backend Architecture

- **Supabase Backend**: Hosted on Supabase with PostgreSQL Row Level Security (RLS).
- **Storage**: Private `project-assets` bucket with strict administrator signed download access.
- **Edge Functions**: `upload-inquiry-asset` handles signed chunked direct uploads and secure administrative asset access tokens.
