# InCampus Create Activity Screen - Claude Design Visual Prototype Prompt

Design a high-fidelity mobile Create Activity screen for InCampus at **390x844pt**.

This prompt is for **Claude Design**. Create an HTML visual prototype for visual validation, plus a React Native-ready handoff. The HTML is only a visual proof; the final product will be implemented later in the existing Expo / React Native app.

Do not generate production React Native code. Do not invent unsupported backend features.

---

## Product Context

InCampus is a campus social discovery app for verified university students in China.

It helps verified students at Tongji University, Jiading Campus create small campus activities: lunch, coffee, study sessions, sports, language exchange, and casual meetups.

The Create Activity screen is the publishing moment. A student wants to share something happening on campus. The form must feel fast and low-pressure, not like a bureaucratic submission.

Creating an activity is one of the two core actions in the app, alongside joining. It must feel effortless.

This screen is reached by tapping the Create tab. It sits above the tab shell as a pushed / stacked screen. It does **not** show the bottom tab bar.

The current MVP has a long form with raw ISO date text input and fallback demo option chips. The redesign should fix the experience visually without requiring new backend behavior.

The app is:

- campus-scoped
- verified-student only
- activity-first
- lightweight and social

It is not:

- a dating app
- a university admin dashboard
- a public social network
- a formal event management tool

---

## What To Produce

Create:

1. One high-fidelity HTML visual prototype for the primary Create Activity screen in its default state.
2. Separate variants or clearly annotated states for:
   - default empty form, advanced collapsed
   - partially filled form
   - advanced options expanded
   - approval mode selected, max pending requests visible
   - validation error state with inline field errors
   - submitting state
   - success toast / publish feedback
   - API error banner
   - category selector bottom sheet open
   - location selector bottom sheet open
   - date/time picker bottom sheet open
3. A React Native implementation handoff:
   - component hierarchy
   - spacing values
   - color tokens
   - typography scale
   - form section measurements
   - input and selector measurements
   - sticky publish bar measurements
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
| text inputs | `TextInput` |
| tappable elements | `Pressable` / `TouchableOpacity` |
| vertical content | `ScrollView` |
| selector list | `ScrollView` / `FlatList` |
| bottom sheet prototype | bottom-aligned `View` or modal-style `View` |
| sticky publish bar | bottom-aligned `View` |
| loading / success animation | `Animated` |
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

Use the same Fresh Campus visual system as Feed and Activity Detail.

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

- fast
- lightweight
- encouraging
- clean
- youthful
- campus-social
- polished

The student is sharing something, not filling a formal document.

Use short labels that leave room for Simplified Chinese later.

Design continuity:

- category pill style matches Feed cards
- segmented controls and chips match the Feed visual system
- form fields feel native and calm
- bottom sticky area uses the same white background and top border pattern as Activity Detail

Avoid:

- purple gradients
- generic AI-looking decorative blobs
- heavy shadows
- long paragraphs
- admin-dashboard styling
- dating-app signals
- technical copy

---

## Backend Contract - Must Match Exactly

### Primary Endpoint

`POST /activities`

On success, the response contains the created activity object, including `activityId`. The client uses that `activityId` to navigate back to Feed and highlight the newly created card.

### Exact Input Fields Sent To Backend

```ts
interface CreateActivityRequest {
  title: string;
  categoryId: string;
  meetingPointId: string;
  scheduledDateTime: string;
  scheduledEndDateTime?: string | null;
  maxParticipants: number;
  participationMode: 'open' | 'approval_based';
  maxRequests?: number | null;
  genderPreference: 'all' | 'male_only' | 'female_only';
  description?: string | null;
}
```

### Field Rules

| Field | Required | UI Rule | Backend Rule |
| --- | --- | --- | --- |
| `title` | Yes | Single-line input | Non-empty, max 100 chars |
| `categoryId` | Yes | Category selector | Must match a valid campus activity category |
| `meetingPointId` | Yes | Location selector | Must match a valid campus location / meeting point |
| `scheduledDateTime` | Yes | Date/time picker | Valid date, must be in the future |
| `scheduledEndDateTime` | No | Optional end time picker | If set, must be after `scheduledDateTime` |
| `maxParticipants` | Yes | Number input or stepper | Positive integer, >= 1 |
| `participationMode` | Yes | Segmented control | `"open"` or `"approval_based"` |
| `maxRequests` | No | Conditional number input | If set, positive integer, >= 1 |
| `genderPreference` | Yes | Low-emphasis chip/segmented control | `"all"`, `"male_only"`, or `"female_only"` |
| `description` | No | Multi-line input | Optional, max 300 chars |

