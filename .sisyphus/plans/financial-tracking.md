# Financial Tracking: Loans, Extra Costs & Payment Timeline

## Context

### Original Request
Add three new sections to the mortgage dashboard:
1. **Loans tracking** — Track personal loans and parents' loans taken to fund the 25% down payment
2. **Extra costs tracking** — Track all additional apartment purchase costs (lawyer, tax, renovation, etc.)
3. **Payment timeline** — A visual timeline showing all payment milestones, loan repayments, and cost due dates

### Interview Summary
**Key Discussions**:
- Loans: Full CRUD with amount, lender name, interest rate, monthly repayment, term, start date, status + activity timeline per loan
- Extra costs: Predefined categories (lawyer, tax, renovation, broker, appraisal, moving, insurance) + free-form custom categories. Track paid/unpaid status + due dates. Flag overdue items.
- Timeline: Horizontal timeline + calendar view showing down payment milestones (contract signing, 30/60 days, key handover) + loan repayments + cost due dates + mortgage start date
- Dashboard: Add summary cards for loans + costs alongside existing bank offer cards
- Access: Household members see all new data (same as bank offers)
- Navigation: 3 new sidebar pages (/loans, /costs, /timeline)

**Research Findings**:
- 7 existing DB tables, activity_events already has polymorphic FKs (mortgageId, offerId)
- 19 shadcn components installed — NO Calendar or Chart components yet
- No date library installed (uses native Date + toLocaleDateString)
- No charting library installed
- Forms use controlled inputs + server actions (NOT react-hook-form)
- Existing patterns: Dialog-based CRUD, table listings, tabbed detail pages

### Metis Review
**Identified Gaps** (addressed):
- Timeline visualization: Use pure CSS/Tailwind for horizontal timeline (no heavy library). For calendar, install shadcn Calendar component (uses react-day-picker, already a dependency of shadcn)
- Loan activity events: Add nullable `loanId` FK to existing `activity_events` table (same pattern as existing `offerId`)
- Cost categories: Use text column with predefined options in constants (NOT a separate categories table — YAGNI)
- Payment milestones: Separate `payment_milestones` table (manually created entries, NOT auto-computed from loans/costs)
- Loans detail page: YES — `/loans/[id]` with tabs (same pattern as `/offers/[id]`) for activity + edit
- Timeline is a READ-ONLY aggregation view — it pulls data from loans, costs, and milestones tables
- Need to handle the case where mortgage has no loans/costs/milestones yet (empty states)
- Summary cards on dashboard: Total Loans Outstanding, Total Extra Costs, Paid Costs, Next Payment Due

---

## Work Objectives

### Core Objective
Add financial tracking for the full apartment purchase lifecycle — down payment loans, extra costs, and a unified payment timeline — so users can see the complete financial picture alongside their mortgage offers.

### Concrete Deliverables
- 3 new DB tables: `loans`, `extra_costs`, `payment_milestones`
- 1 DB migration extending `activity_events` with `loanId` FK
- 3 new pages: `/loans`, `/loans/[id]`, `/costs`, `/timeline`
- Server actions for CRUD on loans, costs, and milestones
- Dashboard summary cards for loans + costs
- Sidebar navigation with 3 new items
- Horizontal timeline visualization + calendar view
- Hebrew labels for all categories, statuses, milestones

### Definition of Done
- [ ] User can create, edit, delete loans with all fields
- [ ] User can add activity messages and track status changes on each loan
- [ ] User can create, edit, delete extra costs with categories and due dates
- [ ] User can mark costs as paid/partially paid/fully paid
- [ ] Overdue costs are visually flagged
- [ ] User can create, edit, delete payment milestones
- [ ] Timeline page shows horizontal timeline with all events
- [ ] Timeline page shows calendar view with payment dates
- [ ] Dashboard shows summary cards for loans and costs
- [ ] Household members can see all new data
- [ ] `npm run build` passes

### Must Have
- Loan CRUD with activity timeline
- Extra cost CRUD with paid/due status
- Payment milestones CRUD
- Timeline visualization (horizontal + calendar)
- Dashboard summary cards
- Hebrew labels throughout
- Household member access

### Must NOT Have (Guardrails)
- NO automatic amortization schedule generation — user enters monthly payment manually
- NO bank integration or auto-fetching data
- NO email/push notifications for upcoming due dates
- NO PDF export or reports
- NO currency conversion — ₪ only
- NO recurring payment auto-generation — user creates entries manually
- NO heavy charting library (D3, Chart.js, Recharts) — use CSS/Tailwind for timeline
- NO react-hook-form or Zod — follow existing controlled inputs + server actions pattern
- NO separate categories table — text column with predefined options
- NO auto-computed timeline entries — milestones are manually created
- NO new shadcn components beyond Calendar (keep component footprint minimal)
- NO changes to existing bank offers, tracks, or contacts functionality

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
Task 1 (DB schema: loans, extra_costs, payment_milestones tables + activity_events extension)
  → Task 2 (constants: loan statuses, cost categories, cost payment statuses, milestone types)
    → Task 3 (server actions: loans CRUD + activity)
    → Task 4 (server actions: costs CRUD)
    → Task 5 (server actions: milestones CRUD + timeline aggregation)
      → Task 6 (loans list page + loan detail page with activity)
      → Task 7 (costs page with CRUD + overdue flagging)
      → Task 8 (timeline page: horizontal timeline + calendar view)
        → Task 9 (dashboard summary cards)
          → Task 10 (sidebar navigation update)
            → Task 11 (final build + deploy)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 3, 4, 5 | Independent server action files, all depend only on 1+2 |
