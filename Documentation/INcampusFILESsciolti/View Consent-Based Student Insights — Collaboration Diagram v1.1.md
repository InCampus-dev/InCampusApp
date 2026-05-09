# View Consent-Based Student Insights — Collaboration Diagram v1.1

![](<assets/View Consent-Based Student Insights — Collaboration Diagram v1.1.svg>)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | View Consent-Based Student Insights | Added missing MVP collaboration view for consent-gated, campus-scoped, read-only Admin Insights over existing stores. | Admin Insights are MVP and must be represented before the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## Purpose

This collaboration diagram represents `DUC-CA-03 — View Consent-Based Student Insights`, which was confirmed as an MVP capability during the final pre-skeleton review. No earlier collaboration diagram source was found, so this concise source is added for skeleton readiness. It shows Campus Admin access through an admin-only portal, runtime authorization through `AuthenticatedAdminContext`, consent checks in `DS-AP-001 Student Account`, and conditional read-only insight access over existing AP and H&L stores.

## Source Sequence Diagram

* No existing source sequence diagram was found in the collaboration diagram package.
* Added from accepted final team decision `DUC-CA-03 — View Consent-Based Student Insights`.

## Related Use Case Realization

* DUC-CA-03 — View Consent-Based Student Insights

## Related Requirements

FR: Admin Insights MVP, consent-based campus-scoped student insight access

NFR: privacy, authorization, campus scoping, least-privilege access

## Participants / Objects

| Object | Type | Responsibility |
|---|---|---|
| Campus Admin | Actor | Requests insight data from an admin-only portal through `AuthenticatedAdminContext`. |
| AdminInsightPortalScreen | Boundary | Collects insight request parameters and displays limited result or denial. |
| AdminInsightController | Control | Coordinates authorization, consent checks, and read-only insight query. |
| CampusAdminAuthorizationService | Service | Verifies runtime `AuthenticatedAdminContext` and campus scope. |
| CampusInsightConsentService | Service | Checks `CampusInsightSharingConsent` on the student account. |
| AdminInsightReadService | Service | Performs conditional read-only access to allowed stores. |
| DS-CA-001 Campus Configuration | Data Store | Campus scope source; read-only in this flow. |
| DS-AP-001 Student Account | Data Store | Stores selected campus and `CampusInsightSharingConsent`; read-only in this flow. |
| DS-AP-002 Student Profile | Data Store | Student Profile data; read-only only when authorized and consent is valid. |
| DS-HL-001 Activities | Data Store | Activity insight data; read-only only when authorized and consent is valid. |
| DS-HL-002 Activity Participations | Data Store | Participation insight data; read-only only when authorized and consent is valid. |

## Message Sequence

| No. | Source | Destination | Message |
|---|---|---|---|
| 1 | Campus Admin | AdminInsightPortalScreen | request insights(studentScope, selectedCampusId) |
| 2 | AdminInsightPortalScreen | AdminInsightController | loadConsentBasedInsights(request, `AuthenticatedAdminContext`) |
| 3 | AdminInsightController | CampusAdminAuthorizationService | authorize(`AuthenticatedAdminContext`, selectedCampusId) |
| 4 | CampusAdminAuthorizationService | DS-CA-001 Campus Configuration | read campus scope |
| 5 | AdminInsightController | CampusInsightConsentService | check consent(studentAccountId, selectedCampusId) |
| 6 | CampusInsightConsentService | DS-AP-001 Student Account | read selected campus and `CampusInsightSharingConsent` |
| 6a | CampusInsightConsentService | AdminInsightController | [not authorized or consent false/revoked] deny identifiable insight access |
| 7 | AdminInsightController | AdminInsightReadService | [authorized and consent true] read limited insight data |
| 8 | AdminInsightReadService | DS-AP-002 Student Profile | conditional read-only Student Profile data |
| 9 | AdminInsightReadService | DS-HL-001 Activities | conditional read-only activity insight data |
| 10 | AdminInsightReadService | DS-HL-002 Activity Participations | conditional read-only participation insight data |
| 11 | AdminInsightController | AdminInsightPortalScreen | return limited insight result or access denied |
| 12 | AdminInsightPortalScreen | Campus Admin | display result |

