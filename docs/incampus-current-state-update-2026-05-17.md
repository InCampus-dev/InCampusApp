# InCampus - Stato Attuale Completo

Data analisi: 2026-05-17
Base analizzata: branch `fix/jacopo-mobile-qa-bugs` / PR #40, basata su `origin/main` dopo PR #38 e PR #39
Aggiornamento documento: include il QA mobile Jacopo J1 e i fix mobile Jacopo J2 presenti in PR #40

## Sintesi Esecutiva

InCampus e' oggi una alpha/MVP integration abbastanza avanzata: backend modulare funzionante, seed demo e smoke check presenti, mobile Expo collegato ai principali flussi studente, supporto Expo Go fisico allineato a SDK 55, e pass QA mobile Jacopo documentato.

Il progetto e' adatto a una demo alpha guidata con backend locale, seed demo e mobile Expo. PR #37 ha aggiunto un comando ripetibile `npm run migrate`, ha riallineato i documenti readiness/runbook/checklist, e ha configurato CI con Postgres per migrazioni, seed demo, backend startup e smoke check. PR #38 ha aggiornato gli script device rendendoli cross-platform. PR #39 ha aggiunto questo current-state snapshot in `docs/` e ha ritirato la vecchia cartella `codingOrganization/`. PR #40 aggiunge `docs/mobile-qa-buglist.md` e corregge i bug confermati nelle schermate mobile di Jacopo.

Non e' ancora production-ready: email verification reale, push delivery reale, scheduler reminder, UI admin, structured options dinamiche mobile, UI withdraw/leave e verifica fisica iPhone/Android restano aperti. La CI Postgres migrate/seed/smoke e' stata confermata su GitHub per PR #39; il percorso device Expo Go resta da validare manualmente su iPhone/Android reali.

## Stato Repository

Il repository e' un monorepo npm workspace con due workspace principali:

- `backend/`: backend TypeScript/Express/TypeORM organizzato come modular monolith per sottosistemi.
- `mobile/`: app React Native/Expo con navigation stack e screen MVP.
- `docs/`: contratti operativi, setup, demo seed, smoke check, runbook, current-state update e review demo readiness.
- `documentation/` e `Documentation/`: documentazione di dominio, UCR, sequence/collaboration/state chart, requisiti e data model.

La cartella `codingOrganization/` era utile nello stadio iniziale di divisione lavoro, ma non e' piu' parte della documentazione operativa corrente ed e' stata rimossa in PR #39.

Stato git osservato durante questa analisi:

- Base corrente: `origin/main` include PR #38 e PR #39.
- Branch QA mobile Jacopo: `fix/jacopo-mobile-qa-bugs`, PR #40.
- Ultimo commit funzionale PR #40 prima di questo aggiornamento documento: `04a4ce9` (`docs: include mobile QA buglist`).
- Questo file e' ora tracciato in `docs/incampus-current-state-update-2026-05-17.md`.

## Stack Tecnico Attuale

Backend:

- Node >= 20.
- TypeScript.
- Express 4.
- TypeORM 0.3.
- PostgreSQL via `pg`.
- Vitest + Supertest.
- JWT auth.
- bcryptjs per password hashing.

Mobile:

- Expo `~55.0.0`.
- `expo-status-bar ~55.0.6`.
- React `^19.2.0`.
- React Native `^0.83.6`.
- React Navigation native stack.
- AsyncStorage per token e selected campus.
- TypeScript.
- `babel-preset-expo ~55.0.21`.

## Architettura Prodotto

Il modello resta quello gia' definito dai requisiti: campus-scoped mobile app per studenti universitari, primo target Tongji University Jiading Campus, non dating app. Il confine di campus e' la regola principale per account, feed, activity, structured options, report e moderazione.

Sottosistemi implementati:

- `AP` Access & Profile.
- `CA` Campus Administration.
- `H&L` Hosting & Lifecycle.
- `D&P` Discovery & Participation.
- `SM` Safety & Moderation.
- `NSF` Notifications & System Flow.
- `shared` per DTO, enum, auth middleware, errori, seed, database config e contratti comuni.

## Backend - Stato Per Sottosistema

### Access & Profile

Implementato:

