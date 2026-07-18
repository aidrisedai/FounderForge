# FounderForge

An AI-powered startup mentor app that runs on Replit and guides founders from idea to revenue through a structured 7-step curriculum.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v4 with Google OAuth
- **AI**: Anthropic Claude API
- **Database**: PostgreSQL via Prisma v5 (Replit built-in)
- **Runtime**: Replit Node.js 20, web, and PostgreSQL modules
- **Styling**: Inline styles plus CSS modules/global CSS where needed

## Replit Runtime Assumptions

- Development runs through the configured Replit workflow: `npm run dev`.
- The app listens on port `5000` and host `0.0.0.0`.
- Replit production deployment runs `npm run build` and `npm run start`.
- Replit PostgreSQL provides `DATABASE_URL` after the PostgreSQL tool is installed.
- Runtime secrets should be managed in Replit Secrets, not committed files.

## Project Structure

```text
src/
  app/
    api/
      auth/[...nextauth]/route.js  - NextAuth Google OAuth handler and user upsert
      chat/route.js                - Anthropic AI mentor endpoint
      projects/route.js            - User project persistence
      memory/route.js              - Founder memory API
      personality/route.js         - Personality assessment API
      gamification/                - XP, stats, and completion APIs
      community/                   - Feed, forums, rooms, DMs, and connections
      discovery/                   - Domains, videos, and problem discovery
      yc/                          - YC-style sprint program APIs
      expert/                      - Expert persona sprint APIs
      admin/                       - Admin analytics and user inspection
    admin/                         - Admin dashboard UI
    globals.css                    - Global styles and animations
    layout.js                      - Root layout with SessionProvider
    page.js                        - Main app page and feature tabs
  components/                      - UI modules for mentor, memory, community, YC, expert, etc.
  lib/
    curriculum.js                  - 7-step startup curriculum data
    storage.js                     - Database storage layer using Prisma
    prisma.js                      - Prisma client singleton
    memory.js                      - File-backed memory helper
    gamification.js                - DB-first gamification with file fallback
prisma/
  schema.prisma                    - PostgreSQL schema
  migrations/                      - SQL migrations
  seed.js                          - Seed script
scripts/
  dev.js                           - Replit-safe Next.js dev launcher on port 5000
  migrate-to-db.js                 - Legacy file-based data migration script
  setup-admin.js                   - Admin setup script
```

## Environment Variables / Secrets Required

- `NEXTAUTH_URL` - Replit dev or production URL for NextAuth callbacks
- `NEXTAUTH_SECRET` - Random string for session encryption
- `DATABASE_URL` - PostgreSQL connection string, auto-provided by Replit PostgreSQL
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ANTHROPIC_API_KEY` - Anthropic API key for AI mentor chat
- `YOUTUBE_API_KEY` - YouTube Data API key for Idea Discovery features
- `ADMIN_EMAILS` - Comma-separated admin email allowlist
- `NEXT_PUBLIC_ADMIN_EMAILS` - Client-visible admin email allowlist

## Environment-specific Config

- **Development** `NEXTAUTH_URL`: `https://f5a7bb2e-741b-43b2-9f5f-b2eb668e2aa0-00-svpl91aazrsd.worf.replit.dev`
- **Production** `NEXTAUTH_URL`: `https://founderforge.edai.fun`

## Database

Uses Replit's built-in PostgreSQL. Schema is managed with Prisma v5.

Useful commands:

```bash
psql $DATABASE_URL -c "SELECT 1"
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run migrate-db
```

## Development

- Run command: `npm run dev`.
- The workflow is configured as `Start application` on port `5000`.
- `scripts/dev.js` clears stale Next.js processes before starting the server to reduce Replit restart port conflicts.

## Production Deployment

Replit deployment is configured in `.replit`:

```bash
npm run build
npm run start
```

Do not switch deployment to port `3000`; Replit expects port `5000` for this project.

## Google OAuth Redirect URIs (Google Cloud Console)

Authorized redirect URIs should include:

- `https://founderforge.edai.fun/api/auth/callback/google` (production)
- `https://f5a7bb2e-741b-43b2-9f5f-b2eb668e2aa0-00-svpl91aazrsd.worf.replit.dev/api/auth/callback/google` (Replit dev)
- `http://localhost:3000/api/auth/callback/google` (optional local dev)
