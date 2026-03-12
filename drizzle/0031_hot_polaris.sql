CREATE TYPE "public"."team_stage" AS ENUM('NOT_SELECTED', 'SEMI_SELECTED', 'SELECTED');--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "payment_screenshot_url" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "team_stage" "team_stage" DEFAULT 'NOT_SELECTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "razorpay_order_id";--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "razorpay_payment_id";--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "razorpay_signature";