- `POST /auth/signup`.
- `POST /auth/verify-email`.
- `POST /auth/signin`.
- `GET /campuses`.
- `PATCH /accounts/me/campus`.
- `PATCH /accounts/me/consent`.
- `POST /profiles`.
- `GET /profiles/me`.
- `PATCH /profiles/me`.
- University identity rules per dominio email.
- Account activation/moderation command handler per suspend/ban.

Limiti:

- Email verification e' ancora mock/console, non invio email reale.
- Mobile ha create/read profile e consent, ma non una UX completa di edit profile.

### Campus Administration

Implementato:

- Campus configuration.
- Structured options per category/location.
- Student insight admin basato su consenso.
- Route admin protette da middleware admin provvisorio.

Route principali:

- `POST /admin/campuses`.
- `GET /admin/campuses/:campusId`.
- `GET /admin/campuses/:campusId/structured-options`.
- `POST /admin/campuses/:campusId/structured-options`.
- `PATCH /admin/campuses/:campusId/structured-options/:optionId`.
- `DELETE /admin/campuses/:campusId/structured-options/:optionId`.

Limiti:

- Non esiste UI admin.
- Admin auth resta header-based/demo, non un sistema staff completo.
- Il mobile create activity usa fallback option seed, non carica ancora queste structured options dinamicamente.

### Hosting & Lifecycle

Implementato:

- Create activity.
- Update status.
- Hard delete activity.
- Join request management host-side.
- Applicant lookup adapter verso AP per profilo minimo.
- Enforcement campus scope su request management.

Route principali:

- `POST /activities`.
- `PATCH /activities/:id/status`.
- `DELETE /activities/:id`.
- `GET /activities/:id/requests`.
- `PATCH /activities/:id/requests/:requestId`.

DTO join request attuale:

- `requestId`.
- `activityId`.
- `applicantId`.
- `status`.
- `createdAt`.
- `applicant.applicantId`.
- `applicant.displayName`.
- `applicant.major`.
- `applicant.shortBio`.

Limiti:

- Il delete resta hard delete; la notifica su delete non e' il ramo principale confermato.
- Cancellation conserva contesto e notifica, mentre delete rimuove activity e participations.

### Discovery & Participation

Implementato:

- Feed campus-scoped.
- Activity detail.
- Direct join.
- Approval-based join request.
- Withdraw request.
- Leave activity.
- Personal activity list.
- Block suppression nel feed/detail dove supportato.

Route principali:

- `GET /activities`.
- `GET /activities/:id`.
- `POST /activities/:id/join`.
- `DELETE /activities/:id/requests/me`.
- `DELETE /activities/:id/participants/me`.
- `GET /profiles/me/activities`.

DTO personal activity attuale:

- Estende activity detail.
- `personalActivityStatus`: `host`, `pending_request`, `confirmed_participant`.
- `participationId?`.
- `participationRecordType?`.
- `participationStatus?`.

Limiti:

- Mobile non espone ancora pulsanti withdraw pending request o leave joined activity.
- Filtri feed mobile restano basilari.

### Safety & Moderation

Implementato backend:

- Block relationship.
- Community rules static content.
- Report submission.
- Admin report list/detail/review.
- Moderation consequences: warn/suspend/ban/remove activity.
- Directed blocks con enforcement reciproco a livello logico dove integrato.

Route principali:

- `POST /blocks`.
- `GET /community-rules`.
- `POST /reports`.
- `GET /admin/campuses/:campusId/reports`.
- `GET /admin/campuses/:campusId/reports/:reportId`.
- `PATCH /admin/campuses/:campusId/reports/:reportId/review`.

Mobile presente:

- `CommunityRulesScreen` chiama `GET /community-rules`, mostra fallback locale se il fetch fallisce e mostra empty-state esplicito se il backend risponde con `sections: []`.
- `ReportSubmissionScreen` chiama `POST /reports`, usa `selectedCampusId` da AsyncStorage, supporta target `activity` o `student`, e ignora route params non stringa/non supportati.
- `BlockUserScreen` chiama `POST /blocks` e puo' ricevere `targetAccountId` da route params, con guardia runtime sui valori non stringa.
- `ActivityDetailsScreen` apre `ReportSubmission` per attivita' e `BlockUser` per host.

Limiti:

- Report/block mobile sono MVP utility screens: in alcuni casi richiedono inserimento manuale ID se manca contesto profilo.
- Non esiste ancora una `StudentProfileScreen` da cui aprire report/block con contesto ricco.
- Non esiste UI admin mobile/web per review report.

