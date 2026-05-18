# InCampus Activity Detail Screen - Claude Design Visual Prototype Prompt

Design a high-fidelity mobile Activity Detail screen for InCampus at **390x844pt**.

This prompt is for **Claude Design**. Create an HTML visual prototype for visual validation, plus a React Native-ready handoff. The HTML is only a visual proof; the final product will be implemented later in the existing Expo / React Native app.

Do not generate production React Native code. Do not invent unsupported backend features.

---

## Product Context

InCampus is a campus social discovery app for verified university students in China.

It helps students at Tongji University, Jiading Campus discover and join low-pressure campus activities such as lunch, coffee, study sessions, sports, language exchange, and casual meetups.

The Activity Detail screen is reached by tapping an activity card from the Feed.

This screen is the decision point: a student looks at it and decides whether to join. It must build trust quickly, show the information that matters, and make joining feel instant and casual.

This screen sits above the bottom tab bar as a pushed / stacked screen. It does **not** show the bottom tab bar.

The app is:

- campus-scoped
- verified-student only
- activity-first
- lightweight and social

It is not:

- a dating app
- a university admin dashboard
- a public social network
- a photo-first social feed

---

## What To Produce

Create:

1. One high-fidelity HTML visual prototype for the primary Activity Detail screen.
2. Separate variants or clearly annotated states for:
   - Guest success, open mode, Join CTA
   - Guest success, approval mode, Request to Join CTA
   - Host/manage view, Manage Requests CTA
   - Full state, disabled Activity Full CTA
   - Loading skeleton
   - Unavailable state
   - Join/request error state
   - Post-join/request success feedback
3. A React Native implementation handoff:
   - component hierarchy
   - spacing values
   - color tokens
   - typography scale
   - card / section measurements
   - sticky CTA measurements
   - state behavior notes
   - backend field mapping

HTML is acceptable for visual proof, but the design must remain directly translatable to React Native.

Do not output a generic web page. Output a mobile app screen prototype.

---

## React Native Compatibility Rules

The existing app is Expo / React Native.

Design as if the HTML elements will later become:

| HTML Prototype Concept | React Native Equivalent |
| --- | --- |
| app screen wrapper | `View` |
| text labels | `Text` |
| tappable elements | `Pressable` / `TouchableOpacity` |
| vertical content | `ScrollView` |
| sticky bottom CTA | bottom-aligned `View` |
| loading / highlight animation | `Animated` |
| styling | `StyleSheet.create` |

Avoid:

- CSS grid layouts that are hard to translate
- complex web-only animations
- hover states
- browser-specific effects
- external icon libraries
- external fonts that are hard to ship
- web-only responsive behavior
- absolute-positioned text that can overlap

Use simple icon-like symbols or minimal CSS shapes only if they can be replaced easily in React Native.

Do not add new dependencies or unsupported product behavior.

---

## Visual System

Use the same Fresh Campus visual system as the Feed.

```ts
const colors = {
  primaryGreen: '#16B978',
  skyBlue: '#4DA3FF',
  coral: '#FF6B5F',
  warmYellow: '#FFD166',
  background: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#1F2933',
  textSecondary: '#667085',
  border: '#E5E7EB',
  danger: '#E5484D',
};
```

Mood:

- bright
- clean
- youthful
- social
- campus-life oriented
- trustworthy
- polished

Joining should feel lightweight, not like signing a contract.

Host info should be present but not dominant. It should help build trust, not feel like a dating profile or profile-shopping surface.

Safety should be visible but calm.

Design continuity with Feed:

- category pill uses the same colored chip style as Feed cards
- time/location formatting is consistent with Feed cards
- participant count uses the same `3/8 joined` pattern
- trust badges use the same lightweight style
- typography, spacing, and border radius match the Feed design system

Avoid:

- purple gradients
- generic AI-looking decorative blobs
- web landing-page styling
- heavy shadows
- long paragraphs
- dating-app signals
- admin-dashboard signals

---

## Backend Contract - Must Match Exactly

### Primary Endpoint

`GET /activities/{activityId}`

Returns the full activity detail object and may return the host's minimal profile info.

If a block relationship exists between the authenticated student and the host, access is rejected and the screen should show the unavailable state.

### Activity Detail Fields

The detail object maps to:

