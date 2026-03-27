CREATE TABLE "referral_verification_rewards" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "referral_verification_rewards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"referrer_id" uuid NOT NULL,
	"referred_user_id" uuid NOT NULL,
	"scope" varchar(64) NOT NULL,
	"self_nullifier" text NOT NULL,
	"reward_type" varchar(64) NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referral_verification_rewards" ADD CONSTRAINT "referral_verification_rewards_referrer_id_users_uuid_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "referral_verification_rewards" ADD CONSTRAINT "referral_verification_rewards_referred_user_id_users_uuid_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "ref_verif_rewards_scope_nullifier_type_idx" ON "referral_verification_rewards" USING btree ("scope","self_nullifier","reward_type");
--> statement-breakpoint
CREATE INDEX "ref_verif_rewards_referrer_created_idx" ON "referral_verification_rewards" USING btree ("referrer_id","created_at");
--> statement-breakpoint
CREATE INDEX "ref_verif_rewards_referred_created_idx" ON "referral_verification_rewards" USING btree ("referred_user_id","created_at");