### Notifications & System Flow

Implementato:

- Notification records.
- Notification list paginata.
- Notification context resolver.
- Fallback per contenuti cancellati/bloccati/non accessibili.
- Event handlers per join, application outcome, cancellation, leave e reminder event.
- Block suppression su notification context dove applicabile.

Route principali:

- `GET /notifications`.
- `GET /notifications/:notificationId/context`.

Tipi principali:

- `JoinEvent`.
- `ApplicationOutcome`.
- `ActivityCancellation`.
- `LeaveEvent`.
- `ActivityReminder`.

Context types:

- `JoinRequestReview`.
- `ActivityDetails`.
- `CancelledActivityContext`.
- `PersonalActivityContext`.
- `NotificationFallbackView`.

Limiti:

- Push delivery resta stub/non reale.
- Reminder handler esiste, ma manca uno scheduler reale che produca automaticamente `ActivityReminderDue`.
- Mobile NotificationFallback ora usa il `reason` per spiegare il motivo del fallback, ma resta una schermata informativa MVP senza recovery action avanzate.

## Backend - Invarianti Codice

Enum principali da rispettare:

- `ActivityStatus`: `open`, `full`, `completed`, `cancelled`.
- `ParticipationRecordType`: `request`, `participation`.
- `ParticipationStatus`: `pending`, `confirmed`, `declined`.
- `ParticipationMode`: `open`, `approval_based`.
- `GenderPreference`: `all`, `male_only`, `female_only`.
- `PlatformAccessStatus`: `PendingVerification`, `Active`, `Suspended`, `Banned`.
- `VerificationStatus`: `Pending`, `Verified`, `Rejected`, `Expired`.
- `ReportTargetType`: `student`, `activity`.
- `ReportStatus`: `pending_review`, `reviewed`.
- `ModerationAction`: `none`, `warn_user`, `suspend_user`, `ban_user`, `remove_activity`.

Nota importante: i requisiti storici parlano anche di stati partecipazione come `left` e `cancelled`; il codice corrente degli enum condivisi espone solo `pending`, `confirmed`, `declined`. Withdraw/leave sono implementati come operazioni, ma non come enum status pubblici `left/cancelled` nel file condiviso attuale.

## Mobile - Stato Attuale

Il mobile e' una shell Expo MVP, non ancora app rifinita production. Usa `AppNavigator` con stack navigation e API client centralizzato.

Route presenti:

- `SignIn`.
- `SignUp`.
- `CampusSelection`.
- `ProfileSetup`.
- `ConsentSettings`.
- `ActivityFeed`.
- `ActivityDetails`.
- `CreateActivity`.
- `ManageRequests`.
- `NotificationList`.
- `NotificationFallback`.
- `PersonalActivityList`.
- `CommunityRules`.
- `ReportSubmission`.
- `BlockUser`.

Screen principali e stato:

- `SignInScreen`: signin backend, salva token e naviga nel flusso.
- `SignUpScreen`: signup backend, flusso email verification ancora mock lato backend.
- `CampusSelectionScreen`: selezione campus e token refresh.
- `ProfileSetupScreen`: crea profilo minimo.
- `ConsentSettingsScreen`: aggiorna consenso campus insight; `Skip for now` forza esplicitamente `campusInsightSharingConsent: false`.
- `ActivityFeedScreen`: `GET /activities`, usa `selectedCampusId`, pull-to-refresh, reload on focus, refresh dopo create/join, highlight `Just created`.
- `CreateActivityScreen`: valida form, chiama `POST /activities`, naviga al feed con `refreshAfterCreate` e `createdActivityId`.
- `ActivityDetailsScreen`: `GET /activities/:id`, mostra host profile, direct join/request via `POST /activities/:id/join`, espone manage requests se host, e azioni report/block.
- `ManageRequestsScreen`: `GET /activities/:id/requests`, approve/decline via `PATCH /activities/:id/requests/:requestId`, usa DTO forte applicant.
- `NotificationListScreen`: `GET /notifications`, paginazione, tap su notification context e navigazione verso detail/manage/personal/fallback; inoltra il fallback reason quando il context resolver fallisce.
- `NotificationFallbackScreen`: safe fallback per target non disponibili con messaggi specifici per `TargetActivityUnavailable`, `BlockRelationshipExists`, `MissingActivityContext` e `UnknownNotificationTarget`.
- `PersonalActivityListScreen`: `GET /profiles/me/activities`, split upcoming/history, supporta flat response o response gia' splittata.
- `CommunityRulesScreen`: `GET /community-rules`, fallback locale se API non disponibile, empty-state esplicito se il backend risponde con `sections: []`.
- `ReportSubmissionScreen`: `POST /reports`, valida a runtime route params opzionali e accetta solo target `activity` o `student`.
- `BlockUserScreen`: `POST /blocks`, valida a runtime `targetAccountId` opzionale prima di usarlo nel form.

