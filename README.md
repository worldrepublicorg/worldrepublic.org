# World Republic

**The World Republic is an open-source platform for global representative democracy.**

It provides the building blocks for political party formation, secure voting, and a self-sustaining economic engine at a planetary scale. This repository contains the core Next.js implementation used to power the platform and the [Raised by Humanity](https://www.raisedbyhumanity.org) campaign.

## Features

- **Political parties** — Discover and create global political parties
- **Citizen verification** — Get verified privately via Self
- **Voting** — Participate in test elections
- **Digital wallet** — Monitor and manage internal rewards and onchain transfers
- **Internationalization** — 50+ languages supported

## Economic engine: world drachma (WDD)

The platform uses a hybrid setup to align incentives through its digital currency, the **world drachma (WDD)**.

- **Centralized database**: Internal rewards are tracked offchain (PostgreSQL).
- **Onchain transfers**: Citizens can withdraw their WDD to a crypto account and interact with the savings account onchain.

### Core incentives
- **Party subsidies**: Funding political parties in proportion to their electoral performance.
- **Savings account**: Citizens earn real-time interest on their deposited WDD with no lock-up period.
- **Ambassador Program**: Rewarding community members for inviting successful party leaders.

### For developers & forks
This repository contains the UI and server logic to interact with the WDD ecosystem. If you are forking this project:
- **Token contract**: You must deploy your own ERC-20 contract (the production app uses Base and World Chain).
- **Treasury**: You will need to fund a treasury wallet to fulfill onchain withdrawal requests.
- **Configuration**: Ensure you update the contract addresses and chain IDs in the server actions and UI components.

## Tech stack

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
   - `NEXTAUTH_URL` — optional canonical app URL (e.g., http://localhost:3000)
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials — https://console.cloud.google.com/apis/credentials
   - `AUTH_WEBAUTHN_RP_NAME` — passkey display name
   - `AUTH_WEBAUTHN_RP_ID` — primary passkey RPID for the NextAuth passkey provider
   - `AUTH_WEBAUTHN_ALLOWED_HOSTS` — comma-separated hosts allowed for custom passkey auth (for multi-domain passkey support)
   - `THIRDWEB_SECRET_KEY` — thirdweb secret key — https://thirdweb.com/dashboard

4. **Run the app**  
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
- **Distribute election subsidies (admin):** Run directly when needed:
  ```bash
  pnpm tsx scripts/distribute.ts <electionId> [--dry-run]
  ```
  Use `--dry-run` to preview without committing. Requires `DATABASE_URL` in env.

## License

AGPL-3.0 — See [LICENSE](./LICENSE) file for details.

## Community

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) for more details.
