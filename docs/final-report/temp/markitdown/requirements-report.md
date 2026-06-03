

InCampus
Software Engineering Project Report
Living the campus, Living the youth, Living life
Target Campus:  Tongji University, Jiading Campus
Product Type:  Mobile Application
Members:  Francesco Nativitati, Jacopo Donati, Matteo Silvetro, YiMing
Document Date:  April 2026









1. Introduction
1.1 Background
1.1.1 The Problem
1.1.2 Existing Platforms and Their Limitations
1.1.3 InCampus as the Response
1.1.4 Product Roadmap and Phased Delivery
1.2 Purpose
1.2.1 Document Scope
1.2.2 System Scope
1.2.3 Development Approach
2. Requirement Gathering
2.1 User Story Table
2.2 Functional Requirements Table
2.3 Non-Functional Requirements
3. Requirement Analysis
3.1 Use Case Diagram
3.2 Use Case Narrative Example
3.3 Use Case Priority Matrix
3.4 System Architecture
3.5 Data Flow Diagram (DFD)
3.6 Data Stores & CRUD Matrix
3.7 Entity Relationship Diagram (ERD)
4. On-Screen Appearance Requirements
4.1 Methodology
4.2 Screen Inventory
4.3 Global UI Constraints
5. Time Management
5.1 Work Breakdown Structure of the System
5.2 The Critical Path of the System
5.3 The Slack Time of Each Non-Critical Activity
5.4 Cost-Benefit Estimate
6. Conclusion









1. Introduction
University campuses provide a natural environment for social interaction, yet many students, particularly newcomers and international students, lack effective tools for organising spontaneous, small-group activities with verified peers. This report documents the requirements engineering, system analysis, architecture design, user interface specification, and project time management for InCampus, a campus-scoped social coordination platform designed to address this gap within the Chinese higher education context.
This document is intended as a structured overview of the work carried out by the team across all project phases. It presents the key decisions, methodological choices, and representative outputs for each phase, rather than reproducing the full technical artefacts in their entirety. Readers seeking the complete documentation, including all user stories, functional and non-functional requirements, use case narratives, DFD workdocs, entity definitions, and the ERD, are directed to the project's primary workspace on Affine, which serves as the single source of truth for all detailed deliverables.
1.1 Background
1.1.1 The Problem
University students, particularly those in their first year or studying at a campus far from home, frequently struggle to form meaningful social connections outside formal academic settings. While campus environments offer physical proximity and shared institutional context, the absence of a dedicated coordination tool means that opportunities for spontaneous small-group activities, such as a shared meal, a study session, or an informal sports match, often go unrealised. This challenge is compounded for international students, who may face language barriers, cultural unfamiliarity, and limited access to existing social circles.
The user research conducted for this project consistently reflects these concerns. Students expressed the need to "find other students to share an ordinary campus moment with" (US-03) and to "feel safer" through verified university access (US-01). Multiple user stories reference comfort and trust as prerequisites for participation: students want to "feel safe joining or accepting activities" (US-14), to "decide whether [they] feel comfortable" before engaging with unfamiliar peers (US-22), and to "avoid further unwanted interaction" when necessary (US-18). Taken together, these narratives point to a social coordination gap that is not merely logistical but also rooted in trust and identity verification.
The initial validation of the idea also supports this direction. During the first project proposal phase, the team collected feedback from ten potential users, who expressed interest in using the app and mentioned concrete needs such as finding people for shared meals, study sessions, sports activities, or meeting students outside their usual circle. This confirms that the problem is not abstract: students already recognize the lack of a simple campus-specific tool for turning ordinary free time into real social interaction.
1.1.2 Existing Platforms and Their Limitations
Students currently rely on a mix of general-purpose communication tools, social networking platforms, and emerging social discovery applications to meet new people or organize activities. However, none of these solutions fully addresses the specific problem targeted by InCampus: helping verified students from the same campus find low-pressure opportunities to share ordinary moments such as meals, breaks, study sessions, sports, or informal campus events.
For this reason, the competitive landscape should be divided into two categories. The first category includes direct or near-direct competitors: platforms that already attempt to support friendship, student communities, or activity-based social discovery. The second category includes indirect substitutes: tools that students currently use to coordinate campus life, even though they were not designed specifically for structured, campus-scoped activity coordination
Platform
Type
Relevance to InCampus
Key Limitations Compared with InCampus
Knock App 
Activity-based friendship app (Italy)
Relevant because it focuses on meeting new people through outings and shared activities.
It is not designed specifically around a single university campus, institutional verification, campus-specific onboarding, or university-managed trust and safety. It supports social discovery broadly, while InCampus focuses on verified campus life and ordinary student routines.
OpenYard
University / student social app (Italy)
Highly relevant because it focuses on university students, events, forums, chat, and student discovery.
It is broader than InCampus: it includes forums, chat, maps, events, and general student networking. InCampus should remain lighter in the MVP and focus on one core flow: create, discover, join, and manage small campus activities with verified peers. OpenYard could not work in a Campus centered view.
GoInConnect
Student community and university onboarding platform (Europe)
Relevant because it helps students connect with future classmates and build student communities.
It is mainly positioned around pre-arrival student connection and university onboarding. InCampus instead targets everyday on-campus activity coordination after students are already living or studying on campus.
Soul
Chinese interest-based social platform
Relevant as a Chinese social discovery platform used by young people to find conversations and connections based on interests and personality.
It is not campus-scoped, not based on real university identity, and not focused on organizing concrete campus activities with participant limits, join requests, and activity lifecycle management.
狐友
Chinese social / campus community platform
Relevant because it includes campus-oriented social interaction and school-circle community features.
It is closer to a social community or feed model. InCampus should differentiate itself by focusing less on broad posting or profile browsing and more on structured, low-friction activity participation among verified students from the same campus.
多啦校圈
Chinese campus social / community app
Relevant as a project-identified campus social competitor.
It should be treated as a direct campus-social reference, but its exact feature set should be verified before making strong claims. InCampus should still differentiate through university verification, structured activity coordination, trust and safety, and a focused MVP.
WeChat / QQ group chats
Indirect substitute
Students often use group chats to coordinate campus activities informally.
Discovery depends on already knowing the right people or being invited to the right group. Activity information is mixed with general chat noise, and there is no structured support for participant limits, approval-based joining, activity status, or campus-scoped discovery.
Xiaohongshu / Weibo
Indirect substitute
Students may discover events, places, or social opportunities through public posts and recommendations.
These platforms are built for content discovery and public broadcasting, not for verified small-group campus coordination. They do not provide a dedicated activity lifecycle, campus-only participation, or structured join/request management.