Limiti mobile ancora reali:

- `CreateActivityScreen` usa fallback hardcoded per category/location UUID dal demo seed. Serve endpoint/UX student-facing per structured options oppure uso controllato dell'admin structured options endpoint.
- Non ci sono test mobile.
- Non ci sono UI withdraw/leave.
- Non c'e' edit profile UX completa.
- Report/block sono accessibili ma ancora spartani.
- Header feed contiene molte azioni testuali (`Alerts`, `Mine`, `Rules`, `Create`) e non e' un design definitivo.
- Non e' stata verificata qui una run Expo manuale su device fisico con backend reale e DB reale.

## API Client Mobile

`mobile/src/services/api.ts` e' il punto unico per le chiamate HTTP mobile:

- Legge `authToken` da AsyncStorage.
- Usa `EXPO_PUBLIC_API_BASE_URL` come base URL.
- Fallback base URL: `http://localhost:3000`.
- Supporta `GET`, `POST`, `PATCH`, `DELETE`.
- Costruisce query params.
- Aggiunge `Authorization: Bearer <token>`.
- Parsifica JSON/text.
- Unwrap automatico response `{ data: ... }`.
- Espone helper errori: `getApiErrorCode`, `getApiErrorMessage`, `getApiErrorDetails`.

Questo file e' load-bearing per quasi tutti gli screen mobile.

## Demo Readiness

Seed demo presente:

- `backend/src/seedDemo.ts`.
- `backend/packages/shared/src/seed/demoSeed.ts`.
- Script root: `npm run seed:demo`.
- Script backend: `npm run seed:demo --workspace backend`.

Migrazioni ripetibili presenti in PR #37:

- `backend/src/runMigrations.ts`.
- `backend/packages/shared/src/migrations/index.ts`.
- Script root: `npm run migrate`.
- Script backend: `npm run migrate --workspace backend`.

Smoke demo presente:

- `backend/src/demoSmokeCheck.ts`.
- Script root: `npm run smoke:demo`.
- Script backend: `npm run smoke:demo --workspace backend`.

Demo data principale:

- Campus: Tongji University / Jiading Campus.
- Host: `demo.host@tongji.edu.cn`.
- Guest: `demo.guest@tongji.edu.cn`.
- Password demo: `InCampusDemo2026!`.
- Categories seed: Lunch, Coffee, Study, Sport, Language Exchange.
- Locations seed: Library Plaza, Cafeteria, Main Gate, Sports Center.
- Activity seed prefix: `[DEMO]`.

Smoke check copre:

- Health.
- Signin host/guest.
- Campus selection token refresh.
- Profile read.
- Campus list.
- Structured options via admin endpoint.
- Seeded feed/detail.
- Create smoke direct-join activity.
- Guest direct join.
- Host notification record/list/context.
- Create approval activity.
- Guest request e host approval.
- Guest notification outcome.
- Notification fallback after deletion.
- Cleanup robusto delle activity smoke.

Limiti demo:

- `migrate`, `seed:demo` e `smoke:demo` richiedono database locale e backend/runtime corretti.
- In PR #37 la verifica locale DB-backed e' stata eseguita: `npm run migrate`, `npm run seed:demo`, backend locale, `npm run smoke:demo`.
- Risultato smoke locale registrato: `pass=15`, `fail=0`, `skipped=3`, `blocked=0`.
- CI Postgres migrate/seed/smoke e' configurata in `.github/workflows/ci.yml`; i check GitHub Actions di PR #39 risultano passati.
- I documenti operativi principali in `docs/` sono stati riallineati: `demo-readiness-review.md`, `mobile-run-check.md`, `project-runbook.md`, `final-integrated-review.md`, `backend-smoke-check.md`, `demo-seed.md`.

