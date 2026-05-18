# Riassunto generale del prodotto

InCampus è una app mobile Expo/React Native per studenti universitari. Il prodotto permette onboarding, scelta campus, profilo, feed attività, creazione attività, join/request, gestione richieste host, notifiche, regole community, report e blocco studenti.

Il front-end attuale è una shell MVP con `StackNavigator`. Non ci sono tab bar, sidebar o modali custom. Le “modali” sono quasi tutte `Alert.alert` native.

# Mappa completa delle schermate

| Area | Nome schermata | Route | File/componente | Scopo | Schermate collegate |
|---|---|---|---|---|---|
| Autenticazione | Sign In | `SignIn` | `mobile/src/screens/SignInScreen.tsx` | Login studente | SignUp, CampusSelection, ActivityFeed |
| Autenticazione | Sign Up / Verify | `SignUp` | `SignUpScreen.tsx` | Registrazione e verifica email | SignIn |
| Onboarding | Campus Selection | `CampusSelection` | `CampusSelectionScreen.tsx` | Scelta campus | SignIn, ProfileSetup, ActivityFeed |
| Onboarding / Profilo | Profile Setup | `ProfileSetup` | `ProfileSetupScreen.tsx` | Creazione profilo | SignIn, ConsentSettings, ActivityFeed |
| Impostazioni | Consent Settings | `ConsentSettings` | `ConsentSettingsScreen.tsx` | Consenso dati campus | ActivityFeed |
| Dashboard / Lista | Activity Feed | `ActivityFeed` | `ActivityFeedScreen.tsx` | Lista attività campus | ActivityDetails, CreateActivity, Notifications, Mine, Rules |
| Dettaglio | Activity Details | `ActivityDetails` | `ActivityDetailsScreen.tsx` | Dettaglio attività e join | ManageRequests, ReportSubmission, BlockUser, ActivityFeed |
| Creazione | Create Activity | `CreateActivity` | `CreateActivityScreen.tsx` | Pubblicare attività | ActivityFeed |
| Host / Richieste | Manage Requests | `ManageRequests` | `ManageRequestsScreen.tsx` | Approva/rifiuta richieste | ActivityDetails |
| Notifiche | Notification List | `NotificationList` | `NotificationListScreen.tsx` | Lista notifiche | ActivityDetails, ManageRequests, PersonalActivityList, Fallback |
| Notifiche | Notification Fallback | `NotificationFallback` | `NotificationFallbackScreen.tsx` | Target notifica non disponibile | NotificationList, ActivityFeed |
| Profilo / Liste | Personal Activity List | `PersonalActivityList` | `PersonalActivityListScreen.tsx` | Attività personali | ActivityDetails |
| Sicurezza | Community Rules | `CommunityRules` | `CommunityRulesScreen.tsx` | Regole community | Da collegare meglio a Report/Block |
| Sicurezza | Report Submission | `ReportSubmission` | `ReportSubmissionScreen.tsx` | Invia report | goBack |
| Sicurezza | Block User | `BlockUser` | `BlockUserScreen.tsx` | Blocca studente | goBack |

# Dettaglio schermate

## Sign In

- Area: Autenticazione
- Route/file: `SignIn` / `SignInScreen.tsx`
- Scopo: Accesso con email universitaria e password.
- Cosa vede l’utente: titolo, sottotitolo, campi email/password, errore inline.
- Dati mostrati: nessun dato remoto, solo errori auth.
- Azioni principali: login o passaggio a registrazione.

### Bottoni e azioni esistenti
- Etichetta: `Sign In`
- Azione: `POST /auth/signin`, salva `authToken`, `studentAccountId`, `selectedCampusId`
- Dove porta / cosa attiva: `CampusSelection` se manca campus, altrimenti `ActivityFeed`
- Collegamento tecnico: `handleSignIn`
- Note: gestisce account non verificato, sospeso, bannato.

