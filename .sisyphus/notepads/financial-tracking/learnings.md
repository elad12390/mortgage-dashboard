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
