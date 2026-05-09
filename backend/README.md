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
