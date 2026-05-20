# Sign Up and Select Campus — Collaboration Diagram v1.1

![](<assets/Sign Up and Select Campus — Collaboration Diagram v1.1.svg>)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | Sign Up and Select Campus | Added MVP `DUC-AP-07 — Update Campus Insight Consent`, stored `CampusInsightSharingConsent` in `DS-AP-001`, and clarified that refusal/revocation does not block normal app usage. | Required before using collaboration diagrams as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

# Purpose

This collaboration diagram is derived from the Sign Up and Select Campus Sequence Diagram. It represents the student onboarding interaction — registration, domain validation, email verification, campus selection, campus insight consent collection/update, and Student Profile creation — as a set of object-to-object links with numbered messages. The diagram preserves the established AP and CA ownership boundaries while adding the accepted MVP consent behavior needed before the first code skeleton.

## Source Sequence Diagram

* Sign Up and Select Campus — Sequence Diagram (DUC-AP-01, DUC-AP-03, DUC-AP-04)

## Related Use Case Realization

* DUC-AP-01 — Sign Up with University Email
* DUC-AP-03 — Select Campus
* DUC-AP-04 — Set Up Profile
* DUC-AP-07 — Update Campus Insight Consent

## Related Requirements

FR: FR-0101, FR-0102, FR-0103, FR-0104, FR-0105, FR-1601, FR-1401

NFR: NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-30, NFR-27

## Participants / Objects

| Object                              | Type       | Responsibility                                       |
| ----------------------------------- | ---------- | ---------------------------------------------------- |
| Student                             | Actor      | External actor initiating onboarding                 |
| SignUpScreen                        | Boundary   | Registration form UI                                 |
| EmailVerificationScreen             | Boundary   | Verification completion UI                           |
| CampusSelectionScreen               | Boundary   | Campus selection UI                                  |
| CampusInsightConsentScreen          | Boundary   | Consent collection/update UI                         |
| ProfileSetupScreen                  | Boundary   | Student Profile creation UI                          |
| SignUpController                    | Control    | Coordinates sign-up request                          |
| DomainValidationService             | Service    | Validates email domain against university rules      |
| AccountActivationService            | Service    | Creates account, handles verification and activation |
| EmailVerificationService            | Service    | Dispatches verification email                        |
| CampusAssociationService            | Service    | Retrieves campus list and associates selected campus |
| CampusInsightConsentService         | Service    | Stores the student's campus insight sharing consent  |
| ProfileCreationService              | Service    | Validates and creates Student Profile                |
| EmailDeliveryGateway                | Gateway    | External email delivery mechanism                    |
| DS-AP-003 University Identity Rules | Data Store | Supported email domain rules (read)                  |
| DS-AP-001 Student Account           | Data Store | Account record, selected campus, and consent (create, read, update) |
| DS-CA-001 Campus Configuration      | Data Store | Campus list (read, owned by CA subsystem)            |
| DS-AP-002 Student Profile           | Data Store | Student Profile record with minimal public profile data (create) |

## Message Sequence

| No. | Source                   | Destination              | Message                                                 |
| --- | ------------------------ | ------------------------ | ------------------------------------------------------- |
| 1   | Student                  | SignUpScreen             | enter email, password, studentId                        |
| 2   | SignUpScreen             | SignUpController         | registerRequest(email, password, studentId)             |
| 3   | SignUpController         | DomainValidationService  | validateDomain(emailDomain)                             |
| 4   | DomainValidationService  | DS-AP-003                | read domain rules                                       |
| 4a  | DomainValidationService  | SignUpController         | \[domain unsupported] UnsupportedEmailDomain            |
| 5   | SignUpController         | AccountActivationService | createAccount(email, passwordHash, studentId)           |
| 6   | AccountActivationService | DS-AP-001                | create StudentAccount (Pending, PendingVerification)    |
| 7   | SignUpController         | EmailVerificationService | sendVerificationEmail(email)                            |
| 8   | EmailVerificationService | EmailDeliveryGateway     | dispatch verification email                             |
| 9   | Student                  | EmailVerificationScreen  | complete verification (token)                           |
| 10  | EmailVerificationScreen  | AccountActivationService | verifyAccount(verificationToken)                        |
| 11  | AccountActivationService | DS-AP-001                | read account by verification context                    |
| 12  | AccountActivationService | DS-AP-001                | update Verification=Verified, Access=Active             |
| 13  | Student                  | CampusSelectionScreen    | open campus selection                                   |
| 14  | CampusSelectionScreen    | CampusAssociationService | getCampuses(universityContext)                          |
| 15  | CampusAssociationService | DS-CA-001                | read campuses (university match, ActivationStatus=True) |
| 16  | Student                  | CampusSelectionScreen    | select campus(campusId)                                 |
| 17  | CampusSelectionScreen    | CampusAssociationService | associateCampus(studentId, campusId)                    |
| 18  | CampusAssociationService | DS-AP-001                | read + update SelectedCampusID                          |
| 19  | Student                  | CampusInsightConsentScreen | grant/refuse campus insight sharing consent            |
| 20  | CampusInsightConsentScreen | CampusInsightConsentService | updateCampusInsightConsent(studentAccountId, consent) |
| 21  | CampusInsightConsentService | DS-AP-001              | update CampusInsightSharingConsent                      |
| 22  | Student                  | ProfileSetupScreen       | submit profile fields                                   |
| 23  | ProfileSetupScreen       | ProfileCreationService   | createProfile(studentAccountId, fields)                 |
| 24  | ProfileCreationService   | DS-AP-002                | create StudentProfile                                   |

## PlantUML Code

