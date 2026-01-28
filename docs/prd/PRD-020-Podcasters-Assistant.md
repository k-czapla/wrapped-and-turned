# PRD-020: Podcaster’s Assistant (Shareable Project Board)

- **Product**: Wrapped and Turned
- **Feature**: Podcaster’s Assistant
- **Doc type**: PRD
- **Status**: Draft
- **Last updated**: 2026-01-28

## Summary

Podcaster’s Assistant generates a **vertical, share-ready board** for a chosen Ravelry project and lets the user **download it as a PNG** for use in podcast show notes, Instagram Stories, and similar formats.

## User story

As a fiber arts content creator, I want a clean “project card” image containing the key details of a project, so I can quickly share it with my audience without manual design work.

## Scope (v1)

### Inputs

- Date range (**From**, **To**) to load candidate projects
- **Selectable project list**: user is presented with a checkmark list of projects in range; they select one or more projects to generate a visualisation for

### Output (board content)

The board should include (when available):

- First project photo from Ravelry
- Pattern name
- Designer name
- Project name
- Size made
- Yarn used (free text or list)
- App branding: “Wrapped & Turned”

### Export

- “Download PNG” button exports the preview as a PNG at a reasonable resolution for sharing.

## Out of scope (v1)

- Editable templates, fonts, themes, or a “Canva-like” editor
- Export to PDF
- Multi-project boards / carousel generation
- Scheduling/social posting integrations

## Requirements

### UX / UI requirements

- **R1 — Clear preview**: show a live preview of the board in a phone-like aspect (9:16-ish).
- **R2 — Empty states**:
  - Before loading projects: explain what the feature does and how to start.
  - After loading but before selection: prompt user to select one or more projects from the checkmark list.
- **R3 — Export**: “Download PNG” is available per selected project once project details are loaded.
- **R4 — Graceful missing data**:
  - No image: show placeholder without broken layout.
  - No size/yarn/designer: show “—” or hide the field.
- **R5 — Mobile-friendly**: board should fit on smaller screens and still be readable.

### Functional requirements

- **R6 — Uses authenticated data**: feature requires Ravelry login (or mock mode in development).
- **R7 — Project list reuse**: use the same underlying “projects in range” query as Wrapped to populate a selectable (checkmark) list of projects.
- **R8 — Per-project detail fetch**: when one or more projects are selected, backend fetches the details needed for each board:
  - Photo URL
  - Pattern + designer
  - Project name
  - Size
  - Yarn used (derived from yarn packs when present)

### Export requirements

- **R9 — PNG output**:
  - Export should include the project image if available.
  - Output should have a white background (avoid transparency surprises).
  - Use a pixel ratio >1 for better sharpness.

### Accessibility requirements

- **R10 — Keyboard operable**: project checkboxes and download buttons usable via keyboard.
- **R11 — Announce errors**: errors should be visible and understandable.

## Edge cases

- Project has no photos → placeholder image block.
- Images fail to load due to network/CORS → board should still export with placeholder.
- Yarn packs are present but inconsistent → render best-effort yarn list; avoid “undefined”.
- Very long pattern/yarn names → clamp/wrap to avoid overflowing the board.

## Acceptance criteria

- User can load projects for a date range.
- User is presented with a selectable (checkmark) list of projects and can select one or more to generate visualisations for.
- User sees a vertical board preview for each selected project.
- User can export each board as a PNG.
- Board remains readable and visually stable when optional fields are missing.