## Device Testing / Expo Go

Il flusso device fisico attuale include:

- Root script `npm run dev:backend:device` chiama `node scripts/start-backend-device.mjs`.
- `scripts/start-backend-device.mjs` avvia il backend con default `HOST=0.0.0.0` e `PORT=3000`, usando `npm.cmd` su Windows e `npm` sugli altri sistemi.
- Mobile script `npm run start:device --workspace mobile` esegue `mobile/scripts/start-device.mjs`.
- Lo script rileva un IP LAN raggiungibile e imposta `EXPO_PUBLIC_API_BASE_URL=http://<host>:3000`.
- `mobile/scripts/start-device.mjs` usa `npx.cmd` su Windows e `npx` sugli altri sistemi.
- Override manuale: `INCAMPUS_DEVICE_HOST=<reachable-ip> npm run start:device --workspace mobile`.
- `EXPO_NO_TELEMETRY` viene impostato di default a `1` nello script device.
- Expo parte in LAN mode con `npx expo start --lan`.

Uso consigliato:

```bash
npm run dev:backend:device
npm run start:device --workspace mobile
```

Se auto-detection sceglie IP sbagliato:

```bash
INCAMPUS_DEVICE_HOST=192.168.1.10 npm run start:device --workspace mobile
```

PowerShell:

```powershell
$env:INCAMPUS_DEVICE_HOST="192.168.1.10"; npm run start:device --workspace mobile
```

## Comandi Operativi Correnti

Install:

```bash
npm install
```

Backend:

```bash
npm run dev:backend
npm run dev:backend:device
npm run migrate
npm run build
npm run lint
npm test
npm run seed:demo
npm run smoke:demo
```

Mobile:

```bash
npm run start --workspace mobile
npm run start:device --workspace mobile
npm run ios --workspace mobile
npm run android --workspace mobile
npm run typecheck --workspace mobile
```

Expo dependency check:

```bash
EXPO_NO_TELEMETRY=1 npm exec --workspace mobile -- expo install --check
```

## Verifiche Eseguite In Questa Analisi

| Comando | Esito |
| --- | --- |
| `git diff --check` | Pass |
| `npm run typecheck --workspace mobile` | Pass |
| `npm run build` | Pass |
| `npm run lint` | Pass |
| `npm test` | Pass: 29 file test, 220 test |
| `node --check scripts/start-backend-device.mjs` | Pass |
| `node --check mobile/scripts/start-device.mjs` | Pass |
| `npm run migrate` | Pass: DB gia' migrato, 0 migrazioni applicate nell'ultima run |
| `npm run seed:demo` | Pass: seed demo sincronizzato |
| `npm run smoke:demo` | Pass: `pass=15`, `fail=0`, `skipped=3`, `blocked=0` |

Nota Expo: il precedente `expo install --check` era passato usando dependency map locale per sandbox offline, ma non e' stato rieseguito durante il pass PR #40.

Nota PR #40: i fix mobile Jacopo sono stati verificati con `npm run typecheck --workspace mobile` durante il pass J2/review. Questo aggiornamento documento non introduce codice eseguibile.

## Readiness Matrix Aggiornata

