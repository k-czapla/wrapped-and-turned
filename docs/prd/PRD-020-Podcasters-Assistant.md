# PRD-020: Podcaster’s Assistant (Shareable Project Board)

- **Product**: Wrapped and Turned
- **Feature**: Podcaster’s Assistant
- **Doc type**: PRD
- **Status**: Draft
- **Last updated**: 2026-03-18

## Summary

Podcaster’s Assistant generates **vertical, share-ready boards** for Ravelry content and lets the user **download them as PNGs** for use in podcast show notes, Instagram Stories, and similar formats. On opening the Assistant page, the user first selects either **Project Update** (date-range–based projects) or **Pattern Round Up** (bundle-based patterns). Users can select from multiple visual design styles to personalize their boards. For both modes, users can **generate an AI-assisted YouTube/show-notes description** (title, short description, Ravelry links list, hashtags).

## User story

As a fiber arts content creator, I want a clean “project card” image containing the key details of a project, so I can quickly share it with my audience without manual design work.

## Scope (v1)

### Mode selection

- On the Podcaster’s Assistant page, the user first chooses **Project Update** or **Pattern Round Up**.
- **Project Update**: load projects by date range; create boards and description for selected projects (existing behaviour).
- **Pattern Round Up**: select a bundle from the user’s Ravelry Bundle/Favorites list ([Ravelry API: bundles_list](https://www.ravelry.com/api#bundles_list)); the app loads the bundle and its patterns ([Ravelry API: bundles_show](https://www.ravelry.com/api#bundles_show)). User selects which patterns to include; boards and video description are generated from pattern data (photo, pattern name, designer, sizes available, needle size, gauge, suggested yarn).

### Inputs (Project Update)

- Date range (**From**, **To**) to load candidate projects
- **Selectable project list**: user is presented with a checkmark list of **all projects in the date range** (started or completed within the range, plus projects started before the range but still in progress during the range). Each row shows the **Ravelry project status in brackets** next to the project name (e.g. In progress, Finished, Hibernating). They select one or more projects to generate a visualisation for. The **finished object (FO) count** (projects with a **completed date** in the range) is used only for Generate Description wording (e.g. “3 FOs in this period”), not for filtering the list.
- **Board design selection** (optional): user can choose from multiple visual styles for the project board via the Board Design page (`/board-design`). The last option is “My design” (user’s customized version); the rest are predefined styles. Selected design is persisted in localStorage and applied to all generated boards.
- **Board design customization** (optional): on the Board Design page, “My design” is the last option; selecting it opens the customizer (font, optional board background image upload, RGBA background/text colors, border). Predefined designs can be selected without opening the customizer. Customizations persist in localStorage and apply to all generated boards (preview and PNG export).
- **Board display options**: a control section below the main Podcaster’s Assistant controls lets the user choose which Ravelry-sourced information to show on the board. **Pattern name** and **Designer** are always shown (checkboxes disabled). User can toggle: **Photo**, **Yarn + color**, **Size made**, **Needle sizes**, **Start date**, **Completed date**, **QR code (on download)**. All toggles are on by default. When **Photo** is enabled, each project board has its own **Project / Pattern** toggle so the user can choose per board whether to use photos from the project or from the pattern.
- **Photo selection**: when Photo is shown, a photo gallery appears on the board preview for each project. The user can select which photo to display from either the project's photos or the pattern's photos (depending on the Project/Pattern toggle). Medium-sized images are used and scaled correctly on the board.
- **Photo repositioning (framing)**: the board photo is shown in a square crop (`object-fit: cover`). For each project (and each pattern in Pattern Round Up), **Left–right** and **Up–down** range controls pan the image within that crop; **Center photo** resets to the default framing. Framing is reflected in the live preview and in downloaded PNGs. Changing the selected gallery photo, Project/Pattern source, or uploading a new photo resets framing to center for that board.
- **Open on Ravelry**: when the project has a Ravelry project URL, clicking the board preview (outside editable yarn/size/needle fields) opens that project page in a new tab; keyboard users can focus the board and press Enter or Space. Editable fields and inputs keep their existing behaviour.
- **Photo upload**: for each project board, the user can upload a photo directly from their computer. Uploaded photos are added to the gallery for that board (prepended to project/pattern photos) and can be selected like Ravelry-sourced photos. Uploaded photos are kept in memory for the session and included in the preview and PNG export.
- **Download all**: a “Download all” button in the preview section downloads all selected project boards as individual PNG files (one file per board). Each board uses the same filename pattern as the per-board “Download PNG” button.

### Inputs (Pattern Round Up)

- **Bundle list**: when Pattern Round Up is selected, the app immediately fetches the user's Ravelry bundles (bundles_list). User selects one bundle from a dropdown.
- **Bundle content**: after selection, the app fetches the bundle (bundles_show) and pattern details for each pattern in the bundle. User sees a **selectable pattern list** (pattern name, designer) and selects one or more patterns to generate boards and description for.
- **Board display options (Pattern Round Up)**: toggles for **Photo**, **Pattern name** (always on), **Designer** (always on), **Sizes available** (from API `sizes_available` when present, else computed sizes + range), **Gauge (with needle size)** (gauge text with needle size in parentheses when present, e.g. "20 sts / 28 rows = 10 cm (4mm)"), **Suggested yarn** (from pattern packs `yarn_name`), **Price** (pattern price, always displayed in EUR), **QR code (on download)** (when on, downloaded PNG includes a QR code linking to the Ravelry pattern page). Same board design selection (Board Design page) and PNG export as Project Update.
- **Download all (Pattern Round Up)**: a “Download all” button in the pattern board preview section downloads all selected pattern boards as individual PNG files (one file per pattern), matching the Project Update behaviour.

### Generate YouTube / show notes description (AI-assisted)

When the user has selected **one or more projects** (Project Update) or **one or more patterns** (Pattern Round Up)—same selection as for the boards—a **“Generate Description”** button is shown. The user can optionally provide a **prompt** (e.g. episode theme, tone, or extra context) to enrich the generated description; if provided, it is included in the request to the AI. Clicking **Generate Description** triggers AI-assisted generation of text suitable for a YouTube video (podcast episode) that the user can paste into the **show notes box** and use as the **title**. For **Pattern Round Up**, the title format is **Ep. [##] | Pattern Round Up - #catchy title# - Knitting Podcast #emoji#** and the description focuses on sharing patterns from a bundle (not FOs).

**UI:** The description section shows the **count of finished objects (FOs)** in the loaded date range (from Wrapped stats) for **title/description wording only** (e.g. “3 finished objects in this period (for title/description wording)” and “(of 3 FOs in this period)”). Only projects with a **completed date** within the range count as FOs. The project list shows all date-eligible projects (with status shown in brackets), not only FOs. The section title uses light emoji (e.g. “✨ Show notes & YouTube description”).

**Output structure (order matters for YouTube):**

1. **Title** — Used as the YouTube video title. Fixed format: **Ep. [##] | ## FOs - #catchy title# - Knitting Podcast #cozy emoji#**. Data: episode number [##] (creator fills in), FO count from selection. AI generates catchy phrase and 1–2 cozy emojis. Tailored for YouTube search and recommendations (~60 characters).
2. **Short description** — A brief (2–4 lines) summary of the episode/video, visible before “Show more” on YouTube. Hook the viewer; may use 1–2 emojis for warmth. Mention finished objects / FOs where natural.
3. **List of Ravelry links** — For each selected project: project/pattern name and a clickable link to the Ravelry project (and optionally pattern) page. Clear list format for easy scanning.
4. **Hashtags** — At the end; relevant fiber-arts and craft hashtags (e.g. #knitting, #crochet, #handmade, #ravelry, #fiberarts, #knittingpodcast) plus project-specific tags where sensible.

**Design goals (“knitting podcast” algorithm):** Title is optimized for YouTube: includes “knitting podcast”, episode placeholder, and project-specific keywords so the title is catchy and clearly tied to the episode content. Concise, scannable; clear keywords (e.g. finished objects, FO, pattern names), no keyword stuffing. Tone is conversational and cozy. Generated text may include tasteful emojis for fun and shareability (see [YouTube description and title guidance](https://support.google.com/youtube/answer/12948449)).

The generated text is displayed in a **show notes box** (or similar) so the user can copy it into YouTube (or another platform). Implementation uses **Groq** (see “AI tools (no-cost options)” below).

### Output (board content)

The board shows **Pattern name** and **Designer** always, and only the other fields the user has enabled in **Board display options**. When a field is enabled, it is included (when available from Ravelry):

- **Photo**: selected project or pattern photo from Ravelry, or a user-uploaded photo (user chooses source per board via Project/Pattern toggle and picks one from the gallery, or uploads from computer; medium-sized images; placeholder if none)
- **Pattern name**: from Ravelry project/pattern (always shown)
- **Designer**: designer name from Ravelry pattern (always shown)
- **Yarn + color**: yarn used (from Ravelry packs)
- **Size made**: size made (from Ravelry project)
- **Needle sizes**: needle sizes used (from Ravelry project needles); if multiple, joined with "+" (e.g. "4mm + 3.5mm")
- **Dates**: one line at the bottom of the board when **Start date** or **Completed date** is enabled and a start date is available. If only start date: “DD.MM.YYYY – In progress”. If both: “DD.MM.YYYY – DD.MM.YYYY”. If no start date, the date section is hidden. A QR code is not shown on the board; when the user downloads the PNG, **QR code (on download)** is enabled in Board display options, and the card has a Ravelry project URL, a QR code is appended on export (see Export).

App branding (“Wrapped & Turned”) remains on the board.

**Editable fields (Project Update):** In the board preview, the user can edit the text for **yarn** (Yarn + color), **size** (Size made), and **needles** (Needle sizes) in place. Pattern name and designer are not editable (cursor remains default). When the user hovers over an editable field, the cursor indicates text editing; clicking the field switches to edit mode; pressing Enter or clicking outside saves the value. The preview and the downloaded PNG both reflect the user's edits.

### Output (Pattern Round Up board content)

The Pattern Round Up board shows **Pattern name** and **Designer** always, and only the other fields the user has enabled in **Board display options (Pattern Round Up)**. When a field is enabled, it is included (when available from Ravelry pattern data):

- **Photo**: selected pattern photo from Ravelry (user can pick from pattern photo gallery)
- **Pattern name**, **Designer**: always shown
- **Sizes available**: from Ravelry pattern `sizes_available` when present (e.g. “13 sizes”), else computed size names plus min/max circumference in meters
- **Gauge (with needle size)**: gauge from Ravelry pattern, with needle size shown in parentheses when present (e.g. "20 sts / 28 rows = 10 cm (4mm)")
- **Suggested yarn**: from pattern packs `yarn_name` (e.g. “De Rerum Natura Bérénice”)
- **Price**: pattern price always shown in euros (e.g. “9.60 EUR”). When the source provides a different currency, the backend converts it to EUR using ECB daily exchange rates (with a static fallback for common currencies if the feed is unavailable).
- **QR code**: not shown on the board; when the user downloads the PNG, **QR code (on download)** is enabled in Board display options, and the card has a Ravelry pattern URL, a QR code is appended on export (see Export).

**Editable fields (Pattern Round Up):** In the board preview, the user can edit the text for **Sizes available** and **Suggested yarn** in place. Pattern name, designer, gauge (with needle size), and price are not editable. Same interaction as Project Update: editable fields show a text cursor on hover; click to edit; Enter or click outside to save. The preview and downloaded PNG include the user's changes.

### Export

- “Download PNG” button exports the preview as a PNG at a reasonable resolution for sharing. The PNG includes any in-place edits the user made to yarn/size fields on the board. When **QR code (on download)** is enabled in Board display options and the card has a Ravelry project or pattern URL, the downloaded image also includes a QR code (linking to that URL) on the **left side** of the board, **outside** the board rectangle; the QR has a white background and the board layout and visuals are unchanged.

## Out of scope (v1)

- Full design editor (Canva-like experience); basic customization (font, RGBA colors) is in scope.
- User-uploaded fonts (user-uploaded project/board photo is in scope)
- ~~Data field selection (toggling which fields appear on the board)~~ — implemented: Board display options (Photo, Pattern name, Designer always on; Yarn + color, Size made, Start date, Completed date, QR code on download)
- Export to PDF
- Multi-project boards / carousel generation
- Scheduling/social posting integrations
- For **Generate Description**: in-app editing of AI output (beyond copy/paste), multiple description templates, YouTube API upload/scheduling, or other platform-specific exports unless added later.

**Note:** The Board Design page lists predefined designs first, then “My design” last (user’s version with customizations). Selecting “My design” opens the customizer (font, RGBA colors, border); selecting a predefined design applies it without opening the customizer. Customizations persist across sessions.

## AI tools (no-cost options)

The **Generate Description** feature requires an LLM/text-generation capability. The following options can be utilized **at no cost** (free tier or open source). Choice will depend on rate limits, reliability, and whether the app runs backend-only (recommended for API keys) or also supports local inference.

| Option | Type | Notes |
|--------|------|--------|
| **Groq** | Cloud API | Free tier at [console.groq.com](https://console.groq.com), no credit card required. Access to Llama models (e.g. Llama 3.1 8B, Llama 3.3 70B). Rate limits (e.g. 30 RPM, 6K TPM for Llama 3.1 8B). Well-suited for low-volume, server-side calls. |
| **Hugging Face Inference API** | Cloud API | Free tier: limited requests/hour (e.g. 300/hr for registered users); small monthly credits. Use a Hugging Face token and models such as Mixtral 8x7b or Gemma. Good for experimentation; check [pricing and limits](https://huggingface.co/docs/api-inference/en/pricing). |
| **GPT4Free** | Open source / community | [g4f](https://github.com/gpt4free/gpt4free) provides free access to various models (e.g. GPT-4–level, DeepSeek) via Python/JS/HTTP. No usage fees; reliability and terms of use of upstream providers may vary. Use with appropriate caution and fallbacks. |
| **Ollama / llama.cpp (self-hosted)** | Local | Run models (e.g. Llama, Mistral) on the host machine; no per-request cost. Requires backend or desktop environment where models can run. No rate limits from a third party; good for privacy and offline use. |

**Chosen for v1: Groq.** The Generate Description feature uses the **Groq** API (free tier at [console.groq.com](https://console.groq.com), no credit card required; Llama models; rate limits apply). Other options in the table remain available for reference or future use. Ensure graceful degradation (clear error, optional non-AI fallback such as title + Ravelry links only) if Groq is unavailable.

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
- **R12 — Board design selection**: users can access a Board Design page to browse and select from available visual styles. The last option is “My design” (user’s customized version); the rest are predefined styles. Selected design persists across sessions (localStorage) and applies to all generated boards (preview and PNG export).
- **R12a — Board design customization**: “My design” is the last option; selecting it opens the customizer (font, optional board background image, RGBA background/text colors, border). Users can override the base design with a custom font (10 options), an optional uploaded board background image, background and text colors (RGBA pickers). Customizations persist in localStorage and apply only when "My design" is selected; predefined designs are used as-is in the Assistant preview and PNG export.
- **R13 — Board design preview consistency**: On the Board Design page, each design option is shown in a preview that uses the same sample project data (pattern name, designer, size, yarn, image placeholder) and the same dimensions (320×480px) as the Podcaster’s Assistant board preview, so users can compare designs accurately and see how the board will look with real content. When “My design” is selected, a “Customize design” section (or modal) shows a preview with the effective design (base style plus user customizations).
- **R14 — Generate Description visibility**: When at least one project is selected, a “Generate Description” button is visible. When no project is selected, the button is disabled or hidden, with a short prompt to select one or more projects.
- **R14a — Optional prompt to enrich description**: The user can optionally enter a free-text prompt (e.g. episode theme, tone, or extra context) before generating. The UI exposes this as an optional field (e.g. text area or input) near the “Generate Description” action. If provided, it is sent to the AI to enrich the title and description; if left empty, generation uses only the selected projects and Ravelry data.
- **R15 — Show notes box**: Generated text (title, description, Ravelry links, hashtags) is shown in a dedicated area (e.g. “Show notes” box) so the user can copy it into YouTube or elsewhere. Copy-to-clipboard (full text or by section) is recommended.

### Functional requirements

- **R6 — Uses authenticated data**: feature requires Ravelry login (or mock mode in development).
- **R7 — Project list in range**: the assistant shows **all projects** in the selected date range (started or completed within the range) in a selectable (checkmark) list. The FO (finished object) count—projects completed in the range—is used only for the Generate Description section (title/description wording), not for filtering the list.
- **R8 — Per-project detail fetch**: when one or more projects are selected, backend fetches the details needed for each board:
  - Project photos and pattern photos (medium URLs) for photo selection
  - Pattern + designer
  - Project name
  - Size
  - Yarn used (derived from yarn packs when present)
  - Needle sizes (from project needles; joined with "+" if multiple)
  - Started and completed dates (when available from Ravelry)
- **R16 — Generate Description (AI)**: When the user clicks “Generate Description”, the app calls the **Groq** API with context: selected project names, pattern names, designers, Ravelry project (and pattern) URLs, and any **optional user prompt** (if provided) to enrich the description. The service returns or the app composes: (1) title, (2) short description, (3) list of Ravelry links, (4) hashtags. Ravelry links must use canonical project/pattern URLs already available from the project-card API. If Groq is unavailable or fails, show a clear error and optionally a non-AI fallback (e.g. title from project list + Ravelry links only).

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
- **Generate Description:** No projects selected → disable or hide “Generate Description”; prompt to select at least one. AI unavailable or timeout → show clear error; offer non-AI fallback (e.g. title + Ravelry links only). Very long project list → keep description concise; consider truncating hashtags or list if near platform length limits.

## Acceptance criteria

- User can load projects for a date range.
- User is presented with a selectable (checkmark) list of projects and can select one or more to generate visualisations for.
- User can access the Board Design page to browse and select a visual style for their boards.
- User can optionally customize the design (font, RGBA background/text colors); customizations persist and apply to all generated boards.
- Selected board design (and any customizations) persists across sessions and applies to all generated boards.
- User sees a vertical board preview for each selected project (using the selected design style).
- User can export each board as a PNG (export matches the preview style).
- Board remains readable and visually stable when optional fields are missing.
- **Generate Description:** When one or more projects are selected, user sees “Generate Description” and can optionally enter a prompt to enrich the description. Clicking it produces text with title, short description, Ravelry links list, and hashtags, shown in a show-notes–style box for copy/paste. If AI fails, user sees a clear error and optionally a non-AI fallback.

