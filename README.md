<div align="center">

# 🎬 CineVault

**A high-performance full-stack streaming platform and AI-powered entertainment hub.**

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-API-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[**Explore Live Demo »**](https://cinevault-stream.vercel.app) · [Report Bug](https://github.com/Mercyy00/CINEVAULT/issues) · [Request Feature](https://github.com/Mercyy00/CINEVAULT/issues)

</div>

---

## 📖 Overview

**CineVault** is a modern, responsive streaming web application engineered to deliver an ad-free, cinematic experience. It combines real-time TMDB catalog ingestion, multi-server video stream resolution (with automatic TMDB-to-IMDb fallback), an AI-driven **MoodFinder** recommendation engine powered by Google Gemini, and secure SQLite-backed authentication with cross-device watch progress tracking.

---

## ✨ Key Features

- 🎯 **AI-Powered "MoodFinder" Engine**: Real-time film recommendations curated via Google Gemini API based on user sentiment, vibe, and genre preferences.
- ⚡ **Multi-Server Streaming Failover**: Dynamic streaming pipeline with support for multi-language Hindi/English ad-free streaming servers (ScreenScape, ModiPlay, MbPly) and automatic IMDb identifier resolution.
- 📺 **Custom HTML5 Video Player**: Synchronized watch progress tracking, auto-resume functionality, custom subtitle styling, and keyboard shortcut navigation.
- 🔐 **Secure Full-Stack Authentication**: JWT session handling with bcrypt password hashing, SQLite (better-sqlite3) persistence, and Firebase Auth integration.
- 📱 **Fluid 60fps Responsive UI**: Crafted with React 19, Motion (Framer Motion), and Tailwind CSS v4 with adaptive layouts for Mobile, Tablet, and Desktop screens.
- 🛡️ **Role-Based Admin Dashboard**: Analytics overview, user session metrics, and live stream server health monitoring.

---

## 🛠️ Tech Stack

### **Frontend**
- **Core Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Motion (Framer Motion v12), Lucide React
- **State & Utilities**: Context API, `use-debounce`, `react-focus-lock`, `@hello-pangea/dnd`

### **Backend & APIs**
- **Server**: Node.js, Express.js, TSX
- **Database**: SQLite (`better-sqlite3`), Firebase Firestore
- **Authentication**: JSON Web Tokens (JWT), Bcrypt.js, Firebase Auth
- **External APIs**: TMDB API, Google Gemini GenAI API, IMDb ID Resolvers

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm, yarn, or bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mercyy00/CINEVAULT.git
   cd CINEVAULT
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3005
   JWT_SECRET=your_jwt_secret_key
   VITE_TMDB_API_KEY=your_tmdb_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the Development Servers:**
   ```bash
   # Start the Express backend server
   npm run server

   # Start the Vite frontend dev server
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3005`.

---

## 🏗️ Project Architecture

```plaintext
cinevault/
├── server/               # Express.js REST API & Database Layer
│   ├── api.ts            # Auth & data endpoints
│   ├── auth.ts           # JWT generation & password hashing
│   ├── db.ts             # SQLite schema and query setup
│   └── index.ts          # Server entry point
├── src/
│   ├── components/       # Reusable UI components & modals
│   ├── context/          # React context providers (Auth, Theme)
│   ├── services/         # Firebase & Watch tracking services
│   ├── api.ts            # TMDB & Backend API integration
│   ├── types.ts          # TypeScript type definitions
│   └── App.tsx           # Main application router and state
└── package.json
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
