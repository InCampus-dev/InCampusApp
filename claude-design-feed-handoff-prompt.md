# InCampus Feed Screen — Claude Design Visual Prototype Prompt

You already generated an HTML visual mockup for the InCampus Feed screen. Do not restart from scratch.

Now create a corrected **HTML visual prototype** for visual validation, but design it so it can later be translated cleanly into the existing Expo / React Native app.

The HTML is only for visual proof. The final product will be implemented in React Native, so avoid web-only ideas that cannot map to React Native primitives.

---

## What To Produce

Create a revised high-fidelity mobile Feed design at **390×844pt**.

Deliver:

1. One HTML visual prototype showing the Feed Success state.
2. Additional visual variants or clearly separated sections for:
   - Loading skeleton
   - Empty state
   - Error state
   - Post-create highlight
3. A React Native implementation handoff below the visual:
   - component hierarchy
   - spacing values
   - color tokens
   - typography scale
   - card layout measurements
   - bottom tab layout measurements
   - state behavior notes
   - backend field mapping

HTML is acceptable for visual proof, but the design must remain directly translatable to React Native.

Do not output a generic web page. Output a mobile app screen prototype.

---

## React Native Compatibility Rules

The final implementation will use an Expo / React Native app.

Design as if the HTML elements will later become:

| HTML Prototype Concept | React Native Equivalent |
| --- | --- |
| app screen wrapper | `View` |
| text labels | `Text` |
| tappable elements | `Pressable` / `TouchableOpacity` |
| feed list | `FlatList` |
| horizontal chips | horizontal `ScrollView` |
| pull refresh | `RefreshControl` |
| skeleton / highlight animation | `Animated` |
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

Do not add new product dependencies or unsupported UI behavior.

---

## Issues To Fix From Previous Mockup

The previous HTML mockup had a good general mood, but fix these problems:

- Header text overlapped with the campus label.
- Feed must be the active bottom tab in every Feed variant.
- Long category chips such as `Language Exchange` must fit cleanly in a horizontal scroll row.
- Bottom tab must not cover card content.
- Empty state copy must be the approved copy, not casual joke copy.
- Card content should feel compact but not cramped.
- Layout must work at 390×844pt without clipped or overlapping text.

Keep the general direction:

- bright
- youthful
- campus-social
- compact
- scannable
- native to Chinese mobile UX expectations

---

## Product Context

InCampus is a campus social discovery app for verified university students in China.

The Feed is the main home screen. It helps students at Tongji University, Jiading Campus discover low-pressure campus activities such as lunch, coffee, study groups, sports, language exchange, and casual meetups.

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

## Backend Contract — Must Match Exactly

The Feed uses:

`GET /activities`

Each activity item available to the Feed has these fields:

```ts
interface ActivityFeedItem {
  activityId: string;
  title: string;
  categoryLabel: string;
  scheduledDateTime: string;
  meetingPointLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  participationMode: 'open' | 'approval_based';
  status?: 'open' | 'full' | 'completed' | 'cancelled';
}
```

Critical rules:

- Use `currentParticipantCount`, not `currentParticipants`.
- `participationMode: "open"` displays as `Open`.
- `participationMode: "approval_based"` displays as `Approval`.
- Never use `"approval"` as a backend value.
- Do not show raw IDs.
- Do not show `activityId`.
- Do not show `hostAccountId`.
- Do not show `campusId`.
- Do not show `genderPreference`.
- Do not show activity description on feed cards.
- Do not add photos or image placeholders to activity cards.
- Do not add like/save/bookmark.
- Do not add messaging.
- Do not add friend/social graph indicators.
- Do not add unread badges.
- Do not add trending/popular ranking labels.
- Do not add change-campus UI.

The current backend feed normally returns future same-campus activities with `status = "open"`.

Status badge guidance:

- In the normal Success state, show open activities.
- If a non-open status is ever returned defensively, show a small status badge.
- Do not include cancelled/completed cards in the default populated Feed design.

---

## Navigation Actions

The design must map to existing navigation:

| UI Element | Action |
| --- | --- |
| Activity card tap | `navigation.navigate('ActivityDetails', { activityId })` |
| Create tab / Empty CTA | `navigation.navigate('CreateActivity')` |
| Alerts tab | `navigation.navigate('NotificationList')` |
| Mine tab | `navigation.navigate('PersonalActivityList')` |
| Retry | `fetchActivities('refresh')` |
| Pull-to-refresh | `fetchActivities('refresh')` |

Do not include Rules as a bottom tab.

Rules belongs under Mine / Safety later.

---

## Visual System

Use the Fresh Campus palette:

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

Design tone:

- bright
- clean
- youthful
- social
- campus-life oriented
- trustworthy
- polished

Avoid:

- purple gradients
- generic AI-looking decorative blobs
- web landing-page styling
- heavy shadows
- long paragraphs
- dating-app signals
- admin-dashboard signals

---

