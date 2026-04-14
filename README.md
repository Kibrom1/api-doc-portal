# api-doc-portal

React frontend for browsing, generating, and exporting API contracts produced by [api-doc-generator](../api-doc-generator). Provides a split-panel workspace where the contract list, endpoint navigation, documentation, and code examples are all visible simultaneously.

## Layout

```
┌────────────────┬──────────────────────────────────────────┬────────────────────┐
│ Contracts      │ Documentation / OpenAPI Spec              │ Request Examples   │
│ ─────────────  │ ──────────────────────────────────────── │ ────────────────── │
│ [+ New]        │  GET /objects                             │ [cURL][Py][JS][Java│
│ ○ Search...    │  ───────────────────────────────          │                    │
│                │  Summary · Tags · Description             │  curl -X GET ...   │
│ ▾ api.example  │                                           │                    │
│   2 versions   │  PATH parameters                          │                    │
│   ▾ Apr 10     │  ─────────────────                        │                    │
│     ▾ objects  │  id  string  yes  …                       │                    │
│       GET /… ● │                                           │                    │
│       POST /…  │  Responses                                │                    │
│   ▸ Apr 8      │  ▼ 200  OK  · ▶ show schema               │                    │
│                │  ▼ 404  Not Found                         │                    │
└────────────────┴──────────────────────────────────────────┴────────────────────┘
```

The left panel and right code panel are **resizable** by dragging the dividers. Widths persist in `localStorage`.

## Requirements

- Node.js 18+
- `api-doc-generator` running at `http://localhost:8000` (or configure `VITE_API_URL`)

## Setup

```bash
cd api-doc-portal
npm install
```

## Running

```bash
npm run dev       # dev server on http://localhost:5173
npm run build     # TypeScript check + Vite production build
npm run preview   # preview the production build locally
npm run lint      # ESLint
```

## Environment

Create `.env.local` if the backend is not on the default URL:

```env
VITE_API_URL=http://localhost:8000
```

Defaults to `http://localhost:8000` if not set.

---

## Features

### Contract list panel (left)

- Contracts are **grouped by source** (URL or repo path). Each group shows the source address with the protocol prefix (`https://`) stripped, and a version count.
- Clicking a group header **expands/collapses** its versions. Groups auto-expand when any of their versions is active.
- Clicking a version (formatted timestamp) **selects** it and loads its documentation in the center and right panels.
- When a version is selected, its endpoints appear **nested below it** in the sidebar, grouped by OpenAPI tag. Each tag group is independently collapsible.
- Clicking an endpoint row **jumps the docs panel** to that endpoint's documentation and highlights the row as active.
- **Search** filters groups by source address (case-insensitive substring).
- **[+ New]** button opens the generation modal.

### Generate modal

**Endpoint mode** — calls a live endpoint and generates from the observed response:

| Field | Required | Notes |
|---|---|---|
| Endpoint URL | yes | Must be `http(s)://...` |
| Method | no | GET / POST / PUT / PATCH / DELETE; default GET |
| Authentication | no | None / Bearer Token / API Key |
| Token / Key | if auth set | Sent as `Authorization: Bearer ...` or custom header |
| Description | no | Optional plain-English hint to Claude |

**Repository mode** — clones a repo, scores files, and generates from source code:

| Field | Required | Notes |
|---|---|---|
| Repository URL or local path | yes | GitHub, GitLab, or a local filesystem path |
| Branch | no | Default: `main` |
| Service path | no | Subdirectory for monorepos (e.g. `services/api`) |
| Access token | no | For private repos (`ghp_...`) |

**Duplicate detection:** If the entered URL/repo matches an existing contract's `source_ref`, an amber warning appears. Checking **Replace Documentation** tells the backend to delete all previous versions for that slug before saving the new one.

**Progress indicator:** During generation, three steps are shown with animated state (pending → active → done):
- Endpoint mode: *Calling endpoint → Analyzing response → Generating contract*
- Repo mode: *Cloning repository → Scanning source files → Generating contract*

An elapsed-second counter is shown. Typical generation takes 20–60 seconds. The modal cannot be closed while generation is in progress.

After success, the modal closes automatically and the new contract is selected.

### Documentation panel (center, Documentation tab)

Docs are rendered **directly from the parsed OpenAPI JSON** — not from the raw Markdown — so the structure is always consistent and navigable by endpoint.

**Overview** (no endpoint selected): API title, version badge, description, and all `servers[].url` base URLs.

**Endpoint view** (endpoint selected):
- Method badge + path + deprecated warning (when `deprecated: true`)
- Summary, tags (as accent-colored pills), and long description
- **Parameters** — grouped by location (path / query / header / cookie). Table: Name | Type | Required | Description. Deprecated params are flagged inline.
- **Request body** — content type header, required flag, and a properties table resolved from the schema. Shows `$ref` and `allOf` schemas correctly.
- **Responses** — one collapsible card per status code. Color-coded: green (2xx), amber (3xx), red (4xx/5xx). Expanding a card shows the response body's properties table.

Schema resolution: `$ref` pointers into `#/components/schemas/...` are resolved at render time. `allOf` schemas are merged (properties and required arrays combined) before display.

### Documentation panel (center, OpenAPI Spec tab)

Shows the raw OpenAPI 3.1.0 YAML with syntax highlighting, line numbers, and a one-click copy button. Max height scrolls within the panel.

### Code examples panel (right)

Generates a request example for the active endpoint in four languages:

