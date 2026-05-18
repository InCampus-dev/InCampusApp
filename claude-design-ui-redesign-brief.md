# InCampus Claude Design UI Redesign Brief

This document is the working brief to give Claude Design enough product, UX, IA, and visual direction to redesign the existing InCampus mobile UI.

The current mobile UI already exists as a first functional MVP. It is useful as a functional reference, but it is not visually final. Claude Design can change the layout, navigation model, hierarchy, component style, and visual language freely, as long as the supported product flows remain intact.

## How To Use This Document

Use this file as the source of truth for the next UI redesign pass.

Ask Claude Design to:

- create a high-fidelity mobile UI direction for the screens listed here
- preserve the current MVP flows and backend-supported actions
- redesign the current visual experience freely
- optimize the UI for Chinese university students, while still supporting international students
- keep the MVP in English for now, but design layouts that can later become Simplified Chinese-first
- avoid adding unsupported core features such as messaging, public profile browsing, swipe/match mechanics, points, photos, or friends

## Product Summary

InCampus is a campus-scoped social discovery app for verified university students.

It helps students find low-pressure opportunities to share ordinary campus moments with nearby students, such as lunch, coffee, study sessions, sports, language exchange, and small activities.

The first rollout focus is Tongji University, Jiading Campus. The design must still be scalable to other campuses and universities later.

The product should feel:

- friendly
- youthful
- social
- local
- safe
- lightweight
- campus-native
- independent from university control

The product must not feel:

- like a dating app
- like a university admin dashboard
- like a surveillance or student-control tool
- like a generic corporate productivity app
- like a public social network centered on profile browsing

The core user promise is:

> Find something happening around campus, join casually, and feel safe because everyone belongs to the campus context.

## Resolved Product Decisions

These decisions come from the product direction and user answers collected before this document.

| Topic | Decision |
| --- | --- |
| Product category | Social discovery app for campus activities |
| Target feeling | Friendly, youthful, social, casual |
| Relationship with university | University/campus verified, but students should not feel controlled by the institution |
| MVP language | English first |
| Future language | Simplified Chinese should become the primary language later |
| Audience | Mainly Chinese students, also international students on campus |
| First campus | Tongji University, Jiading Campus |
| Scale direction | Neutral and scalable beyond the first campus |
| Safety tone | Trustworthy, visible, calm, not heavy |
| Visual mood | Bright, youthful campus look |
| Chinese market reference | Xiaohongshu / REDnote-inspired discovery patterns, adapted to campus activities |
| Navigation | Bottom tabs / normal tab action model |
| Safety placement | Contextual only, not a main tab |
| Most important feed metadata | Category, time, location, in that order |
| Search/filter | Useful for category, time, and location |
| Activity detail focus | Trust and social context |
| Join feeling | Instant and casual |
| Create activity | Quick publish form with advanced options collapsed |
| Category/location input | Searchable selectors |
| Report/block visibility | Quite visible, especially in context |
| Safety education | Integrated during onboarding and reporting |
| Campus verified only | No separate filter needed. The whole app is campus-scoped and verified by design. Use visible trust badges instead. |
| Notifications | Actionable task center, not passive inbox |
| Cancellation notification | Distinct visual treatment |
| Read/unread | Not needed for MVP |
| My Activities | Central in the Mine area |
| Profile | Private/minimal/contextual, not a public social profile |

## Product Truths From Existing Documentation

Project documentation confirms or strongly supports these constraints:

- InCampus is not a dating app.
- The app is campus-scoped.
- Students sign up with a university email.
- Accounts are verified before use.
- Students select a campus.
- Activities belong to a campus.
- Profiles are minimal and contextual, not global public profiles.
- Report and block are supported safety actions.
- Community rules exist.
- Activity creation uses category, time, location, participant limit, and participation mode.
- Join can be direct or approval-based.
- Hosts can manage join requests.
- Notifications are actionable navigation contexts.
- Deletion and cancellation are different.
- Blocking affects visibility, profile access, interactions, and notifications where supported.
- Campus insight consent exists and defaults to false.

The project documentation does not define a detailed Chinese localization system yet. The MVP can stay English, but the new UI should be designed for future Simplified Chinese as the primary language.

## Current UI Reality

Current source references:

- `mobile/src/navigation/AppNavigator.tsx`
- `mobile/src/screens/SignInScreen.tsx`
- `mobile/src/screens/SignUpScreen.tsx`
- `mobile/src/screens/CampusSelectionScreen.tsx`
- `mobile/src/screens/ProfileSetupScreen.tsx`
- `mobile/src/screens/ConsentSettingsScreen.tsx`
- `mobile/src/screens/ActivityFeedScreen.tsx`
- `mobile/src/screens/ActivityDetailsScreen.tsx`
- `mobile/src/screens/CreateActivityScreen.tsx`
- `mobile/src/screens/ManageRequestsScreen.tsx`
- `mobile/src/screens/NotificationListScreen.tsx`
- `mobile/src/screens/NotificationFallbackScreen.tsx`
- `mobile/src/screens/PersonalActivityListScreen.tsx`
- `mobile/src/screens/CommunityRulesScreen.tsx`
- `mobile/src/screens/ReportSubmissionScreen.tsx`
- `mobile/src/screens/BlockUserScreen.tsx`

