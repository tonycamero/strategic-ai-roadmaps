# Backend Deployment Architecture Constraints (Non-Negotiable)

This backend is deployed as a Netlify Function using a prebuilt CommonJS artifact.

## Runtime Model

- Source: TypeScript (backend/src)
- Build step: esbuild → CommonJS bundle
- Output: backend/netlify/functions-dist/api.js
- Netlify: node_bundler="none"
- Lambda runtime: CommonJS only

## Absolute Rules

1. All relative imports in backend/src MUST include explicit `.ts` extensions.
   - Example: `import { x } from '../services/foo.service.ts'`
   - Index files must be explicit: `./content/index.ts`
   - No extensionless relative imports. Ever.

2. Do NOT re-enable zisi bundler.
3. Do NOT convert backend to full ESM.
4. Do NOT introduce dynamic import patterns that depend on Node ESM resolution.
5. The deployed artifact must be require()-safe.

## CI Enforcement

The GitHub Action verifies:
- build:functions succeeds
- api.js contains no top-level `import`
- require(api.js) executes without syntax error

If this file changes, architectural review is required.
