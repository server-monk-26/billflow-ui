# Features

One folder per business capability. Each feature is **self-contained** and exposes a single
public barrel (`index.ts`) — the only legal import surface for other code (CLAUDE.md §4, §3.7).

```
features/<feature>/
├── api/         # RTK Query endpoints injected into baseApi (never a new createApi)
├── components/  # feature-only components (container/presentational split)
├── hooks/
├── model/       # slices, selectors, Zod schemas, types
├── routes/      # lazy route components, registered in app/router.tsx
└── index.ts     # PUBLIC barrel
```

## Phase 4 pattern (replicate for every feature)

A complete vertical slice:

1. **Zod schemas + types** in `model/` (single source of truth, §5/§13).
2. **RTK Query endpoints** in `api/` via `baseApi.injectEndpoints`, validating responses with
   the schema in `transformResponse`, using `providesTags`/`invalidatesTags` (§9).
3. **List** screen: `DataTable` with server pagination/sorting.
4. **Create/Edit** form: React Hook Form + `zodResolver`, shared UI inputs, mutation submit,
   server field errors mapped back via `setError` (§13).
5. **Detail** view.
6. **Permission gating** on UI (`<Can>`) and routes (`<ProtectedRoute>`) (§10).
7. **Audit events** for mutations (§16.3).
8. **Tests**: unit (model logic) + component + (critical flows) E2E. A feature without tests
   is not done (§21).

Register the feature's lazy routes in `src/app/router.tsx` and its nav entry comes from the
server-driven menu (§16.1).
