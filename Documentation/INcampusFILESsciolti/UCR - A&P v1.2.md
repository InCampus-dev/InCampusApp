# UCR - A\&P v1.2

## Version Log

| Version | Date       | Section modified                                           | Description of change                                                                                                             | Reason for change                                                                                                   | Source document used as reference                                                 |
| ------- | ---------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1.1     | 2026-05-04 | Events summary; internal interfaces; moderation open point | Added the AP receiver side for account moderation consequences and clarified that AP updates only DS-AP-001.PlatformAccessStatus. | SM may trigger AP-native suspension/ban consequences, but AP previously did not explicitly model the receiver side. | UCR Critical Integration Review; SM DFD workdoc; AP DFD workdoc; CRUD Matrix v1.5 |
| 1.2   | 2026-05-08 | Student Profile naming; consent/Admin Insights; moderation command vocabulary | Aligned canonical `DS-AP-002 Student Profile` naming, kept minimal public profile wording descriptive, confirmed `DUC-AP-07` as MVP consent handling, and aligned AP moderation receiver scope with final `ModerationAction` vocabulary. | Required before using the UCR as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

Candidate API paths, controller names, service names, and sequence filenames in this UCR are first-skeleton scaffolding unless explicitly accepted elsewhere as final contracts.

## Subsystem: Access and Profile

## 1. Subsystem Responsibility

The Access and Profile subsystem manages university-verified student identity, authentication, campus onboarding, Student Profile lifecycle, context-limited profile viewing, and campus insight sharing consent. It establishes who may enter the system, to which campus context that user belongs, and what minimal public profile data will later be available in trust-sensitive activity contexts. It does not create activities, manage participations, own block relationships, create notification records, or perform moderation actions.

***

## 2. Owned Data Stores

```
Owned stores:
- DS-AP-001 (UserAccountStore) — Student account identity, university email, verification state, password hash, platform access status, selected campus association, and campus insight sharing consent.
- DS-AP-002 (StudentProfileStore) — Student Profile data, exposed only as minimal public profile data in allowed contexts (display name, major, date of birth, gender, interests, languages, short bio, timestamps).
- DS-AP-003 (DomainRulesStore) — University email-domain validation rules used during sign-up.
```

***

## 3. External Data Dependencies

```
External dependencies:
- DS-CA-001 (CampusStore) — Read during Select Campus to retrieve the list of campuses associated with the student's university.
- DS-SM-001 (BlockListStore) — Read during View Student Profile to enforce reciprocal block-based visibility constraints before exposing profile data.
```

***

## 4. Use Case Realizations

***

# DUC-AP-01 — Sign Up with University Email

## Source Use Case

```
Sign Up with University Email
```

## Related Requirements

```
FR: FR-0101, FR-0102, FR-0103, FR-0104, FR-0105
NFR: NFR-01, NFR-02, NFR-03, NFR-04, NFR-05
```

## Implementation Goal

Allow a new student to create an account by entering a university email address, validating the email domain against supported university identity rules, sending a verification email, creating the account record, and activating the account only after successful email verification. The process must also create the password credential state and derive the university association from the verified email domain to support subsequent campus selection.

## Boundary Objects

```
- SignUpScreen
- EmailVerificationScreen
- EmailDeliveryGateway
```

## Control Objects / Services

```
- SignUpController
- DomainValidationService
- EmailVerificationService
- AccountActivationService
```

## Entity Objects / Data Stores

```
- StudentAccount / DS-AP-001
- UniversityIdentityRule / DS-AP-003
```

## Candidate Client-Facing API

| Method + Path             | Purpose                                                              | Input                                                   | Output                                                               | Reads         | Writes        | Events / Notes                                                             |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- | ------------- | ------------- | -------------------------------------------------------------------------- |
| `POST /auth/signup`       | Register a new student account with a university email and password. | `universityEmail`, `password`, `universityStudentId`    | `accountCreated` with pending verification status, or error response | DS-AP-003     | DS-AP-001 (C) | Triggers verification email dispatch via EmailDeliveryGateway.             |
| `POST /auth/verify-email` | Complete email verification and activate the account.                | `verificationToken` (or equivalent mechanism reference) | `accountActivated` or error response                                 | DS-AP-001 (R) | DS-AP-001 (U) | Updates VerificationStatus to Verified and PlatformAccessStatus to Active. |

