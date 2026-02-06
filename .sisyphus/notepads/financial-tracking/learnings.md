# Learnings & Conventions

## [INIT] Session Started
- Plan: financial-tracking
- Tasks: 11 total (sequential with parallelizable groups: 3-4-5, 6-7)
- Session: ses_3cd24bbb6ffeSWvsgyrfCSOgIB
- Started: 2026-02-06T17:35:51.247Z

## Context
Adding financial tracking to mortgage dashboard: loans (for 25% down payment), extra costs (lawyer, tax, renovation, etc.), payment timeline (horizontal + calendar view)

## Task 1: Database Schema - COMPLETED ✓

### What was done
1. Added pgEnums: `loanStatusEnum` (pending, approved, received, repaying, completed) and `costPaymentStatusEnum` (unpaid, partially_paid, fully_paid)
2. Added 3 new tables:
   - `loans`: id, mortgageId, lenderName, amount, interestRate, monthlyRepayment, termMonths, startDate, status, createdAt, updatedAt
   - `extra_costs`: id, mortgageId, category, description, amount, paidAmount, dueDate, status, notes, createdAt, updatedAt
   - `payment_milestones`: id, mortgageId, name, amount, date, isPaid, notes, createdAt
3. Extended `activity_events` with `loanId` FK (nullable, cascade delete)
4. Added relations:
   - `loansRelations`: one(mortgages), many(activityEvents)
   - `extraCostsRelations`: one(mortgages)
   - `paymentMilestonesRelations`: one(mortgages)
   - Updated `mortgagesRelations` to include loans, extraCosts, paymentMilestones
   - Updated `activityEventsRelations` to include loan
5. Added type exports: Loan, NewLoan, ExtraCost, NewExtraCost, PaymentMilestone, NewPaymentMilestone
6. Generated migration: `drizzle/0005_medical_psylocke.sql`
7. Applied migration successfully

### Verification Results
- ✓ Migration generated and applied without errors
- ✓ All 10 tables exist in database (verified via SQL query)
- ✓ activity_events has loan_id column (verified via SQL query)
- ✓ npm run build passes with zero errors
- ✓ All type exports available for use in server actions

### Key Patterns Used
- pgEnum pattern for status enums (matching existing offerStatusEnum, trackTypeEnum)
- FK with cascade delete pattern (matching existing tables)
- Relations pattern with one() and many() (matching existing relations)
- Type inference with $inferSelect/$inferInsert (matching existing types)

### Next Steps
- Task 2: Add constants for loan statuses, cost categories, cost payment statuses, milestone types
- Task 3-5: Create server actions for loans, costs, milestones

## [2026-02-06 17:50] Task 1: Database Schema - COMPLETE

**What was done:**
- Added 2 pgEnums: loanStatusEnum (5 values), costPaymentStatusEnum (3 values)
- Added 3 tables: loans (11 columns), extra_costs (11 columns), payment_milestones (8 columns)
- Extended activity_events with loanId FK (nullable, cascade delete)
- Added 3 relations: loansRelations, extraCostsRelations, paymentMilestonesRelations
- Updated mortgagesRelations to include loans, extraCosts, paymentMilestones
- Updated activityEventsRelations to include loan
- Added 6 type exports: Loan, NewLoan, ExtraCost, NewExtraCost, PaymentMilestone, NewPaymentMilestone
- Generated migration: drizzle/0005_medical_psylocke.sql
- Applied migration successfully

**Verification:**
- ✅ lsp_diagnostics clean on src/db/schema.ts
- ✅ npm run build passes (0 errors)
- ✅ All 10 tables exist in database
- ✅ activity_events has loan_id column

**Session:** ses_3cbee5d8bffeHH1R2jLTQyt0ZB

**Files changed:**
- src/db/schema.ts (+95 lines)
- drizzle/0005_medical_psylocke.sql (new migration)
- drizzle/meta/_journal.json (updated)

**Ready for:** Task 2 (constants)

## Task 2: Constants for Financial Tracking - COMPLETED ✓

**What was done:**
- Added 6 new constant objects to `src/lib/constants.ts`:
  1. `loanStatusLabels`: Record<string, string> - 5 Hebrew labels (pending, approved, received, repaying, completed)
  2. `loanStatusColors`: Record<string, string> - 5 color values (gray, blue, green, yellow, purple)
  3. `costCategoryLabels`: Record<string, string> - 8 Hebrew labels (lawyer, purchase_tax, renovation, broker, appraisal, moving, insurance, other)
  4. `costPaymentStatusLabels`: Record<string, string> - 3 Hebrew labels (unpaid, partially_paid, fully_paid)
  5. `costPaymentStatusColors`: Record<string, string> - 3 color values (red, yellow, green)
  6. `milestoneTypePresets`: Record<string, string> - 6 Hebrew labels (contract_signing, payment_30_days, payment_60_days, key_handover, mortgage_start, custom)