The current UI is a stack-based React Native/Expo MVP. The feed header currently exposes shortcuts for Alerts, Mine, Rules, and Create. For the redesign, this should become a more native mobile bottom-tab structure.

Current design issues to fix:

- Visual system feels basic and prototype-like.
- Navigation feels like stacked screens plus header shortcuts, not a polished app shell.
- Create Activity uses raw date text input and demo option chips.
- Report and Block can expose technical IDs instead of user-friendly target summaries.
- Several screens use technical MVP copy.
- Empty states often explain backend/demo limitations instead of guiding action.
- There is no true Mine hub yet. `PersonalActivityList` exists, but Mine should become a broader personal center.
- Category, time, and location are not visually strong enough in the feed.
- Safety is present, but the tone should become calmer and more product-native.

Do not treat these issues as reasons to remove features. Treat them as redesign opportunities.

## Chinese Market UX Direction

The design should feel native to Chinese mobile app expectations, without copying another app directly.

Use these patterns:

- bottom tab navigation
- compact information-rich cards
- short labels
- strong status badges
- quick entry points
- searchable selector sheets
- native-feeling pickers
- segmented controls
- pull-to-refresh
- immediate visual feedback after touch
- empty states with clear CTAs
- lightweight trust badges
- action-first notification cards

Use Xiaohongshu / REDnote as inspiration at the pattern level:

- discovery-first experience
- card-based browsing
- search and exploration are important
- social proof and trust signals help people decide
- users should understand the value quickly without long explanations

Do not copy Xiaohongshu literally:

- InCampus is activity-first, not photo/post-first.
- The core action is join/request/create, not like/save/follow.
- The profile should stay minimal and contextual.
- The app must avoid dating-app or influencer-app signals.

External reference signals used for this brief:

- Xiaohongshu as search-first discovery, not only social: https://hashmeta.com/blog/xiaohongshu-little-red-book-explained-why-its-search-first-not-just-social/
- Ant Design navigation principle: users need to know where they are and move efficiently: https://ant.design/docs/spec/navigation/
- Ant Design research navigation principle: shallow, efficient navigation and multiple entry points: https://ant.design/docs/spec/research-navigation/
- Alipay Mini Program navigation bar guidance: top-level mobile screens should stay clear and controlled: https://miniprogram.alipay.com/docs/miniprogram/design/navigation-bar

## Language And Localization Direction

MVP:

- English UI.
- Short, plain labels.
- Avoid long explanatory paragraphs.

Future:

- Simplified Chinese primary.
- English still supported for international students.

Design implications:

- Use short tab labels.
- Leave room for Chinese text expansion.
- Avoid layouts where the whole screen depends on long English helper text.
- Use icons plus short labels for repeated navigation.
- Keep form labels concise.
- Prefer structured selections over long text inputs.

Suggested English labels:

| Current / technical | Suggested UI label |
| --- | --- |
| Activity Feed | Feed |
| Notification List | Alerts |
| Personal Activity List | My Activities |
| Campus Insights | Campus Insights |
| Join Activity | Join |
| Request to Join | Request |
| Publish Activity | Publish |
| Manage Requests | Requests |
| Block Student | Block |
| Report Submission | Report |

## Visual Direction

Recommended mood:

- bright
- clean
- youthful
- social
- campus-life oriented
- trustworthy
- polished
- not childish
- not corporate

Recommended primary palette:

| Role | Color | Usage |
| --- | --- | --- |
| Primary green | `#16B978` | Main action, campus-life energy, positive states |
| Sky blue | `#4DA3FF` | Trust, verification, secondary actions |
| Coral | `#FF6B5F` | Social accent, attention moments |
| Warm yellow | `#FFD166` | Friendly highlight, popular/new badges |
| Background | `#F7F8FA` | App background |
| Card | `#FFFFFF` | Main content surfaces |
| Text primary | `#1F2933` | Main text |
| Text secondary | `#667085` | Metadata, helper text |
| Border | `#E5E7EB` | Dividers and card borders |
| Danger | `#E5484D` | Report, block, destructive states |

Alternative palette directions Claude Design can explore:

1. Fresh Campus
   - Green primary, sky blue trust, coral social accent.
   - Best default direction.

2. Soft REDnote Adaptation
   - Coral/red accent, mint secondary, warm neutral backgrounds.
   - Use carefully so it does not feel like a clone of Xiaohongshu.

3. Trust First Campus
   - Blue/green foundation with yellow/coral micro-accents.
   - Good if safety and verification need to feel stronger.

Recommended choice:

Use Fresh Campus as the main direction. It is neutral, scalable, bright, and less likely to feel like dating, admin, or copycat social media.

## Navigation Model

Replace the current stack-first feeling with a bottom tab app structure.

Main tabs:

1. Feed
2. Create
3. Alerts
4. Mine

Safety features should not be a main tab. They should appear contextually:

- Activity Detail -> Report activity
- Activity Detail -> Block host
- Mine -> Community Rules
- Mine -> Safety
- Report flow -> Community Rules link or safety note
- Onboarding -> short community safety trust note