Possible error outputs:

```
UnsupportedEmailDomain
EmailAlreadyRegistered
InvalidVerificationToken
VerificationExpired
```

## Main Design Flow

```
1. The student opens SignUpScreen and enters a university email address, password, and university student ID.
2. SignUpController forwards the request to the Access and Profile module.
3. DomainValidationService reads DS-AP-003 to check whether the email domain matches a supported university identity rule.
4. If the domain is unsupported, the module returns an UnsupportedEmailDomain error. No account is created.
5. If the domain is valid, AccountActivationService creates a new StudentAccount record in DS-AP-001 with VerificationStatus = Pending, PlatformAccessStatus = PendingVerification, the hashed password, and the university student ID.
6. EmailVerificationService dispatches a verification email through EmailDeliveryGateway to the provided university email address.
7. The student completes verification (e.g., clicks verification link), which triggers the POST /auth/verify-email endpoint.
8. AccountActivationService reads DS-AP-001 to locate the account by the verification token context.
9. AccountActivationService updates DS-AP-001: VerificationStatus → Verified, PlatformAccessStatus → Active.
10. The system derives the university association from the verified email domain (FR-0105) and makes it available for the subsequent campus selection step.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- Only university-affiliated email domains listed in DS-AP-003 are accepted (FR-0102).
- The account must not be activated before email verification is completed (FR-0104).
- Duplicate accounts for the same university email must be prevented (NFR-04).
- Password must be stored as a hash; plain passwords must never be persisted.
- Verification email must be sent within a short time after registration (NFR-03).
- The domain validation mechanism must support future expansion to multiple universities (NFR-05).
```

## Postconditions in Design Terms

```
- DS-AP-001 contains a new StudentAccount record with VerificationStatus = Verified and PlatformAccessStatus = Active (after successful verification).
- DS-AP-003 was read but not modified.
- No notification record is created by AP. Sign-up is not a notification-triggering event in the current architecture.
- The university association is derived and available for subsequent campus selection.
```

## Related Diagrams Suggested

```
- signup_verification_sequence.puml
```

## Open Points / Assumptions

```
- Assumption for modeling only: The exact verification mechanism (email link, code entry, university SSO redirect) is modeled abstractly as a verification token exchange. The business rule is confirmed; the technical form is not fixed.
- Assumption for modeling only: Password creation is modeled as part of the sign-up request. Whether a separate password-creation step exists after verification is not specified.
- Unresolved: Exact uniqueness scope for UniversityStudentID (globally unique vs. unique within university context).
```

***

# DUC-AP-02 — Sign In

## Source Use Case

```
Sign In
```

## Related Requirements

```
FR: FR-1501
NFR: NFR-29
```

## Implementation Goal

Allow a student with an existing verified account to authenticate using their university email and password, granting access to the app through the existing account while protecting credentials during the process.

## Boundary Objects

```
- SignInScreen
```

## Control Objects / Services

```
- SignInController
- AuthenticationService
```

## Entity Objects / Data Stores

```
- StudentAccount / DS-AP-001
```

## Candidate Client-Facing API

| Method + Path       | Purpose                                                              | Input                         | Output                                                        | Reads         | Writes | Events / Notes                                                                   |
| ------------------- | -------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------- | ------------- | ------ | -------------------------------------------------------------------------------- |
| `POST /auth/signin` | Authenticate a student using verified university email and password. | `universityEmail`, `password` | `authenticated` with session/token context, or error response | DS-AP-001 (R) | —      | Session/token management is implementation-level and excluded from logical CRUD. |

Possible error outputs:

```
InvalidCredentials
AccountNotVerified
AccountSuspended
AccountBanned
```

## Main Design Flow

