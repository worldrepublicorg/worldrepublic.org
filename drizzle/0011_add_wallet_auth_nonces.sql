CREATE TABLE "wallet_auth_nonces" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "wallet_auth_nonces_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nonce" varchar(255) NOT NULL,
	"address" varchar(255),
	"chain_id" integer NOT NULL,
	"intent" varchar(20) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_auth_nonces_nonce_unique" UNIQUE("nonce")
);
--> statement-breakpoint
CREATE INDEX "wallet_auth_nonces_expires_at_idx" ON "wallet_auth_nonces" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "wallet_auth_nonces_consumed_at_idx" ON "wallet_auth_nonces" USING btree ("consumed_at");
--> statement-breakpoint
CREATE INDEX "wallet_auth_nonces_address_idx" ON "wallet_auth_nonces" USING btree ("address");
