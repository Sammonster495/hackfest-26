CREATE TABLE "site-settings" (
	"id" text PRIMARY KEY NOT NULL,
	"registrations_open" boolean DEFAULT false,
	"results_out" boolean DEFAULT false,
	"payment_open" boolean DEFAULT false
);
