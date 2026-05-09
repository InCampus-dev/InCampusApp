# InCampus Backend

The backend is a Node.js / TypeScript / Express modular monolith.

Phase 0 implements only:

```http
GET /health
```

All business routes are contract-only until feature work begins. See `../docs/api-contract.md`.

## Local Commands

```bash
npm run dev --workspace backend
npm run lint --workspace backend
npm run build --workspace backend
npm test --workspace backend
```

## Package Boundaries

Packages under `backend/packages/` are logical module boundaries:

- `shared`
- `access-profile`
- `campus-administration`
- `hosting-lifecycle`
- `discovery-participation`
- `safety-moderation`
- `notifications-system-flow`

They are not separately deployed services.

D&P intentionally has no `src/entities/` folder because it owns no persistent store. Participation writes belong to H&L-owned interfaces or transaction services.

Shared Phase 0 / Phase 1 contract documents live at repository root under `../docs/`. Keep `backend/docs/` for backend-local notes only.
