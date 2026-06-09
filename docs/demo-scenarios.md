# Demo Scenarios

These scenario-level flows guide the local alpha/demo path. Use `docs/demo-seed.md`, `docs/backend-smoke-check.md`, `docs/mobile-run-check.md`, and `docs/demo-readiness-review.md` for the current repeatable demo setup and verification status.

## Seeded Scenario Accounts

All local/demo student accounts use password `88888888`. Do not use these credentials for production or real deployments.

| Scenario | Account | Seeded data to open |
| --- | --- | --- |
| Manage Requests | `demo.host@tongji.edu.cn` | `Mandarin Practice Circle` has pending join requests. |
| Withdraw Request | `demo.guest@tongji.edu.cn` | `Mandarin Practice Circle` has this guest's pending request. |
| Joined/Leave state | `user1@tongji.edu.cn` | `Library Lunch Table` has this user as confirmed. |
| Normal browsing | `user2@tongji.edu.cn` through `user8@tongji.edu.cn` | Realistic feed spread across today, tomorrow, and the day after tomorrow. |
| Report review | Admin header context | Pending report targets `Main Gate Coffee Chat`. |

1. Student signs up with a supported university email, verifies the account, selects a campus, creates a Student Profile, and grants or refuses campus insight consent.
2. Host creates an activity using a campus category and meeting point from `campus_structured_options`.
3. Guest browses the campus activity feed, opens details, and directly joins or submits a join request.
4. Host reviews pending requests and approves or declines one request.
5. NSF creates notification records for direct join, request submission, and application outcome events.
6. Student opens notification context through the read-only route.
7. Student withdraws a pending request without notification creation.
8. Confirmed participant leaves a joined activity and the host receives a leave notification.
9. Host cancels an activity and confirmed participants receive cancellation notifications.
10. Student submits a report; Campus Admin reviews it and dispatches AP or H&L moderation commands when required.
11. Campus Admin views consent-based insights only for authorized campus scope and consenting students.

## Current Demo Verification

- Backend demo data: `npm run seed:demo`.
- Backend smoke check: `npm run smoke:demo`.
- Mobile run checklist: `docs/mobile-run-check.md`.
- Integrated readiness review: `docs/demo-readiness-review.md`.

Mobile tasks owned outside Francesco should remain marked partial or blocked here until their branches are merged. Do not replace those gaps with hidden mocks.
