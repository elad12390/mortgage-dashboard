CREATE TYPE "public"."cost_payment_status" AS ENUM('unpaid', 'partially_paid', 'fully_paid');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('pending', 'approved', 'received', 'repaying', 'completed');--> statement-breakpoint
CREATE TABLE "extra_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mortgage_id" uuid NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"due_date" timestamp with time zone,
	"status" "cost_payment_status" DEFAULT 'unpaid' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mortgage_id" uuid NOT NULL,
	"lender_name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"interest_rate" numeric(5, 3),
	"monthly_repayment" numeric(12, 2),
	"term_months" integer,
	"start_date" timestamp with time zone,
	"status" "loan_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mortgage_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"is_paid" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD COLUMN "loan_id" uuid;--> statement-breakpoint
ALTER TABLE "extra_costs" ADD CONSTRAINT "extra_costs_mortgage_id_mortgages_id_fk" FOREIGN KEY ("mortgage_id") REFERENCES "public"."mortgages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_mortgage_id_mortgages_id_fk" FOREIGN KEY ("mortgage_id") REFERENCES "public"."mortgages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_milestones" ADD CONSTRAINT "payment_milestones_mortgage_id_mortgages_id_fk" FOREIGN KEY ("mortgage_id") REFERENCES "public"."mortgages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;