| Tab | Runtime |
|---|---|
| cURL | Shell |
| Python | `requests` library |
| JavaScript | `fetch` (async/await) |
| Java | `java.net.http.HttpClient` — Java 11+ stdlib, no extra dependencies |

Examples are constructed from the endpoint method, path, and `servers[0].url`. Requests with a body (POST/PUT/PATCH) include `Content-Type: application/json` and an empty `{}` body placeholder.

### Export / download

Three download buttons in the info strip above the tabs:

| Button | File | Content |
|---|---|---|
| YAML | `{slug}-contract.yaml` | Raw OpenAPI 3.1.0 YAML from the generator |
| JSON | `{slug}-contract.json` | OpenAPI spec as pretty-printed JSON |
| HTML | `{slug}-contract.html` | Self-contained HTML page built from the Markdown doc via `unified` → `remark-parse` → `remark-gfm` → `remark-html`. Includes an embedded CSS stylesheet with typography, tables, code blocks, and responsive layout. No external dependencies. |

### Themes

Five themes, selectable from the header. Choice persists in `localStorage` as `api-doc-portal-theme`.

| Theme | Base background | Accent |
|---|---|---|
| Dark (default) | Dark blue-grey | Indigo |
| Light | White | Indigo |
| Midnight | Deep navy | Cyan |
| Dracula | Dracula dark | Pink |
| Nord | Nord arctic | Slate-blue |

All colors are CSS custom properties on `data-theme="..."` applied to `<html>`. The syntax highlighter uses `oneLight` for the Light theme and `oneDark` for all others.

---

## API integration

All requests go through an Axios client (`src/api/client.ts`) with `VITE_API_URL` as the base URL.

| Function | HTTP | Endpoint |
|---|---|---|
| `listContracts()` | GET | `/api/v1/contracts` |
| `getContract(slug, timestamp)` | GET | `/api/v1/contracts/{slug}/{timestamp}` |
| `generateFromEndpoint(payload)` | POST | `/api/v1/generate/from-endpoint` |
| `generateFromRepo(payload)` | POST | `/api/v1/generate/from-repo` |

Data is cached by **TanStack React Query**. The key `['contract', slug, timestamp]` is shared by the sidebar's `ContractEndpointList` and the main `ContractDetailPanels`. Expanding a version in the sidebar that is already loaded in the center panel reuses the cached result with no additional network request.

## Data types

```ts
// Returned by listContracts() — GET /api/v1/contracts
interface Contract {
  slug: string
  timestamp: string
  source: 'endpoint' | 'repo'
  source_ref: string
  generated_at: string
}

// Returned by getContract() and generate*() — full contract payload
interface ContractDetail {
  openapi_yaml: string
  openapi_json: Record<string, unknown>
  markdown_doc: string
  source: 'endpoint' | 'repo'
  source_ref: string
  generated_at: string
  saved_to: string
}
```

## State management

`WorkspacePage` owns all cross-panel state:

| State | Type | Purpose |
|---|---|---|
| `selected` | `{ slug, timestamp } \| null` | Which contract version is active |
| `activeEndpointId` | `string` | Which endpoint is highlighted/documented |
| `showModal` | `boolean` | Controls generation modal visibility |
| `sidebarWidth` | `number` | Left panel width (persisted) |

`selected` and `activeEndpointId` are both reset when switching to a different contract version. Selecting an endpoint from the sidebar calls `onSelectEndpoint(slug, timestamp, epId)` which sets both simultaneously.

## Project structure

```
src/
  api/
    client.ts                  — Axios instance, VITE_API_URL base URL
    contracts.ts               — listContracts, getContract, generateFromEndpoint, generateFromRepo
  components/
    ContractListPanel.tsx      — left sidebar: groups, versions, search, expand/collapse
    ContractEndpointList.tsx   — nested endpoint list grouped by OpenAPI tag (collapsible)
    ContractDetailPanels.tsx   — center + right panels, tabs (docs/spec), download buttons, info strip
    CodePanel.tsx              — request example panel (cURL / Python / JavaScript / Java)
    GenerateModal.tsx          — generation form with mode toggle, auth, duplicate detection, progress
    EmptyState.tsx             — shown when no contract is selected
    Layout.tsx                 — app shell, sticky header, theme selector dropdown
    documentation/
      DocsRenderer.tsx         — EndpointDoc, OverviewDoc, ParametersSection,
                                  RequestBodySection, ResponsesSection, PropertiesTable
    ui/
      CodeBlock.tsx            — syntax-highlighted block with copy button (theme-aware)
      DiffViewer.tsx           — line diff renderer (reserved for future release)
      MethodBadge.tsx          — colored HTTP method pill (GET/POST/PUT/PATCH/DELETE)
      ResizeHandle.tsx         — drag-to-resize divider (left or right side)
      SourceBadge.tsx          — endpoint / repo badge pill
      Spinner.tsx              — animated loading spinner
  context/
    ThemeContext.tsx            — ThemeProvider, useTheme(), THEMES array, ThemeId type
  pages/
    WorkspacePage.tsx           — single-page layout, owns selected + activeEndpointId state
  types/
    index.ts                    — Contract, ContractDetail, GenerateEndpointPayload, GenerateRepoPayload
  utils/
    schema.ts                   — extractEndpoints, groupByTag, resolveSchema ($ref + allOf),
                                  resolveRef, typeLabel
  App.tsx                       — mounts Layout wrapping WorkspacePage
  main.tsx                      — ReactDOM entry point, QueryClientProvider, ThemeProvider
```