```
1. The student opens SignInScreen and enters university email and password.
2. SignInController forwards the credentials to the Access and Profile module.
3. AuthenticationService reads DS-AP-001 to locate a StudentAccount matching the provided university email.
4. AuthenticationService verifies the submitted password against the stored PasswordHash.
5. AuthenticationService checks that VerificationStatus = Verified and PlatformAccessStatus = Active.
6. If credentials are invalid or the account is not verified/active, the module returns the appropriate error. No access is granted.
7. If authentication succeeds, the module grants access and returns session/token context to the client.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- Only verified accounts with PlatformAccessStatus = Active may sign in (FR-1501).
- Authentication credentials must be protected during the sign-in process (NFR-29).
- Suspended or banned accounts must be rejected with appropriate feedback.
- Session/token management is an implementation concern excluded from the logical CRUD model.
```

## Postconditions in Design Terms

```
- DS-AP-001 was read but not modified at the logical CRUD level.
- The student is granted authenticated access to the app through the existing account.
- No event is emitted.
```

## Related Diagrams Suggested

```
- signin_sequence.puml
```

## Open Points / Assumptions

```
- Assumption for modeling only: Session or token management is excluded from the logical model. The CRUD Matrix records only a read on DS-AP-001.
- Unresolved: Whether rate limiting or account lockout after failed attempts is required is not specified in current FRs/NFRs.
```

***

# DUC-AP-03 — Select Campus

## Source Use Case

```
Select Campus
```

## Related Requirements

```
FR: FR-0105, FR-1601
NFR: NFR-30
```

## Implementation Goal

Allow a student to select or confirm the campus associated with their university during onboarding, so that all subsequent campus-scoped content (activity feed, categories, locations) is filtered to the selected campus. The system reads configured campuses from the Campus Administration store and updates the student's account with the selected campus association.

## Boundary Objects

```
- CampusSelectionScreen
```

## Control Objects / Services

```
- CampusSelectionController
- CampusAssociationService
```

## Entity Objects / Data Stores

```
- StudentAccount / DS-AP-001
- Campus / DS-CA-001
```

## Candidate Client-Facing API

| Method + Path               | Purpose                                                                                | Input                                                                         | Output                                            | Reads         | Writes        | Events / Notes                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `GET /campuses`             | Retrieve the list of active campuses associated with the student's derived university. | Authenticated student context (university derived from verified email domain) | List of campus objects (`campusId`, `campusName`) | DS-CA-001 (R) | —             | Filters by university association derived from authenticated context and ActivationStatus = True. |
| `PATCH /accounts/me/campus` | Associate the authenticated student's account with the selected campus.                | `campusId`                                                                    | `campusAssociated` or error response              | DS-AP-001 (R) | DS-AP-001 (U) | Updates SelectedCampusID on the student account.                                                  |

Possible error outputs:

```
CampusNotFound
CampusNotAssociatedWithUniversity
CampusNotActive
NoCampusesConfigured
```

## Main Design Flow

```
1. The student reaches CampusSelectionScreen during the post-registration onboarding flow.
2. CampusSelectionController requests the list of available campuses from the Access and Profile module.
3. CampusAssociationService derives the student's university from the verified email domain (FR-0105).
4. CampusAssociationService reads DS-CA-001 to retrieve campuses associated with that university where ActivationStatus = True.
5. If no campuses are configured, the module returns a NoCampusesConfigured response. Onboarding cannot be completed.
6. The module returns the list of available campuses to CampusSelectionScreen.
7. The student selects a campus and confirms the selection.
8. CampusSelectionController forwards the selection to CampusAssociationService.
9. CampusAssociationService validates the selected campusId against the previously retrieved list.
10. CampusAssociationService reads and updates DS-AP-001, setting SelectedCampusID to the confirmed campus.
11. The system confirms the campus association and the onboarding flow proceeds.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- Campus scope is the main tenant boundary (CampusID). All downstream content is filtered through it.
- Only campuses associated with the student's university and with ActivationStatus = True may be selected.
- The campus list is read from DS-CA-001 owned by Campus Administration. AP does not create or modify campus records.
- Campus options must be presented clearly so students can identify the correct campus without confusion (NFR-30).
```

