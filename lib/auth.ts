import "server-only";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Passkey from "next-auth/providers/passkey";
import { cache } from "react";
import { createNeonAdapterWithWebAuthn } from "./auth/adapter";
import { pool } from "./db/connection";

const authSecret = process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is not set");
}

const authUrl = process.env.NEXTAUTH_URL;
if (!authUrl) {
  throw new Error("AUTH_URL or NEXTAUTH_URL is not set");
}

// Extract domain from NEXTAUTH_URL for WebAuthn rpID
const getRpId = () => {
  try {
    const url = new URL(authUrl);
    return url.hostname;
  } catch {
    // Fallback for localhost
    return "localhost";
  }
};

const rpId = getRpId();
const rpName = process.env.AUTH_WEBAUTHN_RP_NAME || "World Republic";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set");
}

// Create adapter immediately - postgres.js connections are lazy (only connect on query)
// This is safe because:
// - For localhost: postgres.js doesn't connect until a query is made
// - For remote: Pool connections are also lazy
const adapter = createNeonAdapterWithWebAuthn(pool);

const { handlers, auth: uncachedAuth } = NextAuth({
  adapter,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    // biome-ignore lint/suspicious/noExplicitAny: Type compatibility issue with next-auth@5.0.0-beta.30
    (Passkey as any)({
      rpName,
      rpID: rpId,
    }),
  ],
  experimental: {
    enableWebAuthn: true,
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    session({ session, user }) {
      if (session.user) {
        // Convert user.id (number from database) to string for consistency
        session.user.id = String(user.id);
      }
      return session;
    },
  },
});

// Cached auth - deduplicates calls within the same request
// Multiple components calling auth() in the same render will share the result
export const auth = cache(uncachedAuth);
export { handlers };
