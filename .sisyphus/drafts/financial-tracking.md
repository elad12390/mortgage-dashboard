# Draft: Financial Tracking Features

## Requirements (confirmed)
- User wants to track loans taken for the 25% down payment (personal + parents' loans)
- User wants to track extra costs related to the apartment purchase
- User wants a payment timeline for the apartment

## Research Findings

### Current Domain Model
- **Mortgage** is the root entity (propertyValue, loanAmount, mortgageTermYears, notes)
- **Bank Offers** (bank_offers) are mortgage offers from Israeli banks with status lifecycle (7 statuses)
- **Tracks** (mortgage_tracks) are interest rate components within each offer (Prime, Fixed, Variable, etc. — 7 types)
- **Contacts** are people involved (bank reps, brokers) — linked to mortgage or offer
- **Activity Events** are audit trail (messages + status changes) — linked to mortgage or offer
- **Mortgage Members** — household sharing via invite tokens
- Dashboard shows: mortgage summary cards, activity timeline, 4 summary stats cards, comparison grid
- LTV Ratio is already calculated: loanAmount / propertyValue × 100
- Currency: Israeli Shekel (₪)
- Hebrew labels used throughout (track types, statuses, bank names)
- Estimated monthly payment calculated via standard mortgage formula

### What's Missing (user's request fills this gap)
The app currently tracks the MORTGAGE LOAN itself (the 75%) but NOT:
1. How the 25% down payment is funded (loans from family, personal loans)
2. Extra purchase costs (lawyer, taxes, renovation, etc.)
3. A timeline of when all these payments are due

### Current DB Tables (7 total)
mortgages, bank_offers, mortgage_tracks, contacts, activity_events, mortgage_members, mortgage_invites

### Current UI Patterns
- 7 routes: /, /offers, /offers/new, /offers/[id], /contacts, /members, /invite/[token]
- Server components for pages, client components for interactive elements
- 19 shadcn/ui components installed (Card, Button, Table, Tabs, Select, Badge, Dialog, Input, Label, Textarea, Avatar, AlertDialog, DropdownMenu, Skeleton, Tooltip, Separator, Sheet, Sidebar, Sonner)
- Forms use controlled inputs + server actions (NOT react-hook-form — they use useState + FormData)
- Server actions for data mutations
- Hebrew locale for dates
- Currency formatted as ₪
- Pattern: List pages (table in card), Detail pages (tabs), Form pages (centered card)
- Dialog pattern for inline CRUD (contacts, tracks)
- Toast notifications via Sonner
- Sidebar navigation with 4 items: Dashboard, Bank Offers, Contacts, Members

## User Decisions (Round 1)

### Loans Section — Per-Loan Details
- ✅ Amount + who from (lender name)
- ✅ Interest rate
- ✅ Monthly repayment amount
- ✅ Repayment term (duration)
- ✅ Start date
- ✅ Status (lifecycle tracking)
- ✅ Activity tracking (like existing activity events — NOT just notes)
- ❌ Notes — user prefers activity tracking instead

### Extra Costs Section — Cost Categories
- ✅ Lawyer fees (עורך דין)
- ✅ Purchase tax (מס רכישה)
- ✅ Renovation/repairs (שיפוץ)
- ✅ Mortgage broker fee (יועץ משכנתא)
- ✅ Appraisal/survey (שמאות)
- ✅ Moving costs (הובלה)
- ✅ Insurance (ביטוח)
- ✅ Free-form categories (user can add their own)
- Pattern: predefined categories + custom category option

### Payment Timeline — Content
- ✅ Down payment milestones (contract signing, key handover)
- ✅ Loan repayment schedule (monthly payments for family/personal loans)
- ✅ Extra cost due dates
- ✅ Mortgage start date
- ✅ Any other Israeli home-buying related dates
- User wants comprehensive timeline — not just key dates

## User Decisions (Round 2)

### Extra Costs — Payment Tracking
- ✅ Track paid/unpaid status per cost
- ✅ Track due dates per cost
- Overdue costs (past due date + unpaid) should be visually flagged
- Show totals: total costs, paid, remaining

### Payment Timeline — Visual Style
- ✅ Horizontal timeline (NOT vertical like activity)
- ✅ Calendar view component
- User wants BOTH: a horizontal timeline visualization + calendar view
- Likely need a good charting/calendar component

### Navigation — Placement
- ✅ Separate sidebar pages for each section
- New nav items: Loans, Costs, Timeline (3 new pages)
- Follow existing pattern: separate page per entity

## User Decisions (Round 3)

### Loan Activity
- ✅ Full activity timeline per loan (messages + status changes)
- Same pattern as bank offers: each loan gets its own activity_events
- This means activity_events needs a new FK: loanId

### Down Payment Milestones
- ✅ Contract signing (חתימה) — first payment ~10-15%
- ✅ Within 30/60 days — second installment
- ✅ Key handover (מסירת מפתח) — final payment
- ✅ Custom milestones — user-defined dates and amounts
- Pattern: a milestone entity with name, amount, date, paid status

### Dashboard Summary Cards
- ✅ Add summary cards for new sections on dashboard home
- Ideas: Total Loans (₪), Outstanding Costs (₪), Next Payment Due, etc.

### Member Access
- ✅ Household members see all financial data (loans, costs, timeline)
- Same access model as bank offers — no special restrictions

## Scope Boundaries (finalized)

## Scope Boundaries (finalized)

### INCLUDE
- Loans table: amount, lender name, interest rate, monthly repayment, term, start date, status
- Loans page in sidebar with CRUD
- Activity events linked to loans (messages + status changes)
- Extra costs table: category (predefined + custom), amount, due date, paid status, notes
- Costs page in sidebar with CRUD
- Payment milestones table: name, amount, date, paid status (contract, 30/60 days, key handover, custom)
- Timeline page in sidebar with horizontal timeline + calendar view
- Dashboard summary cards for loans + costs
- Household members can see all new data
- Hebrew labels for categories, statuses, milestones

### EXCLUDE
- Automatic loan amortization schedules (user enters monthly payment manually)
- Integration with banks for auto-fetching data
- Email/push notifications for upcoming due dates
- PDF export or reports
- Currency conversion (₪ only)
- Recurring payment auto-generation (user creates milestones manually)