## Postconditions in Design Terms

```
- DS-AP-001 is updated with the selected SelectedCampusID.
- DS-CA-001 was read but not modified.
- All subsequent campus-scoped content for this student is filtered by the selected CampusID.
- No event is emitted.
```

## Related Diagrams Suggested

```
- select_campus_sequence.puml
```

## Open Points / Assumptions

```
- Unresolved: Whether the student can change their campus association after onboarding is not addressed by current FRs.
- Unresolved: Cross-document wording issue — one older store definition places campus selection under DS-AP-002, but the current CRUD Matrix records the update on DS-AP-001. This realization follows the CRUD Matrix (DS-AP-001).
- Assumption for modeling only: If only one campus exists for the university, the system presents it as default for confirmation (alternate scenario A1 in the narrative).
```

***

# DUC-AP-04 — Set Up Profile

## Source Use Case

```
Set Up Profile
```

## Related Requirements

```
FR: FR-1401
NFR: NFR-27
```

## Implementation Goal

Allow a newly registered student to create a minimal profile during the post-registration onboarding flow. The profile is stored separately from the account record and will later be exposed in allowed activity contexts (join request review, activity details) subject to block checks.

## Boundary Objects

```
- ProfileSetupScreen
```

## Control Objects / Services

```
- ProfileSetupController
- ProfileCreationService
```

## Entity Objects / Data Stores

```
- StudentProfile / DS-AP-002
```

## Candidate Client-Facing API

| Method + Path    | Purpose                                                               | Input                                                                                                                                                    | Output                             | Reads | Writes        | Events / Notes                                                     |
| ---------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----- | ------------- | ------------------------------------------------------------------ |
| `POST /profiles` | Create the authenticated student's minimal profile during onboarding. | `displayName`, `major` (to verify), `dateOfBirth` (optional), `gender` (optional), `interests` (optional), `languages` (optional), `shortBio` (optional) | `profileCreated` or error response | —     | DS-AP-002 (C) | Profile is linked to the authenticated student's StudentAccountID. |

Possible error outputs:

```
ProfileAlreadyExists
MissingMandatoryFields
InvalidFieldValues
```

## Main Design Flow

```
1. The student reaches ProfileSetupScreen during the post-registration onboarding flow.
2. The system displays the required and optional profile fields.
3. The student fills in the profile fields and submits.
4. ProfileSetupController forwards the input to the Access and Profile module.
5. ProfileCreationService validates that all mandatory fields are present and that values meet format constraints.
6. ProfileCreationService checks that no profile already exists for this StudentAccountID in DS-AP-002.
7. ProfileCreationService creates a new StudentProfile record in DS-AP-002, linked to the authenticated StudentAccountID.
8. The system confirms profile creation and the onboarding flow proceeds.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- A profile can only be created once per account. Duplicate creation must be rejected.
- Mandatory profile fields must be completed before submission (the exact mandatory field set is to verify).
- The profile creation flow must be simple enough for a newly registered student to complete without guidance (NFR-27).
- DS-AP-001 is not read by this process according to the CRUD Matrix. The authenticated context provides the StudentAccountID without an explicit store read at the logical level.
```

## Postconditions in Design Terms

```
- DS-AP-002 contains a new StudentProfile record linked to the authenticated StudentAccountID.
- No other store is modified.
- No event is emitted.
```

## Related Diagrams Suggested

```
- setup_profile_sequence.puml
```

## Open Points / Assumptions

```
- Unresolved: The exact mandatory and optional profile fields are not fully fixed. The entity catalog provides a candidate list (DisplayName, Major, DateOfBirth, Gender, Interests, Languages, ShortBio) but final inclusion and required/optional status are to verify.
- Unresolved: Whether a profile photo is required, optional, or excluded in MVP is not specified.
- Assumption for modeling only: Profile creation is treated as a blocking onboarding step. Whether the app allows the student to proceed without a profile is not explicitly stated and is treated conservatively as blocking.
- Unresolved: Exact ordering between Select Campus and Set Up Profile within onboarding is not fixed.
```

