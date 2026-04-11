# API Doc Portal — Design Research & Strategy

**Date:** April 10, 2026
**Status:** Pre-build reference

---

## 1. Research Summary

Analysis of industry-leading portals (Stripe, Twilio, Notion, GitHub, Shopify, OpenAI) plus
academic and community sources on API doc UX.

### 1.1 What the Best Portals Get Right

| Pattern | What Leaders Do |
|---------|----------------|
| Layout | Three-column: sidebar nav + main content + code panel |
| Navigation | Hierarchical sidebar, collapsible groups, sticky on scroll |
| HTTP methods | Color-coded badges: GET (blue), POST (green), PUT (orange), PATCH (purple), DELETE (red) |
| Code examples | Multi-language tabs, syntax highlighting, one-click copy |
| Search | Real-time full-text, Cmd+K shortcut, results grouped by section |
| Endpoint display | Standardized template: badge + path + description + params table + responses + examples |
| Interactive | Embedded "Try It" console — build request, send, see live response |
| Readability | ~70-80 char line width, generous whitespace, clear H1–H5 hierarchy |
| Required fields | Red asterisk or "required" badge on every mandatory param |
| Deprecated items | Strikethrough + warning label |

### 1.2 The Stripe Standard (Gold Benchmark)

Stripe treats documentation as a product, not an afterthought:
- Three-column layout is now the industry standard because Stripe proved it works
- Code examples are injected with the user's actual API key when logged in (copy → paste → run)
- Every change to the API requires a docs update — enforced at the process level
- Custom tooling (Markdoc) built internally to handle their scale

### 1.3 OpenAPI Auto-Generated vs. Hand-Written

| Approach | Pros | Cons |
|----------|------|------|
| Auto-generated from OpenAPI | Always in sync, consistent structure, zero maintenance | Feels generic, lacks narrative context |
| Hand-written Markdown | Narrative, context, personality | Gets stale, maintenance burden |
| **Hybrid (our approach)** | **Accuracy of auto-gen + readability of hand-written** | Slightly more complex to render |

Our generator already produces both — we render both in the portal.

---

## 2. Portal Structure

### 2.1 Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Contracts Library | Browse all saved contracts |
| `/contracts/:slug/:timestamp` | Contract Detail | Read docs, view spec, download |
| `/generate` | Generate (modal/page) | Create a new contract |

### 2.2 Layout — Three-Column (Stripe Pattern)

```
┌──────────────┬───────────────────────────┬────────────────────┐
│  LEFT        │  CENTER                   │  RIGHT             │
│  Sidebar Nav │  Main Content             │  Code Panel        │
│  (240px)     │  (flexible)               │  (380px)           │
│              │                           │                    │
│  Search      │  Endpoint description     │  cURL / language   │
│  Endpoint    │  Parameter tables         │  tabs + copy btn   │
│  groups      │  Response schemas         │  Response preview  │
│  (collaps.)  │  Error catalogue          │                    │
└──────────────┴───────────────────────────┴────────────────────┘
```

On mobile: collapses to single column, sidebar becomes hamburger menu.

---

## 3. Screen-by-Screen Design

### 3.1 Screen A — Contracts Library (Home)

**Purpose:** Entry point. Show all generated contracts. Let user generate new ones.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🔷 API Doc Portal                          [Generate New ＋]   │
├─────────────────────────────────────────────────────────────────┤
│  Search contracts...                 [Filter: All ▾] [Sort ▾]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  api.restful-api.dev/objects              [endpoint]     │  │
│  │  6 endpoints  ·  Generated Apr 10, 2026, 07:55           │  │
│  │  [View Docs]   [↓ YAML]   [↓ JSON]   [↓ Markdown]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  github.com/org/my-api                        [repo]     │  │
│  │  12 endpoints  ·  Generated Apr 10, 2026, 06:20          │  │
│  │  [View Docs]   [↓ YAML]   [↓ JSON]   [↓ Markdown]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component details:**
- Each card: source name (bold), type badge (endpoint/repo, pill shape), endpoint count,
  timestamp, action buttons
- Filter dropdown: All / Endpoint / Repo
- Sort dropdown: Newest / Oldest / Alphabetical
- Empty state: illustration + "No contracts yet. Generate your first one."

---

### 3.2 Screen B — Contract Detail

**Purpose:** Full documentation view for one generated contract.

**Layout (three-column):**
```
┌────────────────┬───────────────────────────────┬──────────────────────┐
│ ← Library      │ api.restful-api.dev/objects    │  [↓ Download ▾]      │
│                │ Generated Apr 10, 2026         │                      │
├────────────────┼───────────────────────────────┼──────────────────────┤
│ 🔍 Search...   │ [Documentation] [OpenAPI Spec] │                      │
│                │                                │  ```bash             │
│ Overview       │ # Objects API                  │  curl -X GET \       │
│                │                                │  https://api.res...  │
│ ▾ Endpoints    │ A publicly accessible REST API  │  ```                 │
│   GET /objects │ for testing HTTP clients...    │  [Copy]              │
│   POST /objects│                                │                      │
│   GET /{id}    │ ── Endpoint Summary ──         │  ── Response ──      │
│   PUT /{id}    │                                │  200 OK              │
│   PATCH /{id}  │ ┌──────┬─────────────┬──────┐ │  ```json             │
│   DELETE /{id} │ │Method│ Path        │ Auth │ │  [                   │
│                │ ├──────┼─────────────┼──────┤ │    { "id": "1",      │
│ Authentication │ │ GET  │ /objects    │ None │ │      "name": "..." } │
│                │ │ POST │ /objects    │ None │ │  ]                   │
│ Error Codes    │ │ GET  │ /objects/id │ None │ │  ```                 │
│                │ └──────┴─────────────┴──────┘ │                      │
└────────────────┴───────────────────────────────┴──────────────────────┘
```