The main gap across these competitors and substitutes is that none of them combines all the elements required by InCampus: university-verified access, campus-scoped visibility, low-pressure activity discovery, structured participation flows, participant limits, approval-based joining when needed, activity lifecycle management, notifications, and basic trust and safety mechanisms. This is the position InCampus should occupy: not a generic social network, not a dating app, and not a simple chat group, but a lightweight campus coordination platform for ordinary shared moments.
1.1.3 InCampus as the Response
InCampus is designed as a direct response to this gap. Access to the platform is gated by university email verification: only students with a valid institutional email can register (US-01, FR-0101 to FR-0105), and upon onboarding each user selects a specific campus that scopes all content visible to them (US-16, FR-1601). Within this verified, campus-bounded environment, students can create activities with defined categories, participant limits, meeting points, and participation modes, while other students can discover, filter, and join those activities through a structured interface. Trust and safety mechanisms, including user reporting (US-17), blocking (US-18), community rules (US-19), and campus administration with moderation capabilities (US-02), are integrated into the core experience.
The platform targets the specific social moment that existing tools fail to support: a verified student wants to do something ordinary on campus (have lunch, play badminton, study together) and needs a low-friction way to find one or a few other verified students from the same campus who want to join.
Compared with broader social platforms, InCampus deliberately avoids endless profile browsing and generic content feeds. Its core interaction is intention-based: a student wants to do something specific on campus, publishes or discovers an activity, and joins a small, bounded interaction with verified peers. This keeps the product aligned with the original idea of reducing social isolation through simple shared moments rather than creating another general-purpose social network.
1.1.4 Product Roadmap and Phased Delivery
The system is designed with an evolutionary product strategy that distinguishes between immediate delivery and planned future extensions. The current scope of work targets the Minimum Viable Product (MVP), which covers the core functional domains required for the platform to operate as a self-contained, useful system. A set of Post-MVP deliverables has been identified and documented alongside the MVP to ensure architectural decisions made today do not preclude future expansion.
Phase
Scope
User Stories
MVP
Campus-based onboarding and identity verification, minimal user profiles, activity creation and full lifecycle management (create, set date/time, manage requests, update status, delete), activity discovery and participation (browse, filter, view details, join, withdraw, leave), notification system (host notifications, participant outcome notifications, cancellation notifications), trust and safety (community rules, report, block), campus administration and configuration.
US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-09, US-14, US-15, US-16, US-17, US-18, US-19, US-20, US-21, US-22, US-23, US-24, US-25, US-26, US-27, US-28 (23 user stories)
Post-MVP
Direct messaging between students, friend connections and social indicators on the activity feed, pre-activity reminder notifications, participation point tracking, post-activity shared photo uploads.
US-08, US-10, US-11, US-12, US-13 (5 user stories)

This phased approach ensures that the foundational functionality, which addresses the core problem of campus social coordination, is delivered, tested, and validated before the platform is extended with social, gamification, and communication features.

1.2 Purpose
1.2.1 Document Scope
This report serves as the primary reference document for the InCampus project. It is intended for use by the development team, project stakeholders, and academic evaluators as a consolidated record of all design decisions and their supporting rationale. The report covers the following areas:
Report Section
Content
Requirements Gathering
User stories with priority and duration estimates, functional requirements with priority estimation, non-functional requirements.
Requirements Analysis
Use case diagram, use case narrative examples, use case priority matrix, system architecture, Data Flow Diagrams (DFD), Entity Relationship Diagram (ERD).
On-Screen Appearance
User interface specifications and mockups.
Project Time Management
Work Breakdown Structure, critical path analysis, slack time of non-critical activities, cost-benefit estimate.

1.2.2 System Scope
The system scope addressed in this report corresponds exclusively to the MVP release of InCampus. The MVP encompasses 23 user stories and their derived functional and non-functional requirements, organised across six functional domains: Access and Identity, User Profile, Activity Management, Discovery and Participation, Notifications, and Safety and Moderation. Together, these domains cover the complete lifecycle of a campus activity, from student registration and profile creation through activity creation, discovery, participation, and moderation.
Five additional user stories, covering direct messaging, friend connections and social indicators, pre-activity reminders, participation points, and post-activity photo uploads, have been classified as Post-MVP. These features are documented within the project workspace for roadmap reference but are explicitly excluded from the analysis, architecture, and project planning presented in this report.
The full mapping between user stories, functional requirements, non-functional requirements, and use cases, including bidirectional traceability, is maintained on the project's Affine workspace and is not reproduced here.
1.2.3 Development Approach
This document reflects an iterative and traceable requirement engineering process in which each deliverable was derived from and validated against the preceding one. The process was managed through a shared task tracker that provides a complete audit trail of decisions and revisions.
The team began by identifying user stories from initial stakeholder discussions and team workshops, then derived functional and non-functional requirements from those stories. Bidirectional traceability was established between all three artefact types (user stories, FRs, NFRs) and reviewed as a team before proceeding. Use cases were then derived from the validated user stories and linked back to their originating requirements.
Each use case was evaluated through a six-factor priority matrix, and the results were used to order the use cases by descending priority. Detailed use case narratives were written for all 31 identified use cases (encompassing both MVP and Post-MVP scope). These narratives informed the construction of the use case diagram, which reached version 1.4 through iterative refinement.
During the diagramming process, the use cases naturally grouped into functional clusters. These clusters were formalised as six DFD subsystems (Access and Profile, Campus Administration, Hosting and Lifecycle, Discovery and Participation, Safety and Moderation, Notifications and System Flow) and used to partition the system architecture work across the team. Each subsystem produced a DFD diagram and an accompanying workdoc containing revision history, boundary definitions, adjacent subsystem interfaces, key business events, logical processes, external entities, and data stores. The subsystem DFDs were then integrated into a single merged system-level DFD and validated through a CRUD matrix.
Finally, the team conducted system analysis: entities, attributes, and relationships were derived from the narratives and data flow analysis, carefully reviewed, and used to produce the Entity Relationship Diagram. This sequential, review-gated workflow ensured internal consistency across all project artefacts and provides the structural foundation for the sections that follow. 