```ts
interface ActivityDetailsViewModel {
  activityId: string;
  title: string;
  description?: string | null;
  scheduledDateTime: string;
  scheduledEndDateTime?: string | null;
  meetingPointLabel: string;
  categoryLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  hostAccountId: string;
  status: 'open' | 'full' | 'completed' | 'cancelled';
  canManageRequests?: boolean;
  hostProfile?: StudentProfileDto;
  genderPreference: 'all' | 'male_only' | 'female_only';
  participationMode: 'open' | 'approval_based';
  maxRequests?: number | null;
  currentRequestCount: number;
}
```

Important:

- Do not show `activityId`.
- Do not show `hostAccountId`.
- Do not show raw UUIDs.
- Do not show `categoryId`, `meetingPointId`, or `campusId`.
- Do not show `maxRequests` directly to guests.
- Do not show `currentRequestCount` directly to guests.
- Do not use `createdAt`; it is not part of the confirmed detail UI contract.

### Activity Field Display Rules

| Field | Display Rule |
| --- | --- |
| `title` | Prominent heading |
| `categoryLabel` | Colored category pill |
| `description` | Show if present; if null, hide section |
| `scheduledDateTime` | Human-readable date/time |
| `scheduledEndDateTime` | If present, append as end time, e.g. `Today, 12:30 - 13:30` |
| `meetingPointLabel` | Location row |
| `currentParticipantCount` + `maxParticipants` | `3/8 joined` and optional progress indicator |
| `participationMode` | Natural language join mode |
| `genderPreference` | Show only if not `all`, low emphasis |
| `status` | Affects CTA and status messaging |
| `canManageRequests` | If true, show Manage Requests CTA |

### Participation Mode Mapping

Use backend values exactly:

- `participationMode: "open"` displays as `Open - join instantly`
- `participationMode: "approval_based"` displays as `Approval needed - host reviews requests`

Never use `"approval"` as a backend value.

### Gender Preference Mapping

Only show gender preference if it is not `all`.

Use neutral, low-emphasis copy:

- `male_only` -> `For male students`
- `female_only` -> `For female students`

Do not make this visually dominant.

---

## Host Profile Fields

The endpoint may return `hostProfile`. This object is optional.

If present, it follows the `StudentProfileDto` shape:

| Field | Type | Display Rule |
| --- | --- | --- |
| `displayName` | String | Host name, shown but not dominant |
| `major` | String | Show as secondary info if present |
| `interests` | String[] | Show 1-2 compact tags if present |
| `languages` | String[] | Do not show on this screen unless needed |
| `shortBio` | String nullable | Show if present, 1-2 lines max |
| `gender` | Enum nullable | Do not show |
| `dateOfBirth` | Date nullable | Do not show |

Host display rules:

- If hostProfile exists, show a compact host byline card.
- If hostProfile is missing, show a neutral fallback such as `Verified student`.
- Do not create a separate `View profile` action.
- Do not make host info a large profile card.
- Do not show dating-like profile details.

---

## Existing Actions And Navigation

| UI Element | Action | Endpoint / Navigation | Condition |
| --- | --- | --- | --- |
| Join | Direct join | `POST /activities/{activityId}/join` | Guest + status open + mode open + not full |
| Request to Join | Submit join request | `POST /activities/{activityId}/join` | Guest + status open + mode approval_based + not full |
| Manage Requests | Navigate to request management | `navigation.navigate('ManageRequests', { activityId })` | `canManageRequests === true` |
| Report activity | Navigate to report form | `navigation.navigate('ReportSubmission', { targetType: 'activity', targetActivityId })` | Guest view only |
| Block host | Navigate to block form | `navigation.navigate('BlockUser', { targetAccountId: hostAccountId })` | Guest view only |
| Back | Go back | native back / `goBack()` | Always |
| Back to Feed | Navigate to Feed | `navigation.navigate('ActivityFeed')` or reset to Feed | Unavailable state |
| Go to Alerts | Navigate to Alerts | `navigation.navigate('NotificationList')` | Optional in unavailable state |

Safety actions are shown in **guest view only**:

- Report activity
- Block host

Do not show `Block host` in host/manage view.

---

## CTA Logic

Use this CTA logic:

```txt
IF canManageRequests === true:
  -> Show "Manage Requests" as primary CTA
  -> Do NOT show Join or Request buttons

ELSE:
  IF status == "full":
    -> Show "Activity Full" as disabled CTA
  ELSE IF status == "open" AND participationMode == "open":
    -> Show "Join" as primary green CTA
  ELSE IF status == "open" AND participationMode == "approval_based":
    -> Show "Request to Join" as primary blue CTA
  ELSE:
    -> Show unavailable / inactive CTA state
```

Important nuance:

- `canManageRequests` is currently true only when the authenticated student is the host **and** the activity uses `approval_based` mode.
- Do not infer extra host actions beyond `Manage Requests`.
- Do not add edit, cancel, delete, duplicate, share, or invite actions.

After successful Join or Request:

- Existing app behavior navigates back to `ActivityFeed` with refresh.
- The design may show brief inline feedback before navigation, but do not design a heavy modal.

---

## What Does Not Exist Or Must Not Be Designed

Do not design:

- separate host profile screen
- `View profile` link
- participant list
- participant avatars
- comments
- reactions
- messaging / chat with host
- activity images / photos
- share action
- save / bookmark action
- similar activities / recommendations
- edit / cancel / delete host actions
- invite actions
- raw ID display

Withdraw/Leave note:

- Backend routes exist for withdrawing a request and leaving an activity.
- They are not currently wired into `ActivityDetailsScreen`.
- Do not design `Withdraw request` or `Leave activity` actions for this redesign pass.

---

## Screen Structure

### 1. Top Navigation Bar

Show:

- native-feeling back arrow
- concise screen title or no title if the activity header provides enough hierarchy
- no bottom tab bar

Host/manage variant:

- If `canManageRequests === true`, an optional `Requests` header action may appear.
- Avoid duplicate manage actions. The sticky CTA should be the clearest manage entry.

### 2. Activity Header Section

Show:

- category pill
- title
- status badge if status is not `open`

Status examples:

- `Full` in coral
- `Cancelled` in muted danger style
- `Completed` in muted neutral style

### 3. Key Info Block

White card on `#F7F8FA` background.

Compact structured rows:

- When: formatted `scheduledDateTime`; include end time if `scheduledEndDateTime` exists
- Where: `meetingPointLabel`
- Spots: `currentParticipantCount/maxParticipants joined`
- How to join:
  - `Open - join instantly`
  - `Approval needed - host reviews requests`
- Gender preference: only if not `all`

Use natural language. Do not show technical labels such as:

- `Gender Pref`
- `Mode`
- `approval_based`

### 4. Description Section

Show description if present.

If `description` is null or empty, hide the section entirely.

Do not show `No description provided`.

### 5. Host Info Section

Compact host trust section.

Possible content:

- small circle avatar placeholder with host initial
- `displayName`
- `major` if present
- 1-2 `interests` tags if present
- `shortBio` if present, max 1-2 lines

This should feel like a byline / trust cue, not a full profile.

### 6. Trust And Safety Section

Guest view only.

Show:

- lightweight trust line: `Campus only - Verified students`
- low-weight contextual safety actions:
  - `Report activity`
  - `Block host`

These must not look like primary actions.

Place above the sticky CTA.

### 7. Sticky Bottom CTA Bar

Fixed at the bottom of the mobile screen, above safe area.

White background with top border or subtle shadow.

Contains:

- small participant summary such as `3 of 8 spots filled`
- primary CTA button

CTA variants:

- Guest + open mode: `Join`, primary green
- Guest + approval mode: `Request to Join`, primary blue
- Guest + full: `Activity Full`, disabled/muted
- Host/manage: `Manage Requests`, primary green
- Completed/cancelled/unavailable: inactive state or back navigation

The sticky CTA must be the clearest action on the screen.

The scrollable content must reserve enough bottom padding so the CTA does not cover content.

---

## Required States

### 1. Loading

Use skeleton layout matching real structure:

- category pill placeholder
- title placeholder, 1-2 lines
- info block with shimmer rows
- description placeholder
- host section placeholder
- sticky CTA placeholder

No full-screen spinner.

Skeleton should be implementable with React Native `Animated`.

### 2. Guest Success - Open Mode

Shows:

- full activity details
- guest safety actions
- sticky green `Join` CTA

### 3. Guest Success - Approval Mode

Shows:

- same detail layout
- join mode row: `Approval needed - host reviews requests`
- sticky blue `Request to Join` CTA

### 4. Host / Manage View

