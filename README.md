<div align="center">

# 🎬 CineVault

**A fast, ad-free discovery hub for films, TV, and anime — with a personalized watchlist that follows you across devices.**

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Report Bug](https://github.com/Mercyy00/CINEVAULT/issues) · [Request Feature](https://github.com/Mercyy00/CINEVAULT/issues)

</div>

---

## 📖 Overview

**CineVault** is a client-only single-page application for discovering movies, TV series, and anime. It pulls catalog metadata live from **TMDB** and **AniList**, lets visitors build a watchlist and track watch progress, and syncs that library across devices for signed-in users via **Firebase Auth + Firestore**.

There is no custom application server. The app talks directly to the public metadata APIs from the browser, and all user state is persisted to `localStorage` first (so guests get a full experience offline) and mirrored to Firestore when signed in. An optional serverless proxy can be pointed at TMDB to keep the API key off the client.

---

## ✨ Key Features

- 🎯 **Personalized rows** — "Because you watched…" and "Because you like…" rows derived from a genre-affinity model built from your onboarding answers and watchlist. Match scores are shown only when there's enough signal to be meaningful (no fabricated "% match").
- 🎲 **Surprise Me & Find by Mood** — quick discovery entry points for when you don't know what to watch.
- 📺 **Custom playback experience** — resume-where-you-left-off, next-episode shortcuts, keyboard controls, picture-in-picture / floating player, and orientation handling on mobile.
- 👥 **Multiple profiles** — including a Kids Mode that filters the catalog to family-friendly content, each with its own watchlist, theme, and font.
- ☁️ **Cross-device sync** — debounced, consent-gated Firestore writes with local-first fallback. Signed-out visitors run entirely from `localStorage`.
- 🎨 **15 themes + display fonts**, PWA install, offline-aware network banner, and a cinematic intro.
- ♿ **Accessibility & resilience** — per-route error boundaries, skip links, keyboard-navigable cards, scroll restoration, and reduced-motion support.
- 🛡️ **Admin dashboard** — gated by a server-minted Firebase `admin` custom claim (never an email allowlist), for viewing user/session metrics.

---

## 🛠️ Tech Stack

- **Framework**: React 19, TypeScript, Vite 6
- **Styling & motion**: Tailwind CSS v4, Motion (Framer Motion v12), Lucide React
- **State**: React Context (`store.tsx`), `use-debounce`
- **Auth & sync**: Firebase Auth (email/password, Google, anonymous guests) + Cloud Firestore
- **Data sources**: TMDB (films & TV), AniList (anime), optional OMDb (IMDb / Rotten Tomatoes / Metacritic ratings)
- **UX libraries**: `@hello-pangea/dnd` (watchlist reorder), `react-focus-lock`
- **Testing**: Vitest, Testing Library, jsdom

> **Note on streaming:** video is embedded from third-party providers via iframe; CineVault hosts no media and stores no stream URLs of its own.

---

## 🚀 Getting Started

### Prerequisites
- Node.js **20.19+**
- npm

### Installation

1. **Clone and install:**
   ```bash
   git clone https://github.com/Mercyy00/CINEVAULT.git
   cd CINEVAULT
   npm install
   ```

2. **Configure environment variables:** copy `.env.example` to `.env.local` and fill in your keys.
   ```env
   # TMDB — provide the key directly, OR point at a proxy that appends it server-side (recommended)
   VITE_TMDB_API_KEY=your_tmdb_api_key
   # VITE_TMDB_PROXY_URL=https://your-proxy.example.com/tmdb

   # Firebase (optional — omit entirely to run local-only with no cloud sync)
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...

   # Optional external ratings
   # VITE_OMDB_API_KEY=...
   ```
   Firebase config is read **only** from build-time env vars — there are no hardcoded fallbacks. If Firebase is not configured, the app runs entirely from `localStorage`.

3. **Run the dev server:**
   ```bash
   npm run dev
   ```

4. Open the URL Vite prints (default `http://localhost:5173`).

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check then produce a production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (zero-warning gate) |
| `npm run test` | Run the Vitest suite |
| `npm run ci` | typecheck + lint + tests |

---

## 🏗️ Project Structure

```plaintext
cinevault/
├── src/
│   ├── components/     # UI components, modals, players, pages
│   ├── services/       # Firebase, auth, cross-device sync, watch tracking, downloads
│   ├── hooks/          # Carousel, scroll restoration
│   ├── lib/            # Storage, navigation, playback, SEO, consent, utils
│   ├── config/         # Server list, anime genre maps
│   ├── api.ts          # TMDB + AniList access layer (cached, deduped, retried)
│   ├── store.tsx       # App-wide state, cloud sync, profiles, match scoring
│   ├── types.ts        # Shared type definitions
│   └── App.tsx         # Routing + layout shell
├── firestore.rules     # Deny-by-default security rules (per-uid scoping)
├── firebase.json
└── index.html
```

---

## 🔐 Security Notes

- **Firestore rules are deny-by-default.** Users may only read/write documents scoped to their own uid. Admin access comes from a server-minted `admin` custom claim, and privilege-escalation fields (`role`, `isAdmin`, `claims`) are explicitly rejected on client writes.
- **Guests are Firebase anonymous sessions** with real uids, so they're covered by owner-scoped rules rather than a world-readable wildcard.
- **No secrets are committed** — `.env*` is gitignored except `.env.example`.

---

## 📄 License

Licensed under the MIT License — see [LICENSE](LICENSE).