Step
Artefact produced
Main input
Validation / review purpose
1
User Stories
Initial idea, team discussion, user validation
Capture real user needs and separate MVP from Post-MVP scope
2
Functional Requirements
User Stories
Translate user needs into testable system behaviours
3
Non-Functional Requirements
User Stories and FRs
Define quality constraints such as security, usability, reliability, performance, and scalability
4
Use Case Narratives
US, FR, NFR
Describe actor goals, system interactions, preconditions, alternate scenarios, and postconditions
5
Use Case Diagram
Use Case Narratives
Visualise system scope, actors, and relationships
6
Subsystem DFD Workdocs
Use cases and requirements
Define subsystem boundaries, data flows, stores, responsibilities, and open points
7
Subsystem DFDs
DFD Workdocs
Model data movement inside each subsystem
8
Final Merged DFD
Six subsystem DFDs
Integrate subsystem flows into one system-level model
9
CRUD Matrix
Merged DFD and canonical data stores
Validate ownership and create/read/update/delete access patterns
10
Entity & Attribute Workdoc
CRUD Matrix and DFD stores
Define logical entities, attributes, keys, and ownership
11
Relationship Review
Entity catalogue and business flows
Validate cardinalities and avoid missing or unjustified relationships
12
ERD
Entity and relationship workdocs
Produce the final logical data model
13
UI Requirements
Use cases, FR/NFR, DFD, CRUD, ERD
Specify MVP screen behaviour, states, permissions, and constraints


2. Requirement Gathering
The requirement gathering phase was conducted through a combination of stakeholder analysis, team workshops, and iterative refinement. The team began by identifying user stories that captured the needs and expectations of the system's primary actors, then derived functional and non-functional requirements from those stories. Bidirectional traceability was established between all three artefact types to ensure that every requirement could be traced back to a user need and every user story was addressed by at least one requirement.

2.1 User Story Table
User stories served as the foundational artefact for the InCampus requirement engineering process. Each story was written from the perspective of one of the system's actors (Student, Student Host, Campus Admin) and captures a specific goal that the system should enable. The initial set of stories was identified through team discussion, then refined through multiple team meetings to ensure completeness, clarity, and alignment with the intended first release. Each user story was assigned a priority classification (MVP or Post-MVP) and linked to its derived functional and non-functional requirements.
The following table presents a representative subset of the 28 user stories. The full table, including all traceability links and metadata, is maintained on the project's Affine workspace.
US-ID
User Story
Function
Actor
Priority
US-01
As a student, I can sign up with my university email so that I'm sure only university users can access the app and I feel safer.
Access and Identity
Student
MVP
US-03
As a student, I want to create a new activity by selecting a category, adding details, and setting a participant limit, so that I can find other students to share an ordinary campus moment with.
Activity Management
Student
MVP
US-04
As a student, I want to browse through the activities and with a filter, so that I can choose the activity to participate in based on my personal preference.
Activity Management
Student
MVP
US-08
As a student, I want message functions so that I can text to others or forward the link of a specific activity to them.
Personal and Social Area
Student
Post-MVP
US-17
As a student, I can report an inappropriate user or activity so that unsafe or unsuitable situations can be reviewed and handled.
Safety and Moderation
Student
MVP
US-23
As a campus admin of a new campus, I can configure the campus-specific setup of the app through a small number of guided steps so that the app can operate correctly in my campus.
Campus Config
Campus Admin
MVP

Table 2.1: Representative user stories. Full table (28 user stories) available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/0DvJ_7MhMu


2.2 Functional Requirements Table
Functional requirements were derived directly from user stories. Each FR specifies a discrete behaviour that the system must exhibit to fulfil the intent expressed in its originating story. Traceability was enforced bidirectionally: every FR is linked to at least one user story, and every user story is covered by at least one FR. The team reviewed all traceability links as a group before proceeding to use case derivation.
The following table presents a representative subset of the functional requirements. The full table is maintained on the project's Affine workspace.
FR-ID
Functional Requirement
Traceability
MVP/Post
FR-0101
The system shall allow a user to enter a university email address during registration.
US-01
MVP
FR-0301
The system shall allow a student host to select an activity category from a predefined campus-specific list.
US-03, US-24
MVP
FR-0501
The system shall display a list of pending join requests to the activity host, showing the minimal profiles of the requesting students.
US-05, US-22
MVP
FR-0801
The system shall provide a messaging function that allows a student to send direct text messages to another student.
US-08
Post-MVP
FR-2001
The system shall allow a student to request to join an activity that requires approval or join directly when direct joining is allowed.
US-20, US-05, US-06
MVP
FR-2601
The system shall allow the host to delete an activity they created before the activity has started.
US-26
MVP

Table 2.2: Representative functional requirements. Full table available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/cVzrNU821B


2.3 Non-Functional Requirements
Non-functional requirements capture the quality attributes that the system must satisfy. For InCampus, these span five primary categories: security (data protection, access control, identity verification), usability (flow simplicity, interface clarity), performance (response times, notification delivery speed), reliability (data consistency, concurrency handling), and scalability (multi-campus support, configuration-driven expansion). Each NFR was linked to its originating user story and to the functional requirements it constrains, establishing a three-way traceability between user stories, functional requirements, and non-functional requirements. The full traceability network was reviewed by the team as a group before proceeding to use case derivation.
NFR-ID
Category
Non-Functional Requirement
Related To
NFR-01
Security
The system shall protect registration and verification data from unauthorized access.
US-01
NFR-05
Scalability
The email-domain validation mechanism shall support future expansion to multiple universities and campuses.
US-01
NFR-10
Usability
The activity creation flow shall require only a small number of clear steps so that students can create an activity quickly in typical campus situations.
US-03, US-25
NFR-13
Reliability
The system must handle concurrent join requests accurately to ensure that the maximum participant limit set by the host is never exceeded due to overlapping database writes.
US-03, US-05, US-20, US-27
NFR-14
Performance
The system shall deliver host notifications within a short time after the join request or join event is completed.
US-06
Table 2.3: Representative non-functional requirements. Full table (44 NFRs) available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/ScUMIHqeVl


