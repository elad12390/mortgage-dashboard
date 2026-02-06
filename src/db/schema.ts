import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  pgEnum,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const eventTypeEnum = pgEnum("event_type", ["message", "status_change"]);

export const trackTypeEnum = pgEnum("track_type", [
  "prime",
  "fixed_unlinked",
  "fixed_linked",
  "variable_every_5",
  "variable_every_year",
  "variable_linked",
  "other",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "initial_inquiry",
  "in_progress",
  "offer_received",
  "approved",
  "rejected",
  "signed",
  "cancelled",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "pending",
  "approved",
  "received",
  "repaying",
  "completed",
]);

export const costPaymentStatusEnum = pgEnum("cost_payment_status", [
  "unpaid",
  "partially_paid",
  "fully_paid",
]);

export const mortgages = pgTable("mortgages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  propertyValue: numeric("property_value", { precision: 12, scale: 2 }),
  loanAmount: numeric("loan_amount", { precision: 12, scale: 2 }),
  mortgageTermYears: integer("mortgage_term_years"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bankOffers = pgTable("bank_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id")
    .notNull()
    .references(() => mortgages.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  status: requestStatusEnum("status").notNull().default("initial_inquiry"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mortgageTracks = pgTable("mortgage_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => bankOffers.id, { onDelete: "cascade" }),
  trackType: trackTypeEnum("track_type").notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 3 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  periodMonths: integer("period_months").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id").references(() => mortgages.id, { onDelete: "cascade" }),
  offerId: uuid("offer_id").references(() => bankOffers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id").references(() => mortgages.id, { onDelete: "cascade" }),
  offerId: uuid("offer_id").references(() => bankOffers.id, { onDelete: "cascade" }),
  loanId: uuid("loan_id").references(() => loans.id, { onDelete: "cascade" }),
  eventType: eventTypeEnum("event_type").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mortgageMembers = pgTable(
  "mortgage_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mortgageId: uuid("mortgage_id")
      .notNull()
      .references(() => mortgages.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserMortgage: unique().on(table.userId, table.mortgageId),
  })
);

export const mortgageInvites = pgTable("mortgage_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id")
    .notNull()
    .references(() => mortgages.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdByUserId: text("created_by_user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedByUserId: text("used_by_user_id"),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id")
    .notNull()
    .references(() => mortgages.id, { onDelete: "cascade" }),
  lenderName: text("lender_name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 3 }),
  monthlyRepayment: numeric("monthly_repayment", { precision: 12, scale: 2 }),
  termMonths: integer("term_months"),
  startDate: timestamp("start_date", { withTimezone: true }),
  status: loanStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const extraCosts = pgTable("extra_costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id")
    .notNull()
    .references(() => mortgages.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: costPaymentStatusEnum("status").notNull().default("unpaid"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentMilestones = pgTable("payment_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id")
    .notNull()
    .references(() => mortgages.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  isPaid: integer("is_paid").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mortgagesRelations = relations(mortgages, ({ many }) => ({
  bankOffers: many(bankOffers),
  contacts: many(contacts),
  activityEvents: many(activityEvents),
  members: many(mortgageMembers),
  invites: many(mortgageInvites),
  loans: many(loans),
  extraCosts: many(extraCosts),
  paymentMilestones: many(paymentMilestones),
}));

export const bankOffersRelations = relations(bankOffers, ({ one, many }) => ({
  mortgage: one(mortgages, {
    fields: [bankOffers.mortgageId],
    references: [mortgages.id],
  }),
  tracks: many(mortgageTracks),
  contacts: many(contacts),
  activityEvents: many(activityEvents),
}));

export const mortgageTracksRelations = relations(mortgageTracks, ({ one }) => ({
  offer: one(bankOffers, {
    fields: [mortgageTracks.offerId],
    references: [bankOffers.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  mortgage: one(mortgages, {
    fields: [contacts.mortgageId],
    references: [mortgages.id],
  }),
  offer: one(bankOffers, {
    fields: [contacts.offerId],
    references: [bankOffers.id],
  }),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  mortgage: one(mortgages, {
    fields: [activityEvents.mortgageId],
    references: [mortgages.id],
  }),
  offer: one(bankOffers, {
    fields: [activityEvents.offerId],
    references: [bankOffers.id],
  }),
  loan: one(loans, {
    fields: [activityEvents.loanId],
    references: [loans.id],
  }),
}));

export const mortgageMembersRelations = relations(mortgageMembers, ({ one }) => ({
  mortgage: one(mortgages, {
    fields: [mortgageMembers.mortgageId],
    references: [mortgages.id],
  }),
}));

export const mortgageInvitesRelations = relations(mortgageInvites, ({ one }) => ({
  mortgage: one(mortgages, {
    fields: [mortgageInvites.mortgageId],
    references: [mortgages.id],
  }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  mortgage: one(mortgages, {
    fields: [loans.mortgageId],
    references: [mortgages.id],
  }),
  activityEvents: many(activityEvents),
}));

export const extraCostsRelations = relations(extraCosts, ({ one }) => ({
  mortgage: one(mortgages, {
    fields: [extraCosts.mortgageId],
    references: [mortgages.id],
  }),
}));

export const paymentMilestonesRelations = relations(paymentMilestones, ({ one }) => ({
  mortgage: one(mortgages, {
    fields: [paymentMilestones.mortgageId],
    references: [mortgages.id],
  }),
}));

export type Mortgage = typeof mortgages.$inferSelect;
export type NewMortgage = typeof mortgages.$inferInsert;
export type BankOffer = typeof bankOffers.$inferSelect;
export type NewBankOffer = typeof bankOffers.$inferInsert;
export type MortgageTrack = typeof mortgageTracks.$inferSelect;
export type NewMortgageTrack = typeof mortgageTracks.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;
export type MortgageMember = typeof mortgageMembers.$inferSelect;
export type NewMortgageMember = typeof mortgageMembers.$inferInsert;
export type MortgageInvite = typeof mortgageInvites.$inferSelect;
export type NewMortgageInvite = typeof mortgageInvites.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type ExtraCost = typeof extraCosts.$inferSelect;
export type NewExtraCost = typeof extraCosts.$inferInsert;
export type PaymentMilestone = typeof paymentMilestones.$inferSelect;
export type NewPaymentMilestone = typeof paymentMilestones.$inferInsert;