Recommended tab behavior:

- Feed opens activity discovery.
- Create opens the quick publish form.
- Alerts opens actionable notifications.
- Mine opens the personal hub.
- Activity Detail, Manage Requests, Report, Block, and onboarding screens sit above the tab shell as pushed screens or modal-style flows.

## Core Information Architecture

| Area | Screen | Route / file | Purpose | Connected screens |
| --- | --- | --- | --- | --- |
| Auth | Sign In | `SignIn`, `SignInScreen.tsx` | Let verified students access the app | Sign Up, Campus Selection, Feed |
| Auth | Sign Up | `SignUp`, `SignUpScreen.tsx` | Register with university email and student ID | Verify Email, Sign In |
| Auth | Verify Email | Same current `SignUpScreen.tsx` step | Verify account before sign in | Sign In |
| Onboarding | Campus Selection | `CampusSelection`, `CampusSelectionScreen.tsx` | Select active campus | Profile Setup, Feed |
| Onboarding | Profile Setup | `ProfileSetup`, `ProfileSetupScreen.tsx` | Create minimal trust profile | Consent Settings |
| Onboarding | Consent Settings | `ConsentSettings`, `ConsentSettingsScreen.tsx` | Ask for campus insight consent | Feed |
| Main | Feed | `ActivityFeed`, `ActivityFeedScreen.tsx` | Discover campus activities | Activity Detail, Create |
| Main | Create | `CreateActivity`, `CreateActivityScreen.tsx` | Publish an activity quickly | Feed |
| Main | Alerts | `NotificationList`, `NotificationListScreen.tsx` | Actionable notification center | Activity Detail, Manage Requests, My Activities, Fallback |
| Main | Mine | New hub composed from existing personal/settings screens | Personal center | My Activities, Profile, Campus, Consent, Rules, Safety |
| Activity | Activity Detail | `ActivityDetails`, `ActivityDetailsScreen.tsx` | Inspect and join/request activity | Manage Requests, Report, Block |
| Activity | Manage Requests | `ManageRequests`, `ManageRequestsScreen.tsx` | Host approves/declines pending requests | Activity Detail, Alerts |
| Activity | My Activities | `PersonalActivityList`, `PersonalActivityListScreen.tsx` | Student activity center | Activity Detail, Create, Feed |
| Safety | Community Rules | `CommunityRules`, `CommunityRulesScreen.tsx` | Rules and safe behavior norms | Report, Mine |
| Safety | Report | `ReportSubmission`, `ReportSubmissionScreen.tsx` | Submit a report | Activity Detail, Mine |
| Safety | Block Student | `BlockUser`, `BlockUserScreen.tsx` | Block another student | Activity Detail, Mine |
| System | Notification Fallback | `NotificationFallback`, `NotificationFallbackScreen.tsx` | Explain unavailable notification target | Alerts, Feed |

## Screen Design Briefs

### 1. Sign In

Purpose:

Let verified students access the app.

Current existing actions:

- Enter university email.
- Enter password.
- Tap `Sign In`.
- Navigate to `SignUp`.
- On success, go to Campus Selection if no selected campus exists.
- On success, go to Feed if selected campus exists.

Recommended content:

- Product name / compact logo area.
- Welcome title.
- Short trust cue: `For verified university students`.
- University email input.
- Password input.
- Primary CTA: `Sign in`.
- Secondary CTA: `Create account`.
- Optional support link: `Need help verifying?`.

States:

- Loading button state.
- Inline validation errors.
- Account not verified.
- Invalid credentials.
- Suspended/banned account.

Redesign notes:

- Friendly and light.
- Do not make it feel like a university portal.
- Keep it simple and calm.

### 2. Sign Up

Purpose:

Create a student account through university identity.

Current existing actions:

- Enter university email.
- Enter university student ID.
- Enter password.
- Confirm password.
- Tap `Sign Up`.
- Navigate to Sign In.
- Continue into Verify Email step after successful registration.

Recommended content:

- University email.
- Student ID.
- Password.
- Confirm password.
- Primary CTA: `Create account`.
- Secondary link: `Already have an account? Sign in`.
- Short copy explaining that university email verification keeps the community campus-only.

States:

- Loading.
- Unsupported email domain.
- Existing account conflict.
- Password mismatch.
- Validation error.

Redesign notes:

- Separate required fields visually.
- Keep institutional trust without heavy official branding.

### 3. Verify Email

Purpose:

Verify account with email code/token.

Current existing actions:

- Enter verification code.
- Tap `Verify`.
- Navigate to Sign In after success.
- Navigate to Sign In manually through existing link.

Recommended content:

- Verification code input.
- Primary CTA: `Verify`.
- Secondary action: `Resend code`.
- Link: `Edit email`.
- Small note that the code was sent to the university email.

States:

- Loading.
- Invalid token.
- Account not found.
- Validation error.
- Success -> Sign In.

Redesign notes:

- Make the step feel quick and normal.
- Avoid heavy security language.

### 4. Campus Selection

Purpose:

Choose the student's campus.

Current existing actions:

- Load active campuses from `/campuses`.
- Select a campus card.
- Tap `Confirm Campus`.
- If profile exists, go to Feed.
- If profile does not exist, go to Profile Setup.

Recommended content:

- Title: `Choose your campus`.
- Campus cards.
- Selected state.
- Primary CTA: `Confirm campus`.
- Current first campus: Tongji University / Jiading Campus.
- Short copy: `Your feed and activities will be scoped to this campus.`

Suggested secondary action:

- `Use another account`.

States:

- Loading.
- Empty: no campuses available.
- Error loading campuses.
- Campus unavailable after selection.
- Submitting.

Redesign notes:

- Campus selection should feel like personalization, not control.
- Make scalability to multiple campuses clear.
- Do not make the UI feel like an admin campus system.

### 5. Profile Setup

Purpose:

Create a minimal trust profile for activity contexts.

Current existing actions:

- Enter display name.
- Enter major.
- Optional date of birth.
- Optional gender.
- Optional interests as comma-separated text.
- Optional languages as comma-separated text.
- Optional short bio.
- Tap `Create Profile`.
- Go to Consent Settings after success.

Recommended content:

- Display name.
- Major.
- Interests as tags.
- Languages as tags.
- Short bio.
- Optional gender.
- Optional date of birth only if still needed.
- Primary CTA: `Create profile`.

States:

- Required field errors.
- Profile already exists.
- Invalid input.
- Submitting.
- Success -> Consent Settings.

Redesign notes:

- This is not a public profile builder.
- Use tag chips/selectors instead of comma-separated text.
- Keep profile setup lightweight.
- Separate required and optional fields.

### 6. Consent Settings

Purpose:

Ask whether the student wants to share profile/activity insight data with authorized campus staff.

Current existing actions:

- Toggle consent.
- Tap `Continue`.
- Tap `Skip for now`.
- Save consent via `/accounts/me/consent`.
- Go to Feed.

Recommended content:

- Short title: `Campus Insights`.
- Calm explanation.
- Toggle.
- Primary CTA: `Continue`.
- Secondary CTA: `Skip for now`.

Suggested copy direction:

- `Help improve campus life.`
- `This does not affect your access to InCampus.`
- `You can change this later.`

States:

- Submitting.
- Account not found.
- Save error.
- Success -> Feed.

Redesign notes:

- Be transparent and non-threatening.
- Do not make users feel monitored.
- This screen is a trust moment, not a legal wall.

### 7. Feed

Purpose:

Main campus activity discovery surface.

Current existing actions:

- Load campus activities from `/activities`.
- Pull to refresh.
- Tap an activity card -> Activity Detail.
- Header shortcut to Alerts.
- Header shortcut to Mine / Personal Activity List.
- Header shortcut to Rules.
- Header shortcut to Create.
- Highlight a newly created activity.

Recommended top area:

- Campus context: `Tongji Jiading`.
- Prompt: `What's happening today?`.
- Search entry.
- Category chips.
- Filter entry for time and location.

Activity card priority:

1. Category
2. Time
3. Location

Recommended card content:

- Category pill.
- Activity title.
- Time.
- Location.
- Participant count.
- Participation mode: open / approval.
- Campus-only or verified badge.
- Light social proof if available.
- Status badge when relevant.

Social proof examples:

- `3 joined`
- `Popular today`
- `Host verified`
- `Near Library Plaza`

Recommended actions:

- Tap card -> Activity Detail.
- Pull to refresh.
- Empty state CTA: `Create the first activity`.
- Search/filter by category, time, and location.
- Optional CTA: `Create`.

States:

- Loading skeleton cards.
- Empty state.
- Error with retry.
- Refreshing.
- Just-created highlight.

Redesign notes:

- Use compact, high-signal cards.
- Feed should be fast to scan.
- Avoid image-led masonry unless photo support is actually added later.
- Make it feel discovery-first, not dashboard-first.

### 8. Activity Detail

Purpose:

Help a student decide quickly whether to join.

Current existing actions:

- Load details from `/activities/:activityId`.
- If host/canManageRequests, show `Requests` header action.
- If host/canManageRequests, show `Manage Requests`.
- If guest, show `Join Activity` or `Request to Join`.
- Disable join when full or not open.
- Tap `Report activity`.
- Tap `Block host`.
- After join/request success, navigate back to Feed with refresh.

Recommended content:

- Category pill.
- Activity title.
- Time.
- Location.
- Participant count.
- Description.
- Host minimal info.
- Campus-only/verified cue.
- Participation mode.
- Safety/context links.

Primary sticky CTA:

- `Join`
- or `Request`
- or `Manage requests` for host

Contextual safety actions:

- `Report activity`.
- `Block host`.

States:

- Loading.
- Activity unavailable.
- Joining/requesting.
- Full.
- Joined success.
- Pending request success.
- Error.

Redesign notes:

- Host info should be present but not dominant.
- This should not feel like profile shopping.
- Joining should feel instant and casual.
- Use a sticky bottom action area.
- Make trust/social context visible above the CTA.

### 9. Create Activity

Purpose:

Quickly publish a campus activity.

Current existing actions:

- Enter title.
- Enter description.
- Enter raw ISO date/time.
- Choose category chip from fallback demo options.
- Choose meeting point chip from fallback demo options.
- Enter max participants.
- Choose participation mode.
- If approval-based, enter max pending requests.
- Choose gender preference.
- Tap `Publish Activity`.
- On success, navigate to Feed and highlight created activity.

Recommended design direction:

- Quick publish form.
- Low pressure.
- Mobile-native controls.
- Advanced options collapsed.

Main fields:

- Category searchable selector.
- Title.
- Date/time picker.
- Location searchable selector.
- Max participants.
- Description.

Advanced options:

- Approval required.
- Max pending requests.
- Participant preference.

Gender/participant preference:

- Default: `Open to all`.
- Put inside Advanced options.
- Keep low emphasis.
- Avoid dating-app feeling.

Actions:

- Primary CTA: `Publish`.
- Secondary action: `Cancel`.

States:

- Validation error.
- Submitting.
- Success -> Feed with new activity highlighted.
- Error.

Redesign notes:

- Do not require ISO date input.
- Use picker controls.
- Category and location should be searchable selectors.
- The whole screen should feel faster than posting on a formal platform.

### 10. Manage Requests

Purpose:

Host reviews pending join requests.

Current existing actions:

- Load pending requests from `/activities/:activityId/requests`.
- Approve request.
- Decline request.
- Remove processed request from list.
- Retry after load error.

Recommended content:

- Activity summary.
- Pending request cards.
- Applicant display name.
- Major.
- Short bio.
- Request time.
- Status.

Existing primary actions:

- `Approve`.
- `Decline`.

Suggested actions:

- `View activity`.
- `View minimal profile`, only if supported inside allowed activity context.

States:

- Missing activity context.
- Loading.
- Empty: no pending requests.
- Error with retry.
- Processing per request.
- Success after approve/decline.

Redesign notes:

- Decision actions should be clear and calm.
- Consider an undo snackbar for decline if feasible.
- Keep applicant profile minimal and contextual.

### 11. Alerts

Purpose:

Actionable notification center.

Current existing actions:

- Load notifications from `/notifications`.
- Pull to refresh.
- Infinite load more.
- Tap a notification.
- Resolve notification context through `/notifications/:notificationId/context`.
- Navigate to Activity Detail, Manage Requests, Personal Activity List, or Notification Fallback.

Supported notification types:

- Join event.
- Application outcome.
- Activity cancellation.
- Leave event.
- Activity reminder.
- Unknown/notice fallback.

Recommended card content:

- Type badge.
- Title.
- Message.
- Time.
- Action hint.

Tap behavior:

- Join request -> Manage Requests.
- Outcome -> Activity Detail or My Activities.
- Cancellation -> Activity Detail or fallback.
- Reminder -> Activity Detail.
- Unknown/unavailable -> Notification Fallback.

States:

- Loading.
- Empty.
- Error with retry.
- Loading tapped item.
- Pagination/loading more.

Redesign notes:

- This is an actionable task center, not a passive inbox.
- No unread/read state needed for MVP.
- Cancellation should have a distinct visual treatment.

### 12. Notification Fallback

Purpose:

Explain when a notification target cannot be opened.

Current existing actions:

- Show reason-specific message.
- Tap `Back to Notifications`.
- Tap `Go to Activity Feed`.

Supported reasons:

- Target activity unavailable.
- Block relationship exists.
- Missing activity context.
- Unknown notification target.

Recommended actions:

- Primary CTA: `Back to Alerts`.
- Secondary CTA: `Go to Feed`.

States:

- Static fallback state.

Redesign notes:

- Neutral and safe tone.
- Do not blame users.
- Avoid technical terms like `contextId`.

### 13. Mine

Purpose:

Personal center.

Current reality:

- There is no full Mine screen yet.
- The current header shortcut points to `PersonalActivityList`.
- The redesign should define Mine as a real tab/hub.

Recommended top area:

- Minimal profile card.
- Campus badge.
- Verified student badge.

Central module:

- `My Activities`.

Secondary links:

- Profile.
- Campus.
- Consent settings.
- Community Rules.
- Safety.
- Language placeholder.
- Sign out.

States:

- Loading profile summary.
- Missing profile fallback.
- Error loading personal summary.

Redesign notes:

- My Activities should be central.
- Do not create a public profile browsing experience.
- Keep this area simple but familiar to Chinese app users.

### 14. My Activities

Purpose:

Show activities connected to the student.

Current existing actions:

- Load `/profiles/me/activities`.
- Split into upcoming/history when needed.
- Pull to refresh.
- Tap an activity -> Activity Detail.
- Show notification context if opened from Alerts.

Recommended segments:

- Upcoming.
- Hosting.
- Pending.
- History.

Recommended card content:

- Activity title.
- Category.
- Time.
- Location.
- Personal status badge: Host / Joined / Pending.
- Participant count.

Suggested actions:

- Open Activity Detail.
- `Browse activities`.
- `Create activity`.
- `Withdraw request` if supported.
- `Leave activity` if supported.

States:

- Loading.
- Empty per segment.
- Error with retry.
- Refreshing.

Redesign notes:

- This area should encourage students to participate more.
- Empty states should push discovery and creation.

### 15. Community Rules

Purpose:

Explain expected behavior and safety norms.

Current existing actions:

- Load `/community-rules`.
- Pull to refresh.
- Show fallback static rules if needed.
- Retry after error.

Recommended placement:

- Mine.
- Activity Detail contextual safety.
- Report flow.
- Light onboarding trust note.

Recommended content:

- Short rules sections.
- Friendly tone.
- CTA: `Report a concern`, if appropriate.

States:

- Loading.
- Empty.
- Error with retry.
- Fallback static content.

Redesign notes:

- Do not use technical MVP copy.
- Make rules feel like community norms, not legal warnings.

### 16. Report

Purpose:

Submit a report about an activity or student.

Current existing actions:

- Choose target type: activity or student.
- Enter target activity ID or target student account ID.
- Choose reason.
- Enter optional details.
- Tap `Submit Report`.
- On success, go back.

Recommended content:

- Target summary when opened from context.
- Reason chips.
- Details field.
- Private/safe explanation.

Actions:

- Primary CTA: `Submit report`.
- Secondary CTA: `Cancel`.
- Link to Community Rules if helpful.

Suggested copy:

- `Reports are private and reviewed by campus staff.`
- `The other student will not be notified by this report.`

States:

- Validation error.
- Missing campus.
- Submitting.
- Success.
- Error.

Redesign notes:

- Avoid showing raw IDs when context exists.
- Make the target clear.
- Keep the flow safe and calm.

### 17. Block Student

Purpose:

Block another student.

Current existing actions:

- Enter or receive target account ID.
- Tap `Block Student`.
- On success, go back.

Recommended content:

- Target summary if available.
- Explanation of block effects.
- Primary CTA: `Block student`.
- Secondary CTA: `Cancel`.
- Optional CTA: `Report this student too`.

Suggested copy:

- `You will not see each other's activities or interactions where supported.`

States:

- Missing student.
- Submitting.
- Success.
- Error.

Redesign notes:

- Blocking is sensitive.
- Explain consequences clearly.
- Do not overdramatize.
- Hide raw account ID when the screen is opened from Activity Detail.

## Main User Flows

### Flow 1: New Student Onboarding

1. Sign Up.
2. Verify Email.
3. Sign In.
4. Campus Selection.
5. Profile Setup.
6. Consent Settings.
7. Feed.

### Flow 2: Returning Student

1. Sign In.
2. If campus exists, go to Feed.
3. If campus is missing, go to Campus Selection.

### Flow 3: Discover And Join

1. Feed.
2. Search/filter by category, time, or location.
3. Tap activity card.
4. Activity Detail.
5. Tap Join or Request.
6. Show success feedback.
7. Return to Feed or update Activity Detail state.

### Flow 4: Create Activity

1. Create tab.
2. Fill quick publish fields.
3. Optional advanced settings.
4. Publish.
5. Return to Feed.
6. Highlight newly created activity.

### Flow 5: Host Manages Requests

1. Alerts or Activity Detail.
2. Manage Requests.
3. Review applicant card.
4. Approve or Decline.
5. Remove processed request.
6. Applicant receives outcome notification.

### Flow 6: Personal Activity Center

1. Mine.
2. My Activities.
3. Switch segment: Upcoming, Hosting, Pending, History.
4. Tap activity.
5. Activity Detail.

### Flow 7: Notification Opens Context

1. Alerts.
2. Tap notification.
3. App resolves current context.
4. If accessible, open relevant screen.
5. If unavailable, open Notification Fallback.

### Flow 8: Report Or Block

1. Activity Detail.
2. Tap Report activity or Block host.
3. Complete safety action.
4. Return to previous context.
5. Keep tone calm and private.

## Recommended Missing Links And Improvements

| Starting screen | Missing or recommended link/action | Destination | Reason | Certainty |
| --- | --- | --- | --- | --- |
| Feed empty state | `Create the first activity` | Create | Empty feed should convert into action | Certain |
| Feed header | Real search/filter entry | Feed filters | Category, time, location are core discovery metadata | Certain |
| Feed | Bottom tabs | Feed/Create/Alerts/Mine | Current header shortcuts are not enough for polished mobile IA | Certain |
| Activity Detail | Sticky CTA | Join/Request/Manage | Main decision should stay visible | Certain |
| Activity Detail | `Back to Feed` is optional if native back exists | Feed | Useful if bottom tabs hide stack context | Probable |
| Create Activity | `Cancel` | Previous screen or Feed | Prevent trapped form feeling | Certain |
| Create Activity | Searchable category selector | Selector sheet | Current chips are demo fallback only | Certain |
| Create Activity | Searchable location selector | Selector sheet | Needed for scalable campus locations | Certain |
| Manage Requests | `View activity` | Activity Detail | Host may need context while reviewing | Probable |
| Alerts | Strong action affordance per item | Relevant context | Alerts are actionable tasks | Certain |
| Mine | `My Activities` central card | My Activities | Participation should be central | Certain |
| Mine | `Language` placeholder | Language settings later | Future Chinese primary + English support | Probable |
| Mine | `Community Rules` | Community Rules | Safety should be discoverable | Certain |
| Report | `Cancel` | Previous screen | Sensitive flow needs safe exit | Certain |
| Report | Contextual target summary | Report | Avoid raw technical IDs | Certain |
| Block Student | `Report this student too` | Report | Common safety follow-up | Probable |

