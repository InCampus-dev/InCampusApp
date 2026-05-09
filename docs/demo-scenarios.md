# Demo Scenarios

These scenario-level flows guide alpha planning. They do not require Phase 0 implementation beyond contracts and scaffolding.

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