3. Requirement Analysis
With user stories, functional requirements, and non-functional requirements established and cross-linked, the team proceeded to structured requirement analysis. This phase transformed the raw requirements into use cases, prioritised them for MVP selection, and produced the analytical artefacts (use case diagram, DFDs, ERD) that inform the system architecture. Each step in this phase was derived from and validated against the preceding deliverable.
3.1 Use Case Diagram
Use cases were derived from the validated user stories by identifying discrete, actor-initiated interactions with the system. Each use case was linked back to its originating user stories and to the functional and non-functional requirements it addresses. The team produced 31 use cases in total (26 MVP and 5 Post-MVP), each with a detailed narrative specifying preconditions, main success scenario, alternate scenarios, and postconditions.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/n_j6yehVr_aOoC3UycoHB

The use case diagram (v1.4) provides a visual overview of all identified use cases, their primary actors, and the key relationships between them (including <<include>> and <<extend>> relationships). During the diagramming process, the use cases naturally grouped into six functional clusters: Access and Profile, Campus Administration, Hosting and Lifecycle, Discovery and Participation, Safety and Moderation, and Notifications and System Flow. These clusters were subsequently formalised as the six DFD subsystems used to partition the architecture work.

Figure 3.1: Use Case Diagram v1.4. Full use case narratives available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/HzTBjm5la2IDisNJmVr7A
3.2 Use Case Narrative Example
Each of the 31 use cases was elaborated into a detailed narrative following a consistent structure: use case name, related requirements, initiating actor, actor's goal, participating actors, preconditions, postconditions, main success scenario, and alternate scenarios. The narrative format ensures that edge cases and system constraints are captured explicitly, rather than left implicit in the user story.
The following table presents a summary of the Join Activity use case narrative as a representative example. This use case was selected because it spans both participation modes (direct join and approval-based), involves concurrency constraints (NFR-13), and connects to multiple downstream use cases (notifications, request management, withdrawal).
Field
Content
Use Case
Join Activity
Related Requirements
FR-0305, FR-2001, FR-2002, FR-0502, NFR-13, NFR-34
Initiating Actor
Student (in guest/participant role)
Actor's Goal
Join a campus activity, either directly or by submitting a join request when approval is required, so that the student can participate in a shared campus moment with low friction.
Preconditions
Verified active account, signed in, campus associated, activity exists and visible, not at capacity, not cancelled/deleted, student is not the host, no existing participation record.
Main Success Scenario
Path A (Direct Join):
Student selects activity → system shows details (direct join allowed) → student confirms → system verifies capacity (concurrency-safe) → registers participant → confirms to student → notifies host.
Path B (Approval-Based):
Student selects activity → system shows details (approval required) → student confirms → system verifies limits → records pending request → confirms to student → notifies host.
Alternate Scenarios
A1: Participant limit reached. A2: Activity no longer available. A3: Student already joined/requested. A4: Block relationship exists. A5: Concurrent join conflict (NFR-13).
Postconditions
Direct join: student registered as participant, count incremented, host notified. Approval-based: pending request recorded, request count incremented, host notified.
Table 3.2: Join Activity use case narrative (summary). Full narratives for all 31 use cases available on the Affine workspace.

https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/dat1BmcX5rVdTU4klyR7T
3.3 Use Case Priority Matrix
To determine the development order and MVP boundary, each use case was evaluated through a six-factor priority matrix. The six factors assess different dimensions of a use case's importance to the system: each factor is scored on a scale of 1 to 5, and the total score determines the overall priority. Use cases were then ordered by descending total score. The matrix was applied consistently across all 31 use cases, producing a clear ranking that informed the MVP/Post-MVP classification.
The following table presents a representative subset of the priority matrix output, showing the six factor scores and total priority for selected use cases.
Use Case
F1
F2
F3
F4
F5
F6
Total
Section
Join Activity
5
4
4
1
5
4
23
MVP
Configure New Campus
5
3
4
2
5
3
22
MVP
Sign Up with University Email
5
3
4
2
5
2
21
MVP
Browse and Filter Activities
4
5
2
1
5
4
21
MVP
PostMVP - Send Message
3
4
3
2
4
2
18
Post-MVP
Edit Profile
1
4
1
1
3
1
11
MVP
Table 3.3: Representative priority matrix output. Full matrix for all 31 use cases available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/n_j6yehVr_aOoC3UycoHB
3.4 System Architecture
The system architecture was derived from the functional groupings that emerged during use case diagramming. The six use case clusters were formalised into six internal subsystems, each with clearly defined data ownership and inter-subsystem interfaces: Access and Profile (AP), Campus Administration (CA), Hosting and Lifecycle (H&L), Discovery and Participation (D&P), Safety and Moderation (SM), and Notifications and System Flow (NSF). Three external entities interact with the system: Student, Campus Admin, and the Notification Delivery Mechanism.
The architecture work was partitioned across the team by subsystem. Each subgroup produced a DFD diagram and a workdoc containing revision history, material analysed, group boundary and coherence, adjacent subsystems, key business events, logical functions and processes, external entities, and data stores. This partition ensured that each subsystem was analysed in depth while maintaining clear integration boundaries.

Figure 3.4: InCampus System Architecture Overview.

3.5 Data Flow Diagram (DFD)
The Data Flow Diagram was produced through a subsystem-based workflow rather than by drawing the full system at once. Since InCampus includes several interacting functional areas, the team first decomposed the system into six architectural subsystems: Access and Profile, Campus Administration, Hosting and Lifecycle, Discovery and Participation, Safety and Moderation, and Notifications and System Flow.
For each subsystem, a dedicated workdoc was created before producing the corresponding DFD. These workdocs were essential because they documented the reasoning behind each diagram, including the subsystem boundary, adjacent subsystem interfaces, external entities, key business events, logical processes, data stores, and open points. This made the DFD work traceable and reviewable, instead of being only a set of isolated diagrams.
The construction process followed these steps:
	•	Identify the subsystem boundary and clarify which responsibilities belong inside the subsystem. 
	•	Identify the external actors or adjacent subsystems that exchange data with it. 
	•	Derive the main processes from the use case narratives and functional requirements. 
	•	Identify the data stores used or owned by the subsystem. 
	•	Draw the subsystem DFD, showing data flows between actors, processes, and data stores. 
	•	Review the DFD against the subsystem workdoc to check missing flows, unclear responsibilities, or inconsistent ownership. 
	•	Merge the six subsystem DFDs into one integrated system-level DFD. 
	•	Validate the merged DFD through the CRUD matrix, checking which processes create, read, update, or delete data in each canonical data store. 
