# PRD-000: Wrapped and Turned — Product Overview

- **Product**: Wrapped and Turned
- **Doc type**: PRD (overview)
- **Status**: Draft
- **Last updated**: 2026-02-24

## Summary

**Wrapped and Turned** is a lightweight web app for fiber artists (knitters, crocheters, etc.) that connects to **Ravelry**. It helps creators:

- Generate a “Spotify Wrapped”-style view of their making over a selected date range (**Wrapped**)
- Create **share-ready vertical boards** for podcasts / Instagram Stories / social posts (**Podcaster’s Assistant**): either **Project Update** (projects by date range) or **Pattern Round Up** (patterns from a Ravelry bundle)
- Generate an **AI-assisted YouTube/show-notes description** (title, description, Ravelry links, hashtags) for selected projects or patterns

The app is intentionally simple: no paid services, minimal infrastructure, and no need to support high request volume at this stage.

## Problem statement

Fiber artists track projects in Ravelry, but:

- The data is not packaged into a fun, quick “year-in-review” style summary.
- Sharing a project’s key details (pattern, designer, yarn, photo) takes manual work.

## Goals

- **G1 — Fast insights**: let users pick a time range and instantly see meaningful stats.
- **G2 — Shareable output**: make it easy to export visuals (charts/boards) suitable for social/podcasts.
- **G3 — Respect privacy**: keep credentials off the browser; minimize data retention.
- **G4 — Keep it simple**: free charting + simple backend; avoid over-engineering.

## Non-goals (for v1)

- User accounts beyond “log in with Ravelry” (no app-specific signup).
- Long-term storage of project data or building a data warehouse.
- Heavy personalization, recommendations, or community features.
- Monetization, subscriptions, ads.

## Personas

- **P1 — Casual maker**: wants a quick “look what I made this season/year” summary.
- **P2 — Content creator / podcaster**: needs a polished, consistent board for sharing each featured project.
- **P3 — Power user**: has many projects and wants deeper breakdowns; may push performance/rate limits.

## Primary user journeys

### Journey A — Create “Wrapped”

1. User opens app → clicks **Log in with Ravelry**
2. User selects **From / To** dates
3. User clicks **Generate**
4. App shows stats tiles + charts + small project gallery

### Journey B — Create Podcaster’s Assistant board

1. User opens Assistant → selects **Project Update** or **Pattern Round Up**
2. **Project Update**: chooses From/To dates → Load projects → picks one or more projects → app renders vertical board preview(s) → Download PNG and/or Generate Description
3. **Pattern Round Up**: Load my bundles → selects a bundle → picks one or more patterns → app renders vertical pattern board preview(s) → Download PNG and/or Generate Description

## Success metrics (v1)

- **Activation**: % of visitors who successfully connect to Ravelry (OAuth completes).
- **Wrapped completion**: % who generate wrapped after login.
- **Assistant completion**: % who download a PNG after selecting a project.
- **Time-to-first-result**: median seconds from “Generate” to results.
- **Reliability**: error rate for `/api/wrapped` and `/api/project-card/:id` requests.

## Key product requirements (high level)

- **Authentication**: Ravelry OAuth 2.0; backend stores access token server-side and uses session cookies.
- **Date range**: user-selectable; used to filter which projects count “in range”.
- **Stats**: counts + totals + breakdowns + highlights (see `PRD-010-Wrapped.md`).
- **Visuals**: free charting library; provide at least one clear chart (craft breakdown).
- **Share/export**: export Assistant board to PNG in-browser.

## Data and privacy considerations

- Use OAuth best practices (state parameter, server-side token exchange).
- Avoid persisting sensitive tokens to the browser.
- Avoid storing user project data long-term (v1 can be stateless beyond session).
- Provide clear messaging that Ravelry data is fetched on demand for the user.

## Constraints / assumptions

- Ravelry API availability and rate limits apply; responses may be incomplete (e.g., missing yardage).
- Not all projects have photos, patterns, or yarn pack details.
- Initial usage volume is modest; simplest viable architecture is preferred.

## Risks

- **Rate limiting / slow loads**: fetching per-project details can be expensive for many projects.
- **Data quality**: yardage/meterage may be missing or inconsistent.
- **Image hotlinking**: exported PNG relies on fetching remote images; some may fail due to CORS/network.

## Open questions

- Should “in range” mean *completed date* only, or *started OR completed*? (v1 currently treats “completed if available else started”.)
- Should Wrapped exports (charts + tiles) also be downloadable as an image?
- What is the desired default range for Wrapped (last 12 months) vs Assistant (last 3 months)?

