import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve("docs/final-report");
const read = (p) => readFileSync(path.resolve(p), "utf8").replace(/\r\n/g, "\n");

function cleanTableSource(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/&#xA;/g, " ")
    .replace(/^\s*#\s+/gm, "### ")
    .replace(/^\s*##\s+/gm, "#### ")
    .replace(/^\s*###\s+/gm, "##### ")
    .trim();
}

function sourceAppendix(title, sourcePath, note) {
  const body = cleanTableSource(read(sourcePath));
  return `## ${title}\n\n${note}\n\n${body}\n`;
}

function fig(src, caption, opts = {}) {
  const cls = ["figure-page"];
  if (opts.landscape !== false) cls.push("landscape");
  if (opts.wide) cls.push("wide");
  return `<div class="${cls.join(" ")}">\n<figure>\n<img src="${src}" alt="${caption.replace(/"/g, "&quot;")}">\n<figcaption>${caption}</figcaption>\n</figure>\n</div>`;
}

function codeBlockFromFile(label, sourcePath) {
  return `### ${label}\n\n\`\`\`text\n${read(sourcePath).trim()}\n\`\`\`\n`;
}

const reqMedia = "assets/diagrams/requirements-report-media";
const oodMedia = "assets/diagrams/ood-report-media";

const toc = `<nav class="toc">
  <ol>
    <li><a href="#1-project-overview-and-report-structure">Project Overview and Report Structure</a>
      <ol>
        <li><a href="#11-product-summary">Product Summary</a></li>
        <li><a href="#12-report-structure">Report Structure</a></li>
        <li><a href="#13-source-basis-and-affine-availability">Source Basis and Affine Availability</a></li>
      </ol>
    </li>
    <li><a href="#2-project-context-and-vision">Project Context and Vision</a>
      <ol>
        <li><a href="#21-campus-problem">Campus Problem</a></li>
        <li><a href="#22-target-users-and-trust-boundary">Target Users and Trust Boundary</a></li>
        <li><a href="#23-product-positioning">Product Positioning</a></li>
      </ol>
    </li>
    <li><a href="#3-requirements-and-scope">Requirements and Scope</a>
      <ol>
        <li><a href="#31-methodology">Methodology</a></li>
        <li><a href="#32-user-story-collection">User Story Collection</a></li>
        <li><a href="#33-mvp-and-post-mvp-boundary">MVP and Post-MVP Boundary</a></li>
        <li><a href="#34-functional-requirements">Functional Requirements</a></li>
        <li><a href="#35-non-functional-requirements">Non-Functional Requirements</a></li>
        <li><a href="#36-traceability-and-priority-logic">Traceability and Priority Logic</a></li>
      </ol>
    </li>
    <li><a href="#4-requirement-analysis">Requirement Analysis</a>
      <ol>
        <li><a href="#41-use-case-model">Use Case Model</a></li>
        <li><a href="#42-use-case-narratives-and-priority-matrix">Use Case Narratives and Priority Matrix</a></li>
        <li><a href="#43-data-flow-analysis">Data Flow Analysis</a></li>
        <li><a href="#44-data-stores-and-crud-validation">Data Stores and CRUD Validation</a></li>
        <li><a href="#45-entity-relationship-model">Entity Relationship Model</a></li>
      </ol>
    </li>
    <li><a href="#5-on-screen-appearance-and-ui-requirements">On-Screen Appearance and UI Requirements</a>
      <ol>
        <li><a href="#51-methodology">Methodology</a></li>
        <li><a href="#52-screen-inventory">Screen Inventory</a></li>
        <li><a href="#53-global-ui-constraints">Global UI Constraints</a></li>
        <li><a href="#54-visual-identity">Visual Identity</a></li>
      </ol>
    </li>
    <li><a href="#6-architecture-and-object-oriented-design">Architecture and Object-Oriented Design</a>
      <ol>
        <li><a href="#61-architectural-choice">Architectural Choice</a></li>
        <li><a href="#62-module-responsibilities">Module Responsibilities</a></li>
        <li><a href="#63-stores-and-ownership-rules">Stores and Ownership Rules</a></li>
        <li><a href="#64-object-model">Object Model</a></li>
        <li><a href="#65-interaction-diagrams">Interaction Diagrams</a></li>
        <li><a href="#66-lifecycle-and-activity-diagrams">Lifecycle and Activity Diagrams</a></li>
        <li><a href="#67-component-model">Component Model</a></li>
      </ol>
    </li>
    <li><a href="#7-implementation-and-development-artifacts">Implementation and Development Artifacts</a>
      <ol>
        <li><a href="#71-private-repository-access">Private Repository Access</a></li>
        <li><a href="#72-monorepo-organization">Monorepo Organization</a></li>
        <li><a href="#73-backend-implementation">Backend Implementation</a></li>
        <li><a href="#74-mobile-implementation">Mobile Implementation</a></li>
        <li><a href="#75-current-implementation-status">Current Implementation Status</a></li>
      </ol>
    </li>
    <li><a href="#8-testing-and-quality-assurance">Testing and Quality Assurance</a>
      <ol>
        <li><a href="#81-ci-workflow">CI Workflow</a></li>
        <li><a href="#82-local-verification">Local Verification</a></li>
        <li><a href="#83-regression-scope">Regression Scope</a></li>
        <li><a href="#84-qa-limitations">QA Limitations</a></li>
      </ol>
    </li>
    <li><a href="#9-user-documentation-and-user-manual">User Documentation and User Manual</a>
      <ol>
        <li><a href="#91-student-user-manual">Student User Manual</a></li>
        <li><a href="#92-campus-admin-user-manual">Campus Admin User Manual</a></li>
        <li><a href="#93-common-errors-and-troubleshooting">Common Errors and Troubleshooting</a></li>
      </ol>
    </li>
    <li><a href="#10-project-management-and-time-management">Project Management and Time Management</a>
      <ol>
        <li><a href="#101-work-breakdown-structure">Work Breakdown Structure</a></li>
        <li><a href="#102-critical-path-and-slack">Critical Path and Slack</a></li>
        <li><a href="#103-cost-benefit-estimate">Cost-Benefit Estimate</a></li>
      </ol>
    </li>
    <li><a href="#11-limitations-and-future-work">Limitations and Future Work</a>
      <ol>
        <li><a href="#111-course-mvp-completion">Course MVP Completion</a></li>
        <li><a href="#112-alpha-and-demo-limitations">Alpha and Demo Limitations</a></li>
        <li><a href="#113-future-roadmap">Future Roadmap</a></li>
      </ol>
    </li>
    <li><a href="#12-conclusion">Conclusion</a></li>
    <li><a href="#appendices">Appendices</a>
      <ol>
        <li><a href="#appendix-a---full-user-story-table">Appendix A - Full User Story Table</a></li>
        <li><a href="#appendix-b---full-functional-requirements">Appendix B - Full Functional Requirements</a></li>
        <li><a href="#appendix-c---full-non-functional-requirements">Appendix C - Full Non-Functional Requirements</a></li>
        <li><a href="#appendix-d---full-use-case-table-and-priority-matrix">Appendix D - Full Use Case Table and Priority Matrix</a></li>
        <li><a href="#appendix-e---full-crud-matrix">Appendix E - Full CRUD Matrix</a></li>
        <li><a href="#appendix-f---full-entity-and-attribute-catalog">Appendix F - Full Entity and Attribute Catalog</a></li>
        <li><a href="#appendix-g---full-relationship-and-data-store-tables">Appendix G - Full Relationship and Data Store Tables</a></li>
        <li><a href="#appendix-h---original-diagrams-gallery">Appendix H - Original Diagrams Gallery</a></li>
        <li><a href="#appendix-i---github-actions-and-test-evidence">Appendix I - GitHub Actions and Test Evidence</a></li>
        <li><a href="#appendix-j---technical-reproducibility-notes">Appendix J - Technical Reproducibility Notes</a></li>
        <li><a href="#appendix-k---documentation-sources-used">Appendix K - Documentation Sources Used</a></li>
        <li><a href="#appendix-l---glossary">Appendix L - Glossary</a></li>
      </ol>
    </li>
  </ol>
</nav>`;

const md = String.raw`
<section class="cover">
  <div class="brand-band"></div>
  <img class="cover-logo" src="assets/logo/incampus-wordmark.png" alt="InCampus wordmark">
  <div class="cover-rule"></div>
  <h1>Software Engineering Group Project — Final Report</h1>
  <p class="assignment">Group project - Final report</p>
  <p class="tagline">Living the campus, Living the youth, Living life</p>
  <dl class="cover-meta">
    <dt>Target Campus</dt><dd>Tongji University, Jiading Campus</dd>
    <dt>Product Type</dt><dd>Mobile Application</dd>
    <dt>Team Members</dt><dd>Francesco Nativitati, Jacopo Donati, Matteo Silvetro, YiMing</dd>
  </dl>
</section>

# Table of Contents

${toc}

# 1. Project Overview and Report Structure

## 1.1 Product Summary

InCampus is a campus-scoped mobile application for verified university students who want to turn ordinary free time into shared campus activity. The first target setting is Tongji University, Jiading Campus. The product focuses on practical coordination: a student creates an activity with a time, place, category, capacity, and participation mode; other verified students discover it inside the campus boundary; participation is handled through direct join or host approval; the system records notifications, reports, blocks, and consent-sensitive administrative insight rules.

The final course deliverable consolidates requirements engineering, requirement analysis, object-oriented design, implementation evidence, testing evidence, user documentation, project-management artifacts, and limitations. It is intentionally broader than an executive digest. Full tables are preserved in appendices and original diagrams are reproduced as full-page figures when readability requires it.

## 1.2 Report Structure

The report follows the logical order of the project work. Sections 2 to 5 recover the requirements and analysis phase. Section 6 presents the architectural and object-oriented design. Section 7 documents the private implementation artifacts without exposing source-code dumps. Section 8 records the verified automated QA evidence. Section 9 provides user-facing documentation. Sections 10 to 12 close with project-management analysis, limitations, future work, and synthesis. Appendices A to L preserve the full source tables, diagram gallery, evidence excerpts, reproducibility notes, sources, and glossary.

## 1.3 Source Basis and Affine Availability

The report was rebuilt from four source groups: previous course reports, current repository documentation, implementation/CI evidence, and Affine-exported project workspace material. The exported Affine material under \`Documentation/INcampusFILES/\` is treated as the primary project artifact source because it contains the full user-story table, functional and non-functional requirements, use case table, CRUD matrix, entity catalog, relationship table, architecture documents, and original scenario diagrams.

Live Affine MCP access was explicitly checked during this rebuild. The available tool/resource discovery surfaces exposed Adobe Acrobat, Notion, and GitHub helpers, but no Affine MCP namespace or resource server was mounted in this session; \`list_mcp_resources\` returned no resources. Therefore, no artifact is silently invented as an Affine replacement. Where a standalone original was not available through the mounted tools, the report uses either the local Affine export or the original embedded media recovered from the previous DOCX reports, and identifies that source in Appendix K.

# 2. Project Context and Vision

## 2.1 Campus Problem

University campuses create proximity, but proximity alone does not create interaction. Students may share cafeterias, libraries, sport courts, dormitory areas, and study spaces while still missing simple chances to meet for ordinary activities. This is especially visible for newcomers and international students, who may not yet have stable social circles or may hesitate to approach unfamiliar peers without context.

The requirements report framed the problem as both logistical and trust-related. Students want a practical way to find others for meals, study sessions, sport, language exchange, walks, or informal campus events. At the same time, they need assurance that participants belong to the university context, that interaction remains bounded by campus scope, and that safety tools exist if a situation becomes uncomfortable.

## 2.2 Target Users and Trust Boundary

The main user group is Tongji University, Jiading Campus students, including local and international students. The main administrative actor is a controlled campus administrator responsible for campus configuration, structured options, report review, and consent-based insight access. The trust boundary is created by university email verification, campus selection, student profile setup, report/block mechanisms, and scoped administrative authorization.

This boundary is essential to the product identity. InCampus is not a public follower-based platform and not an open-ended profile browsing product. The primary object is the campus activity, not the profile. Profiles are context-limited and expose only the minimum public information needed for trust in an activity workflow.

## 2.3 Product Positioning

| Dimension | InCampus Position |
| --- | --- |
| Product type | Verified campus activity coordination mobile app. |
| First deployment context | Tongji University, Jiading Campus. |
| Core loop | Create activity, browse/filter, view details, join/request, manage requests, notify, report/block when needed. |
| Trust model | University identity rule, campus scope, moderation, blocking, community rules, and privacy consent. |
| MVP style | Lightweight, activity-first, student-centered, campus-specific. |
| Excluded pattern | Generic public social feed or unrestricted profile discovery. |

# 3. Requirements and Scope

## 3.1 Methodology

The requirements workflow began with user stories and moved through functional requirements, non-functional requirements, use case derivation, use case priority scoring, data-flow analysis, CRUD validation, entity modeling, relationship modeling, and UI requirements. Each step was traceable to the previous one. The exported Affine files show this chain explicitly through user-story IDs, FR/NFR codes, use case IDs, data store IDs, and version logs.

## 3.2 User Story Collection

The final exported user-story catalog contains 30 stories across students, student hosts, student guests, and campus admins. Stories cover identity, campus selection, profile setup/editing, activity creation, feed browsing, filtering, activity details, participation, notifications, safety, campus configuration, structured options, and consent-based insights. Post-MVP stories preserve broader social ideas without letting them dilute the MVP.

| Scope | User Stories | Product Meaning |
| --- | --- | --- |
| MVP | US-01 to US-07, US-09, US-11, US-14 to US-30 where marked MVP | Verified access, campus coordination, activity lifecycle, participation, safety, admin setup, consent. |
| Post-MVP | US-08, US-10, US-12, US-13 | Direct messages, friend indicators, participation points, shared activity photos. |

The complete original table is preserved in Appendix A.

## 3.3 MVP and Post-MVP Boundary

The MVP boundary is intentionally activity-first. It includes enough identity, profile, discovery, participation, notification, safety, and campus-administration functionality for a coherent course implementation. Broader social and reward features remain Post-MVP so that the first implementation can preserve privacy, safety, and traceability.

| MVP Area | Included Capability |
| --- | --- |
| Access and profile | Sign up, verify email, sign in, select campus, create/edit profile, update consent. |
| Activity lifecycle | Create activity, set date/time/location/category/capacity, update status, cancel/delete where authorized. |
| Discovery and participation | Browse/filter feed, view details, direct join, request to join, withdraw pending request, leave joined activity, personal activity list. |
| Host controls | View pending requests, approve/decline requests, preserve capacity constraints. |
| Notifications | Host, participant, cancellation, reminder event handling, notification list, context opening. |
| Safety | Report, review report, block user, community rules, moderation delegation. |
| Campus admin | Configure campus, manage structured options, review reports, view consent-based student insights. |

## 3.4 Functional Requirements

The functional requirement catalog defines the system behavior needed to realize the MVP. The final exported table includes the updated consent, structured option, withdraw/leave, cancellation, and insight requirements. Appendix B preserves the full table.

| Group | Examples | Implementation Mapping |
| --- | --- | --- |
| Access and identity | FR-101 to FR-105, FR-1501, FR-1601 | Auth routes, identity rule validation, verification, sign-in, campus selection. |
| Profile and consent | FR-1401 to FR-1403, FR-2901 to FR-2903 | Profile routes and mobile screens, granular campus-insight consent. |
| Activity lifecycle | FR-301 to FR-305, FR-2501, FR-2601 to FR-2603 | Activity creation, scheduling, lifecycle state, hard delete/cancel flows. |
| Discovery and participation | FR-401 to FR-406, FR-2001 to FR-2002, FR-2701 to FR-2704 | Feed/detail routes, join/request, withdraw, leave, personal list. |
| Notifications | FR-601 to FR-704, FR-1101, FR-2801 to FR-2804 | Notification handlers, records, list/context routes, cancellation/reminder support. |
| Safety and moderation | FR-201 to FR-203, FR-1701 to FR-1901 | Report submission/review, block creation, community rules. |
| Campus administration | FR-2301 to FR-2302, FR-3001 | Campus creation, options management, consent-based insights. |

## 3.5 Non-Functional Requirements

The NFR catalog covers security, usability, performance, reliability, scalability, traceability, and privacy. The implementation and design give particular weight to campus isolation, consent, safe moderation routing, transactionality, and minimal profile exposure. Appendix C preserves the full original table.

| Theme | Representative Concern | Design Response |
| --- | --- | --- |
| Security | Verified student scope, credential protection, minimal exposure. | University email validation, auth middleware, account/profile separation, contextual profile reads. |
| Reliability | Participation consistency, report traceability, block enforcement. | Transactional participation updates, report status model, reciprocal block checks in supported flows. |
| Usability | Onboarding, activity details, request flows, report clarity. | Short screen flows, scannable activity cards, structured options, clear moderation actions. |
| Performance | Feed filtering, notification delivery, status changes. | Scoped reads, internal event handling, lightweight notification records. |
| Scalability | Multi-campus setup without new code per campus. | CampusID tenant boundary and campus-specific structured options. |
| Privacy | Student control over non-academic campus-life insights. | Consent stored in AP account state and checked before admin insight assembly. |

## 3.6 Traceability and Priority Logic

Traceability connects user stories, FRs, NFRs, and use cases. The use case priority matrix then scores business/user value, architectural importance, risk, and MVP relevance. High-priority flows are the ones needed to prove the product loop: verified onboarding, campus selection, activity creation, discovery, joining/requesting, host decisions, notifications, safety, configuration, and consent-based insights.

# 4. Requirement Analysis

## 4.1 Use Case Model

The use case diagram was exported from the Affine project documentation and updated to v1.7 for final pre-skeleton alignment. It shows the four main actors and the MVP use case package.

${fig("assets/diagrams/use-case-diagram-v1.7.svg", "Figure 4.1: Original Affine-exported use case diagram v1.7.", {landscape:true})}

## 4.2 Use Case Narratives and Priority Matrix

Use cases were derived from user stories and scored using the project priority matrix. Appendix D preserves the full use case table and priority rows. The representative Join Activity narrative is central because it combines participation mode branching, block checks, capacity checks, duplicate prevention, and notification events.

| Representative Use Case | Main Actor | Why It Matters |
| --- | --- | --- |
| Sign Up with University Email | Student | Establishes verified identity and university boundary. |
| Select Campus | Student | Creates the tenant scope for all later activity reads/writes. |
| Create Activity | Student Host | Produces the main discoverable object in the product. |
| Join Activity | Student Guest | Completes the core product loop. |
| Manage Join Requests | Student Host | Supports controlled participation and safety. |
| Configure New Campus | Campus Admin | Enables multi-campus operation by configuration. |
| View Consent-Based Student Insights | Campus Admin | Demonstrates privacy-by-design administrative access. |

## 4.3 Data Flow Analysis

The DFD work followed a subsystem-first method. Each subgroup produced a workdoc and diagram before the system-level merge. The previous requirements report includes the original embedded DFD evidence recovered from the DOCX media package. The full standalone DFD source was not exposed as a mounted Affine MCP resource in this session; therefore the report uses the original recovered report images and documents that limitation in Appendix K.

${fig(`${reqMedia}/image9.png`, "Figure 4.2: Original requirements-report subgroup DFD example recovered from the DOCX media package.", {landscape:true})}

${fig(`${reqMedia}/image11.png`, "Figure 4.3: Original requirements-report final merged DFD recovered from the DOCX media package.", {landscape:true})}

## 4.4 Data Stores and CRUD Validation

The final CRUD matrix defines operations over ten canonical logical stores. It validates that each module writes its owned stores and that cross-module effects are handled through allowed reads, events, or owner-native commands. Appendix E preserves the full CRUD matrix.

| Store | Name | Owning Module |
| --- | --- | --- |
| DS-CA-001 | Campus Configuration | Campus Administration |
| DS-CA-002 | Campus Structured Options | Campus Administration |
| DS-AP-001 | Student Account | Access and Profile |
| DS-AP-002 | Student Profile | Access and Profile |
| DS-AP-003 | University Identity Rules | Access and Profile |
| DS-HL-001 | Activities | Hosting and Lifecycle |
| DS-HL-002 | Activity Participations | Hosting and Lifecycle |
| DS-SM-001 | Block Relationships | Safety and Moderation |
| DS-SM-002 | Report Records | Safety and Moderation |
| DS-NS-001 | Notification Records | Notifications and System Flow |

## 4.5 Entity Relationship Model

The ERD was produced from the DFD, CRUD matrix, entity catalog, and relationship table. Appendix F and Appendix G preserve the full entity and relationship documentation.

${fig(`${reqMedia}/image14.png`, "Figure 4.4: Original requirements-report Entity Relationship Diagram recovered from the DOCX media package.", {landscape:true})}

# 5. On-Screen Appearance and UI Requirements

## 5.1 Methodology

The on-screen appearance requirements were derived from MVP use cases, FR/NFR constraints, entity fields, safety rules, and DFD ownership boundaries. The earlier requirements report describes a two-pass process: first mapping use cases to screens and required actions, then reviewing the result for MVP alignment, missing fields, permission states, block enforcement, unsupported behavior, and traceability issues.

## 5.2 Screen Inventory

The implemented mobile application and UI brief confirm the following MVP screen inventory.

| Screen Area | Student/Admin Screen |
| --- | --- |
| Access | Sign In, Sign Up, Campus Selection |
| Profile | Profile Setup, Mine/Profile, Consent Settings, Student Profile context |
| Activities | Activity Feed, Activity Details, Create Activity, Manage Requests, Personal Activity List |
| Notifications | Notification List, Notification Fallback/Context |
| Safety | Report Submission, Block User, Community Rules |
| Campus Admin demo | Admin Dashboard, Structured Options, Reports, Report Detail, Admin Insights |

## 5.3 Global UI Constraints

The UI requirements emphasize clarity, trust, and low-friction participation. Student screens must keep activity details scannable, make participation status visible, show errors without ambiguity, and respect block/report constraints. Admin screens must make campus scope explicit and avoid suggesting unrestricted student surveillance.

| Constraint | Requirement |
| --- | --- |
| Campus scope | Activity and admin views must make campus context visible or implicit through scoped navigation. |
| Minimal profile exposure | Profiles appear in relevant contexts only and avoid unnecessary personal data. |
| Consent clarity | Insight sharing must be understandable and revocable without affecting ordinary app access. |
| Safety access | Report, block, and community-rules flows must be discoverable from relevant contexts. |
| Empty/error states | Screens must provide clear empty states, validation errors, and unavailable-target fallbacks. |

## 5.4 Visual Identity

The final report and product UI use the InCampus identity: primary navy, deep navy, campus green, light app background, and white/card surfaces. Coral/yellow accents are used sparingly. This identity supports the product vision because it reads as campus-oriented and trustworthy rather than as a generic public social product.

# 6. Architecture and Object-Oriented Design

## 6.1 Architectural Choice

The Object-Oriented Design Report defines the backend architecture as a Multi-Tenant Modular Monolith with Event-Driven Internal Flows. This choice keeps deployment and testing simple while enforcing module boundaries through ownership rules, event contracts, command delegation, and scoped persistence.

${fig("assets/diagrams/system-architecture-diagram-v1.1.svg", "Figure 6.1: Original Affine-exported system architecture diagram v1.1.", {landscape:true})}

## 6.2 Module Responsibilities

| Module | Responsibility |
| --- | --- |
| Access and Profile | University identity, account activation, campus selection, student profile, consent, platform access status. |
| Campus Administration | Campus configuration, structured options, campus-admin context, consent-based insights. |
| Hosting and Lifecycle | Activity truth, participation truth, capacity, lifecycle status, host request decisions. |
| Discovery and Participation | Feed assembly, filtering, activity details, join/request/withdraw/leave orchestration. |
| Safety and Moderation | Blocks, report submission, report review, moderation outcomes, community rules. |
| Notifications and System Flow | Event handlers, notification records, context opening, suppression/fallback logic. |

## 6.3 Stores and Ownership Rules

The architecture uses a shared relational database but preserves logical ownership. Modules may read other stores only for justified context. They may not mutate another module's truth directly. Notification consequences are event-driven. Moderation consequences are delegated through internal commands to the owning module.

## 6.4 Object Model

The design class diagram translates the ten stores into implementation-aware entities. StudentAccount is the identity root; Campus is the tenant boundary; Activity and Participation carry lifecycle and capacity state; BlockRelationship, ReportRecord, and NotificationRecord implement safety and system flow.

${fig(`${oodMedia}/image5.svg`, "Figure 6.2: Original design class diagram recovered from the Object-Oriented Design Report DOCX media.", {landscape:true})}

## 6.5 Interaction Diagrams

The design includes system sequence diagrams, detailed sequence diagrams, and collaboration diagrams. These diagrams show how the MVP flows respect tenant scope, ownership, transactionality, event handling, and consent.

${fig(`${oodMedia}/image7.svg`, "Figure 6.3: Original system sequence diagram - Sign Up and Select Campus.", {landscape:true})}

${fig(`${oodMedia}/image9.svg`, "Figure 6.4: Original system sequence diagram - Join Activity.", {landscape:true})}

${fig("assets/diagrams/sequence-sign-up-campus.svg", "Figure 6.5: Original sequence diagram - Sign Up and Select Campus.", {landscape:true})}

${fig("assets/diagrams/sequence-join-activity.svg", "Figure 6.6: Original sequence diagram - Join Activity.", {landscape:true})}

${fig("assets/diagrams/sequence-manage-join-requests.svg", "Figure 6.7: Original sequence diagram - Manage Join Requests.", {landscape:true})}

${fig("assets/diagrams/sequence-notification-event.svg", "Figure 6.8: Original sequence diagram - Notification Event Handling.", {landscape:true})}

${fig("assets/diagrams/sequence-report-review.svg", "Figure 6.9: Original sequence diagram - Report and Review Report.", {landscape:true})}

${fig("assets/diagrams/sequence-configure-campus.svg", "Figure 6.10: Original sequence diagram - Configure New Campus.", {landscape:true})}

${fig("assets/diagrams/sequence-consent-insights.svg", "Figure 6.11: Original sequence diagram - View Consent-Based Student Insights.", {landscape:true})}

${fig("assets/diagrams/collaboration-join-activity.svg", "Figure 6.12: Original collaboration diagram - Join Activity.", {landscape:true})}

${fig("assets/diagrams/collaboration-manage-join-requests.svg", "Figure 6.13: Original collaboration diagram - Manage Join Requests.", {landscape:true})}

${fig("assets/diagrams/collaboration-notification-event.svg", "Figure 6.14: Original collaboration diagram - Notification Event Handling.", {landscape:true})}

${fig("assets/diagrams/collaboration-report-submit.svg", "Figure 6.15: Original collaboration diagram - Report Submission.", {landscape:true})}

${fig("assets/diagrams/collaboration-report-delegation.svg", "Figure 6.16: Original collaboration diagram - Report Review and Delegation.", {landscape:true})}

${fig("assets/diagrams/collaboration-configure-campus.svg", "Figure 6.17: Original collaboration diagram - Configure New Campus.", {landscape:true})}

${fig("assets/diagrams/collaboration-consent-insights.svg", "Figure 6.18: Original collaboration diagram - Consent-Based Student Insights.", {landscape:true})}

## 6.6 Lifecycle and Activity Diagrams

The state charts define persistence-based and derived states. Participation uses RecordType plus Status to avoid ambiguity; StudentProfile status is derived from account status; ReportRecord separates review status from moderation action trace.

${fig("assets/diagrams/state-activity-participation.svg", "Figure 6.19: Original state chart - Activity Participation.", {landscape:true})}

${fig("assets/diagrams/state-profile.svg", "Figure 6.20: Original state chart - Student Profile.", {landscape:true})}

${fig("assets/diagrams/state-report-record.svg", "Figure 6.21: Original state chart - Report Record.", {landscape:true})}

${fig(`${oodMedia}/image51.svg`, "Figure 6.22: Original activity diagram - Onboarding and Access.", {landscape:true})}

${fig(`${oodMedia}/image53.svg`, "Figure 6.23: Original activity diagram - Activity Participation Flow.", {landscape:true})}

${fig(`${oodMedia}/image55.svg`, "Figure 6.24: Original activity diagram - Safety and Moderation Flow.", {landscape:true})}

## 6.7 Component Model

The component diagram shows the modular monolith as six backend modules, a mobile frontend, shared contracts, the event dispatcher, internal command interfaces, and the shared PostgreSQL persistence layer. It reinforces that shared persistence is not shared ownership.

${fig(`${oodMedia}/image57.svg`, "Figure 6.25: Original component diagram recovered from the Object-Oriented Design Report DOCX media.", {landscape:true})}

# 7. Implementation and Development Artifacts

## 7.1 Private Repository Access

“For intellectual property and future commercialization reasons, the repository is maintained as private. The development artifacts are available to the teaching staff upon request through controlled GitHub collaborator access.”

Private controlled-access repository reference: \`https://github.com/InCampus-dev/InCampusApp\`.

This report does not expose source-code dumps. It documents architecture, route groups, workflows, tests, and evidence at the level needed for assessment while preserving private implementation IP.

## 7.2 Monorepo Organization

| Area | Role |
| --- | --- |
| \`backend\` | TypeScript/Express/TypeORM backend modules, routes, services, entities, migrations, tests, seed/smoke tooling. |
| \`mobile\` | React Native/Expo mobile application, screens, services, navigation, tests. |
| \`docs\` | API contracts, error/event/internal command contracts, setup/runbook, demo readiness, QA notes. |
| \`Documentation\` / \`documentation\` | Affine-exported requirements, data model, diagrams, architecture, and design workdocs. |
| \`codingOrganization\` | Repository organization and planning support material where present. |

## 7.3 Backend Implementation

The backend is implemented with TypeScript, Express, TypeORM, PostgreSQL, npm workspaces, Vitest, and ESLint. Route groups map to the design modules.

| Subsystem | Implemented Route Groups |
| --- | --- |
| Access and Profile | \`/auth/signup\`, \`/auth/verify-email\`, \`/auth/signin\`, \`/campuses\`, \`/accounts/me/campus\`, \`/accounts/me/consent\`, \`/accounts/me/insight-consent\`, \`/profiles\`, \`/profiles/me\`, \`/activities/:id/profiles/:studentAccountId\`. |
| Campus Administration | \`/admin/campuses\`, \`/admin/campuses/:campusId/structured-options\`, \`/admin/campuses/:campusId/student-insights\`. |
| Hosting and Lifecycle | \`/activities\`, \`/activities/:activityId/requests\`, \`/activities/:activityId/requests/:requestId\`, \`/activities/:activityId/status\`, \`DELETE /activities/:activityId\`. |
| Discovery and Participation | \`GET /activities\`, \`GET /activities/:activityId\`, \`POST /activities/:activityId/join\`, \`DELETE /activities/:activityId/requests/me\`, \`DELETE /activities/:activityId/participants/me\`, \`GET /profiles/me/activities\`. |
| Safety and Moderation | \`/reports\`, \`/admin/campuses/:campusId/reports\`, \`/admin/campuses/:campusId/reports/:reportId/review\`, \`/blocks\`, \`/community-rules\`. |
| Notifications and System Flow | \`/notifications\`, \`/notifications/:notificationId/context\`, internal event handlers for join, decision, leave, cancellation, and reminder events. |

## 7.4 Mobile Implementation

The mobile app is implemented with React Native/Expo and service-layer tests. Current screens cover onboarding, profile, consent, feed, activity details, create activity, manage requests, notifications, personal activities, safety tools, and demo admin workflows.

| Workflow | Mobile Surface |
| --- | --- |
| Student onboarding | Sign Up, verification flow support, Sign In, Campus Selection, Profile Setup. |
| Student profile and consent | Mine/Profile, Profile Setup/Edit, Consent Settings. |
| Activity discovery | Activity Feed, filters, Activity Details. |
| Activity hosting | Create Activity, Manage Requests, update/cancel/delete where supported. |
| Participation | Direct join, approval request, withdraw pending request, leave joined activity. |
| Notifications | Notification List, context routing, fallback screen. |
| Safety | Report Submission, Block User, Community Rules, contextual Student Profile. |
| Campus admin demo | Admin Dashboard, Structured Options, Reports, Report Detail, Admin Insights. |

## 7.5 Current Implementation Status

The course MVP is implemented sufficiently for guided local/demo use and automated verification. It is not claimed as production-ready.

| Status Area | Verified Status |
| --- | --- |
| Automated regression | 280 passing automated tests verified locally: 260 backend and 20 mobile. |
| Backend CI | Successful GitHub Actions backend checks include install, lint, build, test, migrations, seed, backend start, and smoke. |
| Mobile CI | Successful GitHub Actions mobile checks include install and typecheck. |
| Email | Real email delivery remains mock/console-based. |
| Push | Real push delivery remains stub/log-based; notification records and contexts are implemented. |
| Reminder scheduling | Reminder handler exists, but production scheduler hardening remains future work. |
| Admin UI | Demo/admin screens exist; production admin IAM and hardening remain incomplete. |
| Mobile structured options | Implemented in current mobile/backend flow, not listed as missing. |
| Withdraw/leave | Implemented in current mobile/backend flow, not listed as missing. |

# 8. Testing and Quality Assurance

## 8.1 CI Workflow

The repository CI workflow defines backend and mobile checks. Backend checks install dependencies, lint, build, test, run migrations, seed demo data, start the backend, and execute the demo smoke check. Mobile checks install dependencies and run the mobile TypeScript typecheck.

| Branch | Run ID | SHA | Evidence | Result |
| --- | --- | --- | --- | --- |
| \`main\` | \`26859944398\` | \`59c382206540d634c1413448325082189aae9a9b\` | \`gh api repos/InCampus-dev/InCampusApp/actions/runs/26859944398/jobs\` | Backend checks success; Mobile checks success. |
| \`feature/granular-campus-insights-consent\` | \`26859628823\` | \`1baf47541a09f766c43d38783073d7c80ebbce35\` | \`gh api repos/InCampus-dev/InCampusApp/actions/runs/26859628823/jobs\` | Backend checks success; Mobile checks success. |

Raw CLI evidence is included in Appendix I.

## 8.2 Local Verification

| Test Layer | Tool/Command | Scope | Verified Result |
| --- | --- | --- | --- |
| Backend unit/integration | \`npm test --workspace backend\` | Services, routes, event handlers, architectural invariants | 31 files, 260 tests passed. |
| Mobile service tests | \`npm test --workspace mobile\` | API/service helpers, notification fallback copy, activity actions/capacity | 5 files, 20 tests passed. |
| Backend lint | \`npm run lint --workspace backend\` | Backend TypeScript lint rules | Passed. |
| Mobile typecheck | \`npm run typecheck --workspace mobile\` | Mobile TypeScript compile contract | Passed. |
| CI backend | GitHub Actions | Install, lint, build, test, migrate, seed, start, smoke | Successful runs verified. |
| CI mobile | GitHub Actions | Install and typecheck | Successful runs verified. |

Combined automated regression count: 280 passing tests.

## 8.3 Regression Scope

The test suite protects onboarding, campus scoping, profile creation, insight consent, activity creation, feed/detail behavior, join/request flows, withdraw/leave, host approval/decline, notification event handling, notification context opening, reports, blocking, community rules, consent-based insights, and ownership invariants such as event-only notification writes and moderation command delegation.

## 8.4 QA Limitations

The project does not claim full production end-to-end testing. Real email and push integrations are not covered by integration tests because the current delivery mechanisms are mock/console or stub/log based. Mobile UI has service tests and implemented screens, but complete device-level E2E automation is not present. Admin screens are demo/admin surfaces rather than a production staff IAM implementation.

# 9. User Documentation and User Manual

## 9.1 Student User Manual

### 9.1.1 Sign Up, Verify, and Sign In

1. Open InCampus and choose sign up.
2. Enter a supported university email address.
3. Submit the sign-up form and wait for the verification step.
4. Complete email verification using the code or link provided by the system.
5. Return to the app and sign in with the verified account.

### 9.1.2 Select Campus and Set Up Profile

1. After sign-in, review the campuses associated with the verified university identity.
2. Select Tongji University, Jiading Campus when it is the correct campus.
3. Create the student profile with minimal public information such as display name, major/interests, and short profile details.
4. Edit the profile later from the profile or mine area if details change.

### 9.1.3 Manage Campus Insight Consent

1. Open Consent Settings.
2. Review what consent-based insights mean: authorized campus staff may only access supported student-interest/activity insight data when consent is granted.
3. Grant, refuse, or revoke consent.
4. Normal app access continues regardless of the consent choice.

### 9.1.4 Browse, Filter, and View Activities

1. Open the activity feed.
2. Browse available activities in the selected campus.
3. Apply filters such as category, time, location, or other structured options when available.
4. Open an activity to view details: title, host, schedule, place, capacity, participation mode, description, and current availability.

### 9.1.5 Create an Activity

1. Choose create activity.
2. Select category and meeting location from campus structured options.
3. Add title, description, date/time, capacity, and participation mode.
4. Review the details and submit.
5. The activity appears in the campus feed if it is open and discoverable.

### 9.1.6 Join, Request, Withdraw, and Leave

1. Open an activity detail page.
2. If the activity allows direct join and has capacity, choose join.
3. If the activity requires approval, choose request to join.
4. If a pending request is no longer desired, withdraw the request from the activity detail page.
5. If already joined and no longer available, leave the activity before it starts where supported by the current activity state.

### 9.1.7 Manage Requests as Host

1. Open the hosted activity or the manage requests screen.
2. Review pending join requests and applicant profile snippets.
3. Approve a request when capacity and activity state allow it.
4. Decline a request when the applicant should not join.
5. The system updates participation status and notifies the applicant.

### 9.1.8 Hosted Activity Changes

1. Open the hosted activity.
2. Use available actions to update status, cancel, or delete where supported and allowed.
3. Cancellation notifies affected participants when notification records are enabled.
4. Deletion removes the activity according to the current lifecycle rules.

### 9.1.9 Notifications and Personal Activity List

1. Open notifications to see participation, host, cancellation, or reminder records.
2. Open a notification to navigate to the relevant context.
3. If the target is unavailable, blocked, deleted, or no longer accessible, the fallback screen explains the situation.
4. Open the personal activity list to see upcoming and past activity participation contexts.

### 9.1.10 Report, Block, and Community Rules

1. Use report when a user or activity appears unsafe, inappropriate, or unsuitable.
2. Provide the report reason and submit.
3. Use block to avoid further supported interactions with another user.
4. Read community rules from the safety/community area before using participation features.

## 9.2 Campus Admin User Manual

### 9.2.1 Controlled Admin Access

Campus admin access is controlled and scoped. Admins should only operate inside their authorized campus context. Production staff identity hardening remains a future-work item, so course/demo admin surfaces should be treated as controlled demonstration tools.

### 9.2.2 Configure Campus and Structured Options

1. Open the admin dashboard.
2. Configure campus information where authorized.
3. Manage structured options such as activity categories and campus locations.
4. Add, update, or deactivate options carefully because students use them during activity creation and filtering.

### 9.2.3 Review Reports and Record Outcomes

1. Open the campus report queue.
2. Select a report to inspect reporter, target, reason, status, and available context.
3. Record an outcome.
4. When a moderation consequence is needed, the system routes the consequence to the proper owner module rather than letting the admin screen directly mutate unrelated stores.

### 9.2.4 Consent-Based Student Insights

1. Open Admin Insights.
2. Review only students within the authorized campus scope.
3. Understand that identifiable profile/participation insight data is available only for students who granted consent.
4. Students who refuse or revoke consent must not be treated as data gaps to bypass; the restriction is part of the privacy model.

## 9.3 Common Errors and Troubleshooting

| Situation | Meaning | User Action |
| --- | --- | --- |
| Unsupported email domain | The university identity rule does not support the submitted domain. | Use the official university email or contact support/admin. |
| Verification not completed | Account exists but is not active yet. | Complete verification before signing in. |
| Campus unavailable | No campus association was found for the verified identity or selected campus. | Recheck the account/campus selection. |
| Activity full | Capacity has been reached, possibly due to a concurrent join. | Choose another activity or wait for capacity to change. |
| Already joined/requested | A participation or pending request already exists. | Use withdraw/leave if available. |
| Target unavailable | The referenced activity/user was deleted, blocked, or no longer accessible. | Return to the feed or personal list. |
| Consent off | Admin insight data is not shown because the student has not granted consent. | No action required unless the student chooses to change consent. |

# 10. Project Management and Time Management

## 10.1 Work Breakdown Structure

The WBS separated the project into requirements, analysis, UI requirements, architecture/design, implementation, QA, documentation, and final consolidation. The original requirements report identifies the core sequence: user stories, FR/NFRs, use cases, DFDs, CRUD, ERD, UI requirements, and time-management outputs.

| WBS Area | Main Outputs |
| --- | --- |
| Requirements gathering | User stories, FR table, NFR table, traceability. |
| Requirement analysis | Use case diagram, narratives, priority matrix, DFDs, CRUD matrix, ERD. |
| UI requirements | Screen inventory, global constraints, user-facing state requirements. |
| Object-oriented design | Architecture, class diagram, SSDs, sequence, collaboration, state, activity, component diagrams. |
| Implementation | Backend modules/routes, mobile screens/services, seed/smoke scripts. |
| QA | Backend/mobile tests, lint/typecheck, CI checks, smoke verification. |
| Final documentation | Unified final report, appendices, evidence, user manual. |

## 10.2 Critical Path and Slack

The critical path follows artifact dependency order. User stories must precede FR/NFRs; FR/NFRs must precede use cases; use cases and DFDs must precede CRUD and entity modeling; entity/relationship modeling must precede object design and implementation planning. Formatting, presentation, and visual polish have slack because they can run after the core traceability chain is stable.

| Critical Task | Dependency | Slack Interpretation |
| --- | --- | --- |
| User story finalization | Project idea and validation | Low slack because all later requirements depend on it. |
| FR/NFR derivation | User stories | Low slack because use cases and tests trace to these IDs. |
| Use case model | FR/NFRs | Low slack because DFD/design scenarios depend on use cases. |
| DFD and CRUD | Use cases and stores | Low slack because ownership rules depend on this validation. |
| Entity/relationship model | CRUD and data stores | Low slack for object design consistency. |
| UI requirements | Use cases and NFRs | Moderate slack, but must remain aligned with MVP scope. |
| Final report formatting | Completed artifacts | Higher slack; can be done after content is stable. |

## 10.3 Cost-Benefit Estimate

The project is feasible as a course MVP because the core value is delivered by a focused activity coordination loop, not by broad platform features. The main cost comes from cross-module correctness: identity, campus scoping, capacity, notifications, moderation, and consent must be consistent. The benefit is a coherent product that can later be extended to institutional partnerships without rewriting the conceptual architecture.

| Cost Area | Benefit |
| --- | --- |
| Verified identity and campus scoping | Safer, more trusted student interaction boundary. |
| Modular backend design | Clear ownership, easier testing, fewer hidden cross-module mutations. |
| Automated regression suite | Protects core flows and supports faster iteration. |
| Consent-based admin insights | Allows institutional value while respecting student privacy. |
| Private repository/IP control | Preserves future commercialization options. |

# 11. Limitations and Future Work

## 11.1 Course MVP Completion

The course MVP is coherent from requirements to implementation. The core student loop, host controls, safety tools, admin configuration, consent-based insights, backend contracts, mobile screens, and automated tests are present. The implementation is appropriate for a guided local/demo environment.

## 11.2 Alpha and Demo Limitations

The implementation still has alpha/demo limitations. Real email delivery is mock/console-based. Real push delivery is stub/log-based. The reminder handler exists but production scheduling is not hardened. Admin UI exists as demo/admin screens, while production staff IAM and institutional hardening are incomplete. Full production E2E automation is not yet present.

## 11.3 Future Roadmap

Future work should prioritize production email/push integrations, scheduler hardening, staff IAM, device-level E2E tests, institutional onboarding processes, Chinese localization, accessibility review, richer admin audit trails, and careful Post-MVP expansion such as friend indicators, messaging, points, or shared post-activity photos only after the activity-first trust model remains stable.

# 12. Conclusion

InCampus is a complete software engineering project in the course sense: it begins with a concrete campus problem, derives traceable requirements, validates data and use case models, defines a modular architecture, implements the MVP in backend and mobile code, verifies the system through automated tests and CI evidence, and provides user-facing documentation. Its strongest engineering qualities are the CampusID tenant boundary, module ownership discipline, event-driven notifications, moderation command delegation, and privacy-by-design consent handling. The repository remains private for legitimate IP and future commercialization reasons, while development evidence can be made available to teaching staff through controlled collaborator access.

# Appendices

${sourceAppendix("Appendix A - Full User Story Table", "docs/final-report/assets/tables/user-story-v1.3.md", "Original Affine-exported source table.")}

${sourceAppendix("Appendix B - Full Functional Requirements", "docs/final-report/assets/tables/functional-requirements-v1.3.md", "Original Affine-exported source table.")}

${sourceAppendix("Appendix C - Full Non-Functional Requirements", "docs/final-report/assets/tables/non-functional-requirements-v1.2.md", "Original Affine-exported source table.")}

${sourceAppendix("Appendix D - Full Use Case Table and Priority Matrix", "docs/final-report/assets/tables/use-cases-v1.2.md", "Original Affine-exported source table.")}

${sourceAppendix("Appendix E - Full CRUD Matrix", "docs/final-report/assets/tables/crud-matrix-v1.6.md", "Original Affine-exported source table.")}

${sourceAppendix("Appendix F - Full Entity and Attribute Catalog", "docs/final-report/assets/tables/entities-attributes-v1.2.md", "Original Affine-exported source table.")}

## Appendix G - Full Relationship and Data Store Tables

${cleanTableSource(read("docs/final-report/assets/tables/databases-v1.1.md"))}

${cleanTableSource(read("docs/final-report/assets/tables/relationship-table-v1.1.md"))}

## Appendix H - Original Diagrams Gallery

This gallery preserves the major original diagrams used in the report. Standalone SVGs come from the Affine export folders. Some DFD/ERD/class/component/activity diagrams were recovered from the original previous DOCX reports because the live Affine MCP server was not exposed in this session.

${fig("assets/diagrams/use-case-diagram-v1.7.svg", "Appendix Figure H.1: Use Case Diagram v1.7.", {landscape:true})}
${fig(`${reqMedia}/image11.png`, "Appendix Figure H.2: Final Merged DFD recovered from previous requirements report media.", {landscape:true})}
${fig(`${reqMedia}/image14.png`, "Appendix Figure H.3: ERD recovered from previous requirements report media.", {landscape:true})}
${fig("assets/diagrams/system-architecture-diagram-v1.1.svg", "Appendix Figure H.4: System Architecture Diagram v1.1.", {landscape:true})}
${fig(`${oodMedia}/image5.svg`, "Appendix Figure H.5: Design Class Diagram.", {landscape:true})}
${fig(`${oodMedia}/image57.svg`, "Appendix Figure H.6: Component Diagram.", {landscape:true})}
${fig(`${oodMedia}/image51.svg`, "Appendix Figure H.7: Onboarding and Access Activity Diagram.", {landscape:true})}
${fig(`${oodMedia}/image53.svg`, "Appendix Figure H.8: Activity Participation Flow.", {landscape:true})}
${fig(`${oodMedia}/image55.svg`, "Appendix Figure H.9: Safety and Moderation Flow.", {landscape:true})}
${fig("assets/diagrams/sequence-sign-up-campus.svg", "Appendix Figure H.10: Sign Up and Select Campus Sequence Diagram.", {landscape:true})}
${fig("assets/diagrams/sequence-join-activity.svg", "Appendix Figure H.11: Join Activity Sequence Diagram.", {landscape:true})}
${fig("assets/diagrams/sequence-manage-join-requests.svg", "Appendix Figure H.12: Manage Join Requests Sequence Diagram.", {landscape:true})}
${fig("assets/diagrams/sequence-notification-event.svg", "Appendix Figure H.13: Notification Event Handling Sequence Diagram.", {landscape:true})}
${fig("assets/diagrams/sequence-report-review.svg", "Appendix Figure H.14: Report and Review Report Sequence Diagram.", {landscape:true})}
${fig("assets/diagrams/sequence-configure-campus.svg", "Appendix Figure H.15: Configure New Campus Sequence Diagram.", {landscape:true})}
${fig("assets/diagrams/sequence-consent-insights.svg", "Appendix Figure H.16: View Consent-Based Student Insights Sequence Diagram.", {landscape:true})}
${fig("assets/diagrams/collaboration-join-activity.svg", "Appendix Figure H.17: Join Activity Collaboration Diagram.", {landscape:true})}
${fig("assets/diagrams/collaboration-manage-join-requests.svg", "Appendix Figure H.18: Manage Join Requests Collaboration Diagram.", {landscape:true})}
${fig("assets/diagrams/collaboration-notification-event.svg", "Appendix Figure H.19: Notification Event Handling Collaboration Diagram.", {landscape:true})}
${fig("assets/diagrams/collaboration-report-submit.svg", "Appendix Figure H.20: Report Submission Collaboration Diagram.", {landscape:true})}
${fig("assets/diagrams/collaboration-report-delegation.svg", "Appendix Figure H.21: Report Review and Delegation Collaboration Diagram.", {landscape:true})}
${fig("assets/diagrams/collaboration-configure-campus.svg", "Appendix Figure H.22: Configure New Campus Collaboration Diagram.", {landscape:true})}
${fig("assets/diagrams/collaboration-consent-insights.svg", "Appendix Figure H.23: Consent-Based Student Insights Collaboration Diagram.", {landscape:true})}
${fig("assets/diagrams/state-activity-participation.svg", "Appendix Figure H.24: Activity Participation State Chart.", {landscape:true})}
${fig("assets/diagrams/state-profile.svg", "Appendix Figure H.25: Student Profile State Chart.", {landscape:true})}
${fig("assets/diagrams/state-report-record.svg", "Appendix Figure H.26: Report Record State Chart.", {landscape:true})}

## Appendix I - GitHub Actions and Test Evidence

${codeBlockFromFile("Backend Test Output", "docs/final-report/assets/test-evidence/backend-test-output.txt")}
${codeBlockFromFile("Mobile Test Output", "docs/final-report/assets/test-evidence/mobile-test-output.txt")}
${codeBlockFromFile("Backend Lint Output", "docs/final-report/assets/test-evidence/backend-lint-output.txt")}
${codeBlockFromFile("Mobile Typecheck Output", "docs/final-report/assets/test-evidence/mobile-typecheck-output.txt")}
${codeBlockFromFile("GitHub Actions CLI Evidence", "docs/final-report/assets/test-evidence/github-actions-cli-evidence.txt")}

## Appendix J - Technical Reproducibility Notes

These notes are intentionally separate from the user manual.

| Area | Command or Note |
| --- | --- |
| Backend tests | \`npm test --workspace backend\` |
| Mobile tests | \`npm test --workspace mobile\` |
| Backend lint | \`npm run lint --workspace backend\` |
| Mobile typecheck | \`npm run typecheck --workspace mobile\` |
| Demo seed/smoke | See \`docs/demo-seed.md\`, \`docs/backend-smoke-check.md\`, and \`docs/project-runbook.md\`. |
| PDF rebuild | \`node docs/final-report/temp/build-final-report.mjs\`, \`node docs/final-report/temp/render-report.mjs\`, then Brave headless print to PDF. |

## Appendix K - Documentation Sources Used

| Source | Use |
| --- | --- |
| \`Documentation/INcampusFILES/\` | Primary exported Affine workspace material for requirements, tables, diagrams, architecture, and design workdocs. |
| Previous requirements report DOCX/PDF | Narrative, UI requirements, time-management content, and recovered embedded DFD/ERD/media. |
| Previous Object-Oriented Design Report DOCX/PDF | Architecture narrative and recovered class, SSD, activity, component, and diagram media. |
| \`docs/api-contract.md\` | Current implementation route contract and subsystem mapping. |
| \`.github/workflows/ci.yml\` | CI command sequence and job structure. |
| Local test outputs | Verified backend/mobile/lint/typecheck evidence. |
| GitHub CLI \`gh api\` output | Real GitHub Actions run/job evidence. |

Live Affine MCP note: an Affine MCP server was requested as a required source, but no Affine server/resource/tool was exposed to this session after tool discovery and resource checks. The local Affine exports therefore served as the available primary Affine source. Missing standalone artifacts were recovered from original previous report media when possible. No generated replacement diagram is presented as an original.

## Appendix L - Glossary

| Term | Meaning |
| --- | --- |
| AP | Access and Profile. |
| CA | Campus Administration. |
| H&L | Hosting and Lifecycle. |
| D&P | Discovery and Participation. |
| SM | Safety and Moderation. |
| NSF / N&S | Notifications and System Flow. |
| CampusID | Explicit tenant boundary used to scope accounts, activities, reports, options, and admin access. |
| DS | Logical data store identifier used in DFD/CRUD/design artifacts. |
| FR | Functional Requirement. |
| NFR | Non-Functional Requirement. |
| DUC | Design Use Case. |
| SCD | State Chart Diagram. |
| MVP | Minimum viable product scope for the course implementation. |
`;

writeFileSync(
  path.join(root, "final-report.md"),
  md.replace(/\\`/g, "`").replace(/\n{3,}/g, "\n\n").trim() + "\n"
);
