# PRD-040: Deployment, CI/CD, Hosting, and Observability

- **Product**: Wrapped and Turned
- **Doc type**: PRD (technical / operations)
- **Status**: Draft
- **Last updated**: 2026-01-28

## Summary

This document defines a **simple, free-tier-first** deployment setup for:

- **Frontend (Angular)** hosting
- **Backend (Node/Express)** hosting
- **CI checks** on pull requests
- **Secrets management** for Ravelry OAuth keys
- **Monitoring / alerting** sufficient for low traffic

It is optimized for v1 constraints: low usage, minimal ops, and low/no spend.

## Recommendation (v1)

### CI/CD

- **Source control**: GitHub
- **CI**: GitHub Actions (PR checks + main branch checks)

### Hosting

- **Hosting provider**: Render
  - **Frontend**: Render **Static Site**
  - **Backend**: Render **Web Service** (Node)

### Monitoring

- **Uptime**: UptimeRobot (free) monitoring `GET /health`
- **Error tracking**: Sentry (free) for frontend + backend (optional but recommended)
- **Logs**: Render logs (baseline)

## Why this is the best fit

- **Works with the current implementation**: backend is a long-running Express server with `express-session` (in-memory store).
- **Secrets stay server-side**: Ravelry `client_secret` is never shipped to the browser.
- **Free-tier friendly**: static frontend + low-traffic Node service.
- **Low ops**: provider-managed SSL, simple deploy model, one dashboard for services.

## Known trade-offs (explicit)

- **Free instance sleeping**: Render free web services can spin down when idle. That means:
  - First request after idle can be slow (cold start).
  - **In-memory sessions can be lost** after a restart → users may need to log in again.
- **No horizontal scaling**: v1 assumes single-instance backend; scaling requires persistent session storage.

This is acceptable for v1. If it becomes a problem, the first upgrade is to move sessions to a persistent store (see “Future upgrades”).

## Environments

### Local development

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Proxy: Angular dev server proxies `/api`, `/auth`, `/health` to backend.

### Production (v1)

- Frontend: HTTPS static site (Render)
- Backend: HTTPS web service (Render)
- Frontend calls backend via same-origin paths if configured behind a shared domain, or via the backend public URL + CORS.

## Secrets and configuration

### Where secrets live (required)

- **Render environment variables** (production)
- **Local**: `backend/.env` (not committed)

Do not store secrets in frontend env or build-time substitutions.

### Backend environment variables (production)

- **Required**
  - `SESSION_SECRET`: long random string (minimum 32 chars recommended)
  - `FRONTEND_URL`: the deployed frontend origin (e.g., `https://<site>.onrender.com`)
  - `PUBLIC_BACKEND_URL`: the public backend origin (e.g., `https://<service>.onrender.com`)
- **Ravelry**
  - `RAVELRY_CLIENT_ID`
  - `RAVELRY_CLIENT_SECRET`
  - `RAVELRY_SCOPES` (default: `offline`)
- **Optional**
  - `MOCK_RAVELRY=false` in production
  - `GROQ_API_KEY`: for Podcaster’s Assistant “Generate Description” (AI). If unset, a non-AI fallback description is returned.

### Frontend configuration (production)

Prefer calling backend via relative paths (`/api/...`) when frontend and backend share a domain. If hosted on different domains, ensure the backend CORS config uses the exact `FRONTEND_URL` and requests include credentials.

For this repo’s Render setup (separate Static Site + Web Service), the frontend supports an injected backend origin:

- Set a **frontend build-time env var** `WT_BACKEND_URL` (or `BACKEND_URL` / `PUBLIC_BACKEND_URL`) to your backend public origin (e.g., `https://<service>.onrender.com`).
- The frontend build runs `frontend/scripts/inject-backend-url.mjs`, which replaces a placeholder in `dist/index.html` (`<meta name="wt-backend-url" ...>`).
- At runtime, the app uses that value for:
  - OAuth start: `GET <backend>/auth/ravelry/start`
  - API calls: `GET <backend>/api/...` (with credentials enabled)