Critical enum mapping:

- UI label `Anyone` maps to `participationMode: "open"`.
- UI label `With my approval` maps to `participationMode: "approval_based"`.
- UI label `Open to all` maps to `genderPreference: "all"`.
- UI label `Male students` maps to `genderPreference: "male_only"`.
- UI label `Female students` maps to `genderPreference: "female_only"`.

Never show raw enum values like:

- `approval_based`
- `male_only`
- `female_only`

---

## Campus Options Source

Categories and locations are validated against campus structured options.

Current mobile reality:

- The mobile Create screen currently uses fallback seeded options in code.
- Dynamic student-facing structured-option loading is not fully wired into the mobile screen yet.
- Admin structured-option endpoints exist, but the Create Activity UI must not imply a new student-facing endpoint requirement.

Design guidance:

- Visually design category and location as selector controls.
- The selector should work with whatever options the app provides: fallback seeded options now, dynamic campus options later.
- Do not show `hardcoded`, `demo`, `seeded`, or technical option-source labels to the user.
- Do not add a new backend requirement just for this design.

Sample categories for the visual prototype:

- Lunch
- Study
- Coffee
- Sports
- Language Exchange
- Social

Sample locations for the visual prototype:

- South Cafeteria
- Jiading Library
- Campus Cafe
- Sports Field A
- Dorm 7 Common Room
- Building 4 Plaza

---

## Existing Actions And Navigation

| UI Element | Action |
| --- | --- |
| Publish | Submit form via `POST /activities` |
| Publish success | Navigate to `ActivityFeed` with `refreshAfterCreate` and `createdActivityId` |
| Cancel | `goBack()` or navigate back to `ActivityFeed` |
| Participation mode toggle | Switch between `"open"` and `"approval_based"` |
| Advanced options accordion | Expand/collapse advanced settings |
| Category selector | Select category option and store its `categoryId` |
| Location selector | Select location option and store its `meetingPointId` |
| Date/time picker | Set `scheduledDateTime` |
| Add end time | Optionally set `scheduledEndDateTime` |

Cancel is a confirmed UX addition for this redesign. It should not require a backend endpoint.

---

## What Does Not Exist Or Must Not Be Designed

Do not design:

- draft saving
- autosave
- activity preview before publishing
- photo upload
- image upload
- activity templates
- recurring schedule
- collaborator / co-host field
- shareable link generation
- map picker
- coordinates or geographic pin placement
- invite people
- paid/ticketed activities
- tags beyond existing category
- public visibility controls
- server search or remote filtering for options

End time note:

- `scheduledEndDateTime` is optional and nullable.
- Do not make end time required.

---

## Screen Structure

### 1. Top Navigation Bar

Show:

- left text button: `Cancel`
- centered or left-aligned title: `Create Activity` or `New Activity`
- no bottom tab bar

Cancel action:

- discard local form state
- navigate back with `goBack()` or back to Feed

Do not put Cancel in the sticky bottom action bar.

### 2. Scrollable Form Body

Divide the form into three clear sections.

Use white section cards on `#F7F8FA` background, with subtle section titles.

The form should feel like three quick steps, not one long bureaucratic document.

---

## Section A - What And Where

Required fields, always visible.

Field order:

### Category Selector

- Label: `Category`
- Placeholder: `What kind of activity?`
- Required
- Tapping opens a bottom sheet selector
- After selection, show selected category as a colored pill
- Inline error on submit if missing: `Please choose a category`

### Title

- Label: `Title`
- Placeholder: `Give your activity a name`
- Required
- Single-line text field
- Max 100 characters
- Show character count only near the limit, not always
- Inline error on submit if empty: `Please give your activity a title`

### Date And Time Picker

- Label: `When`
- Placeholder: `Pick a date and time`
- Required
- Tapping opens a native-feeling date/time bottom sheet
- Do not design raw ISO text input
- Inline error if missing: `Please pick a date and time`
- Inline error if in the past: `Pick a future date and time`
- Optional secondary link below field: `Add end time`

### Optional End Time

Only appears after tapping `Add end time`.