| Flusso | Backend | Mobile | Demo-ready | Nota |
| --- | --- | --- | --- | --- |
| Health | Done | N/A | Yes | `GET /health`. |
| Signup/signin | Done | Done | Partial | Email reale assente, seeded signin consigliato. |
| Campus selection | Done | Done | Yes/Partial | Token refresh implementato; dipende da seed/DB. |
| Profile setup/read | Done | Done | Yes/Partial | Create/read mobile; edit UX non completa. |
| Consent settings | Done | Done | Yes | Consent toggle mobile presente. |
| Create activity | Done | Done/Partial | Partial | Chiamata reale, ma options mobile hardcoded al seed. |
| Feed | Done | Done/Partial | Partial | Lettura e refresh presenti, filtri limitati. |
| Activity detail | Done | Done/Partial | Partial | Join/report/block/manage entry presenti, UX MVP. |
| Direct join | Done | Done | Partial | Richiede verifica Expo + DB live per demo end-to-end. |
| Approval request | Done | Done | Partial | Request create via join endpoint. |
| Manage requests | Done | Done | Partial | DTO forte implementato; richiede scenario live con host/guest. |
| Withdraw request | Done | Missing | Backend only | Manca UI mobile. |
| Leave joined activity | Done | Missing | Backend only | Manca UI mobile. |
| Personal activity list | Done | Done/Partial | Partial | Split upcoming/history lato mobile, UX MVP. |
| Notifications list/context | Done | Done/Partial | Partial | Records/context/fallback; fallback reason visibile; push reale assente. |
| Community rules | Done | Done/Partial | Partial | Mobile fallback statico se API fallisce; empty-state per lista vuota. |
| Report activity/student | Done | Done/Partial | Partial | MVP screen, target ID manuale se manca contesto; route params sanificati. |
| Block user | Done | Done/Partial | Partial | MVP screen, target ID manuale se manca contesto; route param sanificato. |
| Admin report review | Done | Missing | Backend only | Nessuna UI admin. |
| Admin campus/options | Done | Missing | Backend only | Nessuna UI admin/student-facing options. |
| Reminder | Partial | N/A | No | Handler testato, scheduler assente. |
| Physical device Expo Go | N/A | Tooling done | Partial | Script e deps pronti; run manuale device non eseguita qui. |

## File Chiave Per La Prossima AI

Backend:

- `backend/src/app.ts`: composition root Express e registrazione sottosistemi.
- `backend/src/server.ts`: bootstrap runtime, supporto `HOST`.
- `backend/src/seedDemo.ts`: seed demo idempotente.
- `backend/src/demoSmokeCheck.ts`: smoke check demo end-to-end backend.
- `backend/packages/shared/src/domain/dtos.ts`: DTO pubblici condivisi.
- `backend/packages/shared/src/domain/enums.ts`: enum canonici.
- `backend/packages/shared/src/seed/demoSeed.ts`: dati demo Tongji.
- `backend/packages/hosting-lifecycle/src/services/ActivityLifecycleService.ts`: create/update/delete/cancel lifecycle.
- `backend/packages/hosting-lifecycle/src/services/JoinRequestManagementService.ts`: list/review join requests.
- `backend/packages/discovery-participation/src/services/JoinService.ts`: direct join/request join.
- `backend/packages/discovery-participation/src/services/PersonalListService.ts`: personal activity list.
- `backend/packages/discovery-participation/src/services/WithdrawLeaveService.ts`: withdraw/leave.
- `backend/packages/safety-moderation/src/services/ReportReviewService.ts`: review report e moderation consequences.
- `backend/packages/notifications-system-flow/src/services/NotificationContextService.ts` o controller equivalente: context/fallback behavior.

Mobile:

- `mobile/src/navigation/AppNavigator.tsx`: route inventory e stack.
- `mobile/src/services/api.ts`: client API centrale.
- `mobile/src/screens/ActivityFeedScreen.tsx`: feed, refresh, highlight create.
- `mobile/src/screens/CreateActivityScreen.tsx`: create activity reale con fallback options.
- `mobile/src/screens/ActivityDetailsScreen.tsx`: detail, join/request, report/block, manage requests entry.
- `mobile/src/screens/ManageRequestsScreen.tsx`: approve/decline con DTO forte.
- `mobile/src/screens/NotificationListScreen.tsx`: notification list/context routing.
- `mobile/src/screens/PersonalActivityListScreen.tsx`: upcoming/history personal list.
- `mobile/src/screens/CommunityRulesScreen.tsx`: rules.
- `mobile/src/screens/ReportSubmissionScreen.tsx`: reports.
- `mobile/src/screens/BlockUserScreen.tsx`: blocks.
- `mobile/scripts/start-device.mjs`: Expo LAN/device start.
- `scripts/start-backend-device.mjs`: backend device start cross-platform per `npm run dev:backend:device`.

Docs:

