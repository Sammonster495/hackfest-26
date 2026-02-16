-- Enum types required by the tables below
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM (
      'Solo', 'Team'
  );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM (
      'Draft', 'Published', 'Ongoing', 'Completed'
    );
  END IF;

END
$$;
--> statement-breakpoint

ALTER TABLE "event" RENAME COLUMN "team_size" TO "max_teams";--> statement-breakpoint
DROP INDEX "event_team_size_idx";--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "date" TYPE timestamp USING "date"::timestamp;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "venue" text NOT NULL;
ALTER TABLE "event" ADD COLUMN "deadline" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "event_type" "event_type" DEFAULT 'Solo' NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "event_status" "event_status" DEFAULT 'Draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "min_team_size" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "max_team_size" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "event_deadline_idx" ON "event" USING btree ("deadline");
