# PRD-020: Podcaster’s Assistant (Shareable Project Board)

- **Product**: Wrapped and Turned
- **Feature**: Podcaster’s Assistant
- **Doc type**: PRD
- **Status**: Draft
- **Last updated**: 2026-02-12

## Summary

Podcaster’s Assistant generates a **vertical, share-ready board** for a chosen Ravelry project and lets the user **download it as a PNG** for use in podcast show notes, Instagram Stories, and similar formats. Users can select from multiple visual design styles to personalize their boards.

## User story

As a fiber arts content creator, I want a clean “project card” image containing the key details of a project, so I can quickly share it with my audience without manual design work.

## Scope (v1)

### Inputs

- Date range (**From**, **To**) to load candidate projects
- **Selectable project list**: user is presented with a checkmark list of projects in range; they select one or more projects to generate a visualisation for
- **Board design selection** (optional): user can choose from multiple visual styles for the project board via the Board Design page (`/board-design`). The first option is “My design” (user’s customized version); the rest are predefined styles. Selected design is persisted in localStorage and applied to all generated boards.
- **Board design customization** (optional): on the Board Design page, “My design” is the first option; selecting it opens the customizer (font, RGBA background/text colors, border). Predefined designs can be selected without opening the customizer. Customizations persist in localStorage and apply to all generated boards (preview and PNG export).
- **Board display options**: a control section below the main Podcaster’s Assistant controls lets the user choose which Ravelry-sourced information to show on the board. All options are selected by default: **Photo**, **Pattern name**, **Designer**, **Yarn + color**, **Size made**. Choices apply to all generated board previews and PNG exports.

### Output (board content)

The board shows only the fields the user has enabled in **Board display options**. When a field is enabled, it is included (when available from Ravelry):

- **Photo**: first project photo from Ravelry (or placeholder if none)
- **Pattern name**: from Ravelry project/pattern
- **Designer**: designer name from Ravelry pattern
- **Yarn + color**: yarn used (from Ravelry packs)
- **Size made**: size made (from Ravelry project)

App branding (“Wrapped & Turned”) and footer link remain on the board.

### Export

- “Download PNG” button exports the preview as a PNG at a reasonable resolution for sharing.

## Out of scope (v1)

- Full design editor (Canva-like experience); basic customization (font, RGBA colors) is in scope.
- User-uploaded fonts or custom images beyond the project photo
- ~~Data field selection (toggling which fields appear on the board)~~ — implemented: Board display options (Photo, Pattern name, Designer, Yarn + color, Size made)
- Export to PDF
- Multi-project boards / carousel generation
- Scheduling/social posting integrations

**Note:** The Board Design page lists “My design” first (user’s version with customizations), then 10 predefined designs. Selecting “My design” opens the customizer (font, RGBA colors, border); selecting a predefined design applies it without opening the customizer. Customizations persist across sessions.

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
- **R12 — Board design selection**: users can access a Board Design page to browse and select from available visual styles. The first option is “My design” (user’s customized version); the rest are predefined styles. Selected design persists across sessions (localStorage) and applies to all generated boards (preview and PNG export).
- **R12a — Board design customization**: “My design” is the first option; selecting it opens the customizer (font, RGBA background/text colors, border). Users can override the base design with a custom font (10 options), background and text colors (RGBA pickers). Customizations persist in localStorage and apply only when "My design" is selected; predefined designs are used as-is in the Assistant preview and PNG export.
- **R13 — Board design preview consistency**: On the Board Design page, each design option is shown in a preview that uses the same sample project data (pattern name, designer, size, yarn, image placeholder) and the same dimensions (320×480px) as the Podcaster’s Assistant board preview, so users can compare designs accurately and see how the board will look with real content. When “My design” is selected, a “Customize design” section (or modal) shows a preview with the effective design (base style plus user customizations).

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
- User can access the Board Design page to browse and select a visual style for their boards.
- User can optionally customize the design (font, RGBA background/text colors); customizations persist and apply to all generated boards.
- Selected board design (and any customizations) persists across sessions and applies to all generated boards.
- User sees a vertical board preview for each selected project (using the selected design style).
- User can export each board as a PNG (export matches the preview style).
- Board remains readable and visually stable when optional fields are missing.

