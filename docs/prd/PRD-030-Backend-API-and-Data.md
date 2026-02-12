# PRD-030: Backend API and Data Responsibilities

- **Product**: Wrapped and Turned
- **Doc type**: PRD (technical / contract)
- **Status**: Draft
- **Last updated**: 2026-01-28

## Summary

The backend exists to:

- Handle **Ravelry OAuth2** securely (keep client secret off the browser)
- Store tokens **server-side** (session) and refresh access tokens as needed
- Provide a **stable, app-owned API** for the frontend so Ravelry shape changes don’t break the UI
- Compute and return Wrapped statistics and project card data

For deployment and operations expectations (CI/CD, hosting, secrets, monitoring), see:

- `PRD-040-Deployment-CICD-and-Observability.md`

## Architecture (v1)

- **Frontend**: Angular + Tailwind
- **Backend**: Node.js + Express
- **Auth**: Ravelry OAuth 2.0
- **Session storage**: in-memory session (sufficient for local/dev and small-scale usage)

## API endpoints (v1)

### `GET /health`

Returns whether the backend is alive and whether Ravelry integration is enabled.

**Response**

```json
{ "ok": true, "ravelryEnabled": true }
```

### `GET /auth/ravelry/start`

Starts OAuth login. Redirects to Ravelry.

### `GET /auth/ravelry/callback`

OAuth callback. Exchanges code for tokens and stores them in session. Redirects to frontend.

### `POST /auth/logout`

Clears session.

### `GET /api/me`

Returns basic identity info for UI (“logged in as”).

**Response**

```json
{ "username": "someUser" }
```

### `GET /api/stat-preferences`

Returns the logged-in user’s stat visibility preferences (which Ravelry stats to show in Wrapped). Requires auth.

**Response**

JSON object with keys: `projects`, `finishedProjects`, `totalYardage`, `totalMeterage`, `craftBreakdown`, `mostProductiveMonth`, `avgDurationDays`, `projectsGallery`. Values are booleans. Defaults to all `true` if not yet set.

### `PUT /api/stat-preferences`

Updates the logged-in user’s stat preferences. Body: same shape as GET response. Requires auth. Returns the merged preferences.

### `GET /api/wrapped?from=YYYY-MM-DD&to=YYYY-MM-DD`

Returns Wrapped stats and a list of projects in range, enriched with optional details.

**Response shape (owned by app)**

```json
{
  "range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "totals": {
    "projects": 0,
    "finishedProjects": 0,
    "totalYardage": 0,
    "totalMeterage": 0
  },
  "breakdowns": { "craft": { "Knitting": 0 } },
  "highlights": { "mostProductiveMonth": "YYYY-MM", "avgDurationDays": 0 },
  "projects": [
    {
      "id": 123,
      "name": "Project name",
      "completed": "YYYY-MM-DD",
      "started": "YYYY-MM-DD",
      "craft": "Knitting",
      "yardage": 420,
      "meterage": 384,
      "patternName": "Pattern",
      "designerName": "Designer",
      "imageUrl": "https://...",
      "url": "https://www.ravelry.com/projects/..."
    }
  ]
}
```

**Error cases**

- `400` if missing/invalid `from` or `to`
- `401` if not authenticated (when Ravelry is enabled)

### `GET /api/project-card/:id`

Returns a minimal set of data needed to render the Assistant board for one project.

**Response shape**

```json
{
  "id": 123,
  "imageUrl": "https://...",
  "projectName": "Project name",
  "patternName": "Pattern",
  "designerName": "Designer",
  "sizeMade": "M",
  "yarnUsed": "Brand A Yarn, Brand B Yarn",
  "projectUrl": "https://www.ravelry.com/projects/username/project-slug"
}
```

- `projectUrl` (optional): Ravelry project page URL, used for the board card footer QR code. Omitted if the Ravelry project detail does not include a permalink.

## Data sourcing notes

- `/api/wrapped` typically requires:
  - A list call to Ravelry projects (user’s list)
  - Per-project detail calls (to enrich with photo + yardage/meterage + designer)
- Per-project calls must be concurrency-limited and best-effort (missing fields are common).

## Security requirements

- Store Ravelry `client_secret` only on backend.
- Use OAuth `state` parameter to prevent CSRF.
- Do not expose access tokens to frontend.
- Use HTTP-only session cookies (and configure `secure` appropriately for production).

## Deployment / hosting implications (v1)

- **Stateful sessions**: the current design uses `express-session` with an in-memory store. In production on free-tier hosts that may restart/sleep services, users may need to log in again after a restart.
- **HTTPS + proxies**: in production the session cookie should be marked `secure`. If behind a reverse proxy, Express must be configured to trust the proxy so secure cookies behave correctly.

## Scalability notes (later)

When usage grows, consider:

- Replacing memory sessions with Redis (or similar)
- Adding caching for project detail calls (in-memory/SQLite)
- Handling Ravelry pagination beyond 100 items per list page