- Etichetta: `Don't have an account? Sign Up`
- Azione: naviga a registrazione
- Dove porta / cosa attiva: `SignUp`
- Collegamento tecnico: `navigation.navigate("SignUp")`
- Note: link testuale.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Forgot password?`
- Motivo: recupero account comune in login.
- Dove dovrebbe portare: schermata recupero password.
- Schermata collegata: da chiarire, non presente.
- Flusso collegato: autenticazione.
- Livello di certezza: da verificare.

- Etichetta suggerita: `Resend verification email`
- Motivo: esiste errore `ACCOUNT_NOT_VERIFIED`, ma non c’è azione successiva.
- Dove dovrebbe portare: flusso verifica email o nuova richiesta token.
- Schermata collegata: `SignUp` step verify o schermata dedicata.
- Flusso collegato: verifica account.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: spinner dentro bottone.
- Empty state: non rilevante.
- Error state: messaggio inline.
- Success state: navigazione.
- Stato dopo salvataggio/modifica/eliminazione: non applicabile.

### Note per il redesign
- Rendere più chiaro il percorso post-login: campus mancante vs feed.
- Aggiungere gerarchia visiva tra CTA primaria e link secondario.
- Valutare visibilità password e recupero account.

## Sign Up / Verify

- Area: Autenticazione
- Route/file: `SignUp` / `SignUpScreen.tsx`
- Scopo: Creazione account e verifica email.
- Cosa vede l’utente: due step nello stesso screen: registrazione e verifica codice.
- Dati mostrati: errori validazione e backend.
- Azioni principali: creare account, verificare codice, tornare a login.

### Bottoni e azioni esistenti
- Etichetta: `Sign Up`
- Azione: `POST /auth/signup`
- Dove porta / cosa attiva: passa allo step `verify`
- Collegamento tecnico: `handleSignUp`
- Note: controlla password uguali e campi obbligatori.

- Etichetta: `Verify`
- Azione: `POST /auth/verify-email`
- Dove porta / cosa attiva: alert successo, poi `SignIn`
- Collegamento tecnico: `handleVerify`
- Note: usa email registrata nello step precedente.

- Etichetta: `Already have an account? Sign In`
- Azione: naviga login
- Dove porta / cosa attiva: `SignIn`
- Collegamento tecnico: `navigation.navigate("SignIn")`
- Note: sempre visibile.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Back to account details`
- Motivo: nello step verify non c’è modo chiaro di correggere email/student ID.
- Dove dovrebbe portare: step `register`.
- Schermata collegata: stesso screen.
- Flusso collegato: signup.
- Livello di certezza: certo.

- Etichetta suggerita: `Resend code`
- Motivo: se il codice non arriva, l’utente resta bloccato.
- Dove dovrebbe portare: endpoint/azione da chiarire.
- Schermata collegata: stesso screen.
- Flusso collegato: verifica email.
- Livello di certezza: da verificare.

### Stati della schermata
- Loading: spinner sul bottone.
- Empty state: non rilevante.
- Error state: messaggio inline.
- Success state: alert “Account Verified”.
- Stato dopo salvataggio/modifica/eliminazione: dopo signup passa a verify.

### Note per il redesign
- Separare meglio registrazione e verifica come stepper.
- Spiegare che la verifica backend è ancora demo/mock se rilevante.
- Rendere più chiaro il requisito email universitaria.

## Campus Selection

- Area: Onboarding
- Route/file: `CampusSelection` / `CampusSelectionScreen.tsx`
- Scopo: scegliere il campus attivo.
- Cosa vede l’utente: lista campus attivi e bottone conferma.
- Dati mostrati: `campusName`, `campusId` interno non visibile.
- Azioni principali: selezionare campus, confermare.

### Bottoni e azioni esistenti
- Etichetta: card campus
- Azione: seleziona `campusId`
- Dove porta / cosa attiva: abilita `Confirm Campus`
- Collegamento tecnico: `setSelectedId`
- Note: se c’è un solo campus viene preselezionato.

- Etichetta: `Confirm Campus`
- Azione: `PATCH /accounts/me/campus`
- Dove porta / cosa attiva: salva token/campus; poi `ActivityFeed` se profilo esiste, altrimenti `ProfileSetup`
- Collegamento tecnico: `handleConfirm`
- Note: se token assente reset a `SignIn`.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Refresh campuses`
- Motivo: gli errori usano Alert, ma non c’è retry visibile nello screen.
- Dove dovrebbe portare: ricarica `/campuses`.
- Schermata collegata: stessa schermata.
- Flusso collegato: onboarding.
- Livello di certezza: certo.

- Etichetta suggerita: `Use another account`
- Motivo: se l’utente è loggato male, oggi viene reindirizzato solo se manca token.
- Dove dovrebbe portare: `SignIn`, cancellando sessione locale.
- Schermata collegata: `SignIn`.
- Flusso collegato: autenticazione.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: spinner “Loading campuses…”.
- Empty state: “No campuses available.”
- Error state: Alert.
- Success state: navigazione.
- Stato dopo salvataggio/modifica/eliminazione: token aggiornato e redirect.

### Note per il redesign
- Rendere chiara la conseguenza della scelta campus.
- Aggiungere stato errore inline invece di solo Alert.
- Valutare ricerca se i campus diventano molti.

## Profile Setup

- Area: Profilo / Onboarding
- Route/file: `ProfileSetup` / `ProfileSetupScreen.tsx`
- Scopo: creare profilo minimo.
- Cosa vede l’utente: form con nome, major, data nascita, gender, interessi, lingue, bio.
- Dati mostrati: solo input locali.
- Azioni principali: selezionare gender, compilare, creare profilo.

### Bottoni e azioni esistenti
- Etichetta: chip gender (`Male`, `Female`, `Other`, `Prefer not to say`)
- Azione: seleziona/deseleziona gender
- Dove porta / cosa attiva: aggiorna stato form
- Collegamento tecnico: `setGender`
- Note: singola selezione.

- Etichetta: `Create Profile`
- Azione: `POST /profiles`
- Dove porta / cosa attiva: alert successo, poi `ConsentSettings`
- Collegamento tecnico: `handleSubmit`
- Note: se profilo già esiste va ad `ActivityFeed`.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Back to campus`
- Motivo: se il campus è errato non c’è collegamento esplicito.
- Dove dovrebbe portare: `CampusSelection`.
- Schermata collegata: `CampusSelection`.
- Flusso collegato: onboarding.
- Livello di certezza: probabile.

