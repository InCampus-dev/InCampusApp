# revisione.md — Alpha Sprint Implementation Plan Review

## Summary

Total changes: **7 additions, 6 modifications, 0 deletions**
Unverified tasks: **2**
Missing deliverables: **0**
Workload flag: **Jacopo ~69 estimated hours vs Matteo ~51.5h and Francesco ~50h — 34% gap, exceeds 20% threshold**

---

## Additions

### A01 — Add AP moderation command handler (AP module, Section 4 file list)

**Section:** Section 4 – File Creation List → Access & Profile (`packages/access-profile/`)

**What to add:**

```
| `src/services/AccountModerationCommandHandler.ts` | Receives RequestAccountModerationAction from SM; updates DS-AP-001.PlatformAccessStatus to Suspended or Banned under AP ownership. Not a client-facing endpoint. | Jacopo |
```

Also add to Section 2 – Task Inventory under **AP**:

```
| AP12 | AP | Implement AccountModerationCommandHandler: receive RequestAccountModerationAction from SM, update DS-AP-001.PlatformAccessStatus | UCR - A&P v1.2.md (Events Consumed, Internal Interfaces — line 873/894) | S | Jacopo |
```

**Source:** UCR - A&P v1.2.md — *"RequestAccountModerationAction — received from Safety and Moderation after a reviewed report outcome requires account suspension or ban. AP handles the consequence under AP ownership by updating DS-AP-001.PlatformAccessStatus only."* Version log entry 1.1 explicitly states this receiver was added because "SM may trigger AP-native suspension/ban consequences, but AP previously did not explicitly model the receiver side."

---

### A02 — Add H&L moderation command handler (H&L module, Section 4 file list)

**Section:** Section 4 – File Creation List → Hosting & Lifecycle (`packages/hosting-lifecycle/`)

**What to add:**

```
| `src/services/ActivityModerationCommandHandler.ts` | Receives RequestActivityModerationAction from SM; performs native activity deletion/removal workflow under H&L ownership. Not a client-facing endpoint. | Matteo |
```

Also add to Section 2 – Task Inventory under **H&L**:

```
| HL07 | H&L | Implement ActivityModerationCommandHandler: receive RequestActivityModerationAction from SM, execute native hard-delete workflow on DS-HL-001 and DS-HL-002 | UCR - H&L v1.4.md (Events Consumed — line 246/322/361) | S | Matteo |
```

**Source:** UCR - H&L v1.4.md — *"RequestActivityModerationAction — internal command/interface received from Safety and Moderation after a reviewed report outcome requires activity removal. H&L performs the native activity removal/status workflow under H&L ownership; this is not a client-facing admin route and not a notification event."*

---

### A03 — Add PendingParticipationConsequenceDispatcher to SM module (Section 4 file list)

**Section:** Section 4 – File Creation List → Safety & Moderation (`packages/safety-moderation/`)

**What to add:**

```
| `src/services/PendingParticipationConsequenceDispatcher.ts` | Conditional dispatcher for RequestPendingParticipationBlockConsequence; invoked by BlockService when a new block may affect a pending join request; routes to H&L-native workflow. SM does not mutate DS-HL-002 directly. | Francesco |
```

**Source:** UCR - S&M v1.3.md, DUC-SM-04 — *"If the block affects a pending join request under the current rules, PendingParticipationConsequenceDispatcher sends RequestPendingParticipationBlockConsequence to the H&L-native participation workflow. SM does not update DS-HL-002."*

---

### A04 — Add admin context validation middleware stub (Shared module, Section 4 file list)

**Section:** Section 4 – File Creation List → Backend – Shared (`packages/shared/`)

**What to add:**

```
| `shared/src/middleware/adminAuth.ts` | Provisional stub: validates AuthenticatedAdminContext for admin-only CA and SM endpoints. Exact admin authentication implementation remains provisional per architecture decision. | Francesco |
```

**Source:** 01 Design Scope and Architectural Choice v1.1.md — *"Campus Admin identity is represented in the first skeleton as a runtime/admin-auth context, not as a canonical database store."* All CA and SM admin endpoints require this context to be validated before proceeding.

---

### A05 — Add Assignment Deliverable Reminder details (Section preamble)

**Section:** Assignment Deliverable Reminder (top of document)

**What to add** after the existing bullet list:

```
Submission constraints:
- File naming: `Group reports 5.2 DAY [N] - [project keyword]`
- Format: PDF only
- Deadline: upload to Baidu cloud disk project folder before 23:00 each day
```

**Source:** Group Assignment 5.2 – Alpha Sprint Development Report — *"Naming your file: Group reports 5.2 DAY * -The key words of your project. Please submit a PDF file! You need upload your report every day report before 23:00."*

---

### A06 — Add GET /notifications list endpoint task (NSF module, if M06 stays as-is)

**Note:** This addition is conditional on the team choosing to keep M06 as a notification list screen (see Modification M04 below). If M06 is rescoped, this addition is not needed.

