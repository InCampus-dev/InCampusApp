# Mobile QA Buglist - Jacopo J1 (Validated)

Date: 2026-05-17
Branch: `main`
Commit: `1dfcd4e` (`Merge pull request #39 from MatteoSilvestro/docs/francesco-final-readiness-reconciliation`)
Scope: Jacopo-owned mobile QA screens only
Reviewed by: Peer QA review (Phase 1 validation against source code)

---

## Validated Bugs

BUG-1
Screen: NotificationFallbackScreen
Area: contract
Severity: minor
Status: CONFIRMED
Description: The screen component signature is `({ navigation }: { navigation: any })` and does not destructure or read the `route` prop. The navigator declares `NotificationFallback: { reason?: string }`, but the screen ignores this param entirely. All fallback reasons (`TargetActivityUnavailable`, `BlockRelationshipExists`, `MissingActivityContext`, `UnknownNotificationTarget`) display the same generic "Content Unavailable" message.
Reproduction: Navigate to `NotificationFallback` with `{ reason: 'BlockRelationshipExists' }`; the screen renders only the hardcoded generic copy regardless of reason.
Suggested owner: Jacopo
Review note: Verified at NotificationFallbackScreen.tsx:6 -- component signature lacks `route` param entirely. Navigator type at AppNavigator.tsx:33 confirms `reason` is declared as an optional string param.

BUG-2
Screen: NotificationListScreen
Area: navigation
Severity: minor
Status: CONFIRMED
Description: The `handleTapNotification` catch block navigates to `NotificationFallback` without forwarding the error code as the `reason` param. The success path in `navigateToNotificationContext` correctly passes `{ reason: context.fallbackReason }` in all branches, but the error path does not.
Reproduction: Trigger `GET /notifications/{id}/context` to fail with error code `BlockRelationshipExists`; `handleTapNotification` catch at line 129 calls `navigation.navigate('NotificationFallback')` with no params.
Suggested owner: Jacopo
Review note: Verified at NotificationListScreen.tsx:129. The success path (lines 139-152) correctly passes reason in all four branches. Only the error catch block omits it. Note: even if fixed, BUG-1 must also be fixed for the reason to render.

BUG-3
Screen: CommunityRulesScreen
Area: empty
Severity: minor
Status: CONFIRMED
Description: When the API returns `{ locale, title, sections: [] }`, the expression `rules?.sections ?? FALLBACK_RULE_SECTIONS` evaluates to `[]` because the nullish coalescing operator does not treat an empty array as nullish. The screen renders the title/subtitle and zero rule cards with no empty-state message.
Reproduction: Return `{ locale: "en", title: "Rules", sections: [] }` from `GET /community-rules`; after loading completes, the screen shows the title but no cards and no indication that no rules exist.
Suggested owner: Jacopo
Review note: Verified at CommunityRulesScreen.tsx:83. The `??` operator only triggers for `null`/`undefined`, not `[]`. Fallback sections (lines 93-104) only render when `rules` itself is null (initial/error state).

BUG-4
Screen: ReportSubmissionScreen
Area: navigation
Severity: minor
Status: INVALID
Description: Codex reported that opening the screen without target context requires manual ID entry. However, the navigator type at AppNavigator.tsx:36-38 explicitly declares all params as optional (`targetType?`, `targetActivityId?`, `targetAccountId?`). The screen is designed to work with or without pre-filled context. Manual entry is the intended fallback, not a bug.
Reproduction: N/A
Suggested owner: Jacopo
Review note: DISMISSED. Route params are optional by type definition. The screen correctly initializes empty fields when params are absent (ReportSubmissionScreen.tsx:26-28). This is a feature request for a contextual picker, not a code defect.

BUG-5
Screen: ReportSubmissionScreen
Area: type
Severity: minor
Status: CONFIRMED
Description: `route?.params?.targetType` is cast to `ReportTargetType | undefined` via `as` without runtime validation. An invalid value (e.g., `'campus'`) passes through the nullish coalescing as truthy, sets `targetType` to the invalid string, leaves neither segment visually selected, and bypasses both client-side ID validation checks (which only trigger for `'activity'` and `'student'`). The submit sends an unsupported `targetType` to `POST /reports`.
Reproduction: Navigate to `ReportSubmission` with `{ targetType: 'campus' as any }`; no segment is highlighted, no ID field is required, and submit sends `targetType: 'campus'` to the backend.
Suggested owner: Jacopo
Review note: Verified at ReportSubmissionScreen.tsx:25-26. The `as` cast at line 25 has no runtime guard. Validation at lines 180-184 only checks `'activity'` and `'student'`, so any other value silently passes client-side validation.