Shows:

- same activity detail layout
- no Report activity
- no Block host
- sticky `Manage Requests` CTA if `canManageRequests === true`

Do not add edit/cancel/delete actions.

### 5. Full State

Shows:

- `Full` status badge
- disabled `Activity Full` CTA
- participant summary showing all spots filled

### 6. Unavailable State

When the activity cannot be loaded, was deleted, is cross-campus inaccessible, or is blocked:

- friendly simple icon / illustration
- title: `This activity is no longer available`
- subtext: `It may have been removed or you no longer have access.`
- primary CTA: `Back to Feed`
- optional secondary CTA: `Go to Alerts`

Do not show raw error codes.

Do not mention block state explicitly.

### 7. Join / Request Success Feedback

After successful `POST /activities/{activityId}/join`:

- brief inline toast/banner
- open mode message: `You're in!`
- approval mode message: `Request sent!`
- then navigate back to Feed with refresh after a short delay

Do not use a heavy modal.

### 8. Error State

Load error:

- inline banner near top: `Couldn't load this activity`
- `Retry` button
- secondary `Back to Feed`

Join/request error:

- inline banner or toast: `Something went wrong. Try again.`
- CTA remains available for retry unless backend state says otherwise

---

## Primary Sample Data

Use this sample for the main Guest Success open-mode variant:

Activity:

- Category: Lunch
- Title: `Lunch at South Cafeteria`
- Date/time: `Today, 12:30`
- End time: not shown unless needed
- Location: `South Cafeteria, Building 4`
- Participants: `3/8 joined`
- Mode: `Open - join instantly`
- Gender preference: `all`, not shown
- Status: `open`
- Description: `Looking for lunch buddies! I usually eat at the south cafeteria around 12:30. Anyone welcome, we can grab a table together.`

Host:

- DisplayName: `Wei Chen`
- Major: `Mechanical Engineering`
- Interests: `lunch`, `language exchange`
- ShortBio: `Exchange student from Shanghai, always happy to meet new people.`

---

## Implementation Handoff Requirements

After the HTML visual prototype, provide a developer handoff with:

### Component Structure

```txt
ActivityDetailsScreen
  DetailTopBar
  ActivityHeader
  DetailInfoBlock
  DescriptionSection
  HostTrustSection
  SafetyActions
  StickyDetailCTA
  DetailLoadingSkeleton
  DetailUnavailableState
  DetailErrorBanner
```

### Backend-To-UI Mapping

```txt
activityId -> navigation param only
title -> main heading
categoryLabel -> category pill
description -> optional description section
scheduledDateTime -> start time label
scheduledEndDateTime -> optional end time label
meetingPointLabel -> location row
currentParticipantCount + maxParticipants -> spots / progress
participationMode -> Open / Approval mode copy
genderPreference -> optional low-emphasis preference row only if not all
status -> status badge and CTA state
hostProfile.displayName -> host name
hostProfile.major -> host secondary info
hostProfile.interests -> compact tags
hostProfile.shortBio -> compact bio
hostAccountId -> BlockUser navigation param only
canManageRequests -> Manage Requests CTA condition
```

### Suggested React Native Layout Values

Provide concrete values for:

- screen padding
- top bar height
- section spacing
- card padding
- card radius
- info row height
- chip height
- badge sizes
- host avatar size
- sticky CTA height
- sticky CTA bottom safe-area padding
- scroll content bottom padding
- title font size
- body font size
- metadata font size

### State-To-Component Mapping

Map:

- loading
- guest success open
- guest success approval
- host/manage
- full
- unavailable
- join/request success
- error

### React Native Notes

Include notes such as:

- use `ScrollView` for detail content
- use a bottom-aligned `View` for sticky CTA
- add bottom padding to scroll content so CTA does not cover content
- use `Animated` for skeleton and subtle success/highlight feedback
- use `Pressable` for CTA and safety actions
- avoid absolute-positioned text that can overlap
- no bottom tab bar on this pushed screen

---

## Final Quality Bar

The final prototype and handoff must:

- fit 390x844pt
- avoid overlapping text
- use exact backend field names
- preserve existing navigation actions
- avoid unsupported features
- keep host info compact
- keep safety actions visible but low-weight
- make the CTA unmistakable
- feel visually continuous with the Feed
- be straightforward to translate into React Native

