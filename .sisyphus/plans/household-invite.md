# Household Invite Link Feature

## Context

### Original Request
Allow the mortgage owner to generate a shareable invite link so another user (spouse/partner) can access the same mortgage data. All members get equal access. Users who have access to multiple mortgages see a switcher.

### Interview Summary
**Key Discussions**:
- Invite mechanism: Shareable link, not email-based
- No roles — all members have identical read/write access
- Multi-mortgage: If invited user already has their own mortgage, show a switcher to toggle between them
- Owner can revoke/remove invited members
- Invite links expire after 7 days
- Only one active invite per mortgage at a time (creating new invalidates old)

### Metis Review
**Identified Gaps** (addressed):
- Active mortgage selection: use cookie-based persistence, default to user's own mortgage
- `getMortgage()` needs to accept optional mortgageId and check membership
- 11 ownership check sites across 5 files must be updated
- Invite accept page must handle unauthenticated users (redirect to sign-in, then back)
- Members can leave voluntarily (self-remove)
- Owner cannot remove themselves
- No activity attribution (userId on events) in this iteration — out of scope
- Unique constraint on `(userId, mortgageId)` in mortgageMembers to prevent duplicates

---

## Work Objectives

### Core Objective
Add household sharing via invite links: generate link → share → accept → full access to the same mortgage data, with a switcher for users with multiple mortgages.

### Concrete Deliverables
- 2 new DB tables: `mortgageMembers`, `mortgageInvites`
- Updated auth layer: all ownership checks accept members
- Invite flow: generate, accept, revoke
- Mortgage switcher in sidebar
- Members management UI
- `/invite/[token]` accept page

### Definition of Done
- [x] Owner can generate invite link and copy it
- [x] Another signed-in user can accept the link and see the shared mortgage
- [x] Switcher appears when user has access to 2+ mortgages
- [x] Owner can remove a member
- [x] Member can leave voluntarily
- [x] Expired links show clear error
- [x] All existing CRUD works for both owner and members
- [x] `npm run build` passes

### Must Have
- Invite link generation with 7-day expiry
- Invite acceptance flow (with sign-in redirect for unauthenticated users)
- All ownership checks updated for membership
- Mortgage switcher
- Members list with revoke capability

### Must NOT Have (Guardrails)
- NO role-based permissions — all members are equal (except invite/revoke which is owner-only)
- NO refactoring of duplicated `verifyMortgageOwnership`/`verifyOfferOwnership` into shared module — update each copy in-place
- NO renaming of `mortgages.userId` column
- NO email/notification sending
- NO general-purpose settings page — focused members UI only
- NO `userId` field on `activityEvents` (attribution is a separate feature)
- NO `drizzle-kit push` — use `generate` + `migrate` only
- NO social sharing integrations (WhatsApp, QR code, etc.) — copy-to-clipboard only
- NO `role` column on `mortgageMembers` — YAGNI

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: none

Each TODO includes manual verification procedures.

---

## Task Flow

