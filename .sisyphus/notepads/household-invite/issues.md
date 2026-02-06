# Issues & Gotchas

## Known Constraints
- `NEON_DATABASE_URL` env var (NOT `DATABASE_URL`)
- Migration workflow: `drizzle-kit generate && drizzle-kit migrate` (NOT push)
- Neon HTTP driver doesn't support transactions
- `@neondatabase/serverless` must stay at v0.10.4

## Guardrails
- NO role-based permissions
- NO refactoring of duplicated verify functions (update in-place)
- NO renaming of `mortgages.userId`
- NO email/notifications
- NO activity attribution (userId on events)
- NO `drizzle-kit push`
