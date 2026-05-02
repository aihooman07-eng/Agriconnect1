CREATE TYPE "public"."farm_status" AS ENUM('pending', 'live', 'rejected');--> statement-breakpoint
CREATE TABLE "coordinators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coordinators_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "farmers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farmers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"status" "farm_status" DEFAULT 'pending' NOT NULL,
	"reject_reason" text,
	"name" text NOT NULL,
	"short_description" text NOT NULL,
	"story" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"dairy" boolean DEFAULT false NOT NULL,
	"crops" boolean DEFAULT false NOT NULL,
	"poultry" boolean DEFAULT false NOT NULL,
	"organic" boolean DEFAULT false NOT NULL,
	"school_friendly" boolean DEFAULT false NOT NULL,
	"primary_image_url" text,
	"visitor_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"visitor_name" text NOT NULL,
	"visitor_email" text NOT NULL,
	"visitor_phone" text,
	"visitor_message" text NOT NULL,
	"is_school" boolean DEFAULT false NOT NULL,
	"institution_name" text,
	"student_count" integer,
	"age_range" text,
	"adult_count" integer,
	"learning_themes" text,
	"preferred_dates" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid,
	"coordinator_id" uuid,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_coordinator_id_coordinators_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."coordinators"("id") ON DELETE no action ON UPDATE no action;