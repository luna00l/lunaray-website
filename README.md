# LunaRay Studio 🎬✨

Official website for **LunaRay Studio** — premier video editing portfolio and service website for YouTube creators, anime/AMV editors, gaming reels, and commercial brands.

---

## 🌟 Highlights & Features

- **Dynamic Interactive Landing Page (`index.html`)**: Cinematic video frame canvas animation, service showcase, portfolio showcase, pricing packages (`Basic: $5`, `Standard: $10`, `Premium: $20`), custom editing section, and direct email enquiry actions.
- **Email-Based Client Enquiry System**: Lightweight, zero-backend `mailto:` contact flow directed to `lunaray.studi0000@gmail.com` with prefilled subject lines for **Contact**, **Custom Edits**, **Book Your Edit**, and **Support**.
- **Contact & Support Page (`contact.html`)**: Dedicated email contact and support options with topic-specific prefilled email buttons.
- **Legal & Compliance Pages**:
  - `terms.html`: Terms & Conditions
  - `privacy.html`: Privacy Policy
  - `refund-policy.html`: Revision & Refund Policies

---

## 🚀 Deploying on Vercel

This repository is optimized for zero-config static deployment on [Vercel](https://vercel.com):

1. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select **Import Git Repository**.
   - Choose `luna00l/lunaray-website`.
2. **Build & Output Settings**:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: *(leave blank — pure static deployment)*
   - Output Directory: `./` *(or leave default)*
3. **Configuration**:
   - The included `vercel.json` automatically configures clean URLs (`/contact`, `/terms`, `/privacy`, `/refund-policy`), asset caching headers, and route rewrites.

---

## 💻 Local Testing

To run the local development server:
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1 3000
```
Then visit `http://localhost:3000` in your web browser.