The workdocs therefore acted as the bridge between the requirements analysis and the final diagram. They preserved the intermediate reasoning that cannot be fully represented inside the DFD itself, such as why a process belongs to one subsystem, why a data store is owned by another subsystem, and when cross-subsystem data access is justified.
The final merged DFD represents the integrated data flow of the whole InCampus system. It shows how students, campus administrators, and the notification delivery mechanism interact with internal processes and persistent data stores. The diagram also reflects the architectural ownership principle adopted in the project: each subsystem owns its own truth stores, while cross-subsystem access is allowed only when explicitly justified by the business flow.
The six subsystem DFDs and their related workdocs are maintained in the project workspace as supporting documentation. To keep the report readable, only one subgroup DFD is included below as an example of the method used for each subsystem. The complete set of subgroup DFDs, workdocs, integration notes, and validation documents is stored in the W7 Software Architecture workspace.

Example of a subgroup DFD used during the subsystem-level analysis phase. Access and Profile dfd and working document here:
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/kHecY6Ghu8
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/li7x92VcwK6lie4982Tca
The subgroup DFDs were not produced as isolated diagrams. Each of them was paired with a corresponding workdoc, where the team documented the reasoning behind the diagram: subsystem responsibilities, external actors, relevant processes, owned or accessed data stores, cross-subsystem dependencies, open points, and design decisions. This ensured that each DFD could be reviewed and corrected before being merged into the final system-level model.
The following workspace organization shows how the architecture documentation was structured. For each subgroup, the workspace contains both the DFD diagram and the related DFD workdoc. In the example shown, the Hosting and Lifecycle folder contains the H&L DFD and the H&L DFD workdoc, while the higher-level architecture folder also includes the Architecture workdoc, the CRUD matrix, and the DFD integration and merge document.

Software Architecture workspace organization, showing the subgroup DFD and the related DFD workdoc structure.
After the subgroup-level analysis was completed, the individual DFDs were merged into a single system-level DFD through a dedicated integration process. The integration workdoc was used to resolve overlaps between subsystems, remove duplicate flows, check inter-subsystem dependencies, and ensure that each data store was accessed only through justified processes. Finally, the merged DFD was validated against the CRUD matrix, which checked whether each process correctly creates, reads, updates, or deletes data in the canonical system data stores.

Figure 3.5: Final Merged Data Flow Diagram. Subsystem DFD workdocs and CRUD matrix available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/oLFYD4ocigUCOKKX_6ka9
3.6 Data Stores & CRUD Matrix
The database analysis was developed after the DFD integration phase, using the merged DFD as the main reference for identifying the persistent data needed by the system. Instead of starting from implementation tables, the team first identified the logical data stores required by the main business processes. This allowed the database structure to remain aligned with the system analysis rather than being designed as an isolated technical artifact.
The result of this process was a set of ten canonical data stores, distributed across the six architectural subsystems. Each data store represents a specific area of responsibility: campus configuration, campus options, user accounts, student profiles, university-domain rules, activities, activity participations, block relationships, reports, and notifications. These stores were defined at a logical level, meaning that they describe what kind of information the system must preserve and which subsystem owns it, without yet committing to a final physical database implementation.
The following screenshot shows the database documentation page used during the analysis phase. This page collected the proposed data stores, their subsystem ownership, and their intended function. It was used as a shared reference to keep the DFD, CRUD matrix, and later ERD work consistent.

Database documentation page showing the canonical data stores and their subsystem ownership.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/6ozREISfbjUmJiFHOHxf3
After the data stores were identified, the merged DFD was validated through a CRUD matrix. The CRUD matrix maps each process against the ten canonical data stores and specifies whether the process creates, reads, updates, or deletes data. This step was necessary to check whether the data flows shown in the DFD were actually consistent with the ownership and responsibility of each subsystem.
The CRUD matrix confirmed the main architectural rule adopted in the project: each subsystem should write primarily to its own data stores, while cross-subsystem access must be explicitly justified by the business flow. For example, Discovery and Participation is allowed to write to Hosting and Lifecycle stores only for participation-related operations such as join, withdraw, and leave, because those actions directly affect activity participation records. Notification processes were instead modeled as read-and-create operations: they read the relevant business context from upstream subsystems and create notification records only in the notification store, without duplicating the original business state.
The following table presents a representative subset of the CRUD matrix. The full matrix is maintained in the project workspace together with the architecture workdocs and the DFD integration documentation.


Representative CRUD matrix. C = Create, R = Read, U = Update, D = Delete. Full matrix available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/SIMeqI1ovH
3.7 Entity Relationship Diagram (ERD)
The Entity Relationship Diagram was produced as the final output of the system data analysis phase. It was not created directly from intuition or from isolated feature ideas, but from the previous architectural artefacts developed during the project: the subgroup DFDs, the final merged DFD, the CRUD matrix, and the dedicated entity-and-attribute workdoc.
The ERD workflow started from the canonical data stores identified during the DFD and CRUD matrix phase. These data stores clarified which parts of the system needed persistent information and which subsystem was responsible for each data area. However, the team did not mechanically transform each data store into one database table. Instead, each store was reviewed to identify the real business entities behind it, the attributes needed to describe those entities, and the relationships required to connect them consistently.
A dedicated entity-and-attribute workdoc was then created to document the reasoning before drawing the ERD. This workdoc listed each proposed entity, its purpose, its owning subsystem, its primary attributes, possible foreign keys, and any open questions about naming, ownership, or cardinality. This intermediate step was important because it allowed the team to review the data model in textual form before turning it into a diagram.
The relationships between entities were also reviewed separately before producing the final ERD. The team checked whether each relationship was justified by the use cases, functional requirements, DFD flows, or CRUD matrix operations. This helped avoid two opposite problems: missing important relationships between subsystems, or adding unnecessary links only because two entities seemed generally related. In particular, cross-subsystem relationships were included only when they were required by the business logic and compatible with the architectural ownership principle established in the DFD and CRUD matrix.
The final ERD therefore represents the consolidated logical data model of InCampus. It includes the main entities related to campus identity, user identity, activity lifecycle, participation, moderation, blocking, and notifications. Each entity is connected through explicit relationships and foreign-key references where needed, so that the model can support the main MVP flows: onboarding, profile setup, activity creation, activity discovery, join/request management, activity status management, reporting, blocking, and notification delivery.
The purpose of this ERD is not to define every physical database implementation detail, but to provide a coherent logical structure for the future database design. The diagram shows which entities must exist, how they are related, and how data ownership is distributed across the six subsystems. This makes the ERD consistent with the previous DFD and CRUD analysis and prepares the project for the next implementation-oriented design step.

