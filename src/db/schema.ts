import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  pgEnum,
  jsonb,
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
  eventType: eventTypeEnum("event_type").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mortgagesRelations = relations(mortgages, ({ many }) => ({
  bankOffers: many(bankOffers),
  contacts: many(contacts),
  activityEvents: many(activityEvents),
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