**Verification:**
- ✅ All constants follow existing pattern (TRACK_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS)
- ✅ All Hebrew labels use Israeli financial terminology
- ✅ npm run build passes (0 errors, compiled successfully in 1208.6ms)
- ✅ TypeScript compilation successful

**Files changed:**
- src/lib/constants.ts (+57 lines, 6 new exports)

**Ready for:** Task 3 (server actions for loans)

## Task 5: Milestones Server Actions + Timeline Aggregation - COMPLETED ✓

**What was done:**
- Added `src/app/actions/milestones.ts` with 5 server actions for milestones CRUD and timeline aggregation.
- Implemented access control using `requireUserId()` + `verifyMortgageAccess()`.
- Timeline aggregation merges payment milestones, extra costs (with dueDate), and loan start dates into consistent entries.

**Verification:**
- ✅ lsp_diagnostics clean on src/app/actions/milestones.ts
- ✅ npm run build passes (0 errors)

**Files changed:**
- src/app/actions/milestones.ts (new)

## [2026-02-06 19:05] Task 3: Loans Server Actions - COMPLETE

**What was done:**
- Added `src/app/actions/loans.ts` with 8 server actions for loan CRUD + activity events.
- Implemented access control using `requireUserId()` + `verifyMortgageAccess()` for all actions.
- Logged status change activity events with metadata `{ oldStatus, newStatus }`.

**Verification:**
- ✅ lsp_diagnostics clean on src/app/actions/loans.ts
- ✅ npm run build passes (warnings only)

## [2026-02-06 19:45] Task 4: Costs Server Actions - COMPLETE

**What was done:**
- Added `src/app/actions/costs.ts` with CRUD + summary actions for extra costs.
- Implemented status auto-calculation from paidAmount vs amount for create/update.
- Summary computes totals plus overdue/upcoming counts based on dueDate and status.

**Verification:**
- ✅ lsp_diagnostics clean on src/app/actions/costs.ts
- ✅ npm run build passes (warnings only)

## [2026-02-06 21:30] Task 6: Loans Pages - PARTIAL COMPLETE

**What was done:**
- Created `src/app/(dashboard)/loans/page.tsx` - Loans list page with:
  - 3 summary cards: Total Loans Amount, Total Monthly Repayments, Active Loans Count
  - Table with columns: Lender Name, Amount, Interest Rate, Monthly Payment, Term, Status (badge), Start Date
  - Each row links to `/loans/[id]`
  - Empty state for no loans
  - Hebrew labels throughout
- Created `src/app/(dashboard)/loans/loading.tsx` - Loading skeleton matching list page structure
- Created `src/app/(dashboard)/loans/[id]/page.tsx` - Loan detail page with:
  - Header with lender name, status badge, delete button
  - 4 summary cards: Amount, Interest Rate, Monthly Payment, Term
  - Tabs: Activity (placeholder), Details (full loan info)
  - Hebrew labels throughout

**Verification:**
- ✅ npm run build passes (0 errors, compiled successfully)
- ✅ All routes appear in build output: /loans, /loans/[id]
- ✅ No LSP errors

**Files changed:**
- src/app/(dashboard)/loans/page.tsx (new, 175 lines)
- src/app/(dashboard)/loans/loading.tsx (new, 49 lines)
- src/app/(dashboard)/loans/[id]/page.tsx (new, 212 lines)

**Still TODO for Task 6:**
- Loan dialog component (src/components/loan-dialog.tsx) for create/edit
- Modify ActivityTimeline component to support loanId prop
- Add loading skeleton for detail page

**Notes:**
- loans table does NOT have a notes field (only lenderName, amount, interestRate, monthlyRepayment, termMonths, startDate, status)
- ActivityTimeline currently expects events prop, needs modification to accept loanId and fetch events internally
- Activity tab shows placeholder until ActivityTimeline is modified

**Ready for:** Complete Task 6 (dialog + ActivityTimeline modification) OR proceed to Task 7 (costs page)

## [2026-02-06 22:15] Task 6: Loan Dialog Component - COMPLETE

**What was done:**
- Created `src/components/loan-dialog.tsx` following exact pattern from `contact-dialog.tsx`
- Implemented controlled inputs with useState for all 7 fields
- Supports both create mode (no loan prop) and edit mode (loan prop provided)
- Form fields with Hebrew labels:
  - lenderName: "שם מלווה" (required)
  - amount: "סכום (₪)" (required)
  - interestRate: "ריבית שנתית (%)" (optional)
  - monthlyRepayment: "תשלום חודשי (₪)" (optional)
  - termMonths: "תקופה (חודשים)" (optional)
  - startDate: "תאריך התחלה" (optional)
  - status: "סטטוס" (required, dropdown with loanStatusLabels)
- Button text:
  - Create trigger: "הלוואה חדשה"
  - Edit trigger: Pencil icon (or children prop)
  - Submit: "שמור"