Figure 3.6: Entity Relationship Diagram. Full entity definitions and relationship table available on the Affine workspace.
https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/tvmtUg2zCa7G4t8HCt9td https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/bR8ViWCmhG 

4. On-Screen Appearance Requirements
The on-screen appearance requirements for InCampus define the expected visual behaviour, content, and interaction states for each screen in the MVP. Rather than prescribing a visual design system, this section specifies what each screen must present to the user, what actions it must support, and what constraints govern its appearance — derived from the functional requirements, non-functional requirements, use case narratives, entity catalog, and DFD workdocs. The complete screen-by-screen specification is maintained in the project's UI requirements document on the Affine workspace.
4.1 Methodology
The UI requirements were produced in two passes. A first draft was generated by mapping each MVP use case to a corresponding screen and extracting content requirements from the functional requirements table, action requirements from the use case narratives, and visual constraints from the non-functional requirements. The draft was then subjected to a structured coherence review against the full project documentation, including the DFD workdocs, entity catalog, CRUD matrix, and architectural decision log. The review identified and resolved critical issues across five categories: MVP scope misalignments, missing entity-level fields, incomplete permission and block-enforcement states, unsupported UI behaviours promoted too close to confirmed requirements, and incorrect FR/NFR traceability references.
4.2 Screen Inventory
The MVP UI comprises 21 specified screens organised across five functional areas:
Onboarding and Identity (6 screens): Sign Up, Verification Pending, Sign In, Campus Selection, Profile Setup, Profile Edit. These screens implement the access and identity domain (AP subsystem): university email registration with domain validation against DS-AP-003, password creation, email verification, campus selection from active configured campuses only, and minimal profile creation and editing.
Activity Management (5 screens): Activity Feed, Activity Detail Guest View, Activity Detail Host View, Manage Join Requests, Create Activity. These screens implement the hosting and lifecycle and discovery and participation domains (H&L and D&P subsystems). The Activity Feed applies visibility rules derived from the D&P workdoc: activities with status Full, Cancelled, Deleted, or Completed are excluded from discovery, and activities from blocked users are hidden. Activity Detail exposes a state-dependent action matrix tied to the viewer's current participation status (not joined, pending request, joined, declined). Create Activity collects all entity attributes required by DS-HL-001: title, category, description, participant limit, meeting point, participation mode (open or approval-based), date and start time, and gender preference with default value all.
Notifications and Safety (5 screens): Notification Inbox, Report Submission, Block Confirmation, Community Rules, Student Minimal Profile. The Notification Inbox supports all active notification branches from the NSF workdoc: JoinEvent, WithdrawEvent, LeaveEvent, ApplicationOutcome, ActivityCancellation, ActivityReminder, and a Fallback state for cases where the referenced activity has been deleted after the notification was created. Report Submission enforces the target XOR constraint (exactly one of: user or activity), collects a reason code from a predefined list, and accepts optional free-text details. Block Confirmation exposes the full reciprocal effects of a block: mutual feed hiding, activity detail inaccessibility, profile inaccessibility, interaction prevention, and notification suppression in both directions.
Personal Area (1 screen): Personal Activity List, which provides two separate lists — upcoming joined activities and past activity history — both backed by DS-HL-001 and DS-HL-002 read operations from the D&P subsystem.
Campus Administration (4 screens): Campus Admin Report Queue, Campus Admin Report Detail, Campus Admin Configure New Campus, Campus Admin Manage Structured Options. Moderation actions on the Report Detail screen are explicitly constrained to record the outcome and action trace in DS-SM-002 and trigger native AP or H&L workflows — the admin interface does not directly mutate Student Account or Activity state.
Two messaging screens (Conversation List, Conversation Thread) are excluded from the current MVP implementation set. US-08 exists in the User Story table as baseline MVP, but the current system architecture defers Send Message, and no Message or Conversation entity or data store exists in the ERD or data-store catalog. These screens will not be implemented until a formal scope decision is made and a messaging data model is delivered.
4.3 Global UI Constraints
Three global requirements apply across all screens regardless of functional domain.
Navigation structure: the app shall provide a persistent navigation structure giving access to the Activity Feed, Personal Activity List, Notification Inbox, Profile Edit, and Community Rules. Messaging is excluded from MVP navigation.
Standard states: all list-based screens implement four standard states — loading (visual indicator while data is retrieved), empty (meaningful message when no items are available), error (feedback when retrieval or submission fails), and success (confirmation after state-changing actions such as submit, delete, block, or report).
Block enforcement: when a block relationship exists between two students, the system enforces a consistent set of restrictions across all applicable screens — feed hiding, activity detail denial, profile inaccessibility, interaction prevention, and notification suppression — regardless of which student initiated the block. This enforcement is applied at the D&P feed level (reading DS-SM-001 as a hard filter) and is consistent with the architectural block invariant documented in the SM workdoc and decisions log.

