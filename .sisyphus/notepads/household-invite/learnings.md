# Learnings & Conventions

## [INIT] Session Started
- Plan: household-invite
- Tasks: 9 total (sequential with one parallelizable group)
- Session: ses_3cd24bbb6ffeSWvsgyrfCSOgIB

## [Task 1] Schema + Migration Completed
- Tables: mortgage_members, mortgage_invites
- Unique constraint on (userId, mortgageId) prevents duplicate memberships
- Migration file: drizzle/0004_ambitious_sentinel.sql
- Build: ✓ passes
- Tables created with:
  - mortgage_members: id, mortgageId (FK cascade), userId, joinedAt
  - mortgage_invites: id, mortgageId (FK cascade), token (unique), createdByUserId, expiresAt, usedByUserId, usedAt, createdAt
- Relations: mortgagesRelations now includes members + invites; added mortgageMembersRelations + mortgageInvitesRelations
- Type exports: MortgageMember, NewMortgageMember, MortgageInvite, NewMortgageInvite

## [Task 2] Shared Auth Helpers Added
- verifyMortgageAccess: checks owner OR member (two-step: owner first, then member)
- verifyOfferAccess: delegates to verifyMortgageAccess
- Imports: db, mortgages, mortgageMembers, bankOffers, eq, and
- Pattern: owner check is fast path, member check is secondary
- Build: ✓ passes

## [Task 3] All Ownership Checks Updated
- 5 files updated: mortgage.ts, offers.ts, activity.ts, contacts.ts, tracks.ts
- 9 local verify functions removed (replaced with shared helpers from @/lib/auth)
- 15+ callsites updated to use verifyMortgageAccess / verifyOfferAccess
- Pattern: import shared helpers, delete local copies, update all callsites
- Build: ✓ passes
- All action files now use centralized auth with member support

## [Task 4] Multi-Mortgage Support Added
- Created src/lib/active-mortgage.ts with cookie helpers (getActiveMortgageId, setActiveMortgageId)
- Added getUserMortgages(userId) to mortgage.ts - returns owned + member mortgages with role indicator
- Updated getMortgage() to accept optional mortgageId parameter
- Cookie-based active mortgage selection with fallback chain:
  1. Explicit mortgageId param (if provided)
  2. Cookie value (if set and accessible)
  3. User's owned mortgage (if exists)
  4. First accessible mortgage from getUserMortgages (member of)
- Build: ✓ passes

## [Task 5] Invite Server Actions Created
- Created src/app/actions/invites.ts with 5 functions
- createInvite: owner-only, generates UUID token, 7-day expiry, invalidates old invites
- getActiveInvite: owner-only, returns active invite or null
- acceptInvite: validates token/expiry, prevents self-invite, idempotent (already member), sets active cookie
- getMembers: fetches owner + members with Clerk user info (firstName, lastName, email, imageUrl)
- removeMember: owner can remove members (not self), member can remove self (leave)
- Uses clerkClient.users.getUser() for user info
- Build: ✓ passes

## [Task 6] Invite Accept Page Created
- Created src/app/(dashboard)/invite/[token]/page.tsx - server component that fetches invite, shows mortgage details
- Created src/app/(dashboard)/invite/[token]/loading.tsx - skeleton for loading state
- Created src/components/invite-accept.tsx - client component with "Join" button, handles acceptInvite action
- Page shows: invited by (owner name from Clerk), property value, expiry date
- Invalid/expired invites show error card
- Inside (dashboard) group so Clerk auth redirects unauthenticated users to sign-in
- Build: ✓ passes, route appears in build output

## [Task 7] Members Management UI Created
- Created src/app/(dashboard)/members/page.tsx - shows invite link (owner only) + members list
- Created src/app/(dashboard)/members/loading.tsx - skeleton
- Created src/components/invite-link.tsx - generate/copy invite link, shows expiry
- Created src/components/members-list.tsx - member cards with avatar/name/email, Remove/Leave buttons with confirmation dialog
- Updated src/components/app-sidebar.tsx - added "Members" nav item with UserPlus icon
- Installed shadcn components: avatar, alert-dialog
- Build: ✓ passes, /members route appears in build output

## [Task 8] Mortgage Switcher Added
- Created src/components/mortgage-switcher.tsx - dropdown select for switching between mortgages
- Shows property value + role label ("My Mortgage" vs "Shared")
- Only renders if user has 2+ accessible mortgages
- Updated src/app/(dashboard)/layout.tsx - fetches getUserMortgages + getActiveMortgageId, passes to sidebar
- Updated src/components/app-sidebar.tsx - accepts mortgages/activeMortgageId props, renders MortgageSwitcher
- On change: calls setActiveMortgageId + router.refresh()
- Build: ✓ passes

## [Task 9] Final Verification & Deploy
- Final build: ✓ passes with zero errors
- All routes present in build output: /, /contacts, /invite/[token], /members, /offers, /offers/[id], /offers/new
- Pushed 8 commits to main branch
- Vercel will auto-deploy to https://mortgage.benhaims.net

## FEATURE COMPLETE: Household Invite System
All 9 tasks completed successfully:
1. ✓ Schema + Migration (mortgage_members, mortgage_invites tables)
2. ✓ Shared auth helpers (verifyMortgageAccess, verifyOfferAccess)
3. ✓ Updated all ownership checks (5 action files)
4. ✓ Multi-mortgage support (getUserMortgages, active mortgage cookie)
5. ✓ Invite server actions (createInvite, acceptInvite, getMembers, removeMember)
6. ✓ Invite accept page (/invite/[token])
7. ✓ Members management UI (/members page)
8. ✓ Mortgage switcher in sidebar
9. ✓ Final verification + deploy

Total commits: 8
Total files changed: 30+
Build status: ✓ passing
Deploy status: ✓ pushed to production
