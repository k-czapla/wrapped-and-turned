# Canva API — Board Design Integration Assessment

- **Date**: 2026-02-12
- **Context**: Evaluating whether Canva’s APIs can support or replace the current in-app board design (Podcaster’s Assistant).

## Current board design (in-app)

- **Design source**: Predefined styles in `project-board-designs.ts` plus user customization (font, RGBA background/text/border) in `BoardDesignService`.
- **Rendering**: HTML/CSS in Angular; export via `html-to-image` to PNG (320×480px vertical card).
- **Data**: Project photo, pattern name, designer, size, yarn, app branding — all from app state.

## Canva API offerings (relevant parts)

### 1. Canva Connect APIs (REST)

| Capability | What it does | Fit for our board |
|------------|--------------|--------------------|
| **Create design** | `POST /designs` — create a design with type (preset or `custom`) and dimensions (40–8000px). Optional `asset_id` to add one image. | Creates an **empty** design (or one image). No way to set layout, text, or colors via API. We cannot “push” our card layout into Canva. |
| **Autofill** | Bulk personalize a **brand template** created in Canva. Send text/images per variant; get back generated designs. | Requires **Canva Enterprise**, a template built in Canva with Data autofill, and OAuth. Good for “same template, many data rows.” Would require rebuilding our board layout as a Canva template and maintaining it there. |
| **URL import** | Import a file from a URL (e.g. PPTX) as a new Canva design. | We could export our board as image/PDF and pass URL; user would get a Canva design to edit. That’s “export then open in Canva,” not “Canva designs our board.” |
| **Export** | Export a design to PNG/PDF etc. | Useful only if the design already exists in Canva (e.g. after Autofill or manual edit). |

### 2. Canva Apps SDK

- Apps run **inside** the Canva editor (effects, AI, etc.).
- Not for “our app asks Canva to render our board”; for extending Canva’s own product.

## Conclusion and options

- **Using Canva to “design” our board in place of current HTML/CSS**: **Not feasible** with the current APIs. Create design gives an empty canvas; we cannot define cards, typography, or colors via the API. Our board is effectively “template + data”; that map is only supported by **Autofill**, which is Enterprise-only and template-in-Canva–based.
- **Reasonable integration options**:
  1. **“Open in Canva” (export then edit)**  
     Export our board as PNG (or generate a URL), then use URL import (or upload) so the user gets a Canva design to edit. Improves “edit in Canva” workflow; does not change how we design the board.
  2. **Enterprise Autofill (future)**  
     If we ever target Canva Enterprise teams: build a board-style template in Canva, use Autofill to fill pattern/designer/yarn/photo per project. Would duplicate our layout in Canva and require auth + Enterprise.
  3. **Keep current approach**  
     In-app styles + customizer + `html-to-image` remain the right fit for a self-contained, no-Canova-account-required flow.

## Recommendation

- **Short term**: Keep the existing board design and export pipeline. No Canva dependency; works for all users.
- **Optional enhancement**: Add an “Open in Canva” (or “Export for Canva”) action that downloads the PNG and optionally opens Canva with that asset (e.g. via share or upload), documented as “edit further in Canva” rather than “design by Canva.”
- **If Canva Enterprise is in scope later**: Revisit Autofill with a dedicated Canva template that mirrors our board layout; document auth and rate limits (e.g. 10 autofill jobs/min/user).

## References

- [Canva Connect APIs](https://www.canva.dev/docs/connect/)
- [Create design](https://www.canva.dev/docs/connect/api-reference/designs/create-design/) — custom dimensions
- [Autofill](https://www.canva.dev/docs/connect/api-reference/autofills/) — bulk personalization (Enterprise)
- [URL import](https://www.canva.dev/docs/connect/api-reference/design-imports/create-url-import-job/)
