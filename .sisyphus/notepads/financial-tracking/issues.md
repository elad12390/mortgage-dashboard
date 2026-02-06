# Issues & Gotchas

## Known Constraints (inherited from previous boulder)
- `NEON_DATABASE_URL` env var (NOT `DATABASE_URL`)
- Migration workflow: `drizzle-kit generate && drizzle-kit migrate` (NOT push)
- Neon HTTP driver doesn't support transactions
- `@neondatabase/serverless` must stay at v0.10.4

## Guardrails (from plan)
- NO automatic amortization schedules
- NO bank integration or auto-fetching
- NO email/notifications
- NO PDF export
- NO heavy charting library (D3, Chart.js, Recharts)
- NO react-hook-form or Zod
- NO new shadcn components beyond Calendar
