# InCampus

> A campus-scoped mobile app for reducing isolation and fostering low-pressure social participation in university campus life.


## About The Project
INCAMPUS helps university students find low-pressure opportunities to share ordinary campus moments with nearby students, such as lunch, coffee breaks, study sessions, sports, and small activities. It is **not a dating app**; the intended character is local, simple, believable, safe, and easy to use.

First rollout focus: **Tongji University, Jiading Campus**.

## Architecture
InCampus is built as a **Multi-Tenant Modular Monolith with Event-Driven Internal Flows**.

- **Multi-Tenant:** `CampusID` acts as the main tenant boundary. All student accounts, activities, reports, and administrative operations are strictly scoped to a configured campus.
- **Modular Monolith:** The backend is deployed as a single application to reduce operational complexity during the MVP stage, but is internally strictly divided into 6 cohesive domains.
- **Event-Driven Flows:** An internal event dispatcher reacts to business events (e.g., `DirectJoinCompleted`, `JoinRequestApproved`, `JoinedParticipantLeft`) strictly for cross-module consequences like notifications.

## Core Modules
The system is divided into six logical subsystems with strict data ownership boundaries:
5. **Safety and Moderation (SM):** Reciprocal block relationships, community rules, moderation reporting, and admin review (triggering native AP/H&L workflows).
6. **Notifications and System Flow (NSF):** Pure event sink handling all push/in-app notification consequences (join events, reminders, cancellations).

## Data Model
The shared database layer enforces logical ownership via 10 canonical stores, with operations strictly guided by the system CRUD Matrix:

- **CA:** `DS-CA-001` (Campus Configuration), `DS-CA-002` (Campus Structured Options)
- **SM:** `DS-SM-001` (Block Relationships), `DS-SM-002` (Report Records)
- **NSF:** `DS-NS-001` (Notification Records)

## Key Features (MVP)
- **Verified Access:** Accounts require verified university emails matched against domain identity rules.
- **Ordinary Activities:** Create activities with category, time, location, participant limits, and join modes (open vs. approval-based).
- **Participation Lifecycle:** Direct join or pending requests, backed by safe atomic concurrency transaction rules.
- **Safety First:** Symmetric block enforcement across visibility and interactions. Reporting system with campus admin review.
- **Consent-Gated Insights:** Admin insights are strictly read-only and require explicit student consent (`CampusInsightSharingConsent`).


## Tech Stack
> **Note:** Stack to be finalized before skeleton initialization.

- **Backend Framework:** [e.g., Spring Boot / Node.js Express / Django]
- **Mobile App:** [e.g., React Native / Flutter]
- **Events / Messaging:** [e.g., Spring ApplicationEvents / RabbitMQ]

## Getting Started


### Prerequisites
- [e.g., Java 17+]
- [e.g., Docker & Docker Compose]

### Local Setup
1. Clone the repository: `git clone https://github.com/your-org/incampus.git`
2. Set up environment variables: `cp .env.example .env`
3. Start the database: `docker-compose up -d`
4. Run database migrations: `[command]`
5. Start the application: `[command]`