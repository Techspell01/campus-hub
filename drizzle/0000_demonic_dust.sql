CREATE TYPE "public"."accent" AS ENUM('violet', 'cyan', 'rose', 'amber', 'emerald', 'indigo');--> statement-breakpoint
CREATE TYPE "public"."announcement_level" AS ENUM('urgent', 'info', 'success');--> statement-breakpoint
CREATE TYPE "public"."coordinator_role" AS ENUM('faculty', 'main', 'sub');--> statement-breakpoint
CREATE TYPE "public"."duty_area" AS ENUM('Stage Management', 'Discipline', 'Refreshment', 'Technical', 'Hospitality', 'Registration', 'Media & Coverage');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'coordinator');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('valid', 'used', 'revoked');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"level" "announcement_level" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"accent" "accent" DEFAULT 'violet' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coordinators" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"role" "coordinator_role" DEFAULT 'sub' NOT NULL,
	"duty_area" "duty_area",
	"phone" text,
	"email" text,
	"accent" "accent" DEFAULT 'violet' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duty_check_ins" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"volunteer_id" text NOT NULL,
	"volunteer_name" text NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duty_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"duty_area" "duty_area" NOT NULL,
	"created_by" text,
	"created_by_name" text NOT NULL,
	"secret" text NOT NULL,
	"opens_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"expected_volunteers" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"club_id" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"accent" "accent" DEFAULT 'violet' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capacity" integer,
	"is_flagship" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"holder_name" text NOT NULL,
	"status" "ticket_status" DEFAULT 'valid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone,
	"admitted_by" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "role" DEFAULT 'student' NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordinators" ADD CONSTRAINT "coordinators_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_check_ins" ADD CONSTRAINT "duty_check_ins_session_id_duty_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."duty_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_check_ins" ADD CONSTRAINT "duty_check_ins_volunteer_id_users_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_sessions" ADD CONSTRAINT "duty_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_sessions" ADD CONSTRAINT "duty_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_admitted_by_users_id_fk" FOREIGN KEY ("admitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_posted_idx" ON "announcements" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_slug_idx" ON "clubs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "coordinators_event_idx" ON "coordinators" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "duty_check_ins_unique" ON "duty_check_ins" USING btree ("session_id","volunteer_id");--> statement-breakpoint
CREATE INDEX "duty_check_ins_session_idx" ON "duty_check_ins" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "duty_sessions_event_idx" ON "duty_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_code_idx" ON "tickets" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_event_user_idx" ON "tickets" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "tickets_user_idx" ON "tickets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");