- Label: `End time`
- Uses same date/time picker pattern
- Must be after start time if set
- Inline error: `End time must be after start time`
- Include a small `Remove` action to clear it

### Location Selector

- Label: `Where`
- Placeholder: `Pick a meeting spot`
- Required
- Tapping opens a bottom sheet selector
- Inline error on submit if missing: `Please choose a meeting spot`

### Max Participants

- Label: `Spots available`
- Input: number input or stepper
- Placeholder: `How many people?`
- Required
- Min 1
- Helper text: `Including yourself`
- Inline error: `Add at least 1 spot`

---

## Section B - Description

Optional, always visible.

### Description

- Label: `Description`
- Muted suffix: `optional`
- Multi-line text area
- Placeholder: `Add details, context, or a short message`
- Max 300 characters
- Show character count
- No error if empty

---

## Section C - Advanced Options

Collapsed by default.

Use an accordion / collapsible card.

Toggle row:

- Label: `Advanced options`
- Helper text: `Approval, limits, and participant preference`
- Chevron icon that rotates when expanded

When expanded, show:

### Participation Mode

- Label: `Who can join`
- Segmented control options:
  - `Anyone` -> `participationMode: "open"`; default selected
  - `With my approval` -> `participationMode: "approval_based"`

When `With my approval` is selected, reveal `Max pending requests`.

### Max Pending Requests

Conditional. Only shown when `participationMode === "approval_based"`.

- Label: `Max pending requests`
- Input: number input or stepper
- Placeholder: `No limit`
- Optional
- Helper text: `Limit how many requests can wait at once`
- Maps to `maxRequests`
- If empty, maps to `null` / omitted
- If set, must be >= 1

### Participant Preference

Low emphasis.

- Label: `Participant preference`
- Options:
  - `Open to all` -> `genderPreference: "all"`; default selected
  - `Male students` -> `genderPreference: "male_only"`
  - `Female students` -> `genderPreference: "female_only"`

Important:

- This field must feel subdued and non-prominent.
- Do not call it `Gender filter`.
- Do not make it look like a dating-app filter.
- Most activities should visually stay at `Open to all`.

---

## Sticky Bottom Action Bar

Fixed at the bottom of the mobile screen, above safe area.

White background with top border.

Contains:

- full-width primary CTA: `Publish`

States:

- Default: green enabled button
- Submitting: spinner inside button, disabled, label remains `Publish`
- Disabled only while submitting, or if the design chooses to disable until required fields are present

The scrollable content must reserve enough bottom padding so the sticky bar does not cover form fields.

---

## Selector Bottom Sheet Pattern

Design one reusable bottom sheet pattern for both Category and Location.

Contents:

- drag handle
- title, e.g. `Choose category` or `Choose location`
- search input: `Search...`
- scrollable list of options
- each option shows label and optional simple icon / color indicator
- selected item gets checkmark and highlight
- tapping an option selects it and closes the sheet, or use a `Done` button if clearer
- empty search result: `No options found`

Important:

- This is a client-side selector pattern over available local/loaded options.
- Do not imply server search.

---

## Date/Time Picker Pattern

Design a native-feeling bottom sheet.

Contents:

- drag handle
- title: `Pick date and time`
- date selection
- time selection
- default suggestion: nearest future time
- confirm button: `Set date and time`
- optional clear/reset action only for end time

Do not show raw ISO strings to users.

---

## Validation Behavior

Validation fires on Publish tap, not on blur.

For each required field that fails:

- red border using `#E5484D`
- short error message below the field
- scroll to first error automatically in implementation handoff

Required validation messages:

- Title empty: `Please give your activity a title`
- Category not selected: `Please choose a category`
- Location not selected: `Please choose a meeting spot`
- Date not set: `Please pick a date and time`
- Date in past: `Pick a future date and time`
- End time invalid: `End time must be after start time`
- Max participants empty or zero: `Add at least 1 spot`
- Max pending requests invalid: `Use at least 1 request or leave it blank`

Do not use modal alerts for validation in the redesigned UI.

---

## API Error Behavior

If `POST /activities` fails:

- show inline error banner above the sticky Publish bar or near the top of the form
- text: `Could not publish activity. Try again.`
- Publish button remains available after failure
- do not show raw backend error codes

---

## Success Behavior

After successful `POST /activities`:

- show brief toast or banner: `Activity published!`
- auto-navigate to `ActivityFeed` after a short delay
- Feed refreshes and highlights the newly created activity using `createdActivityId`

