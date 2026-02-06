CREATE TABLE "mortgage_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mortgage_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_by_user_id" text,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mortgage_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "mortgage_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mortgage_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mortgage_members_user_id_mortgage_id_unique" UNIQUE("user_id","mortgage_id")
);
--> statement-breakpoint
ALTER TABLE "mortgage_invites" ADD CONSTRAINT "mortgage_invites_mortgage_id_mortgages_id_fk" FOREIGN KEY ("mortgage_id") REFERENCES "public"."mortgages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_members" ADD CONSTRAINT "mortgage_members_mortgage_id_mortgages_id_fk" FOREIGN KEY ("mortgage_id") REFERENCES "public"."mortgages"("id") ON DELETE cascade ON UPDATE no action;