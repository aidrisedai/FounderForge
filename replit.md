# FounderForge

An AI-powered startup mentor app that guides founders from idea to revenue in 6 steps.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v4 with Google OAuth
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: PostgreSQL via Prisma v5 (Replit built-in)
- **Styling**: Inline styles (no CSS framework)

## Project Structure

```
src/
  app/
    api/
      auth/[...nextauth]/route.js  - NextAuth Google OAuth handler (creates user in DB)
      chat/route.js                - Claude AI chat endpoint
      projects/route.js            - User project CRUD
    globals.css                    - Global styles & animations (Google Fonts via @import)
    layout.js                      - Root layout with SessionProvider
    page.js                        - Main app page (login + full UI)
  components/
    Providers.js                   - NextAuth SessionProvider wrapper
  lib/
    curriculum.js                  - 6-step startup curriculum data
    storage.js                     - Database storage layer using Prisma
    prisma.js                      - Prisma client singleton
prisma/
  schema.prisma                    - Database schema (User, Project, Conversation, Message, etc.)
  migrations/                      - SQL migrations
scripts/
  migrate-to-db.js                 - Script to migrate file-based data to PostgreSQL
  setup-admin.js                   - Admin user setup script
```

## Environment Variables / Secrets Required

- `NEXTAUTH_SECRET` - Random string for session encryption
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)

## Environment-specific Config

- **Development** `NEXTAUTH_URL`: `https://f5a7bb2e-741b-43b2-9f5f-b2eb668e2aa0-00-svpl91aazrsd.worf.replit.dev`
- **Production** `NEXTAUTH_URL`: `https://founderforge.replit.app`

## Database

Uses Replit's built-in PostgreSQL. Schema managed with Prisma v5.

To apply migrations: `npx prisma migrate deploy`
To migrate from file-based data: `npm run migrate-db`

## Development

- Run command: `npm run dev` (port 5000, host 0.0.0.0)
- The workflow is configured as "Start application" on port 5000

## Google OAuth Redirect URIs (Google Cloud Console)

Authorized redirect URIs:
- `https://founderforge.replit.app/api/auth/callback/google` (production)
- `https://f5a7bb2e-...worf.replit.dev/api/auth/callback/google` (Replit dev)
- `http://localhost:3000/api/auth/callback/google` (local dev)
