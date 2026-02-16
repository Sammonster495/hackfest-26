-- Enum types required by the tables below
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_audience') THEN
    CREATE TYPE event_audience AS ENUM (
      'Participants', 'Non-Participants', 'Both'
    );
  END IF;

END
$$;
--> statement-breakpoint

ALTER TABLE "event" ADD COLUMN "event_audience" "event_audience" DEFAULT 'Both' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_user" ADD COLUMN "college_id" text;--> statement-breakpoint
ALTER TABLE "event_user" ADD CONSTRAINT "event_user_college_id_college_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."college"("id") ON DELETE set null ON UPDATE no action;