***

# DUC-AP-05 — Edit Profile

## Source Use Case

```
Edit Profile
```

## Related Requirements

```
FR: FR-1402
NFR: NFR-27
```

## Implementation Goal

Allow a student with an existing minimal profile to update one or more editable profile fields. The updated profile replaces the previous version for all future profile-viewing contexts.

## Boundary Objects

```
- ProfileEditScreen
```

## Control Objects / Services

```
- ProfileEditController
- ProfileUpdateService
```

## Entity Objects / Data Stores

```
- StudentProfile / DS-AP-002
```

## Candidate Client-Facing API

| Method + Path        | Purpose                                                                          | Input                                                    | Output                                                  | Reads         | Writes        | Events / Notes                                                     |
| -------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | ------------- | ------------- | ------------------------------------------------------------------ |
| `GET /profiles/me`   | Retrieve the authenticated student's current profile for display before editing. | Authenticated student context                            | Current profile data or error if profile does not exist | DS-AP-002 (R) | —             | Returns the current state for pre-population in the edit form.     |
| `PATCH /profiles/me` | Update one or more fields of the authenticated student's minimal profile.        | Fields to update (any subset of editable profile fields) | `profileUpdated` or error response                      | DS-AP-002 (R) | DS-AP-002 (U) | Only the submitted fields are updated. UpdatedAt timestamp is set. |

Possible error outputs:

```
ProfileNotFound
InvalidFieldValues
```

## Main Design Flow

```
1. The student opens ProfileEditScreen from the personal profile area.
2. ProfileEditController requests the current profile from the Access and Profile module.
3. ProfileUpdateService reads DS-AP-002 to retrieve the existing StudentProfile for the authenticated StudentAccountID.
4. If no profile exists, the module returns ProfileNotFound and redirects to Set Up Profile.
5. The current profile data is displayed to the student.
6. The student modifies one or more editable fields and submits.
7. ProfileEditController forwards the updated fields to ProfileUpdateService.
8. ProfileUpdateService validates the submitted values against format constraints.
9. ProfileUpdateService updates the StudentProfile record in DS-AP-002 and sets UpdatedAt to the current timestamp.
10. The system confirms the update. The new profile data is available for future viewing contexts.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- The profile must already exist before editing is allowed (precondition dependency on Set Up Profile).
- Mandatory fields must remain populated after the update (the exact mandatory field set is to verify).
- The editing flow must be simple and understandable (NFR-27).
```

## Postconditions in Design Terms

```
- DS-AP-002 is updated with the new profile field values and an updated UpdatedAt timestamp.
- No other store is modified.
- No event is emitted.
```

## Related Diagrams Suggested

```
- edit_profile_sequence.puml
```

## Open Points / Assumptions

```
- Unresolved: Exact editable fields and which fields remain mandatory after editing are to verify.
- Assumption for modeling only: GET /profiles/me and PATCH /profiles/me are modeled as two separate API calls (read then update) matching the CRUD Matrix RU pattern on DS-AP-002.
```

***

# DUC-AP-06 — View Student Profile

## Source Use Case

```
View Student Profile
```

## Related Requirements

```
FR: FR-1403, FR-0501
NFR: NFR-28, NFR-36
```

## Implementation Goal

Allow a student to view another student's minimal public profile data within a relevant activity context (e.g., host reviewing pending join requests, student viewing activity details), while enforcing block-based visibility constraints. The displayed information is limited to the minimal public profile data allowed for that context and does not expose more personal data than necessary.

## Boundary Objects

```
- StudentProfileViewComponent (embedded in ActivityDetailsScreen, JoinRequestReviewScreen, or other allowed activity contexts)
```

## Control Objects / Services

```
- ProfileViewingController
- ProfileViewingService
- BlockEnforcementService
```

## Entity Objects / Data Stores

```
- StudentProfile / DS-AP-002
- BlockRelationship / DS-SM-001
```