- Etichetta suggerita: `Skip optional fields`
- Motivo: molti campi opzionali possono rallentare onboarding.
- Dove dovrebbe portare: focus sui soli campi richiesti o collasso sezioni opzionali.
- Schermata collegata: stesso screen.
- Flusso collegato: onboarding.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: spinner sul bottone submit.
- Empty state: non rilevante.
- Error state: Alert per campi/validazione.
- Success state: Alert “Profile Created”.
- Stato dopo salvataggio/modifica/eliminazione: va a `ConsentSettings`.

### Note per il redesign
- Separare campi richiesti e opzionali.
- Rendere interessi/lingue come tag editor invece di testo con virgole.
- Data di nascita dovrebbe usare date picker o formato guidato.

## Consent Settings

- Area: Impostazioni / Onboarding
- Route/file: `ConsentSettings` / `ConsentSettingsScreen.tsx`
- Scopo: consenso alla condivisione dati con campus staff.
- Cosa vede l’utente: testo informativo, switch, CTA continue, skip.
- Dati mostrati: stato consenso locale.
- Azioni principali: attivare/disattivare consenso e proseguire.

### Bottoni e azioni esistenti
- Etichetta: switch `Share my data with campus staff`
- Azione: modifica boolean consenso
- Dove porta / cosa attiva: stato locale
- Collegamento tecnico: `setConsentEnabled`
- Note: default false.

- Etichetta: `Continue`
- Azione: `PATCH /accounts/me/consent`
- Dove porta / cosa attiva: reset a `ActivityFeed`
- Collegamento tecnico: `handleContinue`
- Note: salva true/false secondo switch.

- Etichetta: `Skip for now`
- Azione: salva consenso false
- Dove porta / cosa attiva: `ActivityFeed`
- Collegamento tecnico: `handleSkip`
- Note: non blocca uso app.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Learn how data is used`
- Motivo: il consenso richiede fiducia e spiegazione.
- Dove dovrebbe portare: schermata informativa o documento privacy.
- Schermata collegata: da chiarire.
- Flusso collegato: impostazioni/privacy.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: spinner su `Continue`.
- Empty state: non rilevante.
- Error state: Alert.
- Success state: navigazione a feed.
- Stato dopo salvataggio/modifica/eliminazione: onboarding completato.

### Note per il redesign
- Rendere consenso più leggibile e meno legale.
- Mostrare chiaramente “puoi cambiarlo dopo”, ma oggi non esiste una schermata impostazioni per farlo.

## Activity Feed

- Area: Dashboard / Liste
- Route/file: `ActivityFeed` / `ActivityFeedScreen.tsx`
- Scopo: home principale con attività del campus.
- Cosa vede l’utente: lista card attività, header azioni, empty/error/loading.
- Dati mostrati: titolo, data/ora, categoria, meeting point, partecipanti, stato.
- Azioni principali: aprire dettaglio, refresh, creare, notifiche, attività personali, regole.

### Bottoni e azioni esistenti
- Etichetta: `Alerts`
- Azione: naviga a notifiche
- Dove porta / cosa attiva: `NotificationList`
- Collegamento tecnico: `FeedHeaderActions`
- Note: header action testuale.

- Etichetta: `Mine`
- Azione: naviga attività personali
- Dove porta / cosa attiva: `PersonalActivityList`
- Collegamento tecnico: `FeedHeaderActions`
- Note: utile ma poco esplicito.

- Etichetta: `Rules`
- Azione: naviga regole community
- Dove porta / cosa attiva: `CommunityRules`
- Collegamento tecnico: `FeedHeaderActions`
- Note: sicurezza.

- Etichetta: `Create`
- Azione: naviga creazione
- Dove porta / cosa attiva: `CreateActivity`
- Collegamento tecnico: `FeedHeaderActions`
- Note: CTA importante ma nascosta nel testo header.

- Etichetta: card attività
- Azione: apre dettaglio
- Dove porta / cosa attiva: `ActivityDetails`
- Collegamento tecnico: `navigation.navigate('ActivityDetails', { activityId })`
- Note: card intera cliccabile.

- Etichetta: `Retry`
- Azione: ricarica feed
- Dove porta / cosa attiva: `GET /activities`
- Collegamento tecnico: `fetchActivities('refresh')`
- Note: appare in error banner.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Create Activity` nell’empty state
- Motivo: empty text lo suggerisce, ma non c’è CTA lì.
- Dove dovrebbe portare: `CreateActivity`.
- Schermata collegata: Create Activity.
- Flusso collegato: feed → creazione.
- Livello di certezza: certo.

