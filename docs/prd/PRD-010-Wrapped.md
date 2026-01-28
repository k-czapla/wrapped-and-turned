# PRD-010: Wrapped (Stats + Charts)

- **Product**: Wrapped and Turned
- **Feature**: Wrapped
- **Doc type**: PRD
- **Status**: Draft
- **Last updated**: 2026-01-28

## Summary

Wrapped turns a user-selected date range into a “making recap”: headline numbers, breakdowns, highlights, and lightweight visuals.

## User story

As a fiber artist, I want to pick a time period and see a fun, clear summary of what I made, so I can reflect on my progress and share highlights.

## Scope (v1)

- Date range selection (**From**, **To**) and “Generate” action
- Stats tiles:
  - Total projects in range
  - Finished projects in range
  - Total yardage (yd)
  - Total meterage (m)
- Breakdown chart(s):
  - Craft breakdown (e.g., Knitting vs Crochet)
- Highlights:
  - Most productive month
  - Average project duration (days), if available
- Project gallery (cards):
  - Project name
  - First photo (if available)
  - Pattern + designer (if available)
  - Craft, yardage, meterage (if available)

## Out of scope (v1)

- Paid charting/BI tools
- Persisting results or historical runs
- Social posting integrations (IG/TikTok APIs)

## Definitions and data rules

### “In range” definition

For each Ravelry project:

- If `completed` exists, use completed date.
- Else if `started` exists, use started date.
- Include the project if the chosen date is between From and To (inclusive).

This is designed to handle projects without completion dates while still giving users a useful recap.

### Stats definitions

- **Total projects**: count of projects “in range”
- **Finished projects**: count of “in range” projects that have `completed`
- **Total yardage / meterage**: sum of yardage/meterage across “in range” projects (missing values treated as 0)
- **Craft breakdown**: count of “in range” projects grouped by craft name
- **Most productive month**: month with the highest number of “in range” projects (based on the chosen “in range” date per project)
- **Average duration days**: average of (completed - started) in days for projects that have both dates

## Requirements

### UX / UI requirements

- **R1 — Date selection**: user can select From/To via date inputs; defaults should be sensible (e.g., last 12 months).
- **R2 — Loading states**: show clear “Generating…” while loading.
- **R3 — Error handling**: if not authenticated, show a helpful error and a clear path to login.
- **R4 — Visual clarity**: charts must be readable on mobile; legends should not overlap content.
- **R5 — “Missing data” resilience**: if yardage/meterage/pattern/designer/photo is missing, the UI should degrade gracefully without broken layout.

### Functional requirements

- **R6 — Uses Ravelry login**: user must be authenticated before generating Wrapped.
- **R7 — Fetch list then details**: backend may fetch project list then fetch per-project details to enrich output (photo, yardage/meterage, pattern/designer).
- **R8 — Stable contract**: frontend should depend only on backend API response shape, not Ravelry API shapes directly.

### Performance requirements

- **R9 — Reasonable latency**: for typical users (<100 projects in range), results should render in a few seconds.
- **R10 — Concurrency control**: per-project detail fetches must be concurrency-limited to avoid spikes/rate limiting.

### Accessibility requirements

- **R11 — Keyboard usable**: date inputs and buttons reachable via keyboard.
- **R12 — Color contrast**: chart + tiles should maintain readable contrast in default theme.

## Charting / visualization

- **Library**: must be free to use in this context.
- **Minimum**: craft breakdown doughnut (counts by craft).
- **Nice-to-have (v1.5+)**:
  - Projects per month bar chart
  - Yardage/meterage distribution (histogram or bands)

## Future stats backlog (v1.5+)

These are intended to be “easy add-ons” using the existing data pipeline:

- **Top designers** (count by designer)
- **Top patterns** (count by pattern)
- **Yarn weights** distribution (e.g., fingering/DK/worsted)
- **Yarn brands** / top yarns (from yarn packs)
- **Category taxonomy** (e.g., sweaters/hats/socks) using Ravelry pattern categories when available
- **Biggest project** by yardage/meterage
- **UFO / WIP**: started in range but not completed
- **Average time-to-finish by craft/category**

## Acceptance criteria

- User can select a date range and generate Wrapped.
- Wrapped shows tiles + craft breakdown chart + highlights + a project gallery.
- Missing photos or missing yardage does not break the page.
- If unauthenticated, Wrapped generation fails with a clear message.