## Candidate Client-Facing API

| Method + Path                      | Purpose                                                                    | Input                                                    | Output                                 | Reads                        | Writes | Events / Notes                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------- | ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `GET /profiles/{studentAccountId}` | Retrieve another student's minimal public profile data in an allowed activity context. | `studentAccountId` (path), authenticated student context | Minimal public profile data or error response | DS-AP-002 (R), DS-SM-001 (R) | —      | Block check is mandatory before profile exposure. Returns only the fields allowed by the Student Profile exposure rules. |

Possible error outputs:

```
ProfileNotFound
BlockRelationshipExists
ContextNotAllowed
```

## Main Design Flow

```
1. The student reaches a relevant activity context involving another student (e.g., ActivityDetailsScreen showing host info, or JoinRequestReviewScreen showing applicant profiles).
2. The embedding boundary object requests the target student's minimal public profile data through ProfileViewingController.
3. ProfileViewingService reads DS-SM-001 to check whether a block relationship exists between the requesting student and the target student.
4. If a block relationship exists, the module returns a BlockRelationshipExists error. The profile is not exposed.
5. ProfileViewingService reads DS-AP-002 to retrieve the StudentProfile associated with the target StudentAccountID.
6. If the profile does not exist, the module returns ProfileNotFound.
7. The module returns only the minimal public profile fields allowed for that context (NFR-28, NFR-36).
8. The embedding boundary object displays the minimal public profile data within the current activity context.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- Block relationships must be checked before any profile exposure. If a block exists between the two students, the profile must not be displayed (reciprocal enforcement).
- Only minimal public profile data is exposed; no more personal data than necessary for that purpose (NFR-28).
- Profile viewing is read-only; no change is made to the viewed student's profile data.
- The profile viewing context must be a relevant activity context as defined by the system. Arbitrary profile browsing is not supported.
- DS-SM-001 is owned by Safety and Moderation. AP reads it but does not create or modify block records.
```

## Postconditions in Design Terms

```
- DS-AP-002 was read but not modified.
- DS-SM-001 was read but not modified.
- No event is emitted.
- The requesting student sees (or is denied) the target student's minimal public profile data based on block state and context validity.
```

## Related Diagrams Suggested

```
- view_student_profile_sequence.puml
```

## Open Points / Assumptions

```
- Unresolved: The complete set of allowed profile-viewing contexts is not fully enumerated. One confirmed context is pending join request review (FR-0501). Activity details host profile exposure is a candidate but not explicitly confirmed with the same specificity.
- Unresolved: Exact minimal public profile fields exposed per context are to verify.
- Assumption for modeling only: The block check is modeled as a synchronous read from DS-SM-001 within the same request flow, not as an asynchronous service call.
```

***

# DUC-AP-07 — Update Campus Insight Consent

## Source Use Case

```
Update Campus Insight Consent
```

## Related Requirements

```
FR: FR-2901, FR-2902, FR-2903
NFR: NFR-45, NFR-46, NFR-47
```

## Implementation Goal

Allow a student to explicitly grant or revoke consent for authorized campus staff to access identifiable profile-interest and activity-participation insight data. The consent state is stored on the student account and does not affect normal app usage. Revoking consent must immediately prevent further identifiable data access by admin insight views.

## Boundary Objects

```
- AccountSettingsScreen
```

## Control Objects / Services

```
- ConsentUpdateController
- ConsentManagementService
```

## Entity Objects / Data Stores

```
- StudentAccount / DS-AP-001
```

## Candidate Client-Facing API

