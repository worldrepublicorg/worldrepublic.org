CREATE TABLE "multipass_dev_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(16) NOT NULL,
	"nullifier" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "multipass_dev_sessions_expires_idx" ON "multipass_dev_sessions" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "multipass_dev_sessions_status_idx" ON "multipass_dev_sessions" USING btree ("status");