## Feed Screen Structure

### 1. Top Area

Show:

- campus context: `Tongji Jiading`
- lightweight trust cue: `Campus only · Verified`
- main prompt: `What's happening today?`
- small supporting line if needed, such as `5 open activities nearby`

The top area must not overlap.

Use a clear vertical hierarchy:

1. campus/trust row
2. prompt
3. optional supporting metadata
4. category chips

### 2. Category Chips

Horizontal scroll row.

Required chips:

- `All`
- generated category labels from loaded activities

These are client-side filters over already loaded data.

They must not imply a backend search/filter feature.

Long labels like `Language Exchange` must fit without breaking the layout.

### 3. Activity Cards

Each card must be compact and scannable.

Required card content, in priority order:

1. category pill from `categoryLabel`
2. time from `scheduledDateTime`
3. location from `meetingPointLabel`
4. title
5. participant count: `{currentParticipantCount}/{maxParticipants} joined`
6. participation badge:
   - `Open`
   - `Approval`
7. optional non-open status badge only if returned by API

Do not show description.

Do not show raw technical fields.

The full card is tappable.

### 4. Bottom Tab Bar

Use a native-feeling bottom tab bar.

Tabs:

- Feed, active
- Create, visually prominent
- Alerts
- Mine

The bottom tab should reserve enough safe-area/padding so it does not cover the last card.

---

## Required States

### Success

Show 4-5 realistic activity cards.

Sample data:

1. Lunch at South Cafeteria
   - categoryLabel: Lunch
   - time: Today 12:30
   - location: South Cafeteria
   - currentParticipantCount: 3
   - maxParticipants: 8
   - participationMode: open
   - status: open

2. Study Group: Linear Algebra
   - categoryLabel: Study
   - time: Today 15:00
   - location: Library B2
   - currentParticipantCount: 2
   - maxParticipants: 5
   - participationMode: approval_based
   - status: open

3. Coffee & Chat (English Practice)
   - categoryLabel: Language Exchange
   - time: Tomorrow 10:00
   - location: Campus Café
   - currentParticipantCount: 1
   - maxParticipants: 4
   - participationMode: open
   - status: open

4. Basketball 3v3
   - categoryLabel: Sports
   - time: May 22, 17:00
   - location: Sports Field A
   - currentParticipantCount: 4
   - maxParticipants: 6
   - participationMode: open
   - status: open

5. Movie Night Planning
   - categoryLabel: Social
   - time: May 23, 19:30
   - location: Dorm 7 Common Room
   - currentParticipantCount: 0
   - maxParticipants: 8
   - participationMode: open
   - status: open

### Loading

Use 3-4 skeleton cards that match the real card layout.

No full-screen spinner.

The skeleton should be implementable with React Native `Animated`.

### Empty

Use:

- friendly simple icon/illustration
- title: `No activities yet today`
- subtext: `Be the first to create something on campus`
- primary CTA: `Create Activity`

CTA maps to `CreateActivity`.

Do not use unapproved playful copy.

### Error

Use an inline banner near the top of the content area.

Text:

`Something went wrong loading activities`

CTA:

`Retry`

Retry maps to `fetchActivities('refresh')`.

Do not use modal styling.

### Refreshing

Use native pull-to-refresh behavior.

The existing list should remain visible while refreshing.

### Post-Create Highlight

When `createdActivityId` matches a card:

- show subtle highlight
- use soft green/yellow border, glow, or pulse
- do not introduce a new action

---

## Implementation Handoff Requirements

After the HTML visual prototype, provide a developer handoff with:

1. Component structure:

```txt
ActivityFeedScreen
  FeedTopArea
  CategoryChipRow
  ActivityCard
  FeedEmptyState
  FeedErrorBanner
  FeedSkeletonList
  FeedBottomTabBar
```

2. Suggested React Native layout values:

- screen padding
- card padding
- card radius
- chip height
- bottom tab height
- list bottom padding
- badge sizes
- title sizes
- metadata sizes

3. State-to-component mapping:

- loading
- empty
- error
- success
- refreshing
- post-create highlight

4. Backend-to-UI mapping:

```txt
categoryLabel -> category pill
scheduledDateTime -> smart time label
meetingPointLabel -> location label
title -> card title
currentParticipantCount + maxParticipants -> joined count
participationMode -> Open / Approval badge
status -> optional status badge
activityId -> navigation param only
```

5. Notes for React Native implementation:

- use `FlatList`
- use `RefreshControl`
- use horizontal `ScrollView` for chips
- add enough `contentContainerStyle.paddingBottom` for the bottom tab
- avoid overlapping header text
- avoid web-only styling assumptions

---

## Final Quality Bar

The final HTML prototype and handoff must:

- fit 390×844pt
- avoid overlapping text
- keep Feed active in bottom tab
- avoid unsupported backend features
- use exact backend field names
- preserve existing navigation actions
- be visually polished
- be straightforward to translate into React Native