```
@startuml
title Sign Up and Select Campus - Collaboration Diagram

skinparam defaultFontName Arial
skinparam defaultFontSize 11
skinparam roundcorner 8
skinparam actorStyle awesome

skinparam rectangle {
  BackgroundColor #F0F4FF
  BorderColor #2E5FA3
  FontColor #1F3864
}

skinparam database {
  BackgroundColor #F5F5F5
  BorderColor #BFBFBF
  FontColor #1F3864
}

skinparam actor {
  BackgroundColor #FFFFFF
  BorderColor #1F3864
  FontColor #1F3864
}

' ─── Actor ────────────────────────────────────────────────
actor "Student" as Student

' ─── Boundary Objects ─────────────────────────────────────
rectangle "SignUpScreen" as SignUpUI <<Boundary>>
rectangle "EmailVerificationScreen" as VerifyUI <<Boundary>>
rectangle "CampusSelectionScreen" as CampusUI <<Boundary>>
rectangle "CampusInsightConsentScreen" as ConsentUI <<Boundary>>
rectangle "ProfileSetupScreen" as ProfileUI <<Boundary>>

' ─── Control ──────────────────────────────────────────────
rectangle "SignUpController" as Controller <<Control>>

' ─── Services ─────────────────────────────────────────────
rectangle "DomainValidationService" as DomainSvc <<Service>>
rectangle "AccountActivationService" as AcctSvc <<Service>>
rectangle "EmailVerificationService" as EmailSvc <<Service>>
rectangle "CampusAssociationService" as CampusSvc <<Service>>
rectangle "CampusInsightConsentService" as ConsentSvc <<Service>>
rectangle "ProfileCreationService" as ProfileSvc <<Service>>

' ─── Gateway ──────────────────────────────────────────────
rectangle "EmailDeliveryGateway" as Gateway <<Gateway>>

' ─── Data Stores ──────────────────────────────────────────
database "DS-AP-003\nUniversity Identity Rules" as Rules
database "DS-AP-001\nStudent Account" as Account
database "DS-CA-001\nCampus Configuration" as Campus
database "DS-AP-002\nStudent Profile" as Profile

' ─── Phase 1: Sign Up ─────────────────────────────────────
Student --> SignUpUI        : 1: enter email, password, studentId
SignUpUI --> Controller     : 2: registerRequest(email, password, studentId)
Controller --> DomainSvc   : 3: validateDomain(emailDomain)
DomainSvc --> Rules        : 4: read domain rules
DomainSvc --> Controller   : 4a: [domain unsupported] UnsupportedEmailDomain

Controller --> AcctSvc     : 5: createAccount(email, passwordHash, studentId)
AcctSvc --> Account        : 6: create StudentAccount\n(Pending, PendingVerification)

Controller --> EmailSvc    : 7: sendVerificationEmail(email)
EmailSvc --> Gateway       : 8: dispatch verification email

' ─── Phase 2: Email Verification ──────────────────────────
Student --> VerifyUI       : 9: complete verification (token)
VerifyUI --> AcctSvc       : 10: verifyAccount(verificationToken)
AcctSvc --> Account        : 11: read account by verification context
AcctSvc --> Account        : 12: update Verification=Verified,\nAccess=Active

' ─── Phase 3: Campus Selection ────────────────────────────
Student --> CampusUI       : 13: open campus selection
CampusUI --> CampusSvc     : 14: getCampuses(universityContext)
CampusSvc --> Campus       : 15: read campuses\n(university match, ActivationStatus=True)

Student --> CampusUI       : 16: select campus(campusId)
CampusUI --> CampusSvc     : 17: associateCampus(studentId, campusId)
CampusSvc --> Account      : 18: read + update SelectedCampusID

' ─── Phase 4: Campus Insight Consent ─────────────────────
Student --> ConsentUI      : 19: grant/refuse campus insight\nsharing consent
ConsentUI --> ConsentSvc   : 20: updateCampusInsightConsent\n(studentAccountId, consent)
ConsentSvc --> Account     : 21: update\nCampusInsightSharingConsent

' ─── Phase 5: Profile Setup ───────────────────────────────
Student --> ProfileUI      : 22: submit profile fields
ProfileUI --> ProfileSvc   : 23: createProfile(studentAccountId, fields)
ProfileSvc --> Profile     : 24: create StudentProfile

note bottom of Account
  Messages 6, 11, 12, 18, 21
  all access DS-AP-001.
  Create and update only.
  CampusInsightSharingConsent
  is stored here.
  Consent refusal/revocation
  does not block normal app use.
  No modifications from NSF,
  SM, or H&L in this flow.
end note

note bottom of Campus
  DS-CA-001 owned by CA.
  AP reads only (msg 15).
  No campus records modified.
end note

@enduml
```

## Notes for Review

* The accepted MVP consent behavior adds `CampusInsightConsentScreen` and `CampusInsightConsentService` as AP-owned collaboration objects.
* DS-AP-001 receives five numbered messages (6, 11, 12, 18, 21) from three AP services. `CampusInsightSharingConsent` is stored on `DS-AP-001 Student Account`, not in a new admin store.
* DS-CA-001 is read-only in this flow (message 15). AP does not create or modify campus records. Cross-subsystem ownership is preserved.
* Message 4a is a conditional (guarded) message on the DomainValidationService → SignUpController link, representing the unsupported domain alternate flow. If triggered, flow ends before messages 5 onward.
* Return messages are not numbered. Only forward directional messages carry a number, consistent with UML 1.x collaboration diagram notation.
* Assumption for modeling only: Onboarding phase ordering (Sign Up → Campus → Consent → Profile) is shown for readability. Consent may also be updated later in account/profile settings.
* Refusing or revoking campus insight sharing consent does not block normal app usage and does not expose insight data as ordinary public profile data.
* No events are emitted or consumed. No notification records are created. AP is pure user-initiated CRUD.

***