## Component System To Design

Claude Design should define reusable components for:

- Bottom tab bar.
- Activity card.
- Activity detail header.
- Category chips.
- Filter chips.
- Status badge.
- Trust badge.
- Campus badge.
- Verified student badge.
- Notification card.
- Request card.
- Profile mini-card.
- Campus selector card.
- Searchable selector sheet.
- Date/time picker field.
- Advanced options accordion.
- Segmented control.
- Empty state.
- Error banner.
- Loading skeleton.
- Primary CTA.
- Secondary text button.
- Safety action button.
- Form field.
- Toggle row.
- Toast/snackbar feedback.

## Interaction Rules

### Join

Joining should feel instant and casual.

Do not use a heavy confirmation dialog unless there is a specific risk or backend error.

After success:

- show quick success feedback
- update activity state
- refresh feed when needed
- if approval-based, show pending state

### Create

Creating should feel fast.

Keep advanced options collapsed by default.

After publish:

- navigate to Feed
- highlight newly created activity
- show a lightweight success toast or banner

### Alerts

Notifications are actionable.

Tap should route to the relevant context. If the context is gone, go to fallback.

### Safety

Report and Block should be visible in context, especially in Activity Detail, but they should not dominate normal participation.

Community Rules should be available but should not interrupt every flow.

### Consent

Campus insight consent should feel voluntary.

Make it clear that refusing consent does not block app use.

## Empty State Guidelines

Use empty states as action opportunities.

Examples:

- Feed empty: `No activities yet today` + `Create the first activity`
- My Activities empty: `No upcoming activities` + `Browse activities` / `Create activity`
- Alerts empty: `No alerts yet`
- Manage Requests empty: `No pending requests`
- Community Rules empty: `Rules are not available right now`

## Loading Guidelines

Use skeletons where the screen is card-based:

- Feed
- Alerts
- My Activities
- Manage Requests

Use a simple spinner for:

- form submit buttons
- short transitions
- small action processing states

## Error Guidelines

Use inline error banners, not only modal alerts.

Every error state should have:

- clear message
- retry action if data loading failed
- safe fallback navigation if needed

Avoid exposing raw backend terms to students.

## Things To Avoid

- Do not design it like a dating app.
- Do not create swipe/match mechanics.
- Do not make host profiles too dominant.
- Do not make public profile browsing a core experience.
- Do not add unsupported direct messaging as a core screen.
- Do not add participation points as a core loop.
- Do not add photo upload as a required core flow.
- Do not make safety feel like surveillance.
- Do not use university-admin dashboard styling.
- Do not rely on long paragraphs.
- Do not make Create Activity a technical form.
- Do not make gender preference prominent.
- Do not copy Xiaohongshu literally.
- Do not design only for Tongji branding if the product should scale.

## Claude Design Deliverables Requested

Ask Claude Design to produce:

1. A high-fidelity mobile design direction.
2. A redesigned app shell with bottom tabs.
3. All listed screens in English.
4. State variants for loading, empty, error, success, and disabled where relevant.
5. Component system with colors, type, spacing, and button styles.
6. Screen-to-screen flow notes.
7. Notes for future Simplified Chinese localization.
8. Design that can replace the current MVP UI without changing product scope.

Recommended frame sizes:

- 390 x 844
- 430 x 932

## Copy-Paste Prompt For Claude Design