```
Task 1 (schema + migration)
  → Task 2 (shared auth helper)
    → Task 3 (update ownership checks in all action files)
      → Task 4 (getMortgage + getUserMortgages + active mortgage cookie)
        → Task 5 (invite server actions)
          → Task 6 (invite accept page + proxy update)
            → Task 7 (members management UI)
              → Task 8 (mortgage switcher in sidebar)
                → Task 9 (build verification + commit)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | — | Foundation: tables must exist first |
| 2 | 1 | Needs `mortgageMembers` table for queries |
| 3 | 2 | Uses the shared auth helper |
| 4 | 2 | Uses the shared auth helper for mortgage access |
| 5 | 1 | Needs `mortgageInvites` table |
| 6 | 5 | Needs invite server actions |
| 7 | 4, 5 | Needs getUserMortgages + invite actions |
| 8 | 4 | Needs getUserMortgages + active mortgage |
| 9 | all | Final verification |

Note: Tasks 5 and 3-4 can be parallelized (both only depend on 1/2).

---

## TODOs

- [x] 1. Add `mortgageMembers` and `mortgageInvites` tables to schema + run migration

  **What to do**:
  - Add `mortgageMembers` table to `src/db/schema.ts`:
    - `id` uuid PK defaultRandom
    - `mortgageId` uuid FK → mortgages.id (cascade delete)
    - `userId` text notNull (Clerk user ID)
    - `joinedAt` timestamp with timezone notNull defaultNow
    - Add unique constraint on `(userId, mortgageId)` to prevent duplicate memberships
  - Add `mortgageInvites` table to `src/db/schema.ts`:
    - `id` uuid PK defaultRandom
    - `mortgageId` uuid FK → mortgages.id (cascade delete)
    - `token` text notNull unique (for the shareable link)
    - `createdByUserId` text notNull
    - `expiresAt` timestamp with timezone notNull
    - `usedByUserId` text nullable (set when accepted)
    - `usedAt` timestamp with timezone nullable (set when accepted)
    - `createdAt` timestamp with timezone notNull defaultNow
  - Add Drizzle relations for both tables:
    - `mortgageMembers` → `one(mortgages)` on mortgageId
    - `mortgageInvites` → `one(mortgages)` on mortgageId
    - Add `members: many(mortgageMembers)` and `invites: many(mortgageInvites)` to existing `mortgagesRelations`
  - Add type exports: `MortgageMember`, `NewMortgageMember`, `MortgageInvite`, `NewMortgageInvite`
  - Run migration: `source .env.local; export NEON_DATABASE_URL; npx drizzle-kit generate && npx drizzle-kit migrate`

  **Must NOT do**:
  - Do NOT add a `role` column to `mortgageMembers`
  - Do NOT rename or modify existing tables/columns

  **Parallelizable**: NO (foundation for everything)

  **References**:
  - `src/db/schema.ts:35-44` — Table definition pattern (uuid PK, timestamps, notNull)
  - `src/db/schema.ts:46-56` — FK reference pattern with cascade delete
  - `src/db/schema.ts:93-136` — Relations pattern to follow
  - `src/db/schema.ts:138-147` — Type export pattern
  - `drizzle.config.ts` — Uses `NEON_DATABASE_URL` env var

  **Acceptance Criteria**:
  - [x] `npx drizzle-kit generate` creates a new SQL migration file in `drizzle/`
  - [x] `npx drizzle-kit migrate` applies successfully (no errors)
  - [x] Verify tables exist: `source .env.local; export NEON_DATABASE_URL; node -e "const{neon}=require('@neondatabase/serverless');const sql=neon(process.env.NEON_DATABASE_URL);sql('SELECT table_name FROM information_schema.tables WHERE table_schema=$$public$$').then(r=>console.log(r.map(t=>t.table_name)))"` → should include `mortgage_members` and `mortgage_invites`
  - [x] `npm run build` passes

  **Commit**: YES
  - Message: `feat(db): add mortgage_members and mortgage_invites tables`
  - Files: `src/db/schema.ts`, `drizzle/*.sql`
  - Pre-commit: `npm run build`

---

- [x] 2. Create shared `verifyMortgageAccess` helper in `src/lib/auth.ts`

  **What to do**:
  - Add to `src/lib/auth.ts`:
    - `verifyMortgageAccess(mortgageId: string, userId: string)` — checks if user is owner (`mortgages.userId === userId`) OR a member (`mortgageMembers` row exists with matching userId + mortgageId). Throws "Unauthorized" if neither.
    - `verifyOfferAccess(offerId: string, userId: string)` — fetches offer with mortgage, then calls `verifyMortgageAccess(offer.mortgageId, userId)`. Returns the offer. Throws if not found or unauthorized.
  - Import `db`, `mortgages`, `mortgageMembers`, `bankOffers` from schema
  - Use `or(eq(mortgages.userId, userId), exists(...))` pattern or two-step check (check owner first, then check member)

  **Must NOT do**:
  - Do NOT remove the existing `requireUserId()` function
  - Do NOT add role checks — all access is equal

  **Parallelizable**: NO (depends on Task 1)

  **References**:
  - `src/lib/auth.ts:1-10` — Existing auth helper file (currently only has `requireUserId`)
  - `src/app/actions/offers.ts:11-31` — Current `verifyMortgageOwnership` and `verifyOfferOwnership` pattern to replicate
  - `src/db/schema.ts` — Table imports needed: `mortgages`, `mortgageMembers`, `bankOffers`

  **Acceptance Criteria**:
  - [x] `src/lib/auth.ts` exports `verifyMortgageAccess` and `verifyOfferAccess`
  - [x] Both functions handle owner case AND member case
  - [x] Both throw "Unauthorized" error when user has no access
  - [x] `npm run build` passes

  **Commit**: YES
  - Message: `feat(auth): add membership-aware access verification helpers`
  - Files: `src/lib/auth.ts`
  - Pre-commit: `npm run build`

---

- [x] 3. Update all ownership checks in action files to support members

  **What to do**:
  - Update **all 5 action files** to use the new `verifyMortgageAccess`/`verifyOfferAccess` from `src/lib/auth.ts`:
  
  **File: `src/app/actions/mortgage.ts`**:
  - `getMortgage()` — will be handled in Task 4 (skip here)
  - `updateMortgage()` line 67 — replace `and(eq(mortgages.id, id), eq(mortgages.userId, userId))` with: first call `verifyMortgageAccess(id, userId)`, then update `where: eq(mortgages.id, id)` only
  
  **File: `src/app/actions/offers.ts`**:
  - Replace local `verifyMortgageOwnership` (lines 11-20) with import of `verifyMortgageAccess` from `@/lib/auth`
  - Replace local `verifyOfferOwnership` (lines 22-31) with import of `verifyOfferAccess` from `@/lib/auth`
  - `getOfferById()` line 60 — replace `offer.mortgage.userId !== userId` with call to `verifyMortgageAccess(offer.mortgageId, userId)`, wrap in try/catch, return null on unauthorized
  - Update all callsites: `getOffers`, `createOffer`, `updateOffer`, `deleteOffer`

  **File: `src/app/actions/activity.ts`**:
  - Replace local `verifyMortgageOwnership` (lines 9-18) with import of `verifyMortgageAccess`
  - Replace local `verifyOfferOwnership` (lines 20-29) with import of `verifyOfferAccess`
  - Update all callsites: `getActivityEvents`, `addMessage`, `deleteMessage`

  **File: `src/app/actions/contacts.ts`**:
  - Replace local `verifyMortgageOwnership` (lines 9-17) with import of `verifyMortgageAccess`
  - Replace local `verifyOfferOwnership` (lines 19-27) with import of `verifyOfferAccess`
  - `verifyContactOwnership` (lines 29-46) — update the `mortgage.userId !== userId` checks to use `verifyMortgageAccess` calls instead
  - Update all callsites

  **File: `src/app/actions/tracks.ts`**:
  - Replace local `verifyOfferOwnership` (lines 9-18) with import of `verifyOfferAccess`
  - Update all callsites: `createTrack`, `updateTrack`, `deleteTrack`

  **Must NOT do**:
  - Do NOT consolidate the verification into one shared function call site (each file still imports and calls directly)
  - Do NOT change any other logic in these files
  - Do NOT change function signatures

  **Parallelizable**: NO (depends on Task 2)

  **References**:
  - `src/app/actions/offers.ts:11-31` — Local verify functions to replace
  - `src/app/actions/activity.ts:9-29` — Local verify functions to replace
  - `src/app/actions/contacts.ts:9-46` — Local verify functions to replace (includes contactOwnership)
  - `src/app/actions/tracks.ts:9-18` — Local verify function to replace
  - `src/app/actions/mortgage.ts:58-67` — updateMortgage WHERE clause to update
  - `src/lib/auth.ts` — New shared helpers from Task 2

  **Acceptance Criteria**:
  - [x] No local `verifyMortgageOwnership` or `verifyOfferOwnership` functions remain in any action file
  - [x] All action files import from `@/lib/auth`
  - [x] `npm run build` passes
  - [x] Manually test: log in, verify dashboard loads, create/edit/delete an offer, add a track, add a contact, add an activity message — all should work as before for the owner

  **Commit**: YES
  - Message: `refactor(auth): update all ownership checks to support household members`
  - Files: `src/app/actions/mortgage.ts`, `src/app/actions/offers.ts`, `src/app/actions/activity.ts`, `src/app/actions/contacts.ts`, `src/app/actions/tracks.ts`
  - Pre-commit: `npm run build`

---

- [x] 4. Update `getMortgage` + add `getUserMortgages` + active mortgage cookie

  **What to do**:

  **A) `getUserMortgages(userId)` function** — new function in `src/app/actions/mortgage.ts`:
  - Returns array of all mortgages the user can access: owned (`eq(mortgages.userId, userId)`) + member of (join with `mortgageMembers`)
  - Each result includes: mortgage data + `role: "owner" | "member"` indicator (for UI display only, not permissions)
  - Include `bankOffers` count for each mortgage (for switcher label)

  **B) Update `getMortgage()`** — modify existing in `src/app/actions/mortgage.ts`:
  - Accept optional `mortgageId?: string` parameter
  - If `mortgageId` provided: fetch that mortgage AND verify access via `verifyMortgageAccess(mortgageId, userId)`
  - If no `mortgageId`: check cookie `active-mortgage-id` first. If cookie value exists, try to fetch that mortgage with access check. If fails or no cookie, fall back to `eq(mortgages.userId, userId)` (own mortgage). If no own mortgage, try first mortgage from `getUserMortgages`.
  - Return mortgage or null

  **C) Active mortgage cookie helpers** — new file `src/lib/active-mortgage.ts`:
  - `getActiveMortgageId()`: reads `active-mortgage-id` from `cookies()` (Next.js `next/headers`)
  - `setActiveMortgageId(id: string)`: server action that sets the cookie
  - Cookie: `active-mortgage-id`, httpOnly, sameSite: lax, path: /, max-age: 1 year

  **D) Update `getDashboardData()`** — in `src/app/actions/mortgage.ts`:
  - Pass through the active mortgage ID from cookie to `getMortgage()`

  **Must NOT do**:
  - Do NOT add mortgage ID to URL params (cookie-based selection)
  - Do NOT change the return type of `getMortgage()` — still returns single mortgage or null
  - Do NOT modify `createMortgage` — it still uses current userId as owner

  **Parallelizable**: NO (depends on Task 2)

  **References**:
  - `src/app/actions/mortgage.ts:9-27` — Current `getMortgage()` to modify
  - `src/app/actions/mortgage.ts:72-108` — Current `getDashboardData()` to update
  - `src/db/schema.ts` — `mortgageMembers` table for join query
  - `src/lib/auth.ts` — `verifyMortgageAccess` from Task 2
  - Next.js `cookies()` from `next/headers` — for reading/setting active mortgage cookie

  **Acceptance Criteria**:
  - [x] `getUserMortgages` returns array of accessible mortgages
  - [x] `getMortgage()` respects cookie for active mortgage selection
  - [x] `getMortgage()` with no cookie and no own mortgage returns null (until invited)
  - [x] `npm run build` passes
  - [x] Dashboard still loads correctly for existing user

  **Commit**: YES
  - Message: `feat(mortgage): add multi-mortgage support with active mortgage cookie`
  - Files: `src/app/actions/mortgage.ts`, `src/lib/active-mortgage.ts`
  - Pre-commit: `npm run build`

---

- [x] 5. Create invite server actions

  **What to do**:
  - New file `src/app/actions/invites.ts` with these server actions:

  **`createInvite(mortgageId: string)`**:
  - `requireUserId()` → verify caller is the OWNER (`eq(mortgages.userId, userId)`, NOT member — only owner can invite)
  - Generate token: `crypto.randomUUID()`
  - Set `expiresAt`: `new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)` (7 days)
  - Invalidate any existing active invites for this mortgage: set `usedAt = now()` where `mortgageId = X AND usedAt IS NULL`
  - Insert new invite row
  - Return the token (caller constructs the URL)

  **`getActiveInvite(mortgageId: string)`**:
  - `requireUserId()` → verify owner
  - Return active invite (usedAt is null, expiresAt > now) or null

  **`acceptInvite(token: string)`**:
  - `requireUserId()` to get the accepting user
  - Find invite by token where `usedAt IS NULL` and `expiresAt > now()`
  - If not found or expired → throw descriptive error
  - If `userId === invite.createdByUserId` → throw "Cannot accept your own invite"
  - Check if already a member → if yes, redirect to dashboard (idempotent)
  - Insert into `mortgageMembers` (with unique constraint catch for race conditions)
  - Mark invite: set `usedByUserId` and `usedAt`
  - Set active mortgage cookie to this mortgage
  - Return `{ mortgageId }` for redirect

  **`getMembers(mortgageId: string)`**:
  - `requireUserId()` → verify access (owner OR member)
  - Query `mortgageMembers` for this mortgage
  - Also include the owner (from `mortgages.userId`) in the result
  - For each userId, fetch Clerk user info: `clerkClient.users.getUser(userId)` → get firstName, lastName, email, imageUrl
  - Return array: `{ userId, firstName, lastName, email, imageUrl, role: "owner" | "member", joinedAt }`

  **`removeMember(mortgageId: string, memberUserId: string)`**:
  - `requireUserId()` → caller must be owner OR the member removing themselves
  - If caller is owner: can remove any member except themselves
  - If caller is member: can only remove themselves (leave)
  - Delete from `mortgageMembers`
  - If removed user's active mortgage cookie points to this mortgage, they'll get redirected to their own on next load (handled by `getMortgage` fallback)
  - `revalidatePath("/")`

  **Must NOT do**:
  - Do NOT send emails or notifications
  - Do NOT allow members to create invites
  - Do NOT allow multiple simultaneous active invites

  **Parallelizable**: YES (with Tasks 3, 4 — all depend only on Tasks 1, 2)

  **References**:
  - `src/app/actions/offers.ts:1-8` — Server action file pattern ("use server", imports, requireUserId)
  - `src/db/schema.ts` — `mortgageInvites`, `mortgageMembers` tables
  - `src/app/actions/mortgage.ts:29-49` — Insert pattern with `.returning()`
  - Clerk server SDK: `import { clerkClient } from "@clerk/nextjs/server"` for user info lookup

  **Acceptance Criteria**:
  - [x] `createInvite` returns a UUID token string
  - [x] `acceptInvite` with valid token creates a membership row
  - [x] `acceptInvite` with expired token throws error
  - [x] `acceptInvite` by owner throws "Cannot accept your own invite"
  - [x] `getMembers` returns owner + all members with Clerk user info
  - [x] `removeMember` deletes the member row
  - [x] `npm run build` passes

  **Commit**: YES
  - Message: `feat(invites): add invite link generation, acceptance, and member management actions`
  - Files: `src/app/actions/invites.ts`
  - Pre-commit: `npm run build`

---

- [x] 6. Create `/invite/[token]` accept page + update proxy

  **What to do**:

  **A) Invite accept page** — `src/app/(dashboard)/invite/[token]/page.tsx`:
  - Server component
  - Fetch invite by token (new query, NOT via `acceptInvite` — just read the invite to show details)
  - If invite not found or expired: show error card ("This invite link is invalid or has expired")
  - If valid: show confirmation card with mortgage info (property value, owner name via Clerk), "Join" button
  - "Join" button triggers `acceptInvite(token)` server action → redirect to `/` on success
  - Also show a loading.tsx skeleton for this route

  **B) Create client component for accept button** — `src/components/invite-accept.tsx`:
  - Client component with the "Join this mortgage" button
  - Calls `acceptInvite(token)` on click
  - Shows loading state, handles errors (display toast or inline error)
  - On success: `router.push("/")`

  **C) Proxy update** — `src/proxy.ts`:
  - The invite page is INSIDE the `(dashboard)` layout group, so it's already behind Clerk auth
  - No proxy changes needed — unauthenticated users hitting `/invite/[token]` will be redirected to sign-in by Clerk, and after sign-in they'll be sent back to the invite URL
  - VERIFY: Check that Clerk's redirect-after-auth includes the full path with token

  **Must NOT do**:
  - Do NOT show mortgage details to unauthenticated users
  - Do NOT auto-accept on page load — require explicit button click
  - Do NOT build a custom sign-up flow

  **Parallelizable**: NO (depends on Task 5)

  **References**:
  - `src/app/(dashboard)/offers/[id]/page.tsx:36-75` — Dynamic route page pattern with params, notFound()
  - `src/app/(dashboard)/offers/new/page.tsx` — Simple form page pattern
  - `src/components/offer-form.tsx` — Client component form pattern
  - `src/proxy.ts` — Clerk middleware config (check publicRoutes / ignoredRoutes)
  - `src/app/(dashboard)/offers/[id]/loading.tsx` — Loading skeleton pattern

  **Acceptance Criteria**:
  - [x] Navigate to `/invite/[valid-token]` while logged in → shows mortgage info + "Join" button
  - [x] Click "Join" → creates membership → redirects to dashboard showing the shared mortgage
  - [x] Navigate to `/invite/[expired-token]` → shows error message
  - [x] Navigate to `/invite/[invalid-token]` → shows error message
  - [x] Navigate to `/invite/[token]` while logged out → redirected to sign-in → after sign-in, returned to invite page
  - [x] `npm run build` passes

  **Commit**: YES
  - Message: `feat(invite): add invite accept page with auth redirect support`
  - Files: `src/app/(dashboard)/invite/[token]/page.tsx`, `src/app/(dashboard)/invite/[token]/loading.tsx`, `src/components/invite-accept.tsx`
  - Pre-commit: `npm run build`

---

- [x] 7. Add members management UI

  **What to do**:

  **A) Members page** — `src/app/(dashboard)/members/page.tsx`:
  - Server component
  - Call `getMortgage()` to get current active mortgage
  - Call `getMembers(mortgageId)` to get member list
  - Call `getActiveInvite(mortgageId)` to check for existing invite
  - Determine if current user is the owner
  - Render:
    - Page title: "Members"
    - If owner: "Invite" section with generate link button + copy-to-clipboard
    - If active invite exists: show the link + expiry date + "Generate New" button (invalidates old)
    - Members list: Card with each member showing name, email, avatar, joined date
    - Owner badge on the owner row
    - If owner: "Remove" button on each member row (except owner)
    - If member (not owner): "Leave" button for self
  - Add loading.tsx skeleton

  **B) Invite link UI component** — `src/components/invite-link.tsx`:
  - Client component
  - "Generate Invite Link" button → calls `createInvite(mortgageId)` → constructs URL `{window.location.origin}/invite/{token}`
  - Shows the link in a readonly input with "Copy" button
  - Copy-to-clipboard with brief "Copied!" feedback
  - Shows expiry: "Expires in 7 days"

  **C) Members list component** — `src/components/members-list.tsx`:
  - Client component
  - Receives members array + currentUserId + isOwner
  - Shows each member: avatar (Clerk imageUrl), name, email, joined date
  - Owner: "Owner" badge, no remove button
  - Member (if viewer is owner): "Remove" button → calls `removeMember` with confirmation
  - Self (if viewer is member, not owner): "Leave" button → calls `removeMember(mortgageId, self)` with confirmation

  **D) Add nav item** — update `src/components/app-sidebar.tsx`:
  - Add "Members" nav item with `UserPlus` icon from lucide-react, href: `/members`

  **Must NOT do**:
  - Do NOT build a general settings page
  - Do NOT add QR code or social sharing
  - Do NOT show members UI to users without a mortgage

  **Parallelizable**: NO (depends on Tasks 4, 5)

  **References**:
  - `src/app/(dashboard)/contacts/page.tsx` — Page pattern for listing data
  - `src/components/contact-dialog.tsx` — Dialog/form component pattern
  - `src/components/delete-button.tsx` — Destructive action button with confirmation pattern
  - `src/components/app-sidebar.tsx:20-24` — Nav items array to extend
  - shadcn/ui: `Card`, `Button`, `Input`, `Badge` from `@/components/ui/*`

  **Acceptance Criteria**:
  - [x] "Members" appears in sidebar navigation
  - [x] Members page shows list of current members with names/emails from Clerk
  - [x] Owner sees "Generate Invite Link" button → generates link → copies to clipboard
  - [x] Active invite link + expiry shown when invite exists
  - [x] Owner can remove a member (with confirmation)
  - [x] Member can leave (with confirmation) → redirected to own mortgage or setup
  - [x] `npm run build` passes

  **Commit**: YES
  - Message: `feat(members): add members page with invite link generation and member management`
  - Files: `src/app/(dashboard)/members/page.tsx`, `src/app/(dashboard)/members/loading.tsx`, `src/components/invite-link.tsx`, `src/components/members-list.tsx`, `src/components/app-sidebar.tsx`
  - Pre-commit: `npm run build`

---

- [x] 8. Add mortgage switcher to sidebar

  **What to do**:

  **A) Mortgage switcher component** — `src/components/mortgage-switcher.tsx`:
  - Client component
  - Receives: `mortgages` array (from `getUserMortgages`), `activeMortgageId`
  - If only 1 mortgage: render nothing (no switcher needed)
  - If 2+ mortgages: render a `Select` dropdown in the sidebar header area
  - Each option shows: bank name / property value / "My Mortgage" vs "Shared" label
  - On change: call `setActiveMortgageId(id)` server action → `router.refresh()` to reload data

  **B) Update sidebar** — `src/components/app-sidebar.tsx`:
  - Pass mortgage data to `MortgageSwitcher`
  - Since sidebar is a client component and mortgages need server data: fetch `getUserMortgages` in the dashboard layout (`src/app/(dashboard)/layout.tsx`) and pass as prop to `AppSidebar`

  **C) Update dashboard layout** — `src/app/(dashboard)/layout.tsx`:
  - Call `getUserMortgages()` (from `requireUserId()` + query)
  - Call `getActiveMortgageId()` from cookie helper
  - Pass `mortgages` and `activeMortgageId` to `AppSidebar`

  **Must NOT do**:
  - Do NOT add create/edit/delete mortgage from the switcher
  - Do NOT show the switcher if user has only 1 mortgage

  **Parallelizable**: NO (depends on Task 4)

  **References**:
  - `src/components/app-sidebar.tsx:26-68` — Current sidebar to modify
  - `src/app/(dashboard)/layout.tsx` — Dashboard layout to add data fetching
  - `src/lib/active-mortgage.ts` — Cookie helpers from Task 4
  - shadcn/ui: `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` from `@/components/ui/select`

  **Acceptance Criteria**:
  - [x] User with 1 mortgage: no switcher visible in sidebar
  - [x] User with 2+ mortgages: dropdown appears in sidebar header
  - [x] Switching mortgage → page reloads with new mortgage data
  - [x] Active selection persists across page navigations (cookie)
  - [x] `npm run build` passes

  **Commit**: YES
  - Message: `feat(ui): add mortgage switcher to sidebar for multi-mortgage access`
  - Files: `src/components/mortgage-switcher.tsx`, `src/components/app-sidebar.tsx`, `src/app/(dashboard)/layout.tsx`
  - Pre-commit: `npm run build`

---

- [x] 9. Final build verification + push to deploy

  **What to do**:
  - Run `npm run build` — must pass with zero errors
  - Run full manual QA:
    - Log in as owner → dashboard works → create offer → edit → add track → add contact → add message
    - Generate invite link → copy
    - Open incognito → sign in as different user → paste invite link → accept
    - Second user sees shared mortgage in dashboard
    - Switch between mortgages (if second user has their own)
    - Owner: members page shows both users → remove member → member loses access
    - Member: members page → "Leave" → loses access
    - Generate new invite → old invite no longer works
    - Wait for invite to expire (or manually set past expiry in DB) → expired invite shows error
  - Git add all, commit, push

  **Must NOT do**:
  - Do NOT force push

  **Parallelizable**: NO (final step)

  **References**:
  - All files from Tasks 1-8

  **Acceptance Criteria**:
  - [x] `npm run build` → 0 errors
  - [x] All manual QA scenarios pass
  - [x] Pushed to remote, Vercel deploy succeeds
  - [x] Production site works at https://mortgage.benhaims.net

  **Commit**: YES (if any uncommitted changes remain)
  - Message: `chore: final verification for household invite feature`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(db): add mortgage_members and mortgage_invites tables` | schema.ts, migration SQL | build + verify tables |
| 2 | `feat(auth): add membership-aware access verification helpers` | auth.ts | build |
| 3 | `refactor(auth): update all ownership checks to support household members` | 5 action files | build + manual test existing flows |
| 4 | `feat(mortgage): add multi-mortgage support with active mortgage cookie` | mortgage.ts, active-mortgage.ts | build |
| 5 | `feat(invites): add invite link generation, acceptance, and member management actions` | invites.ts | build |
| 6 | `feat(invite): add invite accept page with auth redirect support` | invite page, component | build |
| 7 | `feat(members): add members page with invite link generation and member management` | members page, components, sidebar | build |
| 8 | `feat(ui): add mortgage switcher to sidebar for multi-mortgage access` | switcher, sidebar, layout | build |
| 9 | Push all to deploy | — | build + full QA |

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: zero errors
```

### Final Checklist
- [x] Owner can generate invite link (/members page)
- [x] Invite link can be copied to clipboard
- [x] Another user can accept invite link and see shared mortgage
- [x] Mortgage switcher appears when user has 2+ mortgages
- [x] All CRUD operations work for both owner and members
- [x] Owner can remove members
- [x] Member can leave voluntarily
- [x] Expired/invalid invite links show clear error
- [x] Only owner can generate invites and manage members
- [x] No `role` column exists on mortgageMembers
- [x] No email/notification code exists
- [x] `npm run build` passes
- [x] Deployed and working on production