5. Time Management
The project time management section translates the previously defined MVP scope into an executable project plan. Since the objective of the report is not only to describe the final system but also to document how the team organised the work, the planning structure follows the same progressive logic used throughout the project: requirements gathering, requirements analysis, architecture and data modelling, user interface specification, implementation preparation, testing, and final presentation.
The plan focuses exclusively on the MVP release of InCampus. Post-MVP features, such as direct messaging, friend indicators, participation points, reminder notifications, and shared photo uploads, are treated as roadmap items and are therefore excluded from the critical path of the current project. This choice keeps the schedule realistic and consistent with the product strategy adopted in the previous sections: first deliver and validate the core campus activity coordination flow, then expand the platform with richer social and gamification features.
5.1 Work Breakdown Structure of the System
The Work Breakdown Structure decomposes the InCampus project into manageable work packages. The breakdown is organised by project phase rather than by individual team member, because the main goal is to show how the system evolves from an initial problem definition into a coherent MVP design and implementation plan. Each work package corresponds to a concrete deliverable or group of deliverables already reflected in the report.
WBS ID
Work Package
Main Output
1.0
Project Definition and Scope
Problem definition, target users, MVP boundary, Post-MVP roadmap
1.1
Define product vision and target campus
InCampus concept and Tongji Jiading Campus scope
1.2
Identify target users and core problem
Student isolation and campus coordination problem
1.3
Separate MVP and Post-MVP scope
Phased delivery roadmap
2.0
Requirements Gathering
User stories, functional requirements, non-functional requirements
2.1
Collect and refine user stories
User Story Table
2.2
Derive functional requirements
Functional Requirements Table
2.3
Derive non-functional requirements
Non-Functional Requirements Table
2.4
Review traceability between US, FR, and NFR
Requirement consistency check
3.0
Requirements Analysis
Use cases, priority matrix, system behaviour analysis
3.1
Derive candidate use cases from MVP stories
Use case list
3.2
Write use case narratives
Structured use case specifications
3.3
Evaluate use cases through priority matrix
Use Case Priority Matrix
3.4
Produce use case diagram
Use Case Diagram v1.4
4.0
System Architecture and Data Flow Analysis
Subsystem architecture, DFDs, CRUD matrix
4.1
Decompose the system into functional subsystems
AP, CA, H&L, D&P, SM, NSF subsystem structure
4.2
Produce subsystem DFD workdocs
Boundary, process, datastore, and interface documentation
4.3
Draw subsystem DFDs
Six subsystem DFDs
4.4
Merge subsystem DFDs
Final system-level DFD
4.5
Validate data access through CRUD matrix
CRUD Matrix and architectural rules
5.0
Data Modelling
Entity catalogue and ERD
5.1
Identify logical entities from data stores and flows
Entity and attribute catalogue
5.2
Review relationships and cardinalities
Relationship review
5.3
Produce final ERD
Entity Relationship Diagram
6.0
UI Requirements and Screen Specification
Screen inventory and UI constraints
6.1
Map MVP use cases to screens
Screen inventory
6.2
Define screen content and actions
UI requirements document
6.3
Review UI against FR, NFR, DFD, CRUD, and ERD
Coherence review
6.4
Produce representative UI mockups
On-screen appearance examples
7.0
MVP Implementation Preparation
Implementation-ready specification
7.1
Freeze MVP scope for development
Stable implementation baseline
7.2
Prepare backend and data model implementation tasks
Database and API planning
7.3
Prepare frontend implementation tasks
Mobile screen and navigation planning
7.4
Prepare notification and safety workflows
Notification, report, and block implementation plan
8.0
Testing and Validation
Test plan and MVP validation
8.1
Define test scenarios from use case narratives
Use-case-based test cases
8.2
Define data consistency tests
CRUD and ERD validation tests
8.3
Define UI behaviour tests
Screen-state and permission tests
8.4
Validate critical MVP flows
Onboarding, create activity, browse, join, manage request, notify, report/block
9.0
Final Report and Presentation
Final project documentation and investor-style presentation
9.1
Assemble final report
Complete project report
9.2
Prepare summary presentation
Professional presentation deck
9.3
Review consistency between report and presentation
Final coherence check

This WBS provides a structured view of the work required to complete the MVP. It shows that the project is not treated as a direct jump from idea to implementation, but as a sequence of controlled analysis and design steps. This is particularly important for InCampus because the application involves several interconnected flows: verified access, campus-scoped discovery, activity lifecycle management, participation control, notifications, moderation, and data consistency. By decomposing the work into phases and deliverables, the team can identify dependencies more clearly and use the WBS as the basis for the critical path and slack time analysis in the following sections.
5.2 The Critical Path of the System
The critical path identifies the sequence of activities that determines the minimum time required to complete the project deliverables. In this project, the critical path is strongly shaped by dependency between analysis artefacts: user stories must be stable before functional requirements can be validated, use cases must be defined before DFDs can be produced, the DFD and CRUD matrix must be reviewed before the ERD can be finalised, and the UI requirements must remain consistent with the validated system model.
For this reason, the critical path is not based only on implementation effort. It reflects the complete requirements engineering and system analysis workflow needed to produce a coherent MVP specification for InCampus.
Activity ID
Activity
Estimated Duration
Immediate Predecessor
A
Define project scope and MVP boundary
2 days
None
B
Collect and refine user stories
4 days
A
C
Derive functional and non-functional requirements
4 days
B
D
Review traceability between US, FR, and NFR
1 day
C
E
Derive use cases and write use case narratives
4 days
D
F
Produce use case priority matrix and final use case diagram
2 days
E
G
Decompose the system into architectural subsystems
2 days
F
H
Produce subsystem DFD workdocs and diagrams
5 days
G
I
Merge subsystem DFDs and validate them through the CRUD matrix
3 days
H
J
Define entities, attributes, relationships, and final ERD
3 days
I
K
Produce UI requirements and screen inventory
3 days
J
L
Prepare MVP implementation plan and testing structure
2 days
K
M
Assemble and review the final report
3 days
L
N
Prepare final presentation and delivery material
2 days
M
Based on these dependencies, the critical path is:
A → B → C → D → E → F → G → H → I → J → K → L → M → N
The total estimated duration of the critical path is 38 days.
This means that any delay in one of these activities would directly delay the completion of the project, because each activity produces an output required by the next one. For example, if the use case narratives are incomplete, the DFDs cannot be correctly derived; if the DFD and CRUD matrix are not validated, the ERD may be based on unstable data assumptions; if the ERD and system behaviour are not stable, the UI requirements may describe screens that are not supported by the data model.
The critical path therefore confirms the importance of the sequential workflow adopted by the team. The project cannot be managed as a set of disconnected tasks, because each deliverable depends on the correctness of the previous one. This is especially relevant for InCampus, where the core flows — verified access, campus-scoped activity discovery, participation management, notifications, reporting, and blocking — are interconnected and must remain coherent across requirements, architecture, data modelling, and UI specification.
5.3 The Slack Time of Each Non-Critical Activity
Slack time represents the amount of time by which a non-critical activity can be delayed without delaying the overall project completion date. Since the critical path already includes the sequential activities that determine the minimum project duration, the non-critical activities are mainly supporting tasks that can be carried out in parallel with the main workflow.
These activities are still important for the quality, clarity, and professionalism of the final deliverables, but they do not directly block the next technical step of the project as long as they are completed before their required milestone.
Activity ID
Non-Critical Activity
Estimated Duration
Earliest Possible Start
Required Completion Point
Slack Time
NC1
Refine competitive landscape and external references
2 days
After project scope definition
Before final report assembly
31 days
NC2
Organise workspace links and supporting documentation
2 days
After subsystem DFD workdocs are produced
Before final report assembly
9 days
NC3
Export and format diagrams for the report
2 days
After DFD and CRUD validation
Before final report assembly
6 days
NC4
Prepare representative screenshots of workdocs and documentation structure
1 day
After architecture documentation is organised
Before final report assembly
8 days
NC5
Polish UI mockups and align visual examples with UI requirements
2 days
After UI requirements are defined
Before final presentation preparation
3 days
NC6
Prepare cost-benefit supporting notes
1 day
After MVP scope and architecture are stable
Before final report assembly
15 days
NC7
Prepare presentation visual style and slide structure
2 days
After use case and architecture structure are stable
Before final presentation preparation
19 days
NC8
Review consistency of external links and referenced artefacts
1 day
After final report assembly begins
Before final submission
2 days
The slack time analysis shows that the project contains some flexibility, but only in supporting activities. Tasks such as diagram formatting, workspace organisation, visual polishing, and cost-benefit preparation can be delayed within reasonable limits because they do not block the production of the core analytical artefacts. However, this flexibility is limited near the end of the project, especially for UI polishing, link review, and presentation preparation, because these activities must be completed before final delivery.
The analysis also confirms that the main risk is not in the supporting tasks, but in the sequential dependency between requirements, use cases, DFDs, CRUD validation, ERD, and UI requirements. These core activities have no meaningful slack: delaying one of them would delay the following deliverables and therefore the whole project. For this reason, the team treated the supporting activities as parallel work, while prioritising the completion and validation of the critical-path artefacts first.
5.4 Cost-Benefit Estimate
The cost-benefit estimate evaluates whether the MVP of InCampus is reasonable to develop within the project constraints and whether the expected value justifies the required effort. Since the current project is an academic MVP and not a full commercial launch, the estimate focuses on relative cost categories, expected development effort, and strategic benefits rather than on a complete financial forecast.
The main cost of the project is not immediate infrastructure spending, but the time required to produce a coherent requirements and design foundation. The team deliberately invested a significant part of the schedule in requirements engineering, system analysis, DFD integration, CRUD validation, ERD modelling, and UI requirements. This increases the initial planning effort, but reduces the risk of building an inconsistent system later.
Cost Area
Expected Cost Level
Rationale
Requirements and analysis
High
This phase required user stories, FRs, NFRs, use cases, priority matrix, DFDs, CRUD matrix, ERD, and UI requirements.
Implementation preparation
Medium
The MVP is complex enough to require backend, database, frontend, notification, and moderation logic, but the scope is disciplined and limited to core flows.
Infrastructure and hosting
Low to Medium
Initial deployment can rely on standard cloud/backend services, with costs increasing only if user traffic grows.
Database and storage
Low to Medium
The MVP mainly stores accounts, profiles, activities, participations, reports, blocks, and notifications. Storage needs are limited at first.
Notification services
Low
Push or in-app notifications are part of the MVP, but the expected early usage volume is limited.
Testing and validation
Medium
Testing must cover core flows, permissions, block behaviour, notification suppression, and data consistency.
Maintenance after MVP
Medium
The system will require updates, moderation support, bug fixing, and possible feature extension after validation.