- Etichetta suggerita: `Filter`
- Motivo: feed ha categoria/status ma nessun filtro.
- Dove dovrebbe portare: filtri inline o bottom sheet.
- Schermata collegata: stessa schermata.
- Flusso collegato: discovery.
- Livello di certezza: probabile.

- Etichetta suggerita: `Change campus`
- Motivo: feed dipende da `selectedCampusId`, ma non c’è accesso alla scelta campus.
- Dove dovrebbe portare: `CampusSelection` o impostazioni campus.
- Schermata collegata: CampusSelection.
- Flusso collegato: campus context.
- Livello di certezza: da verificare.

### Stati della schermata
- Loading: full screen spinner.
- Empty state: “No activities yet”.
- Error state: error banner + Retry.
- Success state: lista attività.
- Stato dopo salvataggio/modifica/eliminazione: dopo create/join refresh e highlight “Just created”.

### Note per il redesign
- Questa è la home: serve una gerarchia più forte.
- Header con 4 link testuali può diventare navigation più stabile.
- Card attività dovrebbero mostrare status, mode, posto/tempo in modo più scansionabile.

## Activity Details

- Area: Dettaglio
- Route/file: `ActivityDetails` / `ActivityDetailsScreen.tsx`
- Scopo: mostrare attività e permettere join/request o gestione host.
- Cosa vede l’utente: titolo, descrizione, info box, host, status, preferenze, bottoni safety.
- Dati mostrati: activity DTO, host profile, partecipanti, mode.
- Azioni principali: join/request, manage requests, report activity, block host.

### Bottoni e azioni esistenti
- Etichetta: `Requests` header
- Azione: apre richieste host
- Dove porta / cosa attiva: `ManageRequests`
- Collegamento tecnico: `navigation.setOptions`
- Note: solo se `canManageRequests`.

- Etichetta: `Report activity`
- Azione: apre report precompilato activity
- Dove porta / cosa attiva: `ReportSubmission`
- Collegamento tecnico: params `targetType: activity`, `targetActivityId`
- Note: safety action.

- Etichetta: `Block host`
- Azione: apre blocco host
- Dove porta / cosa attiva: `BlockUser`
- Collegamento tecnico: param `targetAccountId: hostAccountId`
- Note: non passa display name.

- Etichetta: `Manage Requests`
- Azione: apre richieste
- Dove porta / cosa attiva: `ManageRequests`
- Collegamento tecnico: button body
- Note: duplicato con header `Requests`.

- Etichetta: `Join Activity` / `Request to Join`
- Azione: `POST /activities/:id/join`
- Dove porta / cosa attiva: alert successo, poi `ActivityFeed`
- Collegamento tecnico: `handleJoin`
- Note: disabilitato se full/non open/host.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `View host profile`
- Motivo: mostra host ma non permette capire chi sia.
- Dove dovrebbe portare: schermata profilo studente.
- Schermata collegata: da chiarire, non presente.
- Flusso collegato: trust/safety.
- Livello di certezza: da verificare.

- Etichetta suggerita: `Withdraw request` / `Leave activity`
- Motivo: il dettaglio non mostra azioni per utenti già pending/joined.
- Dove dovrebbe portare: stessa schermata con API dedicate.
- Schermata collegata: PersonalActivityList / ActivityDetails.
- Flusso collegato: partecipazione.
- Livello di certezza: da verificare.

- Etichetta suggerita: `Back to feed`
- Motivo: c’è back nativo, ma per stati errore/unavailable serve CTA esplicita.
- Dove dovrebbe portare: `ActivityFeed`.
- Schermata collegata: ActivityFeed.
- Flusso collegato: detail → list.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: full spinner.
- Empty state: `Activity unavailable`.
- Error state: Alert, poi schermata unavailable.
- Success state: join/request alert.
- Stato dopo salvataggio/modifica/eliminazione: dopo join torna al feed.

### Note per il redesign
- Info box è molto tecnico: “Gender Pref”, “Mode” vanno tradotti in linguaggio utente.
- Safety actions sono visibili ma potrebbero essere in menu secondario.
- Duplicazione `Requests` header + `Manage Requests` va risolta.

## Create Activity

- Area: Creazione
- Route/file: `CreateActivity` / `CreateActivityScreen.tsx`
- Scopo: creare una nuova attività.
- Cosa vede l’utente: form lungo con titolo, descrizione, data ISO, categoria, luogo, max partecipanti, mode, gender preference.
- Dati mostrati: opzioni hardcoded demo seed.
- Azioni principali: compilare form, scegliere opzioni, pubblicare.

### Bottoni e azioni esistenti
- Etichetta: chip categoria (`Lunch`, `Study`)
- Azione: seleziona `categoryId`
- Dove porta / cosa attiva: stato form
- Collegamento tecnico: `setCategoryId`
- Note: hardcoded.

