# Demo Readiness Review

This review tracks the integrated demo path after Francesco's T19/T16/T17/T20 work. It is meant to be updated after Matteo and Jacopo merge their remaining mobile/API tasks.

## Demo Path Status

| Step | Status | Evidence | Command or screen to verify | Owner if remaining issue |
| --- | --- | --- | --- | --- |
| Sign up / sign in | Partial | Backend sign-in is smoke-checkable with seeded accounts; sign-up still relies on mock email token delivery. | `npm run smoke:demo`; mobile `SignIn` / `SignUp` screens. | Jacopo for AP mobile polish/email flow. |
| Campus selection with refreshed token | Pass | Backend returns refreshed token after `PATCH /accounts/me/campus`; mobile stores `authToken` and `selectedCampusId`. | `npm run smoke:demo`; mobile `CampusSelection`. | None known. |
| Profile setup/read | Pass | Backend profile read is smoke-checkable; mobile create profile screen is wired. | `GET /profiles/me`; mobile `ProfileSetup`. | None known. |
| Create activity | Partial / blocked mobile | Backend create activity is conditional-smoke-checkable; mobile screen still uses mock option IDs and no `POST /activities`. | `npm run smoke:demo`; mobile `CreateActivity`. | Matteo / T09. |
| Feed refresh | Partial | Backend seeded feed/detail are smoke-checkable; mobile feed calls `GET /activities`, but refresh behavior is T10. | `GET /activities`; mobile `ActivityFeed`. | Matteo / T10. |
| Activity detail | Partial | Backend detail is smoke-checkable; mobile detail calls API but expects flattened host fields not guaranteed by backend DTO. | `GET /activities/:id`; mobile `ActivityDetails`. | Matteo for DTO/UI alignment. |
| Join/request | Partial | Backend direct join and request are smoke-checkable; mobile join button calls endpoint, full UX remains to verify. | `POST /activities/:id/join`; mobile `ActivityDetails`. | Matteo / T11. |
| Manage requests | Partial | Backend pending requests and approve/decline are smoke-checkable; mobile screen is present but DTO/display alignment remains to verify. | `GET/PATCH /activities/:id/requests`; mobile `ManageRequests`. | Matteo / T12. |
| Notifications/fallback | Partial | Backend records, list, context, and fallback are smoke-checkable; push delivery remains stubbed. | `GET /notifications`; `GET /notifications/:id/context`; mobile `NotificationList`. | Jacopo / T13 for mobile/delivery integration. |

## Final Bugs And Risks

### Blocker

- Mobile create activity is still mock-backed, using local category/location IDs and not calling `POST /activities`. This blocks a full mobile-only demo path until T09 lands.

### High

- Personal activity list remains a placeholder, so the participant history part of the demo is not mobile-ready.
- Mobile activity detail/manage-request DTOs may not match backend shapes, especially host profile and applicant display fields.
- Admin auth is still header-based and must remain local/demo only.

### Medium

- Email verification is still mock/console based, so seeded accounts are preferred for demos.
- Push delivery is still a `NotificationDispatcher` stub; only notification records/list/context are verifiable.
- CI does not run DB-backed migrations or end-to-end checks.

### Low

- Root and setup documentation still contains some historical Phase 0 language, although demo-specific docs now describe current checks.

## Known Limits

- Email verification mock.
- Push dispatcher stub.
- Provisional admin auth via headers.
- No DB-backed CI/e2e in the standard suite.
- Mobile feature completion depends on T09, T10, T11, T12, T13, and T15.

## Final Commands

Run these before opening or merging the PR:

```bash
git diff --check
npm run lint
npm run build
npm test
npm run typecheck --workspace mobile
```

Runtime demo checks:

```bash
npm run seed:demo
npm run smoke:demo
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

## PR Summary Draft

```text
Implemented Francesco demo readiness tasks:
- added local/demo seed runner with idempotent Tongji Jiading data;
- added backend smoke check for required and conditional demo-path API checks;
- documented demo seed, backend smoke, mobile run checklist, and integrated readiness review;
- kept mobile feature work owned by Matteo/Jacopo marked as partial/blocked instead of replacing it with hidden mocks.

Validation:
- git diff --check
- npm run lint
- npm run build
- npm test
- npm run typecheck --workspace mobile
```