The benefits of the MVP are both functional and strategic. Functionally, InCampus provides students with a structured way to create, discover, and join small campus activities with verified peers. Strategically, the MVP validates whether the core idea — reducing passive isolation through low-pressure campus interactions — can generate real user engagement before investing in broader social features.
Benefit Area
Expected Benefit
Rationale
Student value
High
The app addresses a concrete campus problem: students often lack a simple way to find others for ordinary shared moments.
Trust and safety
High
University email verification, campus scoping, reporting, blocking, and moderation reduce hesitation and make participation safer.
Product validation
High
The MVP allows the team to test whether students actually create and join activities before expanding the platform.
Scalability potential
Medium to High
The system is designed around campus configuration, which supports future expansion to other campuses.
Development learning value
High
The project produces a complete software engineering workflow, from requirements to architecture, data modelling, UI requirements, and planning.
Commercial potential
Medium
If validated, the platform could later support university partnerships, campus services, event promotion, or premium institutional tools.

Overall, the cost-benefit balance is positive. The MVP requires a considerable analysis and design effort, but this effort is justified because the system involves several interconnected flows that must remain consistent: access control, campus scoping, activity lifecycle, participation management, notifications, moderation, and blocking. A weaker planning phase would reduce short-term effort but increase the risk of implementation errors, duplicated logic, unclear data ownership, and unreliable user interactions.
The main benefit of the project is that it validates a focused and socially meaningful product concept with a controlled MVP scope. Instead of attempting to build a complete social network immediately, InCampus concentrates on one valuable interaction: helping verified students from the same campus share ordinary moments in a simple and safe way. This makes the project feasible within the available time and provides a strong foundation for future development.
6. Conclusion
This report presented the requirements engineering and system analysis work carried out for InCampus, a mobile campus coordination platform designed to help students create, discover, and join low-pressure activities with verified peers. The project started from a concrete social problem the normalization of isolation during campus life and translated it into a structured MVP focused on campus-based onboarding, minimal profiles, activity creation, discovery, participation, notifications, and basic trust and safety.
The team followed a progressive and traceable workflow. User stories were used to capture user needs, functional and non-functional requirements translated those needs into system behaviour and quality constraints, and use cases clarified the main interactions between actors and the system. The architecture was then developed through subsystem decomposition, DFD workdocs, a merged system-level DFD, CRUD validation, entity analysis, and the final ERD. UI requirements were produced only after the system behaviour and data model had been reviewed, ensuring that the interface remained consistent with the underlying system design.
The project time management analysis confirms that the most critical part of the work is the sequential dependency between requirements, use cases, architecture, data modelling, and UI specification. Supporting tasks such as formatting, visual polishing, cost-benefit preparation, and presentation design can be managed in parallel, but the core analytical artefacts must be completed in order to preserve consistency.
In conclusion, InCampus is a feasible and coherent MVP with a clear product identity. It does not attempt to become a generic social network, but focuses on a specific campus need: helping students transform ordinary free time into real, safe, and lightweight social interaction. The work documented in this report provides a solid foundation for implementation, testing, and future expansion beyond the first campus.

