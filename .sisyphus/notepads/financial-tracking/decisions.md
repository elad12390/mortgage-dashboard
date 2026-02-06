# Architectural Decisions

## Database
- 3 new tables: loans, extra_costs, payment_milestones
- Extend activity_events with loanId FK (polymorphic pattern)
- Use pgEnum for loan status + cost payment status
- Text column for cost categories (NOT separate table)

## Timeline
- Pure CSS/Tailwind for horizontal timeline (no charting library)
- shadcn Calendar for calendar view
- Read-only aggregation from milestones + costs + loans
- NO monthly recurring entries (too cluttered)

## Navigation
- 3 new sidebar pages: /loans, /loans/[id], /costs, /timeline
- Order: Dashboard → Bank Offers → Loans → Costs → Timeline → Contacts → Members