| Method + Path                | Purpose                                                            | Input                                   | Output                             | Reads         | Writes        | Events / Notes                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------ | --------------------------------------- | ---------------------------------- | ------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PATCH /accounts/me/consent` | Update the authenticated student's campus insight sharing consent. | `campusInsightSharingConsent` (boolean) | `consentUpdated` or error response | DS-AP-001 (R) | DS-AP-001 (U) | Updates the CampusInsightSharingConsent attribute. Effect must be immediately consistent across all admin insight views (NFR-47). |

Possible error outputs:

```
AccountNotFound
InvalidConsentValue
```

## Main Design Flow

```
1. The student reaches the campus insight sharing consent option during onboarding/registration or later in account/profile settings.
2. The system displays the current consent state by reading DS-AP-001.
3. The student changes the consent toggle (grant or revoke) and confirms.
4. ConsentUpdateController forwards the updated consent value to the Access and Profile module.
5. ConsentManagementService reads DS-AP-001 to locate the student account.
6. ConsentManagementService updates CampusInsightSharingConsent on the StudentAccount record in DS-AP-001.
7. The system confirms the consent update. The new consent state takes effect immediately for any future admin insight access attempts.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- Consent is stored on DS-AP-001 as the `CampusInsightSharingConsent` attribute (default: False).
- Refusing consent does not block normal app usage (FR-2901 context).
- Revoking consent must immediately prevent further identifiable data access by campus staff (NFR-47).
- The MVP Campus Administration admin insight view must check this consent attribute before exposing identifiable student-interest or participation data (FR-2902, FR-2903).
- AP owns the consent state. AP does not define or implement the admin insight dashboard, aggregation logic, or reporting format.
```

## Postconditions in Design Terms

```
- DS-AP-001 is updated with the new CampusInsightSharingConsent value.
- No other store is modified.
- No event is emitted.
- The consent state is immediately available for any subsequent consent-checked read by authorized campus admin processes (owned by Campus Administration).
```

## Related Diagrams Suggested

```
- update_consent_sequence.puml
```

## Open Points / Assumptions

```
- MVP confirmed: Consent collection/update is part of the first skeleton and may occur during onboarding/registration or later in account/profile settings.
- Unresolved: The exact UI screen placement and wording of the consent option are not fixed.
- MVP confirmed: The admin insight feature that consumes this consent state is modeled under Campus Administration as DUC-CA-03 — View Consent-Based Student Insights. AP does not implement the admin-side view.
```

***

## 5. Candidate Client-Facing APIs / Interfaces Summary

### Client-Facing APIs

| Method + Path                      | DUC       | Purpose                                                                    |
| ---------------------------------- | --------- | -------------------------------------------------------------------------- |
| `POST /auth/signup`                | DUC-AP-01 | Register a new student account with university email and password.         |
| `POST /auth/verify-email`          | DUC-AP-01 | Complete email verification and activate the account.                      |
| `POST /auth/signin`                | DUC-AP-02 | Authenticate with verified university email and password.                  |
| `GET /campuses`                    | DUC-AP-03 | Retrieve campuses associated with the student's university.                |
| `PATCH /accounts/me/campus`        | DUC-AP-03 | Associate the authenticated student with a selected campus.                |
| `POST /profiles`                   | DUC-AP-04 | Create the student's Student Profile during onboarding.                    |
| `GET /profiles/me`                 | DUC-AP-05 | Retrieve the authenticated student's own profile for editing.              |
| `PATCH /profiles/me`               | DUC-AP-05 | Update one or more fields of the authenticated student's profile.          |
| `GET /profiles/{studentAccountId}` | DUC-AP-06 | Retrieve another student's minimal public profile data in an allowed activity context. |
| `PATCH /accounts/me/consent`       | DUC-AP-07 | Update the student's campus insight sharing consent.                       |

### Internal Module Interfaces

```
- BlockEnforcementService.checkBlockExists(studentA, studentB) — reads DS-SM-001. Used by DUC-AP-06 before profile exposure. SM owns the store; AP consumes it read-only.
- RequestAccountModerationAction — received from Safety and Moderation after a reviewed report outcome requires account suspension or ban. AP handles the consequence under AP ownership by updating DS-AP-001.PlatformAccessStatus only. This is not a client-facing API and not a notification event.
```

### External Gateways

```
- EmailDeliveryGateway — used by DUC-AP-01 for verification email dispatch. Delivery mechanism details are implementation-level and not fixed.
```

***

## 6. Events Summary

```
Events emitted by Access and Profile:
- None.