## Deployment pipeline (Render)

### Frontend (Render Static Site)

- **Root directory**: `frontend`
- **Build command**:
  - `npm ci && npm run build`
- **Publish directory**:
  - `dist`

Single-page app routing requires a rewrite rule:

- Add a **Rewrite** in Render: `/*` → `/index.html`

Note: Angular’s `@angular/build:application` builder can sometimes emit browser files under a `browser/` subfolder. This repo configures `outputPath.browser=""` so `index.html` is at `dist/index.html` (and `dist` is the correct publish directory).

### Backend (Render Web Service)

- **Root directory**: `backend`
- **Build command**:
  - `npm ci --include=dev && npm run build`
- **Start command**:
  - `npm start`
- **Port**:
  - Render supplies `PORT` automatically; backend reads `PORT` from env.

Note: some hosts (including Render) may perform installs in “production mode” during builds, which can omit `devDependencies`. Since TypeScript builds need `typescript` + `@types/*`, use `npm ci --include=dev` in the build command.

**Tests**: Run tests in CI (GitHub Actions), not on Render. Render does not support multiple build “jobs”; it has a single build command per service. Keeping tests in CI and using only `npm ci --include=dev && npm run build` on Render keeps deploys fast and avoids needing test deps (e.g. vitest, supertest) in the Render build.

### Deploy triggers

- **Simplest**: connect the GitHub repo in Render and enable **Auto Deploy** on main.
- **Optional**: use a Render Deploy Hook triggered from GitHub Actions after CI passes.

## CI checks (GitHub Actions)

Minimum CI goals:

- **Backend**: typecheck/build
- **Frontend**: build (and optionally tests when added)

Implemented workflows (in repo):

- `.github/workflows/ci.yml`
  - Runs on PRs and `main` pushes
  - **Test** job: runs backend and frontend tests
  - **Build** job: runs after tests pass; builds backend + frontend
- `.github/workflows/deploy-render.yml`
  - Runs on `main` pushes
  - Builds backend + frontend
  - Optionally triggers Render Deploy Hooks (only if GitHub repo secrets are set)

Recommended checks:

- `npm ci`
- `npm run build` (repo root)

**Note**: Angular CLI in this repo requires Node \(>= 20.19\). CI must use Node `20.19.x` (or newer compatible).

### Optional GitHub repo secrets (only needed if using deploy hooks)

- `RENDER_BACKEND_DEPLOY_HOOK`: Render deploy hook URL for backend web service
- `RENDER_FRONTEND_DEPLOY_HOOK`: Render deploy hook URL for frontend static site

If you use Render “Auto Deploy on main” instead, you do **not** need these secrets and the deploy-hook steps will be skipped.

## Security and cookies (production notes)

The backend uses `express-session` cookies.

- **HTTPS**: production must run behind HTTPS.
- **Cookie security**:
  - In production, cookies should be `secure: true`.
  - When running behind a reverse proxy (typical on managed hosts), Express should trust the proxy so secure cookies work correctly.

These may require small production-only configuration adjustments if/when we harden v1.

## Monitoring and alerting

### Uptime

- Monitor `GET /health` every 5 minutes (UptimeRobot free plan is sufficient).
- Alert to email on downtime.

### Error tracking (recommended)

- Add Sentry (free tier):
  - Frontend: capture runtime errors + route context
  - Backend: capture unhandled errors + request context (avoid logging tokens)

### Logs

- Use Render logs as the first stop for debugging.
- Never log access tokens or refresh tokens.

## Future upgrades (when traffic grows)

- **Sessions**: replace in-memory sessions with Redis (e.g., Upstash free tier) so logins survive restarts and scaling.
- **Caching**: cache Ravelry project details to reduce API calls (in-memory → Redis → DB).
- **Rate limiting**: add basic rate limiting per IP/session to protect the backend and Ravelry API.

