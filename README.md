# BillFlow UI

Front end for **BillFlow** — a multi-tenant Billing SaaS (en-IN · ₹ INR · GST). Built to the
[Enterprise React Application Engineering Standards](./CLAUDE.md) and the BillFlow Design System
Spec. This repository is the **foundation** (Phases 0–1); feature slices are built on top.

> Read [`CLAUDE.md`](./CLAUDE.md) before contributing — it is the source of truth for how this
> project is built (the 10 golden rules, architecture, and phase order).

## Stack

React 19 · TypeScript (strict) · Vite · React Router v7 (lazy) · Redux Toolkit · RTK Query over a
single Axios instance · **Material UI** (themed from design tokens) · React Hook Form + Zod ·
TanStack Table · Recharts · react-i18next · Vitest + RTL + MSW · Playwright.

## Locked decisions (CLAUDE.md §22)

| Decision | Choice |
|----------|--------|
| UI library | **Material UI**, themed from the design tokens. The chosen library is confined to `shared/ui` + `shared/theme`. |
| Token storage | Tokens are **client-stored**: access token in memory (mirrored to sessionStorage for reload survival), refresh token + session id in sessionStorage. Centralized in `shared/auth/tokenStorage.ts`. Identity (userId/tenantId/roles) is decoded from the JWT. _(Backend integration deferred — login currently runs as a local dev stub; see below.)_ |
| Tenant resolution | From the **auth claim** at login. `X-Tenant-Id` attached by the Axios interceptor. |
| Feature flags | Static config now (`shared/feature-flags`), interface ready for a SaaS provider later. |
| Logging/audit sink | Configurable endpoint via `config` (`VITE_LOG_REMOTE_URL`, `VITE_AUDIT_ENDPOINT`). |

## Design system

A **token-driven** system (`src/shared/theme/tokens.css`). Six axes switch entirely via `data-*`
attributes on `<html>`, all read from the persisted `ui` slice:

`data-theme` (light/dark) · `data-accent` (rose/indigo/emerald/amber) · `data-density`
(compact/comfortable) · `data-radius` (sharp/normal/round) · `data-sidebar` (labeled/icon) ·
`data-font` (geist/plex/manrope).

The MUI theme (`muiTheme.ts`) is built from these tokens; components consume `var(--token)` so they
inherit every axis live. Numerics use the `mono` class (tabular figures) per the spec.

## Getting started

```bash
npm install
cp .env.example .env.development   # adjust as needed
npx msw init public                # generate the MSW worker (auto-runs on install)
npm run dev                        # http://localhost:5173
```

**Login** is at `/auth/login`. Backend integration is **deferred** — submitting establishes a
session locally (no HTTP) via `features/auth/devAuth.ts`: any username/password signs in and goes
to the dashboard, while username `newuser` simulates a first-time user routed to reset password.
Swap `createDevSession` for the real RTK Query login mutation when wiring the backend (the
Postman contract — enveloped `/api/auth/login`, SUCCESS vs PASSWORD_CHANGE_REQUIRED — is in git
history).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (proxies `/api` → `localhost:8080`). |
| `npm run build` | Type-check (`tsc -b`) + production build. |
| `npm run typecheck` | Type-check only. |
| `npm run lint` / `lint:fix` | ESLint (enforces the golden rules: no console, no deep imports, no direct UI-lib imports, no `import.meta.env` outside `config`). |
| `npm test` / `test:watch` / `test:coverage` | Vitest (≥80% on `shared/` + feature `model/`). |
| `npm run e2e` | Playwright. |

## Project structure

See [`CLAUDE.md` §4](./CLAUDE.md). In short: feature-based, each feature self-contained behind a
public barrel (`features/<x>/index.ts`); cross-feature deep imports and direct `@mui/*` imports are
blocked by ESLint.

```
src/
├── app/          # composition root: store, router, providers, layouts, App, ErrorBoundary
├── config/       # the ONLY place import.meta.env is read (Zod-validated, fail-fast)
├── shared/       # ui, theme, api, auth, tenant, permissions, feature-flags, audit, i18n, logger, lib
├── features/     # one folder per business capability (Phase 4+)
├── pages/        # thin route-level screens
└── mocks/        # MSW handlers (dev + tests)
```

## Status — what's built

- **Phase 0:** tooling (Vite/TS strict/ESLint boundaries/Prettier/Husky), `config` + `logger`.
- **Phase 1:** Redux store + typed hooks; `baseApi` + Axios instance + interceptors
  (auth/tenant/correlation/locale, AppError normalization, 401→refresh with stampede guard);
  token-driven theme (light/dark + 6 axes) + `ThemeProvider`; i18n bootstrap; lazy router shell
  with error boundary + 404/403; seed `shared/ui` (`Button`, `Loader`); RBAC primitives
  (`usePermissions`, `<Can>`, `<ProtectedRoute>`); tenant slice; feature-flag + audit scaffolding.

## What's next

- **Phase 2** — build the full `shared/ui` library (§6.1) with tests.
- **Phase 3** — real auth feature (RHF+Zod login, refresh, dynamic menus from server).
- **Phase 4** — first vertical feature slice (e.g. Invoices): list + DataTable + create/edit form +
  detail + RTK Query endpoints + tests. **Pause for review** — this proves the pattern.

Replicate the Phase 4 pattern (`src/features/README.md`) for every subsequent feature.