- Etichetta: chip meeting point (`Jiading Library`)
- Azione: seleziona `meetingPointId`
- Dove porta / cosa attiva: stato form
- Collegamento tecnico: `setMeetingPointId`
- Note: hardcoded.

- Etichetta: `Open Access` / `Requires Approval`
- Azione: seleziona participation mode
- Dove porta / cosa attiva: mostra `Max Pending Requests` se approval.
- Collegamento tecnico: `setParticipationMode`
- Note: segmented chips.

- Etichetta: `All`, `Male Only`, `Female Only`
- Azione: seleziona gender preference
- Dove porta / cosa attiva: stato form
- Collegamento tecnico: `setGenderPreference`
- Note: copy sensibile da rivedere.

- Etichetta: `Publish Activity`
- Azione: `POST /activities`
- Dove porta / cosa attiva: alert successo, poi `ActivityFeed`
- Collegamento tecnico: `handleCreate`
- Note: passa `createdActivityId` al feed.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Cancel`
- Motivo: form lungo senza uscita esplicita oltre back nativo.
- Dove dovrebbe portare: `ActivityFeed`.
- Schermata collegata: ActivityFeed.
- Flusso collegato: creazione → annulla.
- Livello di certezza: certo.

- Etichetta suggerita: `Use date/time picker`
- Motivo: oggi richiede ISO string manuale.
- Dove dovrebbe portare: controllo inline.
- Schermata collegata: stessa schermata.
- Flusso collegato: creazione.
- Livello di certezza: certo.

- Etichetta suggerita: `Load campus options`
- Motivo: il codice segnala fallback demo; le opzioni dovrebbero essere dinamiche.
- Dove dovrebbe portare: endpoint structured options da chiarire lato mobile.
- Schermata collegata: stessa schermata.
- Flusso collegato: creazione.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: spinner al posto di Publish durante create.
- Empty state: non presente per opzioni mancanti.
- Error state: Alert validazione/API.
- Success state: Alert, poi feed.
- Stato dopo salvataggio/modifica/eliminazione: feed refresh + highlight.

### Note per il redesign
- Form va spezzato in sezioni chiare.
- Data/ora manuale è il punto UX più fragile.
- Categorie/luoghi hardcoded vanno visualmente trattati come temporanei o sostituiti.

## Manage Requests

- Area: Host / Richieste
- Route/file: `ManageRequests` / `ManageRequestsScreen.tsx`
- Scopo: host approva o rifiuta richieste di join.
- Cosa vede l’utente: lista richieste con applicant, major, bio, data, status.
- Dati mostrati: requestId, applicantId, applicant profile.
- Azioni principali: approve, decline, retry.

### Bottoni e azioni esistenti
- Etichetta: `Approve`
- Azione: `PATCH /activities/:activityId/requests/:requestId` con `decision: approve`
- Dove porta / cosa attiva: rimuove request dalla lista
- Collegamento tecnico: `handleDecision`
- Note: testo diventa `Working...`.

- Etichetta: `Decline`
- Azione: patch decision decline
- Dove porta / cosa attiva: rimuove request dalla lista
- Collegamento tecnico: `handleDecision`
- Note: stesso loading per entrambi.

- Etichetta: `Retry`
- Azione: ricarica richieste
- Dove porta / cosa attiva: `GET /activities/:id/requests`
- Collegamento tecnico: `fetchRequests`
- Note: solo in error state.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `View activity`
- Motivo: se si arriva da notifica, può servire contesto attività.
- Dove dovrebbe portare: `ActivityDetails`.
- Schermata collegata: ActivityDetails.
- Flusso collegato: notification/manage → detail.
- Livello di certezza: probabile.

- Etichetta suggerita: `View applicant profile`
- Motivo: decisione host richiede fiducia e contesto.
- Dove dovrebbe portare: profilo studente.
- Schermata collegata: da chiarire, non presente.
- Flusso collegato: host review.
- Livello di certezza: da verificare.

### Stati della schermata
- Loading: spinner.
- Empty state: no pending requests.
- Error state: messaggio + Retry.
- Success state: Alert e rimozione card.
- Stato dopo salvataggio/modifica/eliminazione: lista aggiornata localmente.

### Note per il redesign
- Correggere artefatto encoding `Â·`.
- Rendere più leggibile approve/decline come decisione importante.
- Valutare conferma o undo per decline.

## Notification List

- Area: Notifiche
- Route/file: `NotificationList` / `NotificationListScreen.tsx`
- Scopo: visualizzare notifiche e aprire il contesto corretto.
- Cosa vede l’utente: lista notifiche con tipo, titolo, messaggio, account, tempo.
- Dati mostrati: notificationType, title, message, triggeringAccountId, createdAt.
- Azioni principali: aprire notifica, refresh, pagination.

### Bottoni e azioni esistenti
- Etichetta: notification item
- Azione: `GET /notifications/:notificationId/context`
- Dove porta / cosa attiva: `ActivityDetails`, `ManageRequests`, `PersonalActivityList` o `NotificationFallback`
- Collegamento tecnico: `handleTapNotification`
- Note: mostra spinner sulla card cliccata.

- Etichetta: `Retry`
- Azione: ricarica lista
- Dove porta / cosa attiva: `GET /notifications`
- Collegamento tecnico: `onRefresh`
- Note: error banner.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Filter`
- Motivo: ci sono più tipi di notifica.
- Dove dovrebbe portare: filtro tipo notifica.
- Schermata collegata: stessa schermata.
- Flusso collegato: notifiche.
- Livello di certezza: probabile.