**Left sidebar:**
- Sticky on scroll
- Sections: Overview, Endpoints (collapsible list), Authentication, Error Codes
- Active section highlighted
- Clicking an endpoint scrolls the center panel to that section

**Center panel — Documentation tab:**
- Renders the Markdown contract with full formatting
- H1–H3 headings with anchor links
- Parameter tables with Required badge on mandatory fields
- HTTP method badges color-coded on each endpoint heading
- Response status code tabs (200, 400, 404, 500)

**Center panel — OpenAPI Spec tab:**
- Syntax-highlighted YAML viewer (read-only)
- Line numbers
- Copy full spec button

**Right code panel:**
- Shows cURL example for the currently visible endpoint (updates on scroll)
- Language tabs: cURL / Python / JavaScript / TypeScript
- One-click copy button on every code block
- Live response preview below the request example

---

### 3.3 Screen C — Generate New Contract

**Purpose:** Input form to trigger a new contract generation.

**Presented as:** Full-page modal (overlay), closeable with Esc or ✕.

```
┌─────────────────────────────────────────────────────────────────┐
│  Generate New Contract                                    [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Source type                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │  🌐 API Endpoint    │  │  📁 Repository       │             │
│  │  (selected)         │  │                      │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                 │
│  Endpoint URL *                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  HTTP Method        Description (optional AI hint)             │
│  [GET ▾]            ┌─────────────────────────────────────┐    │
│                     │ e.g. "User management endpoints"    │    │
│                     └─────────────────────────────────────┘    │
│                                                                 │
│  Authentication  [None ▾]                                       │
│  (expands to show token/key field when not None)                │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│                               [Cancel]  [Generate Contract →]   │
└─────────────────────────────────────────────────────────────────┘
```

**When Repository is selected**, form switches to:
- Repo URL (GitHub / GitLab HTTPS URL)
- Access Token (optional, for private repos)
- Branch (default: main)
- Service Path (default: `.`, for monorepos)
- Framework hint (optional dropdown: FastAPI, NestJS, Express, Spring Boot…)

**Generation states:**
```
[Generate Contract →]     ← idle

[⏳ Calling endpoint...]  ← step 1

[⚙️  Generating contract...] ← step 2 (Claude working)

[✅ Contract ready! View →]  ← success, auto-navigates to detail page
```

**Error state:** Inline error message below the form, form remains editable.

---

## 4. Component Library Plan

| Component | Description |
|-----------|-------------|
| `MethodBadge` | Colored pill: GET/POST/PUT/PATCH/DELETE |
| `ContractCard` | Library card with source, type, endpoint count, actions |
| `EndpointSection` | Full endpoint block: badge + path + description + params + responses |
| `ParamTable` | Table with name / type / required / description columns |
| `ResponsePanel` | Tabs for status codes, shows schema per code |
| `CodeBlock` | Syntax-highlighted block with language tabs + copy button |
| `SidebarNav` | Sticky hierarchical nav, active state tracking on scroll |
| `GenerateModal` | Form modal, endpoint/repo toggle, auth config, progress states |
| `SearchBar` | Real-time contract search with Cmd+K shortcut |
| `DownloadMenu` | Dropdown: YAML / JSON / Markdown download options |

---

## 5. Tech Stack (Recommended)

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | React + Vite | Fast dev, aligns with workspace pattern |
| Styling | Tailwind CSS | Rapid, consistent, no CSS files |
| Markdown rendering | `react-markdown` + `remark-gfm` | Full GFM support (tables, code fences) |
| Syntax highlighting | `react-syntax-highlighter` (Prism) | Language support + theming |
| Routing | React Router v6 | Standard, file-based routes |
| Data fetching | TanStack Query | Caching, loading states, error handling |
| Icons | Lucide React | Clean, consistent icon set |
| HTTP client | Axios | Backend API calls |

---

## 6. Backend Integration Points

The portal reads from what Phase 1 already produces:

| Portal Need | Backend Source |
|-------------|---------------|
| List all contracts | Scan `output/` directory or future DB |
| Load contract detail | Read `output/{slug}/{timestamp}/` files |
| OpenAPI YAML | `openapi.yaml` |
| OpenAPI JSON | `openapi.json` |
| Markdown doc | `contract.md` |
| Generate new | `POST /api/v1/generate/from-endpoint` or `/from-repo` |

A thin `/api/v1/contracts` listing endpoint will be needed on the backend to serve the file index to the portal. This is a Phase 2 backend addition.

---

## 7. Design Principles (Non-Negotiable)

1. **Accuracy first** — render exactly what was generated, no interpretation
2. **Always copy-able** — every code block has a copy button
3. **Scannable** — color-coded methods, clear hierarchy, short line width
4. **Download everywhere** — YAML, JSON, and Markdown downloadable from every view
5. **Fast** — no full-page reloads; client-side routing throughout
6. **Mobile-aware** — three-column collapses gracefully, no broken layouts