Events consumed by Access and Profile:
- None as catalogue-level domain events.

Internal commands/interfaces consumed by Access and Profile:
- RequestAccountModerationAction — received from Safety and Moderation after a reviewed report outcome requires account suspension or ban. AP handles the consequence under AP ownership by updating DS-AP-001.PlatformAccessStatus only.
```

The Access and Profile subsystem does not emit or consume catalogue-level domain events. Downstream consequences (such as the effect of consent revocation on admin insight views) are enforced through synchronous consent-state reads by the consuming subsystem, not through events.

***

## 7. Suggested Sequence Diagrams

```
1. signup_verification_sequence.puml — Full sign-up flow including domain validation, account creation, verification email dispatch, and account activation.
2. signin_sequence.puml — Sign-in flow with credential validation and error handling.
3. select_campus_sequence.puml — Campus list retrieval from DS-CA-001 and campus association update on DS-AP-001.
4. setup_profile_sequence.puml — Profile creation during onboarding with validation.
5. edit_profile_sequence.puml — Profile read and update flow.
6. view_student_profile_sequence.puml — Profile viewing with block check against DS-SM-001 before exposure.
7. update_consent_sequence.puml — Consent toggle update on DS-AP-001.
```

***

## 8. Open Points / Assumptions

### Open Points

| #  | Topic                                      | Status              | Details                                                                                                                                                                                              |
| -- | ------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | University verification mechanism          | Unresolved          | The business rule is confirmed (university email required, domain validated). The technical form (email link, code, SSO redirect) is not fixed. Modeled abstractly as a verification token exchange. |
| 2  | Exact minimal public profile fields        | Unresolved          | Entity catalog provides a candidate list. Final mandatory/optional status for each field is not fixed.                                                                                               |
| 3  | Profile photo inclusion                    | Unresolved          | Whether a profile photo is required, optional, or excluded in MVP is not specified.                                                                                                                  |
| 4  | Onboarding step ordering                   | Unresolved          | Exact ordering between Select Campus and Set Up Profile within the onboarding flow is not fixed.                                                                                                     |
| 5  | Campus change after onboarding             | Unresolved          | Whether a student can change their campus association after initial onboarding is not addressed by current FRs.                                                                                      |
| 6  | SelectedCampusID store location            | Unresolved          | Cross-document wording mismatch. Older store definition says DS-AP-002; CRUD Matrix says DS-AP-001. This realization follows the CRUD Matrix.                                                        |
| 7  | Allowed profile-viewing contexts           | Unresolved          | One confirmed context is pending join request review (FR-0501). Full enumeration of allowed contexts is not complete.                                                                                |
| 8  | Consent UI placement                       | MVP confirmed; placement detail unresolved | Consent collection/update is MVP and may occur during onboarding/registration or account/profile settings. Exact screen placement remains a UI decision.                                              |
| 9  | Moderation-triggered account state changes | Interface clarified | First-skeleton `ModerationAction` values are `none`, `warn_user`, `suspend_user`, `ban_user`, and `remove_activity`. AP executes only AP-native `suspend_user` and `ban_user` consequences by updating DS-AP-001.PlatformAccessStatus. |
| 10 | Admin insight feature scope                | MVP confirmed       | AP provides the consent state. The admin insight dashboard, aggregation logic, and reporting format are outside AP scope and are documented in Campus Administration DUC-CA-03.                       |

### Assumptions for Modeling Only

| # | Assumption                                                                                                                                                      |
| - | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Password creation is part of the sign-up API call, not a separate step.                                                                                         |
| 2 | Session/token management for Sign In is excluded from the logical CRUD model.                                                                                   |
| 3 | Profile creation is a blocking onboarding step (conservative interpretation).                                                                                   |
| 4 | Block check for profile viewing is a synchronous read within the same request, not an asynchronous call.                                                        |
| 5 | The GET /profiles/me endpoint is separate from GET /profiles/{studentAccountId} because the former requires no block check (own profile) while the latter does. |
