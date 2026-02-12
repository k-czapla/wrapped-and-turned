# PRD-050: Future Development Ideas

- **Product**: Wrapped and Turned
- **Doc type**: PRD (future / backlog)
- **Status**: Draft
- **Last updated**: 2026-01-28

**Implemented:** Idea 3 (Project Board style customization) — style selection page, 3 CSS-based designs (Scandinavian Calm, Technical Pattern Sheet, Neon Yarn Party) plus multiple Canva PNG-based designs (canva-reference-board.png and canva-2.png through canva-10.png in `frontend/public`), persistence via localStorage. **Data field selection** (2026-02-12): Board display options on the Podcaster’s Assistant page let users toggle Photo, Pattern name, Designer, Yarn + color, and Size made (all on by default); options apply to preview and PNG export.

**Evaluated (2026-02-12):** Canva API for board design — see [Canva API board design assessment](../assessments/canva-api-board-design.md). Summary: Connect API cannot replace in-app board rendering (create design is blank; layout/text/colors not programmable). Viable options: optional “Open in Canva” (export PNG then user edits in Canva) or, for Enterprise, Autofill with a Canva-built template. Current in-app design + html-to-image remains recommended.

## Purpose

This document describes planned feature ideas that extend the current Wrapped and Podcaster’s Assistant experiences. It is intended as a **base for further development**—no implementation is specified here; the goal is to capture scope, user value, and requirements so that future work can be scoped and estimated.

---

## Idea 1: AI-driven YouTube description generation (Podcaster’s Assistant)

### Summary

Extend the Podcaster’s Assistant flow so that, in addition to generating shareable project boards (PNG), users can **generate an AI-driven YouTube description** based on the **selected projects**. The description should be optimized for discoverability and algorithm-friendly structure.

### User story

As a fiber arts content creator who publishes podcast episodes or YouTube videos about my projects, I want to generate a ready-to-paste YouTube description that includes a catchy intro, project list with Ravelry links, and relevant hashtags, so I can save time and improve discoverability without manually writing SEO copy.

### Scope

- **Input**: Same as current Podcaster’s Assistant—date range and **selected project(s)** from the checkmark list. The description is generated for the set of projects the user has selected for the board (or a dedicated “Generate description” action with the same selection).
- **Output**: A generated text block (YouTube description) that the user can copy or download. Optionally: one-click copy to clipboard; optional export as `.txt` or markdown.

### Description structure (required elements)

The generated description must include:

1. **Short, catchy introduction**
   - A few sentences that hook the viewer and summarize what the video/episode is about (e.g., “In this episode I’m sharing the projects I finished this season…”).
   - Tone should be consistent with creator/fiber-arts content (friendly, inclusive).
   - Length: suitable for the first visible lines in YouTube (roughly 2–4 lines before “Show more”).

2. **List of projects mentioned, with links to Ravelry**
   - For each selected project: project name, pattern name, designer (when available).
   - Each project or pattern should link to its Ravelry project/pattern page (URLs).
   - Format: clear list (bullets or numbered) so it’s easy to scan and click.