- Etichetta suggerita: `Mark all as read`
- Motivo: comportamento comune notifiche, ma API non evidente.
- Dove dovrebbe portare: azione da chiarire.
- Schermata collegata: stessa schermata.
- Flusso collegato: notifiche.
- Livello di certezza: da verificare.

### Stati della schermata
- Loading: spinner full screen.
- Empty state: “No notifications yet”.
- Error state: error banner + Retry.
- Success state: lista.
- Stato dopo salvataggio/modifica/eliminazione: non presente.

### Note per il redesign
- La nota “Opening a notification is read-only…” è tecnica e va resa più naturale.
- Il mapping verso contesti è buono ma invisibile: servono stati chiari quando una notifica non apre nulla.

## Notification Fallback

- Area: Notifiche / Flussi secondari
- Route/file: `NotificationFallback` / `NotificationFallbackScreen.tsx`
- Scopo: gestire notifiche non apribili.
- Cosa vede l’utente: icona link, titolo, messaggio motivato.
- Dati mostrati: reason derivata da route params.
- Azioni principali: tornare a notifiche o feed.

### Bottoni e azioni esistenti
- Etichetta: `Back to Notifications`
- Azione: naviga notifiche
- Dove porta / cosa attiva: `NotificationList`
- Collegamento tecnico: `navigation.navigate`
- Note: primaria.

- Etichetta: `Go to Activity Feed`
- Azione: reset feed
- Dove porta / cosa attiva: `ActivityFeed`
- Collegamento tecnico: `navigation.reset`
- Note: secondaria.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Why am I seeing this?`
- Motivo: motivi come block/deleted possono essere delicati.
- Dove dovrebbe portare: spiegazione inline/expand.
- Schermata collegata: stessa schermata.
- Flusso collegato: support/safety.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: non presente.
- Empty state: non rilevante.
- Error state: è essa stessa fallback.
- Success state: non rilevante.
- Stato dopo salvataggio/modifica/eliminazione: non applicabile.

### Note per il redesign
- L’icona link è un emoji; per coerenza andrebbe sostituita con icona di sistema.
- Messaggi reason-specific già presenti: buona base per copy migliore.

## Personal Activity List

- Area: Profilo / Liste
- Route/file: `PersonalActivityList` / `PersonalActivityListScreen.tsx`
- Scopo: mostrare attività personali upcoming e history.
- Cosa vede l’utente: intro, eventuale context da notifica, sezioni Upcoming/History.
- Dati mostrati: titolo, status personale, data, categoria, meeting point, partecipanti.
- Azioni principali: aprire dettaglio attività, retry, pull refresh.

### Bottoni e azioni esistenti
- Etichetta: card attività
- Azione: apre dettaglio
- Dove porta / cosa attiva: `ActivityDetails`
- Collegamento tecnico: `navigation.navigate('ActivityDetails')`
- Note: usata in entrambe le sezioni.

- Etichetta: `Retry`
- Azione: ricarica `/profiles/me/activities`
- Dove porta / cosa attiva: aggiorna lista
- Collegamento tecnico: `fetchPersonalActivities`
- Note: solo in notice error.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Browse activities`
- Motivo: se lista vuota, serve uscita verso feed.
- Dove dovrebbe portare: `ActivityFeed`.
- Schermata collegata: ActivityFeed.
- Flusso collegato: personal list → discovery.
- Livello di certezza: certo.

- Etichetta suggerita: `Create activity`
- Motivo: se non ho attività, creare è azione naturale.
- Dove dovrebbe portare: `CreateActivity`.
- Schermata collegata: CreateActivity.
- Flusso collegato: personal list → create.
- Livello di certezza: probabile.

- Etichetta suggerita: `Leave` / `Withdraw`
- Motivo: status pending/joined è mostrato, ma non c’è azione.
- Dove dovrebbe portare: azione participation da chiarire nel mobile.
- Schermata collegata: ActivityDetails o stessa lista.
- Flusso collegato: gestione partecipazione.
- Livello di certezza: da verificare.

### Stati della schermata
- Loading: spinner.
- Empty state: per ogni sezione.
- Error state: notice box + Retry.
- Success state: sezioni popolate.
- Stato dopo salvataggio/modifica/eliminazione: non presente.

