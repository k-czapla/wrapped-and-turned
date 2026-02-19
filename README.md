## Wrapped and Turned

A small Angular + Tailwind app (UI) + Node/Express backend that connects to **Ravelry** to generate:

- **Wrapped**: stats + charts for a chosen time range
- **Podcaster’s Assistant**: a vertical, shareable project board you can download as a PNG

### Product docs (PRDs)

PRDs live in `docs/prd/`:

- `docs/prd/README.md`

### Tech

- **Frontend**: Angular (latest stable) + Tailwind CSS + Chart.js (`ng2-charts`)
- **Backend**: Node.js + Express + Ravelry **OAuth 2.0** (keeps secrets off the browser)
- **Export**: `html-to-image` (free) to download the assistant board

### Prerequisites

- Node **>= 20.19.0**
- A Ravelry developer application (client id/secret)

Create a Ravelry app here: `https://www.ravelry.com/pro/developer`

### Configure

1. Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

2. Fill in:

- `RAVELRY_CLIENT_ID`
- `RAVELRY_CLIENT_SECRET`
- (Optional) `GROQ_API_KEY` for AI-generated show notes in Podcaster's Assistant ([Groq console](https://console.groq.com))

### Run locally

From the repo root:

```bash
npm run dev
```

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`

### What you can do

- **Log in with Ravelry** (via backend OAuth)
- **Wrapped**: pick a date range → generate stats + charts
  - Current stats: total projects, finished projects, total yardage/meterage, craft breakdown, average duration, most productive month
  - Easy additions: top designers, yarn weights, yarn brands, biggest project
- **Podcaster’s Assistant**: load projects → pick one or more → download a vertical board as PNG; **Generate Description** for a YouTube/show-notes title, description, Ravelry links, and hashtags (optional Groq API key for AI; fallback if unset); **Generate thumbnail** for a fun YouTube thumbnail from selected projects, mood, and up to 3 photos (free **Pollinations AI**, no API key)

### Notes / next upgrades

- Add caching (e.g. in-memory or SQLite) to reduce repeated project detail calls.
- Expand statistics: yarn weight distribution, fiber content breakdown, top patterns/designers, category taxonomy.