BUG-6
Screen: BlockUserScreen
Area: navigation
Severity: minor
Status: INVALID
Description: Codex reported that opening the screen without `targetAccountId` requires manual entry. However, the screen itself explicitly documents this as intended MVP behavior at lines 66-68: "If this screen is opened without a profile context, enter the target ID manually."
Reproduction: N/A
Suggested owner: Jacopo
Review note: DISMISSED. The placeholder note at BlockUserScreen.tsx:66-68 confirms this is a known design choice. Route params are optional by type definition (AppNavigator.tsx:39). Not a bug.

BUG-7
Screen: BlockUserScreen
Area: type
Severity: minor
Status: CONFIRMED
Description: `route?.params?.targetAccountId` is read from `route: any` and used as the initial `useState` value. If a non-string value is passed (e.g., `123`), the state holds a number. The `handleBlock` function at line 18 calls `targetAccountId.trim()`, which throws `TypeError` on non-string values.
Reproduction: Navigate to `BlockUser` with `{ targetAccountId: 123 as any }`, then tap "Block Student"; `(123).trim()` throws at runtime.
Suggested owner: Jacopo
Review note: Verified at BlockUserScreen.tsx:14 and :18. The `any` route type provides no type safety, and `.trim()` assumes string. The crash requires a programming error in the caller but is a real runtime fault.

BUG-8
Screen: ConsentSettingsScreen
Area: contract
Severity: major
Status: CONFIRMED
Description: `handleSkip()` calls `handleContinue()` without resetting `consentEnabled` to `false`. If the user toggles the consent switch ON and then taps "Skip for now," the PATCH to `/accounts/me/consent` sends `campusInsightSharingConsent: true`, contradicting the skip/refusal intent. The inline comment at line 45 says "Save as false (default)" but the code does not enforce this.
Reproduction: Open `ConsentSettings`, toggle "Share my data with campus staff" ON, then tap "Skip for now"; the API call at line 24 sends `{ campusInsightSharingConsent: true }`.
Suggested owner: Jacopo
Review note: Verified at ConsentSettingsScreen.tsx:44-48 and :20-26. `handleSkip` delegates to `handleContinue` which reads the current `consentEnabled` state. The comment-code mismatch confirms this was intended to force false but does not. Major severity is warranted because it silently grants consent when the user intended to refuse.

BUG-9
Screen: PersonalActivityListScreen
Area: contract
Severity: minor
Status: CONFIRMED
Description: The History section empty-state text reads "Completed, cancelled, deleted, or past activities will appear here when available." If the backend hard-deletes activities, deleted records cannot appear in the personal activity list, making the "deleted" mention misleading.
Reproduction: Delete an activity, then open `PersonalActivityList`; the deleted activity is absent, but the empty-state copy implies it should appear.
Suggested owner: Jacopo
Review note: Verified at PersonalActivityListScreen.tsx:131. The copy mentions "deleted" activities but backend behavior determines whether soft-deleted records are queryable. If hard-delete is confirmed, the copy is inaccurate. Minor severity as it is a text/UX issue, not a functional defect.

BUG-10
Screen: ReportSubmissionScreen
Area: type
Severity: minor
Status: ADDED-BY-REVIEW
Description: `route?.params?.targetActivityId` and `route?.params?.targetAccountId` are read from `route: any` and used as initial `useState` values without type validation. If either is passed as a non-string (e.g., a number), the `handleSubmit` function calls `.trim()` on the value at lines 57-58, which throws `TypeError` on non-string values. Same class of bug as BUG-7 on BlockUserScreen.
Reproduction: Navigate to `ReportSubmission` with `{ targetActivityId: 123 as any, targetType: 'activity' }`, then tap "Submit Report"; `(123).trim()` throws at runtime.
Suggested owner: Jacopo
Review note: Verified at ReportSubmissionScreen.tsx:27-28 and :57-58. Both ID fields use `.trim()` in the submit handler without verifying the value is a string. The `route: any` type provides no compile-time safety.

---

## Review Summary

- Bugs reviewed: 9
- Confirmed as-is: 5 (BUG-1, BUG-2, BUG-3, BUG-5, BUG-7)
- Severity adjusted: 0
- Dismissed as invalid: 2 -- BUG-4 (optional params by design, not a code defect), BUG-6 (explicitly documented as intended MVP behavior at BlockUserScreen.tsx:66-68)
- New bugs added by review: 1 -- BUG-10 (ReportSubmissionScreen `.trim()` crash on non-string route params, same class as BUG-7)
- Items still marked [to verify]: 0
- Confirmed with correct severity: BUG-8 (major), BUG-9 (minor)
- Screens with zero confirmed bugs: none (every Jacopo-owned screen has at least one finding)
- Recommended next step: Fix BUG-8 first (ConsentSettingsScreen skip-consent logic) as it is the only major-severity bug and directly affects user consent correctness; then batch-fix the type-safety bugs (BUG-5, BUG-7, BUG-10) since they share the same root cause (`route: any` with no runtime validation).