Do not use a heavy modal.

---

## Required States

### 1. Default Empty Form

Show:

- no preselected category
- no preselected location
- empty title
- empty date/time field
- empty spots field or a light placeholder
- empty description
- advanced collapsed
- Publish CTA

### 2. Partially Filled Form

Use:

- Category: `Lunch`
- Title: `Lunch at South Cafeteria`
- When: `Today, 12:30`
- Where: placeholder still visible
- Spots: `8`
- Description: `Looking for lunch buddies! Anyone welcome.`
- Advanced: collapsed

### 3. Advanced Expanded

Show:

- `Who can join`
- `Participant preference`
- no max pending requests if `Anyone` is selected

### 4. Approval Mode Selected

Show:

- `With my approval` selected
- `Max pending requests` field revealed

### 5. Validation Error

Show at least two inline errors, for example:

- missing location
- missing date/time

### 6. Submitting

Show:

- Publish button disabled
- spinner inside button
- no layout shift

### 7. Success Toast

Show:

- lightweight toast/banner: `Activity published!`

### 8. API Error

Show:

- inline error banner: `Could not publish activity. Try again.`

### 9. Category Selector Open

Show bottom sheet with sample category options.

### 10. Location Selector Open

Show bottom sheet with sample location options.

### 11. Date/Time Picker Open

Show date/time picker bottom sheet.

---

## Primary Sample Data

Use these values in the partially filled variant:

- Category: `Lunch`
- Title: `Lunch at South Cafeteria`
- When: `Today, 12:30`
- Where: not selected
- Spots: `8`
- Description: `Looking for lunch buddies! Anyone welcome.`
- Participation mode: `Anyone`
- Participant preference: `Open to all`
- Advanced options: collapsed

---

## Implementation Handoff Requirements

After the HTML visual prototype, provide a developer handoff with:

### Component Structure

```txt
CreateActivityScreen
  CreateTopBar
  FormSection
  CategorySelectorField
  TitleField
  DateTimeField
  LocationSelectorField
  NumberStepperField
  DescriptionField
  AdvancedOptionsAccordion
  ParticipationModeControl
  ParticipantPreferenceControl
  OptionSelectorBottomSheet
  DateTimePickerBottomSheet
  FormErrorBanner
  StickyPublishBar
  SuccessToast
```

### Backend-To-UI Mapping

```txt
title -> Title input
categoryId -> selected Category option id
meetingPointId -> selected Location option id
scheduledDateTime -> When picker value, serialized as ISO on submit
scheduledEndDateTime -> optional End time picker value, serialized as ISO or omitted/null
maxParticipants -> Spots available number
participationMode -> Anyone / With my approval
maxRequests -> Max pending requests, only shown for approval mode
genderPreference -> Participant preference
description -> optional Description input
createdActivity.activityId -> Feed highlight navigation param
```

### Suggested React Native Layout Values

Provide concrete values for:

- screen padding
- top bar height
- section spacing
- section card padding
- card radius
- input height
- text area height
- selector field height
- chip height
- segmented control height
- bottom sheet max height
- sticky publish bar height
- safe-area padding
- scroll content bottom padding
- title font size
- label font size
- helper text font size
- error text font size

### State-To-Component Mapping

Map:

- default
- partially filled
- advanced expanded
- approval mode selected
- validation error
- submitting
- success toast
- API error
- category selector open
- location selector open
- date/time picker open

### React Native Notes

Include notes such as:

- use `ScrollView` for form content
- use bottom-aligned `View` for sticky Publish bar
- add bottom padding to scroll content so sticky bar does not cover fields
- use `TextInput` for title, description, and numeric values
- use `Pressable` for selectors, chips, accordion, and CTA
- use local state for bottom sheet visibility
- serialize date values to ISO strings only at submit time
- keep raw IDs internal
- validation should be field-level, not modal alerts
- no bottom tab bar on this pushed screen

---

## Final Quality Bar

The final prototype and handoff must:

- fit 390x844pt
- avoid overlapping text
- use exact backend field names
- preserve existing navigation behavior
- avoid unsupported features
- make Publish unmistakable
- keep advanced options collapsed by default
- make date/time selection feel native
- keep participant preference subdued
- feel visually continuous with Feed and Activity Detail
- be straightforward to translate into React Native

