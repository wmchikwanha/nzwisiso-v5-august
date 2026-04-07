

# CHW Role-Based Access Control Plan

## Problem

Currently, all authenticated users get the `psychiatrist` role (assigned by the `handle_new_user` trigger) and see the full clinical interface -- diagnostics, treatment planning, crisis intervention, screening tools. Community Health Workers (CHWs) should NOT have access to clinical diagnostic modules. They need a restricted view: record narratives, run basic screenings, and refer patients upward.

## What Exists Today

- `app_role` enum: `admin`, `moderator`, `user` -- no `chw` role
- `user_roles` table with RLS and `has_role()` security definer function
- `handle_new_user` trigger assigns `psychiatrist` to all new users
- `userRole` exposed via `AuthContext` but never used to gate UI tabs
- All 7 tabs (Patients, Intake, Assessment, Screening, First Aid, History, Analytics) visible to everyone

## Solution: Add `chw` Role with Graduated UI Access

### Role Permissions Matrix

| Module | `psychiatrist` | `admin` | `chw` |
|--------|:-:|:-:|:-:|
| Patients (register, view) | Yes | Yes | Yes |
| Intake Queue (review) | Yes | Yes | View only |
| Recording & Transcription | Yes | Yes | Yes |
| Process Narrative (MSE) | Yes | Yes | No |
| Screening (PHQ-9 only) | Yes | Yes | Yes |
| Screening (full battery) | Yes | Yes | No |
| Clinical Abstract / MSE | Yes | Yes | No |
| Diagnostic Formulation | Yes | Yes | No |
| Treatment Plan | Yes | Yes | No |
| Crisis First Aid | Yes | Yes | No |
| Referral (upward) | Yes | Yes | Yes (primary action) |
| Assessment History | Yes | Yes | View own recordings |
| Analytics | Yes | Yes | No |
| Ask AI | Yes | Yes | No |

### CHW-Specific Features

- **Upward Referral**: After recording a narrative, CHW sees a "Refer to Clinician" button instead of "Process Narrative". This creates a referral record linking the transcript + patient to a named or tentative clinician.
- **Safety Net**: If PHQ-9 Item 9 >= 1, CHW sees the same crisis safety message as the patient portal (phone numbers, immediate action steps) but cannot initiate clinical crisis protocols.

---

## Implementation Steps

### 1. Database Migration

- Add `chw` to `app_role` enum: `ALTER TYPE public.app_role ADD VALUE 'chw'`
- No new tables needed -- CHW referrals use the existing `referrals` table with `context = 'chw_upward_referral'`

### 2. Admin Role Assignment

- Remove auto-assignment of `psychiatrist` from `handle_new_user` trigger -- instead assign `user` as default
- Add a clinician-facing "Team Management" section (admin only) where admins can invite CHWs and assign roles
- For now (Phase 1): admin manually updates role via the existing `user_roles` table; a simple admin UI can be added later

### 3. AuthContext Enhancement

- `userRole` is already fetched -- no changes needed to the context
- Create a helper: `src/lib/permissions.ts` with:
  - `canAccessDiagnostics(role)` 
  - `canProcessNarrative(role)`
  - `canAccessFullScreening(role)`
  - `canAccessAnalytics(role)`
  - `canAccessCrisisProtocols(role)`
  - `canReferUpward(role)` (all roles, but it's the CHW's primary action)

### 4. UI Gating in Index.tsx

- Wrap tab visibility with permission checks:
  - **Assessment tab**: visible to all, but "Process Narrative" button hidden for CHW; replaced with "Refer to Clinician"
  - **Screening tab**: CHW sees PHQ-9 only; other instruments hidden
  - **First Aid tab**: hidden for CHW
  - **Analytics tab**: hidden for CHW
  - **Diagnostic Formulation, Treatment Plan, Ask AI**: hidden for CHW within assessment view
- CHW header shows role badge: "Community Health Worker"

### 5. CHW Referral Workflow (New Component)

- `src/components/CHWReferralForm.tsx`:
  - Appears after CHW records and transcribes a narrative
  - Fields: select clinician (from profiles), urgency level, brief note
  - Saves to `referrals` table with `context = 'chw_upward_referral'` and `referral_type = 'clinical_review'`
  - Links the transcript text and patient_id
  - Clinician sees these in their Intake Queue with a "CHW Referral" badge

### 6. Intake Queue Enhancement

- Add a filter/section for CHW referrals alongside patient self-intake sessions
- CHW referrals show: patient identifier, transcript excerpt, referring CHW name, urgency, timestamp

---

## Security Considerations

- RLS policies already gate data by `user_id` -- CHWs can only see their own patients and recordings
- No new RLS changes needed; the gating is at the UI + permission helper level
- CHWs cannot call `process-narrative`, `suggest-diagnosis`, or `generate-treatment-plan` edge functions -- the UI simply doesn't expose these actions
- For defense-in-depth: edge functions can optionally check caller role via JWT claims (Phase 2)

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Add `chw` to `app_role` enum |
| `src/lib/permissions.ts` | New -- role permission helpers |
| `src/pages/Index.tsx` | Gate tabs and components by role |
| `src/components/CHWReferralForm.tsx` | New -- upward referral form |
| `src/components/IntakeQueue.tsx` | Add CHW referral section |
| `src/contexts/AuthContext.tsx` | No changes needed |

## Phase 2 (Future)

- Admin UI for managing team members and assigning roles
- Edge function role verification (check JWT role claim server-side)
- CHW-specific simplified UI theme with larger controls
- Offline recording with sync-on-reconnect for CHW field use