## PlantUML Code

```plantuml
@startuml
title View Consent-Based Student Insights - Collaboration Diagram v1.1

left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam packageStyle rectangle
skinparam dpi 180
skinparam nodesep 80
skinparam ranksep 80
skinparam defaultFontName Helvetica
skinparam ArrowFontSize 11
skinparam ObjectFontSize 12

object "Campus Admin\n(AuthenticatedAdminContext)" as Admin <<Actor>>

package "Campus Administration / Admin Portal" {
  object "AdminInsightPortalScreen" as InsightUI <<Boundary>>
  object "AdminInsightController" as Controller <<Control>>
  object "CampusAdminAuthorizationService" as Authz <<Service>>
  object "CampusInsightConsentService" as ConsentSvc <<Service>>
  object "AdminInsightReadService" as InsightRead <<Service>>
}

package "Existing Stores (read-only)" {
  object "DS-CA-001\nCampus Configuration" as CampusStore <<Data Store>>
  object "DS-AP-001\nStudent Account" as AccountStore <<Data Store>>
  object "DS-AP-002\nStudent Profile" as ProfileStore <<Data Store>>
  object "DS-HL-001\nActivities" as ActivityStore <<Data Store>>
  object "DS-HL-002\nActivity Participations" as ParticipationStore <<Data Store>>
}

Admin --> InsightUI : 1: request insights\n(studentScope, selectedCampusId)
InsightUI --> Controller : 2: loadConsentBasedInsights\n(request, AuthenticatedAdminContext)
Controller --> Authz : 3: authorize\n(AuthenticatedAdminContext, selectedCampusId)
Authz --> CampusStore : 4: read campus scope
Controller --> ConsentSvc : 5: check consent\n(studentAccountId, selectedCampusId)
ConsentSvc --> AccountStore : 6: read selected campus +\nCampusInsightSharingConsent
ConsentSvc --> Controller : 6a: [not authorized or consent false/revoked]\ndeny identifiable insight access
Controller --> InsightRead : 7: [authorized and consent true]\nread limited insight data
InsightRead --> ProfileStore : 8: conditional read-only\nStudent Profile data
InsightRead --> ActivityStore : 9: conditional read-only\nactivity insight data
InsightRead --> ParticipationStore : 10: conditional read-only\nparticipation insight data
Controller --> InsightUI : 11: return limited insight result\nor access denied
InsightUI --> Admin : 12: display result

note bottom of Controller
No new admin store is introduced.
AuthenticatedAdminContext is runtime/admin-auth context,
not a database table.
CA does not own AP or H&L data.
end note

note bottom of AccountStore
CampusInsightSharingConsent is stored in DS-AP-001.
If consent is false or revoked, identifiable
insight access is denied and normal app usage continues.
end note

note bottom of InsightRead
All insight access is campus-scoped and read-only.
No writes are performed to AP, H&L, SM, or NSF stores.
Moderation/report-review access is a separate flow.
end note

@enduml
```

## Notes for Review

* This is a new collaboration source because Admin Insights are confirmed MVP and no earlier collaboration diagram source was found in the package.
* `AuthenticatedAdminContext` is a runtime context object with `adminId`, `email`, `role`, `authorizedCampusIds`, and `selectedCampusId`; it is not a canonical data store.
* The flow uses only existing stores: `DS-CA-001`, `DS-AP-001`, `DS-AP-002 Student Profile`, `DS-HL-001`, and `DS-HL-002`.
* CA does not own AP/H&L data and performs no AP/H&L writes.
* Consent false/revoked denies identifiable insight access but does not block normal student app usage.
* Exact insight aggregation shape and UI copy remain unresolved.
