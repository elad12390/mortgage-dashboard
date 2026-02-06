# Architectural Decisions

## Active Mortgage Selection
- Cookie-based: `active-mortgage-id`
- Default: user's own mortgage
- Fallback: first accessible mortgage from getUserMortgages

## Invite Model
- One active invite per mortgage at a time
- New invite invalidates old
- 7-day expiry
- UUID token

## Auth Approach
- Shared helpers in `src/lib/auth.ts`: `verifyMortgageAccess`, `verifyOfferAccess`
- 11 ownership check sites across 5 action files must be updated
- Owner OR member check (OR logic, not replacement)

## Member Display
- Uses Clerk server SDK: `clerkClient.users.getUser(userId)`
- Shows: firstName, lastName, email, imageUrl