**Section:** Section 2 – Task Inventory under **NSF**

**What to add:**

```
| NSF09 | NSF | Notification list endpoint: GET /notifications (paginated, recipient-scoped, read-only; no isRead/readAt field per architecture) | UCR - N&S v1.2.md open point 3 (FR-0704) | M | Jacopo |
```

**Section 4 addition:**

```
| `src/controllers/NotificationListController.ts` | GET /notifications endpoint — returns recipient-scoped notification records; no read/unread state. | Jacopo |
```

**Source:** Functional Requirements v1.3.md FR-0704 — *"personal message center or notification list for historical access"*; UCR - N&S v1.2.md open point 3 — notification list UX marked Unresolved. **No candidate API path for a list endpoint is defined in any UCR; this task introduces a first-skeleton endpoint not yet fully specified. Mark as scaffolding.**

---

### A07 — Add workload rebalancing: move NSF04 and NSF05 to Francesco

**Section:** Section 2 – Task Inventory and Section 3 – 5-Day Sprint Schedule

**What to add/move:**

In the task inventory, reassign:

```
| NSF04 | NSF | Event handler: CancellationNotificationHandler (ActivityCancelled, fan-out) | DUC-NSF-03 | M | Francesco |
| NSF05 | NSF | Event handler: LeaveEventNotificationHandler (JoinedParticipantLeft) | DUC-NSF-04 | M | Francesco |
```

Update Module Ownership table in Section 1:

```
| Francesco | CA, SM | Shared infrastructure, CI, DB, NSF04, NSF05 |
```

**Rationale:** Estimated hours with current assignment: Jacopo ~69h, Matteo ~51.5h, Francesco ~50h. Moving NSF04 (M=3h) and NSF05 (M=3h) to Francesco reduces Jacopo to ~63h and raises Francesco to ~56h, narrowing the gap to ~12% — within the 20% threshold.

**Source:** Sprint plan review criteria — *"Workload is balanced across Jacopo, Matteo, and Francesco — flag imbalances above 20%."*

---

## Modifications

### MOD01 — M01 derivation is not traceable

**Section:** Section 2 – Task Inventory, Mobile row M01

**Current:**
```
| M01 | Mobile | Initialize React Native project, navigation stack, theme | Use Case Diagram v1.7.md | S | Francesco |
```

**Proposed:**
```
| M01 | Mobile | Initialize React Native project, navigation stack, theme | 01 Design Scope and Architectural Choice v1.1.md (multi-module client structure), Assignment requirements | S | Francesco |
```

**Reason:** Use Case Diagram v1.7.md models use case relationships between actors; it does not justify or specify mobile project initialization, navigation stack choice, or theming. The correct source is the architectural decision document that defines the mobile client as a layer of the system.

**Source:** 01 Design Scope and Architectural Choice v1.1.md — defines Student Mobile App as a system tier. Assignment requirements establish the need for a client.

---

### MOD02 — M05 double assignment: resolve conflict between Section 2 and Section 3

**Section:** Section 3 – Day 5 schedule, Francesco row

**Current (Section 2):** M05 assigned to Matteo.
**Current (Day 5 schedule):** Francesco: "SM06 (tests), M01 (mobile init), **M05 (create activity screen)**, assist with integration fixes." Matteo: "HL06, DP07 (final tests), **M04/M05 (activity screens polish)**."

**Proposed:** Remove M05 from Francesco's Day 5 task list. M05 is Matteo's task per the authoritative Section 2 task inventory. Francesco's Day 5 should read:

```
Francesco | SM06 (tests), M01 (mobile init), assist with integration fixes | All SM tasks done.
```

**Reason:** The task table in Section 2 is the authoritative assignment record. The Day 5 schedule contradicts it by assigning M05 work to Francesco, creating ambiguity about ownership and accountability.

**Source:** Section 2 task inventory (M05 = Matteo).

---

### MOD03 — M06 scope description does not match its cited source

**Section:** Section 2 – Task Inventory, Mobile row M06

**Current:**
```
| M06 | Mobile | Basic notification display (in‑app list) | DUC‑NSF‑06 | S | Jacopo |
```

**Proposed option A (if notification list is added via A06):**
```
| M06 | Mobile | Notification list screen and single notification context navigation | DUC-NSF-06, NSF09 (new) | M | Jacopo |
```

**Proposed option B (if list is deferred):**
```
| M06 | Mobile | Single notification context navigation screen (tapping a notification opens its context via GET /notifications/{id}/context) | DUC-NSF-06 | S | Jacopo |
```

**Reason:** DUC-NSF-06 defines only `GET /notifications/{notificationId}/context` — a single-notification routing endpoint. A notification list (GET /notifications) is not defined in any UCR. The NSF UCR explicitly marks notification list UX as "Unresolved" in open point 3. The current description of M06 as "in-app list" exceeds what DUC-NSF-06 covers.