### Note per il redesign
- “MVP route…” è testo tecnico da rimuovere dall’utente finale.
- Upcoming/History potrebbero essere tab o segmented control.
- Badge status sono importanti e vanno standardizzati.

## Community Rules

- Area: Sicurezza
- Route/file: `CommunityRules` / `CommunityRulesScreen.tsx`
- Scopo: mostrare regole community.
- Cosa vede l’utente: titolo, sottotitolo, card regole.
- Dati mostrati: sezioni da `/community-rules` o fallback locale.
- Azioni principali: refresh/retry.

### Bottoni e azioni esistenti
- Etichetta: `Retry`
- Azione: ricarica regole
- Dove porta / cosa attiva: `GET /community-rules`
- Collegamento tecnico: `fetchRules('refresh')`
- Note: appare se API fallisce.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Report a concern`
- Motivo: dalle regole è naturale passare al report.
- Dove dovrebbe portare: `ReportSubmission`.
- Schermata collegata: ReportSubmission.
- Flusso collegato: safety.
- Livello di certezza: probabile.

- Etichetta suggerita: `Back to feed`
- Motivo: screen informativo senza CTA finale.
- Dove dovrebbe portare: `ActivityFeed`.
- Schermata collegata: ActivityFeed.
- Flusso collegato: rules → app.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: spinner.
- Empty state: “No community rules…”.
- Error state: notice + fallback rules + Retry.
- Success state: sezioni regole.
- Stato dopo salvataggio/modifica/eliminazione: non applicabile.

### Note per il redesign
- Copy “static MVP safety content” è tecnico.
- Le regole possono diventare pagina safety con CTA report/block.

## Report Submission

- Area: Sicurezza
- Route/file: `ReportSubmission` / `ReportSubmissionScreen.tsx`
- Scopo: inviare report activity/student.
- Cosa vede l’utente: form target type, target ID, reason, details.
- Dati mostrati: route params precompilati se disponibili.
- Azioni principali: scegliere tipo target, motivo, submit.

### Bottoni e azioni esistenti
- Etichetta: `Activity` / `Student`
- Azione: cambia target type
- Dove porta / cosa attiva: mostra input Activity ID o Student Account ID
- Collegamento tecnico: `setTargetType`
- Note: segmented control.

- Etichetta: reason chips
- Azione: seleziona reasonCode
- Dove porta / cosa attiva: stato form
- Collegamento tecnico: `setReasonCode`
- Note: unsafe, harassment, misleading, other.

- Etichetta: `Submit Report`
- Azione: `POST /reports`
- Dove porta / cosa attiva: Alert successo, poi `goBack`
- Collegamento tecnico: `handleSubmit`
- Note: usa `selectedCampusId`.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Cancel`
- Motivo: form sensibile, serve uscita chiara.
- Dove dovrebbe portare: `goBack`.
- Schermata collegata: schermata precedente.
- Flusso collegato: safety.
- Livello di certezza: certo.

- Etichetta suggerita: target summary readonly
- Motivo: se arriva da ActivityDetails, l’utente non dovrebbe vedere solo ID tecnico.
- Dove dovrebbe portare: display contestuale activity/host.
- Schermata collegata: ActivityDetails.
- Flusso collegato: detail → report.
- Livello di certezza: probabile.

### Stati della schermata
- Loading: spinner sul bottone.
- Empty state: non rilevante.
- Error state: Alert.
- Success state: Alert + goBack.
- Stato dopo salvataggio/modifica/eliminazione: ritorno schermata precedente.

### Note per il redesign
- Evitare ID tecnici visibili quando possibile.
- Reason chips vanno spiegati con copy semplice.
- Chiarire privacy: “non notifica altri studenti” è utile, ma va reso meno tecnico.

## Block User

- Area: Sicurezza
- Route/file: `BlockUser` / `BlockUserScreen.tsx`
- Scopo: bloccare uno studente.
- Cosa vede l’utente: descrizione, input account ID, bottone block, nota.
- Dati mostrati: targetAccountId da route se presente.
- Azioni principali: inviare block.

### Bottoni e azioni esistenti
- Etichetta: `Block Student`
- Azione: `POST /blocks`
- Dove porta / cosa attiva: Alert successo, poi `goBack`
- Collegamento tecnico: `handleBlock`
- Note: se aperta da ActivityDetails riceve hostAccountId.

### Bottoni, link o collegamenti consigliati
- Etichetta suggerita: `Report this student too`
- Motivo: blocco e report sono flussi safety collegati.
- Dove dovrebbe portare: `ReportSubmission` con `targetType: student`.
- Schermata collegata: ReportSubmission.
- Flusso collegato: block → report.
- Livello di certezza: probabile.

- Etichetta suggerita: `Cancel`
- Motivo: azione sensibile.
- Dove dovrebbe portare: `goBack`.
- Schermata collegata: precedente.
- Flusso collegato: safety.
- Livello di certezza: certo.

