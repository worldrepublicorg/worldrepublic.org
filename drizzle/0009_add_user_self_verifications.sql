CREATE TABLE "user_self_verifications" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"scope" varchar(64) NOT NULL,
	"self_nullifier" text NOT NULL,
	"self_verified_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_self_verifications" ADD CONSTRAINT "user_self_verifications_user_id_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "user_self_verifications_scope_nullifier_idx" ON "user_self_verifications" USING btree ("scope","self_nullifier");
