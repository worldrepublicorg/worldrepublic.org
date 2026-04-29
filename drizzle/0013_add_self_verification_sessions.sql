CREATE TABLE "self_verification_sessions" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(16) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"last_error" text
);
--> statement-breakpoint
ALTER TABLE "self_verification_sessions" ADD CONSTRAINT "self_verification_sessions_user_id_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "self_verification_sessions_user_idx" ON "self_verification_sessions" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "self_verification_sessions_expires_idx" ON "self_verification_sessions" USING btree ("expires_at");