**Source:** UCR - N&S v1.2.md, DUC-NSF-06 candidate API; open point 3 — *"Notification list UX: Unresolved. FR-0704 mentions a 'personal message center or notification list' for historical access. Exact UX for this list is not defined."*

---

### MOD04 — Plan claim "All tasks are fully traceable" is inaccurate for tech stack

**Section:** Closing note (last paragraph of the document)

**Current:**
```
> All tasks are fully traceable to the project documentation.
```

**Proposed:**
```
> All business logic tasks are traceable to the project documentation (UCRs, Sequence Diagrams, CRUD Matrix, Entity Catalog, and Architectural Choice document). Implementation technology choices — Node.js, TypeScript, TypeORM, PostgreSQL, React Native — are team implementation decisions not specified in any project document and should be confirmed by the team before Day 1.
```

**Reason:** No project document specifies the programming language, ORM, database engine, or mobile framework. Claiming full traceability is factually incorrect and may create false confidence in a code review or audit.

**Source:** 01 Design Scope and Architectural Choice v1.1.md — specifies Multi-Tenant Modular Monolith pattern but not implementation language or framework. No other document defines the stack.

---

### MOD05 — Day 4 same-day dependency between NSF04 and HL04 is unmitigated

**Section:** Section 3 – Day 4 schedule, dependency notes

**Current:**
```
NSF04 needs ActivityCancelled emitted from HL04 (done today by Matteo). NSF05 needs JoinedParticipantLeft from DP05. Plan to coordinate.
```

**Proposed — add explicit mitigation note:**
```
NSF04 needs ActivityCancelled emitted from HL04 (done today by Matteo). NSF05 needs JoinedParticipantLeft from DP05. Mitigation: NSF04 and NSF05 handlers must be testable with synthetic events from Day 3 onward (see NSF02/NSF03 pattern). If HL04 is not merged before NSF04 integration, NSF04 integration tests use a synthetic ActivityCancelled event stub and are validated end-to-end on Day 5.
```

**Reason:** Both NSF04 and HL04 are on Day 4 with no explicit fallback if HL04 is delayed. Without a mitigation strategy, a Day 4 delay in HL04 blocks NSF04 integration. The existing pattern for NSF02/NSF03 (testable with synthetic events) should be explicitly carried forward.

**Source:** Sprint plan itself — *"events will be emitted by D&P on Day 4, so handlers can be tested with synthetic events."* Same mitigation pattern should be explicitly stated for Day 4 cross-dependencies.

---

### MOD06 — Participation entity must use canonical RecordType + Status vocabulary

**Section:** Section 4 – File Creation List → Hosting & Lifecycle, `src/entities/Participation.ts` row

**Current:**
```
| `src/entities/Participation.ts` | DS‑HL‑002 entity | Matteo |
```

**Proposed:**
```
| `src/entities/Participation.ts` | DS-HL-002 entity. Fields must use canonical vocabulary: RecordType = 'request' | 'participation'; Status = 'pending' | 'confirmed' | 'declined'. Values 'joined', 'left', 'approved', 'cancelled', 'withdrawn' are NOT valid persisted statuses. | Matteo |
```

**Reason:** The architecture document and SCD explicitly define the canonical persisted participation vocabulary. Omitting this from the file description risks incorrect field naming during implementation.

**Source:** 01 Design Scope and Architectural Choice v1.1.md — *"Participation.RecordType = request | participation; Participation.Status = pending | confirmed | declined."* ActivityParticipation SCD.md — *"`joined`, `left`, `withdrawn`, `cancelled`, and `deleted` are not canonical persisted Participation statuses."* Entities & Attributes v1.2.md — *"`approved` maps to `confirmed`; `joined` maps to RecordType = participation plus Status = confirmed."*

---

## Unverified Tasks

### ⚠️ UV01 — M06 "Basic notification display (in-app list)"

**Location:** Section 2 – Task Inventory, Mobile row M06

**Issue:** No `GET /notifications` list endpoint is defined in any UCR. DUC-NSF-06 covers only single-notification context navigation. The NSF UCR open point 3 marks notification list UX as "Unresolved." The `NotificationListScreen.tsx` mobile screen and any corresponding backend endpoint required to populate it cannot be traced to a confirmed source document.

**Action required:** Either add A06 (new endpoint task) or rescope M06 to single-notification context only per MOD03 option B.

---

### ⚠️ UV02 — M01 "Initialize React Native project" derived from "Use Case Diagram v1.7.md"

**Location:** Section 2 – Task Inventory, Mobile row M01

**Issue:** The use case diagram describes actor-use-case relationships; it does not specify mobile project structure, navigation library choice, or theming. The derivation link is invalid.

**Action required:** Apply MOD01.

---

## Missing Deliverables

None. All five daily report elements required by Group Assignment 5.2 (standing meeting photo, working table, code screenshot, burn-out chart, daily summary) are acknowledged in the plan preamble. However, the submission format details (PDF, file naming convention, 23:00 deadline) are absent — see Addition A05.
