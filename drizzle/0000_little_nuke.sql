CREATE TYPE "public"."request_status" AS ENUM('initial_inquiry', 'in_progress', 'offer_received', 'approved', 'rejected', 'signed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."track_type" AS ENUM('prime', 'fixed_unlinked', 'fixed_linked', 'variable_every_5', 'variable_every_year', 'variable_linked', 'other');--> statement-breakpoint
CREATE TABLE "bank_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mortgage_id" uuid NOT NULL,
	"bank_name" text NOT NULL,
	"status" "request_status" DEFAULT 'initial_inquiry' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mortgage_id" uuid,
	"offer_id" uuid,
	"name" text NOT NULL,
	"role" text,
	"phone" text,
	"email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mortgage_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"track_type" "track_type" NOT NULL,
	"interest_rate" numeric(5, 3) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"period_months" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mortgages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_value" numeric(12, 2),
	"loan_amount" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_offers" ADD CONSTRAINT "bank_offers_mortgage_id_mortgages_id_fk" FOREIGN KEY ("mortgage_id") REFERENCES "public"."mortgages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_mortgage_id_mortgages_id_fk" FOREIGN KEY ("mortgage_id") REFERENCES "public"."mortgages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_offer_id_bank_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."bank_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_tracks" ADD CONSTRAINT "mortgage_tracks_offer_id_bank_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."bank_offers"("id") ON DELETE cascade ON UPDATE no action;