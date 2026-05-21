# API Contract

Phase 0 defines alpha client-facing routes. The route catalogue below reflects the current implemented demo surface and should be checked against source before larger contract changes.

## Contract Rules

- `CampusID` is the tenant boundary for student and admin flows.
- `AuthenticatedAdminContext` is runtime context only. There is no Campus Admin store.
- Cross-module writes must go through owning-module services or shared contracts.
- Notification opening and listing are read-only. Notification records have no `isRead`, `readAt`, or read/unread state.
- Pending request withdrawal creates no notification.
- Cancellation and deletion are distinct.

## Route Catalogue

| Method | Path | Owning module | Auth | Request DTO | Response DTO | Main errors |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/health` | Backend foundation | None | none | `HealthResponseDto` | none |
| POST | `/auth/signup` | AP | None | `SignUpRequestDto` | `AccountCreatedDto` | `VALIDATION_ERROR`, `UNSUPPORTED_EMAIL_DOMAIN`, `CONFLICT` |
| POST | `/auth/verify-email` | AP | None | `VerifyEmailRequestDto` | `AccountActivatedDto` | `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT` |
| POST | `/auth/signin` | AP | None | `SignInRequestDto` | `AuthenticatedResponseDto` | `AUTH_FORBIDDEN`, `ACCOUNT_NOT_VERIFIED`, `ACCOUNT_SUSPENDED`, `ACCOUNT_BANNED` |
| GET | `/campuses` | AP reads CA | Student | none | `CampusSummaryDto[]` | `AUTH_REQUIRED`, `NOT_FOUND` |
| GET | `/campuses/{campusId}/structured-options` | CA | Student | query params | `CampusStructuredOptionDto[]` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND` |
| PATCH | `/accounts/me/campus` | AP | Student | `SelectCampusRequestDto` | `CampusAssociatedDto` | `AUTH_REQUIRED`, `NOT_FOUND`, `CAMPUS_SCOPE_VIOLATION` |
| PATCH | `/accounts/me/consent` | AP | Student | `UpdateConsentRequestDto` | `ConsentUpdatedDto` | `AUTH_REQUIRED`, `VALIDATION_ERROR` |
| POST | `/profiles` | AP | Student | `CreateProfileRequestDto` | `StudentProfileDto` | `AUTH_REQUIRED`, `VALIDATION_ERROR`, `CONFLICT` |
| GET | `/profiles/me` | AP | Student | none | `StudentProfileDto` | `AUTH_REQUIRED`, `NOT_FOUND` |
| PATCH | `/profiles/me` | AP | Student | `UpdateProfileRequestDto` | `StudentProfileDto` | `AUTH_REQUIRED`, `VALIDATION_ERROR`, `NOT_FOUND` |
| GET | `/activities/{activityId}/profiles/{studentAccountId}` | D&P reads AP/SM | Student | path params | `PublicStudentProfileDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `BLOCK_RELATIONSHIP_EXISTS`, `TARGET_UNAVAILABLE` |
| POST | `/admin/campuses` | CA | Admin | `CreateCampusRequestDto` | `CampusCreatedDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT` |
| GET | `/admin/campuses/{campusId}/structured-options` | CA | Admin | query params | `CampusStructuredOptionDto[]` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND` |
| POST | `/admin/campuses/{campusId}/structured-options` | CA | Admin | `CreateStructuredOptionRequestDto` | `CampusStructuredOptionDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT` |
| PATCH | `/admin/campuses/{campusId}/structured-options/{optionId}` | CA | Admin | `UpdateStructuredOptionRequestDto` | `CampusStructuredOptionDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR` |
| DELETE | `/admin/campuses/{campusId}/structured-options/{optionId}` | CA | Admin | path params | `DeletionConfirmationDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `CONFLICT` |
| GET | `/admin/campuses/{campusId}/student-insights` | CA reads AP/H&L | Admin | query params | `ConsentBasedStudentInsightDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `CAMPUS_SCOPE_VIOLATION` |
| POST | `/activities` | H&L | Student | `CreateActivityRequestDto` | `ActivityCreatedDto` | `AUTH_REQUIRED`, `VALIDATION_ERROR`, `CAMPUS_SCOPE_VIOLATION`, `CONFLICT` |
| GET | `/activities` | D&P | Student | query params | `ActivitySummaryDto[]` | `AUTH_REQUIRED`, `CAMPUS_SCOPE_VIOLATION` |
| GET | `/activities/{activityId}` | D&P | Student | path params | `ActivityDetailDto` | `AUTH_REQUIRED`, `NOT_FOUND`, `BLOCK_RELATIONSHIP_EXISTS`, `TARGET_UNAVAILABLE` |
| POST | `/activities/{activityId}/join` | D&P orchestrates H&L | Student | path params | `JoinActivityResultDto` | `AUTH_REQUIRED`, `NOT_FOUND`, `BLOCK_RELATIONSHIP_EXISTS`, `CONFLICT`, `CONCURRENCY_CONFLICT` |
| DELETE | `/activities/{activityId}/requests/me` | D&P orchestrates H&L | Student | path params | `WithdrawalResultDto` | `AUTH_REQUIRED`, `NOT_FOUND`, `CONFLICT`, `CONCURRENCY_CONFLICT` |
| DELETE | `/activities/{activityId}/participants/me` | D&P orchestrates H&L | Student | path params | `LeaveActivityResultDto` | `AUTH_REQUIRED`, `NOT_FOUND`, `CONFLICT`, `CONCURRENCY_CONFLICT` |
| GET | `/profiles/me/activities` | D&P | Student | query params | `PersonalActivityListDto` | `AUTH_REQUIRED` |
| GET | `/activities/{activityId}/requests` | H&L | Student host | path params | `JoinRequestListDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND` |
| PATCH | `/activities/{activityId}/requests/{requestId}` | H&L | Student host | `DecideJoinRequestDto` | `JoinRequestDecisionDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `CONCURRENCY_CONFLICT` |
| PATCH | `/activities/{activityId}/status` | H&L | Student host | `UpdateActivityStatusRequestDto` | `ActivityStatusUpdatedDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT` |
| DELETE | `/activities/{activityId}` | H&L | Student host | path params | `DeletionConfirmationDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `CONFLICT` |
| GET | `/notifications` | NSF | Student | pagination query | `NotificationRecordDto[]` | `AUTH_REQUIRED` |
| GET | `/notifications/{notificationId}/context` | NSF | Student | path params | `NotificationContextDto` | `AUTH_REQUIRED`, `NOT_FOUND`, `AUTH_FORBIDDEN`, `BLOCK_RELATIONSHIP_EXISTS`, `TARGET_UNAVAILABLE` |
| GET | `/community-rules` | SM | Student | optional locale query | `CommunityRulesDto` | `AUTH_REQUIRED` |
| POST | `/reports` | SM | Student | `SubmitReportRequestDto` | `ReportSubmittedDto` | `AUTH_REQUIRED`, `VALIDATION_ERROR`, `CAMPUS_SCOPE_VIOLATION` |
| GET | `/admin/campuses/{campusId}/reports` | SM | Admin | query params | `ReportListDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `CAMPUS_SCOPE_VIOLATION` |
| GET | `/admin/campuses/{campusId}/reports/{reportId}` | SM | Admin | path params | `ReportDetailDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `TARGET_UNAVAILABLE` |
| PATCH | `/admin/campuses/{campusId}/reports/{reportId}/review` | SM | Admin | `ReviewReportRequestDto` | `ReportReviewedDto` | `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND` |
| POST | `/blocks` | SM | Student | `CreateBlockRequestDto` | `BlockCreatedDto` | `AUTH_REQUIRED`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT` |

## Known Documentation Mismatch

`GenderPreference` differs between the sprint plan and final source documents:

- Sprint plan enum: `all | male | female`
- Final entity documentation: `all | male_only | female_only`

The shared TypeScript foundation follows the final documentation and uses `all | male_only | female_only`.