| B | 6, 7 | Independent pages, depend on their respective actions |

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | — | Foundation: tables must exist first |
| 2 | — | Constants needed by actions and UI (can parallel with 1) |
| 3 | 1, 2 | Needs loans table + status constants |
| 4 | 1, 2 | Needs extra_costs table + category constants |
| 5 | 1, 2 | Needs payment_milestones table + milestone constants |
| 6 | 3 | Needs loan server actions |
| 7 | 4 | Needs cost server actions |
| 8 | 5 | Needs milestone actions + timeline aggregation |
| 9 | 3, 4, 5 | Needs all actions for summary data |
| 10 | 6, 7, 8 | All pages must exist before adding nav |
| 11 | all | Final verification |

---

## TODOs

- [x] 1. Database schema: Add `loans`, `extra_costs`, `payment_milestones` tables + extend `activity_events`

  **What to do**:

  **A) Add `loans` table** to `src/db/schema.ts`:
  - `id` uuid PK defaultRandom
  - `mortgageId` uuid FK → mortgages.id (cascade delete) notNull
  - `lenderName` text notNull (e.g., "הורים - אבא ואמא", "בנק לאומי הלוואה אישית")
  - `amount` numeric(12,2) notNull (loan amount in ₪)
  - `interestRate` numeric(5,3) nullable (annual interest rate %, null = 0% / interest-free)
  - `monthlyRepayment` numeric(12,2) nullable (monthly payment amount in ₪)
  - `termMonths` integer nullable (repayment duration in months)
  - `startDate` date nullable (when repayment begins)
  - `status` text notNull default "pending" (from loanStatusEnum or text with app-level validation)
  - `createdAt` timestamp with timezone notNull defaultNow
  - `updatedAt` timestamp with timezone notNull defaultNow

  **B) Add `extra_costs` table** to `src/db/schema.ts`:
  - `id` uuid PK defaultRandom
  - `mortgageId` uuid FK → mortgages.id (cascade delete) notNull
  - `category` text notNull (predefined values + custom, stored as text)
  - `description` text nullable (free-form description, useful for custom categories)
  - `amount` numeric(12,2) notNull (cost amount in ₪)
  - `paidAmount` numeric(12,2) notNull default "0" (how much has been paid so far)
  - `dueDate` date nullable (when the cost is due)
  - `status` text notNull default "unpaid" (unpaid / partially_paid / fully_paid)
  - `notes` text nullable
  - `createdAt` timestamp with timezone notNull defaultNow
  - `updatedAt` timestamp with timezone notNull defaultNow

  **C) Add `payment_milestones` table** to `src/db/schema.ts`:
  - `id` uuid PK defaultRandom
  - `mortgageId` uuid FK → mortgages.id (cascade delete) notNull
  - `name` text notNull (e.g., "חתימת חוזה", "תשלום 30 יום", "מסירת מפתח")
  - `amount` numeric(12,2) notNull (payment amount in ₪)
  - `date` date notNull (when payment is due)
  - `isPaid` boolean notNull default false
  - `notes` text nullable
  - `createdAt` timestamp with timezone notNull defaultNow

  **D) Extend `activity_events` table** — add `loanId` column:
  - `loanId` uuid FK → loans.id (cascade delete) nullable
  - This follows the existing polymorphic FK pattern (mortgageId, offerId are already nullable)

  **E) Add Drizzle relations** for all new tables:
  - `loansRelations`: one(mortgages) on mortgageId
  - `extraCostsRelations`: one(mortgages) on mortgageId
  - `paymentMilestonesRelations`: one(mortgages) on mortgageId
  - Update `mortgagesRelations`: add `loans: many(loans)`, `extraCosts: many(extraCosts)`, `paymentMilestones: many(paymentMilestones)`
  - Update `activityEventsRelations`: add `loan: one(loans, ...)` on loanId

  **F) Add type exports**: `Loan`, `NewLoan`, `ExtraCost`, `NewExtraCost`, `PaymentMilestone`, `NewPaymentMilestone`

  **G) Run migration**:
  ```bash
  source .env.local; export NEON_DATABASE_URL; npx drizzle-kit generate && npx drizzle-kit migrate
  ```

  **Must NOT do**:
  - Do NOT create enums for status/category — use text columns with app-level constants (matches existing pattern for track types which are also text-based pgEnum)
  - Actually — DO use pgEnum for loan status and cost status (existing pattern uses pgEnum for offerStatus and trackType). Create `loanStatusEnum` and `costPaymentStatusEnum`
  - Do NOT modify existing tables (except adding loanId to activity_events)
  - Do NOT add indexes beyond FKs (premature optimization)

  **Parallelizable**: NO (foundation for everything)

  **References**:
  - `src/db/schema.ts:8-12` — pgEnum pattern (offerStatusEnum, trackTypeEnum, eventTypeEnum)
  - `src/db/schema.ts:35-44` — Table definition pattern (uuid PK, timestamps, notNull)
  - `src/db/schema.ts:46-56` — FK reference pattern with cascade delete
  - `src/db/schema.ts:68-77` — activity_events table (add loanId following offerId pattern at line 72)
  - `src/db/schema.ts:93-136` — Relations pattern
  - `src/db/schema.ts:138-147` — Type export pattern with InferSelectModel/InferInsertModel
  - `drizzle.config.ts` — Uses `NEON_DATABASE_URL` env var

  **Acceptance Criteria**:
  - [ ] `npx drizzle-kit generate` creates a new SQL migration file in `drizzle/`
  - [ ] `npx drizzle-kit migrate` applies successfully (no errors)
  - [ ] Verify tables exist: `source .env.local; export NEON_DATABASE_URL; node -e "const{neon}=require('@neondatabase/serverless');const sql=neon(process.env.NEON_DATABASE_URL);sql('SELECT table_name FROM information_schema.tables WHERE table_schema=$$public$$').then(r=>console.log(r.map(t=>t.table_name)))"` → should include `loans`, `extra_costs`, `payment_milestones`
  - [ ] Verify activity_events has loanId column: `node -e "const{neon}=require('@neondatabase/serverless');const sql=neon(process.env.NEON_DATABASE_URL);sql('SELECT column_name FROM information_schema.columns WHERE table_name=$$activity_events$$').then(r=>console.log(r.map(c=>c.column_name)))"` → should include `loan_id`
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(db): add loans, extra_costs, and payment_milestones tables`
  - Files: `src/db/schema.ts`, `drizzle/*.sql`
  - Pre-commit: `npm run build`

---

- [x] 2. Add constants for loan statuses, cost categories, cost payment statuses, and milestone types

  **What to do**:
  - Add to `src/lib/constants.ts`:

  **Loan Status Labels** (Hebrew):
  ```
  pending → ממתין
  approved → אושר
  received → התקבל
  repaying → בהחזר
  completed → הושלם
  ```

  **Loan Status Colors** (same pattern as offerStatusColors):
  ```
  pending → gray
  approved → blue
  received → green
  repaying → yellow
  completed → purple
  ```

  **Cost Category Labels** (Hebrew):
  ```
  lawyer → עורך דין
  purchase_tax → מס רכישה
  renovation → שיפוץ
  broker → יועץ משכנתא
  appraisal → שמאות
  moving → הובלה
  insurance → ביטוח
  other → אחר
  ```

  **Cost Payment Status Labels** (Hebrew):
  ```
  unpaid → לא שולם
  partially_paid → שולם חלקית
  fully_paid → שולם
  ```

  **Cost Payment Status Colors**:
  ```
  unpaid → red
  partially_paid → yellow
  fully_paid → green
  ```

  **Milestone Type Presets** (Hebrew, for UI convenience — not enforced):
  ```
  contract_signing → חתימת חוזה
  payment_30_days → תשלום 30 יום
  payment_60_days → תשלום 60 יום
  key_handover → מסירת מפתח
  mortgage_start → תחילת משכנתא
  custom → מותאם אישית
  ```

  **Must NOT do**:
  - Do NOT create a separate constants file — add to existing `src/lib/constants.ts`
  - Do NOT change existing constants

  **Parallelizable**: YES (with Task 1 — no DB dependency)

  **References**:
  - `src/lib/constants.ts` — Existing constants file with trackTypeLabels, offerStatusLabels, offerStatusColors, banks array

  **Acceptance Criteria**:
  - [ ] All new constant objects are exported from `src/lib/constants.ts`
  - [ ] Hebrew labels are correct and match Israeli financial terminology
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(constants): add loan, cost, and milestone labels and colors`
  - Files: `src/lib/constants.ts`
  - Pre-commit: `npm run build`

---

- [x] 3. Create loan server actions (`src/app/actions/loans.ts`)

  **What to do**:
  - New file `src/app/actions/loans.ts` with these server actions:

  **`getLoans(mortgageId: string)`**:
  - `requireUserId()` → `verifyMortgageAccess(mortgageId, userId)`
  - Query all loans where `mortgageId = X`, ordered by createdAt desc
  - Return loans array

  **`getLoanById(loanId: string)`**:
  - `requireUserId()` → fetch loan with mortgage → `verifyMortgageAccess(loan.mortgageId, userId)`
  - Return loan or null if not found/unauthorized

  **`createLoan(mortgageId: string, data: {...})`**:
  - `requireUserId()` → `verifyMortgageAccess(mortgageId, userId)`
  - Insert into loans table with all fields
  - `revalidatePath("/")`
  - Return created loan

  **`updateLoan(loanId: string, data: {...})`**:
  - `requireUserId()` → fetch loan → `verifyMortgageAccess(loan.mortgageId, userId)`
  - If status changed: create status_change activity event (same pattern as offers)
  - Update loan
  - `revalidatePath("/")`

  **`deleteLoan(loanId: string)`**:
  - `requireUserId()` → fetch loan → `verifyMortgageAccess(loan.mortgageId, userId)`
  - Delete loan (cascade deletes activity events via FK)
  - `revalidatePath("/")`

  **`getLoanActivityEvents(loanId: string)`**:
  - `requireUserId()` → fetch loan → `verifyMortgageAccess`
  - Query activity_events where `loanId = X`, ordered by createdAt desc
  - Return events array

  **`addLoanMessage(loanId: string, content: string, createdAt?: Date)`**:
  - `requireUserId()` → fetch loan → `verifyMortgageAccess`
  - Insert activity_event with `eventType: "message"`, `loanId`, `mortgageId` (from loan)
  - `revalidatePath("/")`

  **`deleteLoanMessage(eventId: string)`**:
  - `requireUserId()` → fetch event with loan → `verifyMortgageAccess` via event's mortgageId
  - Delete event
  - `revalidatePath("/")`

  **Must NOT do**:
  - Do NOT auto-compute anything from loan data (no amortization schedules)
  - Do NOT allow members to create loans in mortgages they don't have access to

  **Parallelizable**: YES (with Tasks 4, 5 — all depend only on Tasks 1, 2)

  **References**:
  - `src/app/actions/offers.ts:1-8` — Server action file pattern ("use server", imports, requireUserId)
  - `src/app/actions/offers.ts:35-67` — CRUD pattern (create, get, update, delete)
  - `src/app/actions/activity.ts` — Activity event pattern (getActivityEvents, addMessage, deleteMessage)
  - `src/lib/auth.ts` — verifyMortgageAccess helper
  - `src/db/schema.ts` — loans, activityEvents tables

  **Acceptance Criteria**:
  - [ ] All 8 functions exported and callable
  - [ ] Loan CRUD creates/updates/deletes rows in loans table
  - [ ] Status change creates activity event with metadata `{oldStatus, newStatus}`
  - [ ] Activity messages linked to loan via loanId
  - [ ] Access verified for all operations
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(loans): add loan CRUD and activity server actions`
  - Files: `src/app/actions/loans.ts`
  - Pre-commit: `npm run build`

---

- [x] 4. Create extra costs server actions (`src/app/actions/costs.ts`)

  **What to do**:
  - New file `src/app/actions/costs.ts` with these server actions:

  **`getCosts(mortgageId: string)`**:
  - `requireUserId()` → `verifyMortgageAccess(mortgageId, userId)`
  - Query all extra_costs where `mortgageId = X`, ordered by dueDate asc (soonest first), then createdAt desc
  - Return costs array

  **`createCost(mortgageId: string, data: {...})`**:
  - `requireUserId()` → `verifyMortgageAccess(mortgageId, userId)`
  - Auto-set status based on paidAmount vs amount:
    - paidAmount === 0 → "unpaid"
    - paidAmount < amount → "partially_paid"
    - paidAmount >= amount → "fully_paid"
  - Insert into extra_costs table
  - `revalidatePath("/")`

  **`updateCost(costId: string, data: {...})`**:
  - `requireUserId()` → fetch cost → `verifyMortgageAccess(cost.mortgageId, userId)`
  - Auto-recalculate status based on paidAmount vs amount
  - Update cost
  - `revalidatePath("/")`

  **`deleteCost(costId: string)`**:
  - `requireUserId()` → fetch cost → `verifyMortgageAccess`
  - Delete cost
  - `revalidatePath("/")`

  **`getCostsSummary(mortgageId: string)`**:
  - `requireUserId()` → `verifyMortgageAccess`
  - Return: `{ totalCosts, totalPaid, totalRemaining, overdueCount, upcomingCount }`
  - Overdue: unpaid/partially_paid AND dueDate < today
  - Upcoming: unpaid/partially_paid AND dueDate within next 30 days

  **Must NOT do**:
  - Do NOT create a separate categories table
  - Do NOT send notifications for overdue items

  **Parallelizable**: YES (with Tasks 3, 5)

  **References**:
  - `src/app/actions/offers.ts` — CRUD pattern
  - `src/lib/auth.ts` — verifyMortgageAccess
  - `src/db/schema.ts` — extra_costs table

  **Acceptance Criteria**:
  - [ ] All 5 functions exported and callable
  - [ ] Cost CRUD creates/updates/deletes rows
  - [ ] Status auto-calculated from paidAmount vs amount
  - [ ] Summary calculates correct totals, overdue count, upcoming count
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(costs): add extra cost CRUD and summary server actions`
  - Files: `src/app/actions/costs.ts`
  - Pre-commit: `npm run build`

---

- [x] 5. Create milestone server actions + timeline aggregation (`src/app/actions/milestones.ts`)

  **What to do**:
  - New file `src/app/actions/milestones.ts` with these server actions:

  **`getMilestones(mortgageId: string)`**:
  - `requireUserId()` → `verifyMortgageAccess(mortgageId, userId)`
  - Query all payment_milestones where `mortgageId = X`, ordered by date asc
  - Return milestones array

  **`createMilestone(mortgageId: string, data: {...})`**:
  - `requireUserId()` → `verifyMortgageAccess`
  - Insert into payment_milestones table
  - `revalidatePath("/")`

  **`updateMilestone(milestoneId: string, data: {...})`**:
  - `requireUserId()` → fetch milestone → `verifyMortgageAccess`
  - Update milestone
  - `revalidatePath("/")`

  **`deleteMilestone(milestoneId: string)`**:
  - `requireUserId()` → fetch milestone → `verifyMortgageAccess`
  - Delete milestone
  - `revalidatePath("/")`

  **`getTimelineData(mortgageId: string)`**:
  - `requireUserId()` → `verifyMortgageAccess`
  - Aggregates ALL payment-related data into a unified timeline:
    - Payment milestones (from payment_milestones table)
    - Extra cost due dates (from extra_costs where dueDate is not null)
    - Loan start dates (from loans where startDate is not null)
  - Each timeline entry: `{ id, type: "milestone"|"cost"|"loan_start", date, name, amount, isPaid/status, sourceId }`
  - Sorted by date ascending
  - Return array of timeline entries

  **Must NOT do**:
  - Do NOT auto-generate monthly loan repayment entries on the timeline (too many entries, clutters the view)
  - Do NOT make timeline entries editable — they are read-only views of data from other tables

  **Parallelizable**: YES (with Tasks 3, 4)

  **References**:
  - `src/app/actions/offers.ts` — CRUD pattern
  - `src/app/actions/mortgage.ts:72-108` — getDashboardData aggregation pattern
  - `src/lib/auth.ts` — verifyMortgageAccess

  **Acceptance Criteria**:
  - [ ] Milestone CRUD works correctly
  - [ ] `getTimelineData` returns unified sorted array from milestones + costs + loans
  - [ ] Timeline entries have consistent shape regardless of source
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(milestones): add milestone CRUD and timeline aggregation actions`
  - Files: `src/app/actions/milestones.ts`
  - Pre-commit: `npm run build`

---

- [ ] 6. Create loans page (`/loans`) and loan detail page (`/loans/[id]`)

  **What to do**:

  **A) Loans list page** — `src/app/(dashboard)/loans/page.tsx`:
  - Server component
  - Fetch active mortgage via `getMortgage()`
  - If no mortgage, redirect to `/`
  - Fetch loans via `getLoans(mortgageId)`
  - Display:
    - Page header: "הלוואות" (Loans) with "הלוואה חדשה" (New Loan) button
    - Summary cards row (2-3 cards):
      - Total loans amount (₪)
      - Total monthly repayments (₪)
      - Active loans count
    - Table with columns: Lender Name, Amount (₪), Interest Rate (%), Monthly Payment (₪), Term, Status (badge), Start Date
    - Each row links to `/loans/[id]`
    - Empty state if no loans
  - Add `loading.tsx` skeleton

  **B) New loan dialog or page** — `src/components/loan-dialog.tsx`:
  - Client component (Dialog pattern, like contact-dialog)
  - Form fields: Lender Name (text), Amount (number), Interest Rate (number, optional), Monthly Repayment (number, optional), Term in months (number, optional), Start Date (date input, optional), Status (select from loanStatusLabels)
  - Create mode: calls `createLoan()` server action
  - Edit mode: pre-fills fields, calls `updateLoan()` server action
  - Toast notifications
  - Close dialog on success

  **C) Loan detail page** — `src/app/(dashboard)/loans/[id]/page.tsx`:
  - Server component (same pattern as `/offers/[id]`)
  - Fetch loan via `getLoanById(id)`
  - If not found, call `notFound()`
  - Display:
    - Header: lender name + status badge + delete button
    - Summary cards: Amount (₪), Interest Rate (%), Monthly Payment (₪), Term
    - Tabs:
      1. **Activity** tab: `ActivityTimeline` component (reuse existing) — pass `loanId` instead of `offerId`
      2. **Edit Details** tab: loan edit form (reuse `LoanDialog` content inline or use the dialog component)
  - Add `loading.tsx` skeleton

  **D) Update ActivityTimeline component** — `src/components/activity-timeline.tsx`:
  - Currently accepts `mortgageId` and optional `offerId`
  - Add optional `loanId` prop
  - When `loanId` is provided, fetch activity events via `getLoanActivityEvents(loanId)` and use `addLoanMessage(loanId, ...)` / `deleteLoanMessage(eventId)` for mutations
  - The existing component pattern should support this with minimal changes — just add the loanId code path

  **Must NOT do**:
  - Do NOT create an amortization schedule view
  - Do NOT add loan-specific contacts (loans are simpler than bank offers)

  **Parallelizable**: NO (depends on Task 3)

  **References**:
  - `src/app/(dashboard)/offers/page.tsx` — List page pattern (table with rows linking to detail)
  - `src/app/(dashboard)/offers/[id]/page.tsx` — Detail page pattern (header + tabs)
  - `src/components/contact-dialog.tsx` — Dialog CRUD pattern
  - `src/components/activity-timeline.tsx` — Activity timeline component (needs loanId support)
  - `src/components/offer-form.tsx` — Form component pattern (controlled inputs + server action)
  - `src/app/(dashboard)/offers/[id]/loading.tsx` — Loading skeleton pattern

  **Acceptance Criteria**:
  - [ ] `/loans` page shows list of all loans for active mortgage
  - [ ] Summary cards show correct totals
  - [ ] "New Loan" button opens dialog/form → creates loan → appears in list
  - [ ] Clicking a loan row navigates to `/loans/[id]`
  - [ ] Loan detail page shows loan info + activity tab + edit tab
  - [ ] Activity messages can be added/deleted on loan detail page
  - [ ] Status changes create activity events with old→new metadata
  - [ ] Empty state displayed when no loans exist
  - [ ] Hebrew labels used throughout
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(loans): add loans list page, detail page, and loan dialog`
  - Files: `src/app/(dashboard)/loans/page.tsx`, `src/app/(dashboard)/loans/[id]/page.tsx`, `src/app/(dashboard)/loans/loading.tsx`, `src/app/(dashboard)/loans/[id]/loading.tsx`, `src/components/loan-dialog.tsx`, `src/components/activity-timeline.tsx`
  - Pre-commit: `npm run build`

---

- [x] 7. Create costs page (`/costs`)

  **What to do**:

  **A) Costs page** — `src/app/(dashboard)/costs/page.tsx`:
  - Server component
  - Fetch active mortgage via `getMortgage()`
  - If no mortgage, redirect to `/`
  - Fetch costs via `getCosts(mortgageId)` and summary via `getCostsSummary(mortgageId)`
  - Display:
    - Page header: "הוצאות נוספות" (Extra Costs) with "הוצאה חדשה" (New Cost) button
    - Summary cards row (4 cards):
      - Total Costs (₪): sum of all cost amounts
      - Paid (₪): sum of all paidAmount values
      - Remaining (₪): total - paid
      - Overdue: count of overdue items (red badge if > 0)
    - Table with columns: Category (Hebrew label), Description, Amount (₪), Paid (₪), Remaining (₪), Due Date, Status (badge with color)
    - Overdue rows: visually flagged (e.g., red border-left or red background tint)
    - Each row has edit + delete action buttons
    - Empty state if no costs
  - Add `loading.tsx` skeleton

  **B) Cost dialog** — `src/components/cost-dialog.tsx`:
  - Client component (Dialog pattern)
  - Form fields:
    - Category: Select dropdown with predefined options from `costCategoryLabels` + "אחר" (Other) option
    - If "Other" selected: show text input for custom category name
    - Description (text, optional)
    - Amount (number, required)
    - Paid Amount (number, default 0)
    - Due Date (date input, optional)
    - Notes (textarea, optional)
  - Status auto-calculated from paidAmount vs amount (shown as read-only badge)
  - Create mode: calls `createCost()`
  - Edit mode: pre-fills, calls `updateCost()`
  - Toast notifications

  **C) "Mark as Paid" quick action**:
  - On each cost row, add a quick "Mark Paid" button (or checkbox)
  - Calls `updateCost(id, { paidAmount: amount })` → auto-sets status to "fully_paid"
  - Provides instant feedback without opening the full edit dialog

  **Must NOT do**:
  - Do NOT create a separate categories management page
  - Do NOT add recurring cost support
  - Do NOT add cost attachments (receipts, invoices)

  **Parallelizable**: YES (with Task 6 — both depend on different actions)

  **References**:
  - `src/app/(dashboard)/contacts/page.tsx` — List page with dialog CRUD pattern
  - `src/components/contact-dialog.tsx` — Dialog form pattern
  - `src/components/delete-button.tsx` — Delete confirmation button pattern
  - `src/lib/constants.ts` — costCategoryLabels, costPaymentStatusLabels, costPaymentStatusColors

  **Acceptance Criteria**:
  - [x] `/costs` page shows list of all extra costs for active mortgage
  - [x] Summary cards show correct totals (total, paid, remaining, overdue count)
  - [x] "New Cost" button opens dialog → creates cost → appears in list
  - [x] Category select shows Hebrew labels with "Other" custom option
  - [x] Status auto-calculated from paid vs total amount
  - [x] Overdue costs visually flagged (past due date + not fully paid)
  - [x] "Mark Paid" quick action works
  - [x] Edit dialog pre-fills all fields
  - [x] Delete removes cost with confirmation
  - [x] Empty state displayed when no costs exist
  - [x] `npm run build` passes

  **Commit**: YES
  - Message: `feat(costs): add extra costs page with CRUD, overdue flagging, and summary`
  - Files: `src/app/(dashboard)/costs/page.tsx`, `src/app/(dashboard)/costs/loading.tsx`, `src/components/cost-dialog.tsx`
  - Pre-commit: `npm run build`

---

- [x] 8. Create timeline page (`/timeline`) with horizontal timeline + calendar view

  **What to do**:

  **A) Install shadcn Calendar component**:
  - Run: `npx shadcn@latest add calendar`
  - This installs react-day-picker (likely already a peer dep) + the Calendar UI component

  **B) Timeline page** — `src/app/(dashboard)/timeline/page.tsx`:
  - Server component
  - Fetch active mortgage via `getMortgage()`
  - If no mortgage, redirect to `/`
  - Fetch timeline data via `getTimelineData(mortgageId)`
  - Fetch milestones via `getMilestones(mortgageId)` (for CRUD on milestones)
  - Display:
    - Page header: "ציר זמן" (Timeline) with "אבן דרך חדשה" (New Milestone) button
    - **Summary cards row** (3 cards):
      - Next Payment: nearest upcoming unpaid entry (date + amount)
      - Total Upcoming (₪): sum of unpaid entries
      - Completed: count of paid/completed entries
    - **Tab view** with two tabs:
      1. **Timeline tab**: Horizontal timeline visualization
      2. **Calendar tab**: Calendar view with payment dates
    - **Milestones management** section below: table of milestones with edit/delete

  **C) Horizontal timeline component** — `src/components/payment-timeline.tsx`:
  - Client component
  - Receives timeline entries array (from `getTimelineData`)
  - Visual: horizontal scrollable timeline with:
    - A horizontal line (the timeline axis)
    - Dots/nodes on the line for each event, positioned by date
    - Each node shows: date, name, amount, type icon, paid/unpaid indicator
    - Color coding: green = paid, red = overdue, blue = upcoming, gray = future
    - Type icons: 🏠 milestone, 💰 cost, 🏦 loan start
    - Today marker on the timeline
  - Built with pure CSS/Tailwind (flexbox with overflow-x-auto)
  - No heavy charting library
  - Responsive: scrollable on mobile

  **D) Calendar view component** — `src/components/payment-calendar.tsx`:
  - Client component
  - Uses shadcn Calendar component
  - Highlights dates that have payments:
    - Green dot = paid
    - Red dot = overdue
    - Blue dot = upcoming
  - Clicking a date shows the entries for that date in a popover or side panel
  - Shows month navigation
  - Below calendar: list of entries for selected date (or current month)

  **E) Milestone dialog** — `src/components/milestone-dialog.tsx`:
  - Client component (Dialog pattern)
  - Form fields:
    - Name: text input with suggested presets (חתימת חוזה, תשלום 30 יום, תשלום 60 יום, מסירת מפתח, תחילת משכנתא) as a select-or-type pattern
    - Amount (number, required)
    - Date (date input, required)
    - Paid checkbox (boolean)
    - Notes (textarea, optional)
  - Create/Edit modes
  - Toast notifications

  **Must NOT do**:
  - Do NOT install D3, Chart.js, Recharts, or any heavy visualization library
  - Do NOT make timeline entries editable inline — edit the source (milestone/cost/loan) instead
  - Do NOT show monthly recurring loan payments on timeline (too many entries)
  - Do NOT build a full Gantt chart

  **Parallelizable**: NO (depends on Task 5, and benefits from Tasks 3, 4 for complete data)

  **References**:
  - `src/app/(dashboard)/offers/page.tsx` — Page pattern with server component
  - `src/components/activity-timeline.tsx` — Timeline component pattern (but this is vertical — new one is horizontal)
  - shadcn Calendar docs: https://ui.shadcn.com/docs/components/calendar
  - `src/components/ui/tabs.tsx` — Tabs component for switching views
  - `src/lib/constants.ts` — milestoneTypePresets for suggested names

  **Acceptance Criteria**:
  - [ ] `/timeline` page loads with timeline data from all sources (milestones, costs, loans)
  - [ ] Horizontal timeline shows events positioned by date with color coding
  - [ ] Today marker visible on timeline
  - [ ] Calendar view highlights dates with payments
  - [ ] Clicking a calendar date shows entries for that date
  - [ ] "New Milestone" button opens dialog → creates milestone
  - [ ] Milestones table shows all milestones with edit/delete
  - [ ] Summary cards show next payment, total upcoming, completed count
  - [ ] Timeline scrolls horizontally for many events
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(timeline): add payment timeline page with horizontal view and calendar`
  - Files: `src/app/(dashboard)/timeline/page.tsx`, `src/app/(dashboard)/timeline/loading.tsx`, `src/components/payment-timeline.tsx`, `src/components/payment-calendar.tsx`, `src/components/milestone-dialog.tsx`, `src/components/ui/calendar.tsx`
  - Pre-commit: `npm run build`

---

- [x] 9. Add dashboard summary cards for loans and costs

  **What to do**:

  **A) Update `getDashboardData()`** in `src/app/actions/mortgage.ts`:
  - Add to the returned stats:
    - `totalLoansAmount`: sum of all loan amounts
    - `totalMonthlyRepayments`: sum of all loan monthly repayments
    - `activeLoansCount`: count of loans with status "received" or "repaying"
    - `totalCostsAmount`: sum of all extra cost amounts
    - `totalCostsPaid`: sum of all extra cost paidAmount values
    - `costsRemaining`: totalCostsAmount - totalCostsPaid
    - `overdueCostsCount`: count of overdue costs
    - `nextPaymentDue`: nearest upcoming payment (from milestones + costs with due dates, unpaid)

  **B) Update dashboard page** — `src/app/(dashboard)/page.tsx`:
  - Add a new section below existing stats grid:
    - Section title: "מימון והוצאות" (Financing & Costs)
    - 4 new summary cards:
      1. **הלוואות פעילות** (Active Loans): count + total monthly repayments
      2. **סה"כ הלוואות** (Total Loans): total loans amount (₪)
      3. **הוצאות נותרות** (Remaining Costs): remaining costs (₪) + overdue badge
      4. **תשלום הבא** (Next Payment): date + amount of nearest upcoming payment
  - Cards should link to their respective pages (`/loans`, `/costs`, `/timeline`)

  **Must NOT do**:
  - Do NOT restructure existing dashboard cards
  - Do NOT move existing stats
  - Do NOT add charts or graphs to dashboard

  **Parallelizable**: NO (depends on Tasks 3, 4, 5 for data)

  **References**:
  - `src/app/(dashboard)/page.tsx:54-80` — Existing stats cards grid pattern
  - `src/app/actions/mortgage.ts:72-108` — getDashboardData function to extend
  - `src/db/schema.ts` — loans, extra_costs tables for queries

  **Acceptance Criteria**:
  - [ ] Dashboard shows new "Financing & Costs" section with 4 summary cards
  - [ ] Active Loans card shows correct count and monthly repayment total
  - [ ] Total Loans card shows correct total
  - [ ] Remaining Costs card shows correct amount with overdue badge if applicable
  - [ ] Next Payment card shows nearest upcoming payment date and amount
  - [ ] Cards link to respective pages
  - [ ] Existing dashboard content unchanged
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(dashboard): add financing and costs summary cards`
  - Files: `src/app/(dashboard)/page.tsx`, `src/app/actions/mortgage.ts`
  - Pre-commit: `npm run build`

---

- [x] 10. Update sidebar navigation with new pages

  **What to do**:

  **A) Update `src/components/app-sidebar.tsx`**:
  - Add 3 new nav items to the navigation array:
    1. **הלוואות** (Loans) — `Landmark` icon from lucide-react — href: `/loans`
    2. **הוצאות** (Costs) — `Receipt` icon from lucide-react — href: `/costs`
    3. **ציר זמן** (Timeline) — `CalendarDays` icon from lucide-react — href: `/timeline`
  - Position: after "Bank Offers" and before "Contacts" (logical grouping: offers → loans → costs → timeline → contacts → members)
  - Or group with a visual separator: financial tracking items together

  **Must NOT do**:
  - Do NOT restructure existing nav items
  - Do NOT add sub-navigation or collapsible groups
  - Do NOT change icons for existing nav items

  **Parallelizable**: NO (all pages must exist first)

  **References**:
  - `src/components/app-sidebar.tsx:20-26` — Existing nav items array (Dashboard, Bank Offers, Contacts, Members)
  - lucide-react icons: Landmark, Receipt, CalendarDays

  **Acceptance Criteria**:
  - [ ] Sidebar shows 7 nav items: Dashboard, Bank Offers, Loans, Costs, Timeline, Contacts, Members
  - [ ] New items use appropriate Hebrew labels
  - [ ] New items have distinct icons
  - [ ] Clicking each nav item navigates to correct page
  - [ ] Active state highlighting works for new items
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(nav): add loans, costs, and timeline to sidebar navigation`
  - Files: `src/components/app-sidebar.tsx`
  - Pre-commit: `npm run build`

---

- [x] 11. Final build verification + push to deploy

  **What to do**:
  - Run `npm run build` — must pass with zero errors
  - Verify all routes appear in build output: `/loans`, `/loans/[id]`, `/costs`, `/timeline`
  - Run manual QA:
    - Dashboard loads with new summary cards section (empty but no errors)
    - Create a loan → appears in loans list → click into detail → add activity message
    - Edit loan status → verify status change event in activity
    - Create extra costs (predefined + custom category) → appears in costs list
    - Mark a cost as paid → status updates
    - Create payment milestones → appear on timeline
    - Timeline shows horizontal view with milestones
    - Calendar view shows payment dates
    - Sidebar nav works for all new pages
    - Test with a household member (if possible) — verify they can see all new data
  - Git add all, commit, push
  - Verify Vercel auto-deploy succeeds

  **Must NOT do**:
  - Do NOT force push

  **Parallelizable**: NO (final step)

  **References**:
  - All files from Tasks 1-10

  **Acceptance Criteria**:
  - [ ] `npm run build` → 0 errors
  - [ ] All new routes visible in build output
  - [ ] All manual QA scenarios pass
  - [ ] Pushed to remote, Vercel deploy succeeds
  - [ ] Production site works at https://mortgage.benhaims.net
  - [ ] All new pages accessible and functional

  **Commit**: YES (if any uncommitted changes remain)
  - Message: `chore: final verification for financial tracking feature`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(db): add loans, extra_costs, and payment_milestones tables` | schema.ts, migration SQL | build + verify tables |
| 2 | `feat(constants): add loan, cost, and milestone labels and colors` | constants.ts | build |
| 3 | `feat(loans): add loan CRUD and activity server actions` | loans.ts | build |
| 4 | `feat(costs): add extra cost CRUD and summary server actions` | costs.ts | build |
| 5 | `feat(milestones): add milestone CRUD and timeline aggregation actions` | milestones.ts | build |
| 6 | `feat(loans): add loans list page, detail page, and loan dialog` | pages, components | build |
| 7 | `feat(costs): add extra costs page with CRUD, overdue flagging, and summary` | pages, components | build |
| 8 | `feat(timeline): add payment timeline page with horizontal view and calendar` | pages, components | build |
| 9 | `feat(dashboard): add financing and costs summary cards` | page.tsx, mortgage.ts | build |
| 10 | `feat(nav): add loans, costs, and timeline to sidebar navigation` | app-sidebar.tsx | build |
| 11 | Push all to deploy | — | build + full QA |

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: zero errors
```

### Final Checklist
- [ ] Loans: CRUD with all fields (amount, lender, rate, monthly, term, start, status)
- [ ] Loans: Activity timeline per loan (messages + status changes)
- [ ] Costs: CRUD with categories (predefined + custom) and paid/due tracking
- [ ] Costs: Overdue flagging (visual indicator)
- [ ] Costs: Summary totals (total, paid, remaining, overdue count)
- [ ] Milestones: CRUD with name, amount, date, paid status
- [ ] Timeline: Horizontal view with all sources (milestones, costs, loan starts)
- [ ] Timeline: Calendar view with payment date highlights
- [ ] Dashboard: Summary cards for loans + costs
- [ ] Sidebar: 3 new nav items (Loans, Costs, Timeline)
- [ ] Household members can see all new data
- [ ] Hebrew labels throughout
- [ ] `npm run build` passes
- [ ] Deployed and working on production