3. **Algorithm- and discoverability-friendly elements**
   - **Hashtags**: relevant fiber-arts and craft hashtags (e.g., #knitting, #crochet, #handmade, #ravelry, #fiberarts, plus pattern/project-specific tags where sensible).
   - **Keywords**: natural inclusion of terms that help search (e.g., “knit”, “crochet”, “pattern”, “yarn”, “finished object”).
   - Structure that works well with YouTube’s “Show more” and search indexing (clear sections, line breaks, no keyword stuffing).

### Out of scope (for initial version)

- Editing the AI output inside the app (beyond copy/paste into an external editor).
- Multiple description “templates” or style choices (can be added later).
- Integration with YouTube API (upload or scheduling).
- Support for other platforms (e.g., Instagram caption, TikTok description) unless explicitly added in a later iteration.

### Requirements (to be refined in implementation)

- **R1 — Same project selection as board**: description generation uses the same selected projects as the Podcaster’s Assistant board (or an explicit “Generate description” action with same selection model).
- **R2 — Ravelry links**: every listed project/pattern must have a correct, clickable Ravelry URL (project page and/or pattern page as appropriate).
- **R3 — Copy/download**: user can copy the full description to clipboard and/or download it as a file.
- **R4 — AI provider**: implementation will need an AI/LLM integration (e.g., OpenAI, Anthropic, or self-hosted). Cost, rate limits, and privacy must be evaluated; no PII should be sent beyond what’s needed for the description.
- **R5 — Graceful degradation**: if AI is unavailable or fails, show a clear error and optionally a non-AI fallback (e.g., plain list with links only).

### Edge cases

- No projects selected → disable or hide “Generate description”; show message to select at least one project.
- Very long project list → description may need truncation or “top N” plus “and X more” to stay within platform limits.
- Ravelry link format → use canonical project/pattern URLs; handle deleted or private projects (e.g., omit link or show “Link unavailable”).

### Acceptance criteria (target)

- User can trigger “Generate YouTube description” from the Podcaster’s Assistant flow (after selecting one or more projects).
- Generated description includes: short intro, project list with Ravelry links, and hashtags/SEO-friendly elements.
- User can copy the description to clipboard and/or download it for use in YouTube.
- If AI generation fails, user sees a clear error and no broken UI.

---

## Idea 2: Downloadable charts and drill-down popups (Wrapped)

### Summary

Enhance the Wrapped experience so that **stat sections (e.g., “Projects finished”) are clickable**. When the user clicks a section, a **popup (modal) opens** showing a **chart** that visualizes how that metric is distributed (e.g., projects by month). The chart (or the popup content) should be **downloadable** (e.g., as PNG or SVG) so users can save or share it.

### User story

As a fiber artist viewing my Wrapped summary, I want to click on a stat like “Projects finished” and see a chart showing how those projects were spread over time (e.g., by month), and I want to download that chart so I can use it in a blog post or social media.

### Scope

- **Trigger**: User clicks on a Wrapped stat/section (e.g., “Projects finished”, “Total projects”, “Yardage”, “Craft breakdown”). Which sections are clickable is configurable (start with “Projects finished” and expand).
- **Popup**: A modal (or slide-over) that opens on click, containing:
  - A **chart** appropriate to the metric (see below).
  - Optional short title/caption (e.g., “Projects finished by month”).
  - A **download** control (e.g., “Download chart as PNG”).
- **Download**: The chart (or the popup content) can be exported as an image (PNG preferred for compatibility) or SVG. Filename should be sensible (e.g., `wrapped-projects-by-month-2024.png`).

### Chart types (by section)

- **Projects finished / Total projects**
  - **Chart**: Projects spread **by month** (e.g., bar chart: x = month, y = count).
  - Data: same “in range” and “finished” rules as in PRD-010; group by month (completed date or started date per project).
- **Craft breakdown**
  - **Chart**: Already exists in Wrapped; in popup, show the same or an enhanced view (e.g., bar chart by craft) with download option.
- **Yardage / Meterage** (if added as clickable)
  - **Chart**: Distribution over time (e.g., yardage per month) or by project (e.g., top N projects by yardage).
- Other stats (e.g., “Most productive month”, “Average duration”) can get a small chart or summary visualization in the popup as needed.

### Out of scope (for initial version)

- Editing or customizing the chart inside the app (colors, labels, date format).
- Multiple export formats in v1 (PNG first; SVG/PDF can be added later).
- Sharing directly to social platforms from the popup (copy image or download only).

### Requirements (to be refined in implementation)

- **R1 — Clickable sections**: At least the “Projects finished” (and optionally “Total projects”) section has a clear affordance (e.g., clickable tile or “View chart” link) that opens the popup.
- **R2 — Chart by month**: For “Projects finished”, the popup chart shows project count per month (x = month, y = count); months with zero can be shown or omitted depending on UX choice.
- **R3 — Download**: User can download the chart as PNG (or equivalent) from within the popup. Resolution should be adequate for social/blog use (e.g., 2x pixel ratio).
- **R4 — Accessibility**: Popup can be closed via keyboard (Escape); focus is trapped in modal; chart has accessible title/description.
- **R5 — Reuse data**: Use the same Wrapped data already loaded (no extra backend call for the drill-down unless a different aggregation is required).

### Edge cases

- No projects in range → popup can show “No data” and an empty chart or message.
- Single month with data → chart still renders (one bar or one point).
- Very long date range (e.g., 5 years) → consider grouping by quarter or year, or horizontal scroll; to be decided in implementation.
- Mobile: popup must be responsive; chart readable on small screens; download still works.

### Acceptance criteria (target)

- User can click on “Projects finished” (or designated section) in Wrapped and see a popup with a chart (e.g., projects by month).
- User can download the chart from the popup as PNG (or agreed format).
- User can close the popup and return to Wrapped without losing state.
- Chart and popup work on desktop and mobile.

---

## Idea 3: Project Board style customization and data selection (Podcaster's Assistant)

**Implementation status (2026-02-12):** Implemented. Delivered: dedicated Board Design page (`/board-design`) where users can browse and select from 10 visual styles (from `project-board-prompts`); selected design is persisted in localStorage and applied to all Podcaster's Assistant project boards (preview and PNG export). **Design customization**: users can override the selected design with (1) font choice (10 options), (2) RGBA color pickers for background and text. **Data field selection (R2)**: On the Podcaster’s Assistant page, a “Show on board” control section (below the main controls) provides checkboxes for Photo, Pattern name, Designer, Yarn + color, and Size made (all on by default); the board preview and PNG export respect these options. Board Design previews use the same sample project data and dimensions (320×480px) as the Assistant view; a live “Customize design” section shows the effective design.

### Summary

Extend the Podcaster's Assistant feature so that users can **choose from multiple visual styles** for their Project Board and **customize which data fields are displayed**. This adds a style selection page and a data preferences interface, allowing users to personalize their shareable boards to match their brand or aesthetic preferences.

### User story

As a fiber arts content creator, I want to choose a visual style for my Project Board from several design options, and I want to control which project details (e.g., yarn, size, designer) appear on the board, so I can create boards that match my personal brand and include only the information relevant to my audience.

### Scope

- **Style selection page**: A dedicated page or modal where users can browse and preview different Project Board design styles (e.g., minimal, colorful, elegant, modern). Each style should show a preview example.
- **Style application**: Once a style is selected, it applies to all Project Boards generated in the current session (or can be saved as a user preference).
- **Data field selection**: Users can specify which data fields to display on the Project Board:
  - Project photo (always included, but style may vary)
  - Pattern name
  - Designer name
  - Project name
  - Size made
  - Yarn used
  - App branding ("Wrapped & Turned")
  - Additional fields (e.g., date completed, craft type) if available
- **Preview update**: The board preview updates in real-time as users change style or toggle data fields.

### Style options (initial set)

The initial version should include at least 3–4 distinct styles:

1. **Minimal**: Clean, simple layout with subtle colors and ample whitespace.
2. **Colorful**: Bold colors, vibrant backgrounds, playful typography.
3. **Elegant**: Sophisticated design with refined typography and muted color palette.
4. **Modern**: Contemporary design with geometric elements and current design trends.

Each style should maintain readability and ensure the exported PNG remains high quality.

### Out of scope (for initial version)

- Custom color picker or full design editor (Canva-like experience).
- User-uploaded fonts or custom images beyond the project photo.
- Multiple styles per board (one style applies to all boards in a session).
- Style templates created by users or community.
- Advanced layout customization (e.g., repositioning elements, resizing).

### Requirements (to be refined in implementation)

- **R1 — Style selection UI**: A clear interface (page or modal) where users can browse available styles with preview examples. Selection is intuitive and accessible.
- **R2 — Data field toggles**: Checkboxes or toggle switches for each available data field (pattern name, designer, size, yarn, etc.). At least one field beyond the photo must be selectable.
- **R3 — Live preview**: Board preview updates immediately when style or data fields change, without requiring a regeneration step.
- **R4 — Style persistence**: Selected style and data preferences can be saved as user preferences (stored locally or in user account) so they persist across sessions.
- **R5 — Export consistency**: Exported PNG matches the preview exactly (same style, same selected fields).
- **R6 — Graceful field handling**: If a selected data field is missing for a project (e.g., no yarn information), the board layout adjusts gracefully without breaking (field is omitted, layout remains stable).

### Edge cases

- User deselects all optional fields → board should still display at minimum the project photo and app branding (or show a warning that at least one field should be selected).
- Style preview fails to load → fallback to default style with clear indication.
- Very long text in selected fields → same handling as current implementation (clamp/wrap to avoid overflow).
- User changes style mid-session → all subsequent boards use the new style; previously generated boards are not affected.

### Acceptance criteria (target)

- User can access a style selection page/modal from the Podcaster's Assistant flow.
- User can preview and select from multiple Project Board styles.
- User can toggle which data fields appear on the board.
- Board preview updates in real-time when style or data selections change.
- Exported PNG matches the selected style and includes only the selected data fields.
- Style and data preferences can be saved and persist across sessions.

---

## Cross-cutting notes

- **Backend**: Idea 1 may require a new backend endpoint or use of an external AI API; Idea 2 may be frontend-only if Wrapped already returns enough data to compute monthly aggregates; Idea 3 is primarily frontend-focused but may require storing user preferences (localStorage or user account).
- **Dependencies**: Idea 1 depends on choosing an AI provider and handling API keys/usage. Idea 2 depends on the existing charting library supporting export (e.g., canvas-to-PNG or SVG export). Idea 3 depends on the existing Project Board generation system and may require CSS/styling framework updates.
- **Priority**: These ideas are not sequenced; each can be developed and released independently once prioritized by the team.

---

## References

- PRD-010: Wrapped (stats, charts, “in range” rules)
- PRD-020: Podcaster’s Assistant (project selection, board, PNG export)
- PRD-030: Backend API and data (for any new endpoints or AI integration)
