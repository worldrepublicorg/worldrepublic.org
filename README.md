# World Republic

Open-source Next.js app for the World Republic platform—discover and found parties, prep for elections and referendums, and verify identity with Self before voting. Includes server actions and UI; wire up your own auth, database, and deploy stack to get started.

## Features

- **Political parties** — Discover and create global political parties
- **Voting** — Participate in test elections and referendums
- **Identity verification** — Zero-knowledge proof verification via Self
- **Digital wallet** — Manage WDD (world drachma) transactions
- **Internationalization** — 50+ languages supported

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **Auth:** NextAuth.js v5 (Google OAuth, WebAuthn)
- **Identity:** Self (zero-knowledge verification)
- **Blockchain:** thirdweb (WDD transactions)
- **UI:** Worldcoin Mini Apps UI Kit, Tailwind CSS
- **Code quality:** Biome (linting/formatting)

## Setup

1. **Install dependencies**  
   ```bash
   pnpm install
   ```

2. **Copy environment variables**  
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables:**
   - `DATABASE_URL_LOCAL_DEV` — direct (non-pooled) Postgres URL for local dev — https://console.neon.tech/
   - `DATABASE_URL` — pooler Postgres URL (used in production) — https://console.neon.tech/
   - `NEXTAUTH_SECRET` — secret for NextAuth (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — app base URL (e.g., http://localhost:3000)
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials — https://console.cloud.google.com/apis/credentials
   - `THIRDWEB_SECRET_KEY` — thirdweb secret key — https://thirdweb.com/dashboard

4. **Set up database**  
   ```bash
   pnpm tsx scripts/reset-database.ts  # Reset and apply schema
   pnpm tsx scripts/seed-parties.ts     # Optional: seed sample parties
   ```

5. **Run the app**  
   ```bash
   pnpm dev
   ```
   Then open `http://localhost:3000`

## Scripts

- `pnpm dev` — Start development server with Turbopack
- `pnpm build` — Build for production
- `pnpm start` — Start production server
- `pnpm lint` — Run Biome linter
- `pnpm lint:fix` — Auto-fix linting issues
- `pnpm format` — Format code with Biome

## Database

- **Migrations:** Schema is managed with Drizzle ORM (see `drizzle/` directory)
- **Reset:** `pnpm tsx scripts/reset-database.ts` — drops all tables and applies fresh schema
- **Seed:** `pnpm tsx scripts/seed-parties.ts` — populates sample parties
- **Distribute election subsidies (admin):** Run directly when needed:
  ```bash
  pnpm tsx scripts/distribute.ts <electionId> [--dry-run]
  ```
  Use `--dry-run` to preview without committing. Requires `DATABASE_URL` in env.

## License

AGPL-3.0 — See [LICENSE](./LICENSE) file for details.
