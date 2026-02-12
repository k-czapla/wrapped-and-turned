# Canva board design — PoC: what you need to provide

We can run a **proof-of-concept** that uses your existing Canva board design to generate project boards via the **Autofill API**. Here’s what’s required and what you’d need to provide.

---

## 1. Canva account / organization

- **Canva Enterprise** is required for the Autofill API (the integration acts on behalf of users in an Enterprise organization). If you don’t have Enterprise, see the [lighter PoC option](#if-you-dont-have-canva-enterprise) below.
- Your Canva account must have **Multi-factor Authentication (MFA)** enabled (needed for the Developer Portal).

---

## 2. Turn your design into an autofillable brand template

Your board design must be set up as a **brand template** with **Data autofill** so the API can fill in project data.

**In Canva:**

1. **Open your board design** (the one you want to use for the PoC).
2. **Data autofill**  
   - Use the **Data autofill** app (e.g. “Connect data” / “Data” in Canva).  
   - For each element that should come from our app, assign a **data field**:
     - **Text**: e.g. pattern name, designer, size, yarn, project name.  
     - **Image**: the project photo.  
   - Note the **exact field names** you use (e.g. `PATTERN_NAME`, `DESIGNER`, `PROJECT_PHOTO`) — we’ll map our board data to these.
3. **Publish as brand template**  
   - Save/publish this design as a **brand template** in your (Enterprise) brand.

**What to send us:**

- **Brand ID** (from Canva: Brand → Settings or API docs).
- **Brand template ID** (the ID of the template that is your board design).
- **List of data field names and types** you set in Data autofill, for example:

  | Field name (exact) | Type   | Our mapping (example)   |
  |-------------------|--------|--------------------------|
  | `PATTERN_NAME`    | text   | pattern name             |
  | `DESIGNER`        | text   | designer name            |
  | `SIZE`            | text   | size made                |
  | `YARN`            | text   | yarn used                |
  | `PROJECT_PHOTO`   | image  | first project photo URL  |

  (We can also discover fields via the API once we have Brand ID + Template ID.)

---

## 3. Canva Connect integration (OAuth)

So our app can call the Autofill API on your behalf:

1. Go to **[Canva Developer Portal](https://www.canva.com/developers/)** → **Your integrations** → **Create an integration**.
2. Choose **Private** (Enterprise teams).
3. Under **Credentials**, copy:
   - **Client ID**
   - **Client secret** (generate and save once; it’s not shown again).
4. Under **Scopes**, add at least:
   - `brandtemplate:content:read`
   - `design:content:write`
5. Under **Authentication**, add a **Redirect URL** (e.g. for local PoC: `http://127.0.0.1:4200/canva-callback` or whatever our frontend will use).

**What to send us (via secure channel / env vars, not in chat):**

- **Client ID**
- **Client secret**  
These will go into backend environment variables (e.g. `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`).

---

## 4. Optional but helpful

- **Screenshot or export (PNG)** of your Canva board design — so we can align layout and field mapping.
- **Design dimensions** (e.g. 1080×1920 for Stories) if you care about exact export size — we can match that in the export step.

---

## What we’ll build for the PoC

- **Backend**: Auth flow (OAuth 2.0 + PKCE) with Canva, store access token; endpoint that accepts project id(s), calls Canva “get brand template dataset” then “create design autofill job” with mapped data (pattern, designer, size, yarn, photo URL), then “create design export job” to get PNG.
- **Frontend**: Optional “Generate with Canva template” path that uses this backend and shows/downloads the resulting PNG.
- **Config**: Brand ID + Template ID in env or config; field name mapping in code (or config).

---

## If you don’t have Canva Enterprise (Option B — implemented)

We do a **lighter PoC**:

- You **export your board design from Canva as PNG** (empty or with sample content).
- You place the file at **`frontend/public/canva-reference-board.png`** (see `frontend/public/README-canva-reference.md`).
- We use it as a **visual reference** to mimic the layout in our existing in-app board (HTML/CSS), so the Podcaster’s Assistant output “looks like” your Canva design, but we don’t call the Canva API.

That doesn’t prove the Autofill flow, but it does prove we can match your design in our app.

---

## Summary checklist (Autofill PoC)

| You provide | Purpose |
|-------------|--------|
| Canva Enterprise + MFA | Required for Autofill API |
| Design set up as brand template with Data autofill | So API can fill text/image fields |
| Brand ID + Brand template ID | Which template to use |
| Data field names (and types) | Map our board data → Canva fields |
| Client ID + Client secret (Developer Portal) | OAuth for our backend |
| Redirect URL configured in portal | So Canva can redirect after login |
| (Optional) PNG/screenshot + dimensions | Align layout and export size |

Once we have the IDs, credentials, and field list, we can wire up the PoC backend and a minimal frontend path to “generate board via your Canva template.”