```text
Design a high-fidelity mobile UI for InCampus, a friendly youthful campus social discovery app for verified university students in China.

The current UI already exists as a first functional MVP, but it is not visually final. Treat the current UI as a functional prototype only. You can redesign the interface, navigation, layout, visual style, and components freely while preserving the supported product flows and actions.

Product:
InCampus helps verified students at Tongji University Jiading Campus discover and join low-pressure campus activities such as lunch, coffee, study sessions, sports, language exchange, and small casual meetups. It should later scale to other campuses and universities.

Target users:
Mainly Chinese university students, also international students on campus.

Language:
Design the MVP in English. Prepare the layout for Simplified Chinese to become the primary language later. Use short labels and avoid layouts that depend on long English paragraphs.

Market fit:
Optimize for Chinese mobile app habits. Use a polished, bright, compact, discovery-first UI inspired by Xiaohongshu / REDnote patterns, but adapted to campus activities. Do not copy Xiaohongshu directly. This is not a photo/content app. It is activity discovery, joining, creating, alerts, and personal activity tracking.

Brand feeling:
Friendly, youthful, social, clean, safe, local, lightweight, campus-native.

Must not feel like:
- a dating app
- a university admin dashboard
- a surveillance/control tool
- a corporate productivity product
- a public profile browsing social network

Recommended navigation:
Use bottom tabs:
1. Feed
2. Create
3. Alerts
4. Mine

Safety features should be contextual, not a main tab.

Visual direction:
- bright youthful campus look
- neutral and scalable beyond Tongji
- white cards on soft light background
- compact high-signal cards
- short labels
- clear primary actions
- trust/status badges
- mobile-native sheets and pickers
- polished but not cluttered

Recommended palette:
- Primary green #16B978
- Sky blue #4DA3FF
- Coral #FF6B5F
- Warm yellow #FFD166
- Background #F7F8FA
- Card #FFFFFF
- Text #1F2933
- Muted text #667085
- Border #E5E7EB
- Danger #E5484D

Core product rules:
- campus-scoped
- verified university students only
- minimal private/contextual profile, not public social profile
- not dating
- no direct messaging as core MVP
- no public profile browsing as core MVP
- no points/photos/friends as core MVP
- activity discovery is the core
- trust and safety should be visible but not heavy
- report/block actions are contextual
- activity participation should feel casual and low-friction

Design these screens:

1. Sign In
- university email
- password
- Sign in
- Create account
- trust cue: verified university students
- states: loading, invalid credentials, account not verified

2. Sign Up
- university email
- student ID
- password
- confirm password
- Create account
- Already have an account
- states: loading, unsupported email domain, existing account, validation error

3. Verify Email
- verification code
- Verify
- Resend code
- Edit email
- success goes to Sign In

4. Campus Selection
- choose campus
- campus cards
- Confirm campus
- include Tongji University / Jiading Campus as first campus
- explain that feed and activities are campus-scoped
- states: loading, empty, error, submitting

5. Profile Setup
- minimal trust profile, not public social profile
- display name
- major
- interests as tags
- languages as tags
- short bio
- optional gender
- Create profile
- keep it lightweight

6. Consent Settings
- campus insight consent
- switch
- Continue
- Skip for now
- calm privacy copy
- make clear that refusing consent does not block app use

7. Feed
- main discovery screen
- top campus context: Tongji Jiading
- prompt: What's happening today?
- search/filter entry
- category chips
- compact activity cards
- activity card priority: category, time, location
- also show participant count, participation mode, campus-only/verified badge, light social proof
- empty state with Create Activity CTA
- loading skeleton
- error retry

8. Activity Detail
- category
- title
- time
- location
- participant count
- host minimal info but not dominant
- description
- trust/safety cues
- sticky bottom CTA: Join or Request
- host variant: Manage requests
- contextual actions: Report activity, Block host
- states: loading, unavailable, joining, full, success, error

9. Create Activity
- quick publish form
- category searchable selector
- title
- date/time picker
- location searchable selector
- max participants
- description
- advanced options collapsed
- advanced options: approval required, max pending requests, participant preference
- default participant preference: Open to all
- Publish
- Cancel
- success goes to Feed and highlights new activity

10. Manage Requests
- activity summary
- pending request cards
- applicant name, major, short bio, request time
- Approve
- Decline
- suggested View activity link
- states: loading, empty, error, processing

11. Alerts
- actionable notification center
- notification cards with type badge, title, message, time, action hint
- types: join event, application outcome, cancellation, leave event, reminder
- cancellation notifications should look distinct
- tap leads to relevant context
- no unread/read state needed for MVP
- states: loading, empty, error, pagination, item loading

12. Notification Fallback
- content unavailable
- reason-specific message
- Back to Alerts
- Go to Feed
- neutral safe tone

13. Mine
- personal center
- profile mini-card
- campus badge
- verified student badge
- My Activities as the central module
- links: Profile, Campus, Consent, Community Rules, Safety, Language placeholder, Sign out
- do not make it a public profile browsing page

14. My Activities
- segments: Upcoming, Hosting, Pending, History
- activity cards with personal status badge
- CTAs in empty states: Browse activities, Create activity
- tap activity opens Activity Detail

15. Community Rules
- friendly rules content
- short safety sections
- Report a concern CTA if appropriate
- available from Mine and contextual safety flows

16. Report
- target summary
- reason chips
- details field
- Submit report
- Cancel
- private/safe copy
- avoid raw technical IDs when opened from context

17. Block Student
- target summary if available
- explanation of block effects
- Block student
- Cancel
- optional Report this student too
- sensitive but calm tone

Reusable components:
- bottom tab bar
- activity card
- activity detail header
- category chips
- filter chips
- trust badge
- status badge
- campus badge
- verified student badge
- notification card
- request card
- profile mini-card
- searchable selector sheet
- date/time picker field
- advanced options accordion
- segmented control
- empty state
- error banner
- loading skeleton
- primary CTA
- secondary text button
- safety action
- toast/snackbar feedback

Important constraints:
- Do not make it look like a dating app.
- Do not make it look like an official university admin app.
- Do not make safety feel like surveillance.
- Keep UI compact and suitable for Chinese mobile habits.
- Make Feed, Create, Alerts, and Mine feel like a real mobile product.
- Keep safety visible but contextual.
- Make activity participation feel instant and casual.
- Do not invent unsupported messaging, public profile browsing, points, photos, or friend systems.
- Design English MVP screens, but keep spacing and hierarchy ready for Simplified Chinese.
```