- Calls createLoan/updateLoan server actions from loans.ts
- Toast notifications: "ההלוואה נשמרה בהצלחה" (success), "שגיאה בשמירת ההלוואה" (error)
- Closes dialog on successful save

**Key Implementation Details:**
- Numeric fields (amount, interestRate, monthlyRepayment) stored as strings in DB (Drizzle numeric type)
- Passed as strings to server actions (no parseFloat conversion)
- termMonths converted to integer for DB storage
- startDate converted to Date object for DB storage
- Status field uses type assertion to satisfy TypeScript union type
- Select onValueChange handler casts string to loan status union type

**Verification:**
- ✅ lsp_diagnostics clean (no errors)
- ✅ npm run build passes (0 errors, compiled in 1301.9ms)
- ✅ All routes appear in build output: /loans, /loans/[id]

**Files changed:**
- src/components/loan-dialog.tsx (new, 186 lines)

**Pattern Consistency:**
- Follows contact-dialog.tsx exactly:
  - "use client" directive
  - Controlled inputs with useState
  - DialogTrigger renders button (create) or children (edit)
  - handleSubmit calls server action + toast
  - Close dialog on success
  - No react-hook-form or Zod validation

**Ready for:** Task 7 (costs pages) or Task 8 (costs dialog)

## [2026-02-06 22:45] Task 6: ActivityTimeline Component - loanId Support - COMPLETE

**What was done:**
- Modified `src/components/activity-timeline.tsx` to support optional `loanId` prop
- Updated ActivityTimelineProps interface to include `loanId?: string`
- Added imports: `addLoanMessage`, `deleteLoanMessage` from `src/app/actions/loans`
- Modified `handleSubmit()` to use conditional logic:
  - If `loanId` provided: calls `addLoanMessage(loanId, content, createdAt)`
  - If `offerId` provided: calls existing `addMessage({ mortgageId, offerId }, content, customDate)`
  - Converts customDate string to Date object for loan messages (matches addLoanMessage signature)
- Modified `handleDelete()` to use conditional logic:
  - If `loanId` provided: calls `deleteLoanMessage(eventId)`
  - Otherwise: calls existing `deleteMessage(eventId)`
- Kept all existing offerId functionality unchanged
- No visual changes or event display logic modifications

**Key Implementation Details:**
- Component remains client-side ("use client")
- Conditional logic based on prop presence (loanId takes precedence in logic flow)
- Date handling: customDate string → Date object for loan messages (addLoanMessage expects Date)
- Existing offerId path unchanged: still uses customDate string (addMessage expects string)
- Events display logic unchanged: component still receives events prop and renders them identically

**Verification:**
- ✅ lsp_diagnostics clean on src/components/activity-timeline.tsx (0 errors, 0 warnings)
- ✅ npm run build passes (0 errors, compiled in 1230.8ms)
- ✅ All routes appear in build output: /loans, /loans/[id], /offers, /offers/[id]
- ✅ No TypeScript errors or warnings

**Files changed:**
- src/components/activity-timeline.tsx (+3 lines: 1 import, 1 prop, 2 conditional branches)

**Pattern Consistency:**
- Follows existing conditional pattern from activity.ts (if offerId else if mortgageId)
- Reuses existing server action pattern (call from event handlers)
- Maintains backward compatibility: offerId path works exactly as before

**Ready for:** Task 7 (costs pages) or complete Task 6 (integrate ActivityTimeline into loan detail page)

## [2026-02-06 23:00] Task 6: Loan Detail Loading Skeleton - COMPLETE

**What was done:**
- Created `src/app/(dashboard)/loans/[id]/loading.tsx` - Loading skeleton for loan detail page
- Matches structure of loan detail page:
  - Header section: back button skeleton, title skeleton, badge + date skeleton, delete button skeleton
  - 4 summary cards (grid: sm:grid-cols-2 lg:grid-cols-4) with CardHeader + CardContent skeletons
  - Tabs section: 2 tab triggers (Activity, Details) + Card with content skeleton
- Follows pattern from `src/app/(dashboard)/offers/[id]/loading.tsx`
- Uses Skeleton component from `@/components/ui/skeleton`
- Uses Card, CardHeader, CardContent from `@/components/ui/card`

**Verification:**
- ✅ lsp_diagnostics clean (0 errors, 0 warnings)
- ✅ npm run build passes (0 errors, compiled in 1268.3ms)
- ✅ Route /loans/[id] appears in build output as dynamic route

**Files changed:**
- src/app/(dashboard)/loans/[id]/loading.tsx (new, 45 lines)

**Pattern Consistency:**
- Follows offers/[id]/loading.tsx structure exactly
- Header: back button + title + badge + delete button
- Summary cards: 4 cards (vs 2 in offers) matching loan detail page
- Tabs: 2 tabs (Activity, Details) matching loan detail page
- All skeletons use consistent sizing and spacing

**Ready for:** Task 7 (costs pages)
