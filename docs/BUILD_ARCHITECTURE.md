# Build & Deployment Architecture

**Last Updated:** 2025-12-23
**Status:** Frozen (Discovery Only)

## 1. Repo Topology

The repository follows a monorepo structure managed by `pnpm` workspaces.

### Top-Level Directories
*   `/backend` (Workspace Package: `@roadmap/backend`)
*   `/frontend` (Workspace Package: `@roadmap/frontend`)
*   `/shared` (Workspace Package: `@roadmap/shared`)
*   `/api` (Vercel Serverless Functions)
*   `/docs` (Documentation)

### Non-Workspace Directories
*   `node_modules` (Root modules)
*   `screenshots`
*   `.github`
*   `.git`

## 2. PNPM Workspace Model

Defined in `pnpm-workspace.yaml`:
```yaml
packages:
  - 'shared'
  - 'backend'
  - 'frontend'
```

### Workspace Packages

| Directory | Package Name | Workspace Dependency? | Review Status |
| :--- | :--- | :--- | :--- |
| `/shared` | `@roadmap/shared` | No | Shared types/libraries |
| `/backend` | `@roadmap/backend` | Depends on `@roadmap/shared` | Core API Logic |
| `/frontend` | `@roadmap/frontend` | Depends on `@roadmap/shared` | React UI |

### Root Build Command
(`package.json` -> `scripts.build`)
```bash
pnpm -r --filter @roadmap/shared --filter @roadmap/backend --filter @roadmap/frontend build
```
*   **Execution Order**: Topological (Shared -> Backend/Frontend).
*   **Filters**: Explicitly lists packages to avoid building potential future non-production packages.

## 3. Build Outputs

| Package | Build Script | Output Path | Artifact Content |
| :--- | :--- | :--- | :--- |
| `@roadmap/shared` | `tsc` | `/shared/dist` | Compiled JS + `.d.ts` |
| `@roadmap/backend` | `tsc` | `/backend/dist` | Compiled JS (Node.js) |
| `@roadmap/frontend`| `tsc && vite build` | `/frontend/dist` | Static HTML/CSS/JS (SPA) |

## 4. Vercel Integration

**Current Model**: **Serverless API (Backend Only)**

The repository is configured to deploy **only** Serverless Functions. The Frontend build artifact (`/frontend/dist`) is **not** served as a static site in this configuration.

### Deployment Config (`vercel.json`)
*   **Functions**: `api/**/*.ts` -> `nodejs20.x`
*   **Output Directory**: `(None)` - Explicitly removed to enable Serverless mode.
*   **Build Command**: Runs the full workspace build (Shared + Backend + Frontend).
    *   *Note*: Frontend is built but ignored by Vercel deployment.
*   **Install Command**: `pnpm install`

### Configuration Source
*   `vercel.json` is the source of truth for `functions` and `routes`.
*   Project Settings (UI) must have `Output Directory` cleared to match this config.

## 5. Routes & Runtime

### Entry Points
Vercel identifies entry points in the `/api` directory.

| File | Route | Runtime | Description |
| :--- | :--- | :--- | :--- |
| `/api/health.ts` | `/api/health` | Node.js 20.x | Simple status check (JSON) |
| `/api/index.js` | `/api/*` | Node.js | Legacy/Express adapter (Rewrite Target) |

### Routing Logic (`vercel.json` Rewrites)
1.  `/api/(.*)` -> `/api/index.js` (Wildcard capture)
2.  `/health` -> `/api/index.js`
3.  `/(.*)` -> `/index.html` (Legacy SPA fallback - currently inoperative as no static host)

## 6. Contradictions & Drift

1.  **Ghost Frontend Build**: The root build command builds `@roadmap/frontend`, but Vercel discards the output (`frontend/dist`) because `outputDirectory` is unset. This wastes build minutes.
2.  **Routing Ambiguity**: `vercel.json` rewrites all `/api/*` to `/api/index.js`, but `/api/health.ts` exists as a specific file. Vercel's behavior (File System vs Rewrite priority) determines which takes precedence (FS usually first).
3.  **Legacy Artifacts**: `/api/index.js` appears to be a bridge module but relies on a compiled backend distribution that might not be located where Vercel expects it in the serverless environment (requires bundling).

**Recommendation (Out of Scope)**:
*   Decide if Vercel should serve the Frontend. If YES, set `Output Directory` to `frontend/dist`.
*   If NO (API only), remove `@roadmap/frontend` from the build command to save time.