- `docs/api-contract.md`: contratto API, da verificare contro codice prima di usarlo come fonte unica.
- `docs/error-contract.md`: error envelope.
- `docs/event-contract.md`: eventi.
- `docs/internal-command-contract.md`: comandi interni/moderazione.
- `docs/demo-seed.md`: seed demo.
- `docs/backend-smoke-check.md`: smoke check.
- `docs/demo-readiness-review.md`: readiness T10-T20 aggiornata dopo PR #35 e PR #36 reale.
- `docs/mobile-run-check.md`: checklist mobile/device aggiornata con caveat correnti.
- `docs/project-runbook.md`: runbook integrazione readiness.
- `docs/final-integrated-review.md`: skeleton T20, non sign-off finale.
- `docs/incampus-current-state-update-2026-05-17.md`: questo snapshot operativo aggiornato.
- `docs/mobile-qa-buglist.md`: buglist QA Jacopo J1 validata, con BUG-4 e BUG-6 marcati invalid e BUG-1/2/3/5/7/8/9/10 confermati.
- `mobile/README.md`: run mobile e device flow aggiornato.
- `documentation/INcampusFILESsciolti/UCR - *.md`: UCR di dominio.

## Documentazione Operativa Riallineata

Questi file costituiscono la documentazione operativa corrente per demo readiness, runbook e checklist:

- `docs/demo-readiness-review.md`.
- `docs/mobile-run-check.md`.
- `docs/project-runbook.md`.
- `docs/final-integrated-review.md`.
- `docs/backend-smoke-check.md`.
- `docs/demo-seed.md`.

I documenti mantengono esplicitamente aperti: device fisico, T20 final QA/sign-off, email reale, push reale, scheduler reminder, admin UI/auth reale, structured options dinamiche mobile e withdraw/leave UI. La CI remota DB-backed e' stata confermata su PR #39.

## Aggiornamenti PR Recenti

- PR #39: ha aggiunto `docs/incampus-current-state-update-2026-05-17.md`, ha rimosso `codingOrganization/`, e ha aggiornato i riferimenti in `README.md` e `docs/setup.md`.
- PR #38: rende cross-platform `npm run dev:backend:device` tramite `scripts/start-backend-device.mjs`.
- PR #38: rende cross-platform `npm run start:device --workspace mobile` usando `npx.cmd` su Windows.
- PR #38: aggiunge esempi PowerShell per `INCAMPUS_DEVICE_HOST` e `EXPO_PUBLIC_API_BASE_URL` in `mobile/README.md`.
- PR #38: mantiene invariati i caveat di validazione; il tooling device e' pronto, ma la run fisica iPhone/Android resta da eseguire davvero.
- PR #40: aggiunge `docs/mobile-qa-buglist.md` come buglist QA Jacopo J1.
- PR #40: corregge il consenso `Skip for now`, il fallback notification reason, l'empty-state community rules, la copy history personal activities e la sanificazione runtime dei route params in report/block.

## Rischi E Gap Principali

Priorita' alta:

- Caricare structured options reali nel mobile create activity invece dei fallback seed hardcoded.
- Implementare UI mobile per withdraw pending request e leave joined activity.
- Fare una run manuale Expo Go su device fisico con backend e DB reali.
- Verificare su Windows/PowerShell il percorso device cross-platform.

Priorita' media:

- Aggiungere test mobile almeno per API client/navigation-critical screens.
- Aggiungere profile/detail context per report/block senza ID manuale.
- Aggiungere edit profile UX.
- Rendere feed filters e empty/error states piu' vicini alla demo finale.

Priorita' futura/production:

- Email verification reale.
- Push notification delivery reale.
- Scheduler reminder reale.
- Admin UI e auth staff reale.
- Estendere CI/e2e oltre lo smoke DB-backed introdotto in PR #37.
- Hardening sicurezza, logging, observability e rate limiting.

## Indicazioni Per La Prossima AI

Usa questo file come stato operativo aggiornato, ma verifica sempre DTO e route nel codice se devi implementare. La documentazione di dominio resta prioritaria per regole prodotto, mentre il codice corrente e' prioritario per shape API e nomi route effettivamente disponibili.

Non reintrodurre mock nascosti nei flussi gia' collegati al backend. Se una demo non funziona, preferisci correggere client/API alignment o documentare il gap invece di simulare dati. Per mobile, preserva i route name attuali in `AppNavigator`. Per backend, non cambiare DTO o enum senza controllare impatto su mobile, test e docs.

Conclusione: il progetto e' in buono stato per una demo alpha guidata, soprattutto con migrate + seed + smoke + Expo device tooling e il primo pass QA mobile Jacopo corretto. Non e' ancora una beta chiusa: mancano alcune UX secondarie, verifica device reale, e i servizi production-grade (email, push, scheduler, admin UI, hardening) non sono completi.