### Stati della schermata
- Loading: spinner sul bottone.
- Empty state: non rilevante.
- Error state: Alert.
- Success state: Alert + goBack.
- Stato dopo salvataggio/modifica/eliminazione: ritorno schermata precedente.

### Note per il redesign
- Non mostra nome studente, solo ID: poco user-friendly.
- Serve spiegazione più chiara delle conseguenze del blocco.
- La nota “StudentProfileScreen non presente” è tecnica.

# Flussi principali tra schermate

1. Registrazione:
   `SignIn` → `SignUp` → step verify → `SignIn`.

2. Login con campus già scelto:
   `SignIn` → salva token → `ActivityFeed`.

3. Login senza campus:
   `SignIn` → `CampusSelection` → se profilo esiste `ActivityFeed`, altrimenti `ProfileSetup`.

4. Onboarding nuovo utente:
   `CampusSelection` → `ProfileSetup` → `ConsentSettings` → `ActivityFeed`.

5. Discovery attività:
   `ActivityFeed` → tap card → `ActivityDetails`.

6. Creazione attività:
   `ActivityFeed` → `CreateActivity` → `Publish Activity` → `ActivityFeed` con refresh/highlight.

7. Join attività:
   `ActivityDetails` → `Join Activity` o `Request to Join` → `ActivityFeed` con refresh.

8. Gestione host:
   `ActivityDetails` host → `ManageRequests` → `Approve`/`Decline` → resta su lista richieste aggiornata.

9. Notifiche:
   `ActivityFeed` → `NotificationList` → tap notifica → `ActivityDetails` / `ManageRequests` / `PersonalActivityList` / `NotificationFallback`.

10. Sicurezza da dettaglio:
   `ActivityDetails` → `Report activity` → `ReportSubmission` → `goBack`.
   `ActivityDetails` → `Block host` → `BlockUser` → `goBack`.

11. Attività personali:
   `ActivityFeed` → `PersonalActivityList` → tap attività → `ActivityDetails`.

12. Regole:
   `ActivityFeed` → `CommunityRules`.

# Collegamenti mancanti o da valutare

| Schermata di partenza | Collegamento mancante o consigliato | Destinazione | Motivo | Livello |
|---|---|---|---|---|
| ActivityFeed empty | `Create Activity` CTA | CreateActivity | Empty text lo suggerisce ma non c’è bottone | certo |
| ActivityFeed | `Filter` | Stessa schermata | Feed può crescere molto | probabile |
| ActivityFeed | `Change campus` | CampusSelection | Campus context non modificabile dal feed | da verificare |
| ActivityDetails | `View host profile` | Da chiarire | Trust/safety | da verificare |
| ActivityDetails | `Withdraw` / `Leave` | Da chiarire | Stati joined/pending non gestiti nel dettaglio | da verificare |
| CreateActivity | `Cancel` | ActivityFeed/goBack | Form lungo senza uscita esplicita | certo |
| CreateActivity | date/time picker | Stessa schermata | ISO manuale fragile | certo |
| ManageRequests | `View activity` | ActivityDetails | Utile da notifica/richieste | probabile |
| ManageRequests | `View applicant profile` | Da chiarire | Decisione host richiede contesto | da verificare |
| PersonalActivityList | `Browse activities` | ActivityFeed | Empty state senza CTA | certo |
| PersonalActivityList | `Create activity` | CreateActivity | Azione naturale se lista vuota | probabile |
| CommunityRules | `Report a concern` | ReportSubmission | Safety flow collegato | probabile |
| ReportSubmission | `Cancel` | goBack | Azione sensibile | certo |
| BlockUser | `Report this student too` | ReportSubmission | Block/report sono collegati | probabile |
| SignIn | `Forgot password` | Da chiarire | Recupero account assente | da verificare |
| SignUp verify | `Resend code` | Da chiarire | Utente può bloccarsi | da verificare |

# Componenti ricorrenti da ridisegnare

- Stack header e header actions: oggi testuali (`Alerts`, `Mine`, `Rules`, `Create`).
- Card lista attività.
- Card richieste join.
- Card notifiche.
- Card regole.
- Form input.
- Segmented controls/chip.
- Bottoni primari e secondari.
- Error banner e notice box.
- Empty states.
- Loading states.
- Alert native per success/error.
- Badge/status.
- Pull-to-refresh.
- Navigation fallback.
- Safety action buttons.

# Checklist completa per il redesign

Autenticazione:
- Sign In
- Sign Up / Verify

Onboarding:
- Campus Selection
- Profile Setup
- Consent Settings

Dashboard e attività:
- Activity Feed
- Activity Details
- Create Activity
- Manage Requests
- Personal Activity List

Notifiche:
- Notification List
- Notification Fallback

Sicurezza:
- Community Rules
- Report Submission
- Block User

Layout/componenti trasversali:
- Stack header
- Feed header actions
- Card activity
- Card notification
- Card request
- Form pattern
- Empty/error/loading states
- Success/error Alert pattern