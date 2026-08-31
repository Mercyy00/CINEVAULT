# Connecting a Custom Domain to CineVault

This guide provides instructions for linking your custom domain (e.g. `yourcinevault.com` or `watch.yourdomain.com`) to your CineVault deployment.

---

## 1. Configure Environment Variables
In your `.env` (or hosting dashboard environment settings), set your production site URL:

```env
VITE_SITE_URL=https://yourcinevault.com
```

This ensures that:
- Canonical `<link rel="canonical">` tags point to your custom domain.
- OpenGraph `og:url` and `og:image` tags use your domain.
- Schema.org JSON-LD structured data and sitemaps match your domain.

---

## 2. Platform-Specific Domain Setup

### Option A: Netlify (Recommended for static SPAs)
1. Go to **Netlify Dashboard** > **Site Configuration** > **Domain management**.
2. Click **Add a domain** and enter `yourcinevault.com`.
3. In your DNS provider (Cloudflare, Namecheap, GoDaddy, Google Domains, Route53), add:
   - **Apex Domain (`@`)**:
     - Type: `A`
     - Name: `@`
     - Value: `75.2.60.5`
   - **Subdomain (`www` or `watch`)**:
     - Type: `CNAME`
     - Name: `www`
     - Value: `your-site-name.netlify.app`
4. Netlify will automatically generate and renew a free Let's Encrypt SSL/TLS certificate.

### Option B: Firebase Hosting
1. Go to **Firebase Console** > **Hosting** > **Custom Domains**.
2. Click **Add custom domain** and enter `yourcinevault.com`.
3. Firebase will provide two `A` records (or `TXT` verification records).
4. Add the provided `A` records to your DNS provider.
5. Verification and automatic SSL certificate provisioning takes between 10 minutes to a few hours.

### Option C: Vercel
1. Go to **Project Settings** > **Domains**.
2. Add `yourcinevault.com`.
3. Add the DNS records shown by Vercel:
   - `A` record pointing to `76.76.21.21`
   - `CNAME` for `www` pointing to `cname.vercel-dns.com`

---

## 3. Post-Domain Connection Verification Checklist
After connecting your custom domain:
- [ ] Test that `https://yourcinevault.com/` loads securely over HTTPS.
- [ ] Confirm `https://yourcinevault.com/robots.txt` is accessible.
- [ ] Confirm `https://yourcinevault.com/sitemap.xml` is accessible.
- [ ] Confirm `https://yourcinevault.com/llms.txt` is accessible.
- [ ] Test OpenGraph previews via [opengraph.xyz](https://www.opengraph.xyz/) or Twitter Card validator.
