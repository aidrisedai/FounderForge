# FounderForge — AI Startup Mentor

FounderForge is a Replit-hosted AI startup mentor that guides founders from idea to revenue through a structured 7-step curriculum. It includes Google Sign-In, PostgreSQL-backed project persistence, AI mentor chat, memory, gamification, community features, idea discovery, YC-style sprint planning, expert sprints, and admin analytics.

## Primary Runtime: Replit

FounderForge is configured to run on Replit first. Preserve these assumptions when changing infrastructure or startup scripts:

- Replit provides Node.js, web hosting, and PostgreSQL through `.replit` modules.
- The application runs on port `5000` and host `0.0.0.0`.
- The Replit workflow starts the app with `npm run dev`.
- Production deployment runs `npm run build` and `npm run start`.
- Replit Secrets provide runtime environment variables, including `DATABASE_URL`.

See [`REPLIT_SETUP.md`](./REPLIT_SETUP.md) for the full Replit setup and deployment checklist.

## Required Replit Secrets

Add these in Replit's **Secrets** tool:

```bash
NEXTAUTH_URL=https://your-repl-or-production-url
NEXTAUTH_SECRET=your-random-secret-here
DATABASE_URL=postgresql://... # auto-created by Replit PostgreSQL
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ANTHROPIC_API_KEY=your-anthropic-api-key
YOUTUBE_API_KEY=your-youtube-api-key # required for Idea Discovery video features
ADMIN_EMAILS=admin@example.com,founder@example.com
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,founder@example.com
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## Google OAuth

Create a Google OAuth web client and add callback URLs for each environment you use:

```text
https://your-replit-dev-url/api/auth/callback/google
https://your-production-url/api/auth/callback/google
http://localhost:3000/api/auth/callback/google # optional local development
```

## Replit Setup Commands

Run these from the Replit Shell after installing dependencies and enabling PostgreSQL:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed # optional, but recommended for discovery/community seed data
npm run setup-admin # optional admin setup
npm run dev
```

## Replit Smoke Test Checklist

Before handing the app to users or another AI system, verify:

```bash
psql $DATABASE_URL -c "SELECT 1"
npx prisma generate
npx prisma migrate deploy
npm run build
npm run dev
```

Then manually confirm:

- Google login works.
- A user can create/load a project.
- AI chat responds with the configured Anthropic key.
- Discovery features load if `YOUTUBE_API_KEY` and seed data are configured.
- Admin dashboard access works for configured admins.

## Architecture Overview

```text
src/
├── app/
│   ├── page.js                       # Main app shell and feature tabs
│   ├── layout.js                     # Root layout with auth provider
│   ├── globals.css                   # Global styles
│   ├── admin/                        # Admin dashboard UI
│   └── api/
│       ├── auth/[...nextauth]/       # Google OAuth via NextAuth
│       ├── chat/                     # Anthropic-powered mentor chat
│       ├── projects/                 # Project persistence
│       ├── memory/                   # Memory dashboard API
│       ├── personality/              # Founder personalization
│       ├── gamification/             # XP, levels, achievements
│       ├── community/                # Feed, forums, rooms, DMs, connections
│       ├── discovery/                # Domains, videos, problem extraction
│       ├── yc/                       # YC-style sprint planning
│       ├── expert/                   # Expert persona sprints
│       └── admin/                    # Admin analytics and user inspection
├── components/                       # UI modules for app features
└── lib/
    ├── curriculum.js                 # 7-step startup curriculum
    ├── prisma.js                     # Prisma client singleton
    ├── storage.js                    # Prisma-backed user/project storage
    ├── memory.js                     # File-backed mentor memory
    ├── gamification.js               # DB-first gamification with file fallback
    └── *Coach/personality/community helpers

prisma/
├── schema.prisma                     # PostgreSQL schema
├── migrations/                       # Applied database migrations
└── seed.js                           # Seed script

scripts/
├── dev.js                            # Replit-safe Next.js dev launcher on port 5000
├── setup-admin.js                    # Admin setup helper
├── migrate-to-db.js                  # Legacy file-data migration helper
└── setup-directories.js              # Local data directory setup
```

## Core Product Areas

- **Curriculum mentor:** 7-step startup journey from problem validation through promotion.
- **AI chat:** Server-side Anthropic calls keep API keys hidden from users.
- **Project persistence:** Projects, progress, deliverables, conversations, and messages are stored in PostgreSQL through Prisma.
- **Memory:** Founder context, insights, milestones, and patterns are currently file-backed under `data/memory`.
- **Gamification:** XP, levels, streaks, achievements, and leaderboard support founder momentum.
- **Community:** Founder profiles, posts, channels, rooms, direct messages, and social feed.
- **Discovery:** Domain/video-based problem discovery using YouTube-related data.
- **YC and expert sprints:** Guided operating plans with daily tasks and check-ins.
- **Admin:** Analytics, users, conversations, and platform oversight.

## Important Replit Notes

- Do not change the app back to port `3000`; Replit workflow and deployment expect port `5000`.
- Keep `DATABASE_URL` available before running Prisma commands or build/deployment checks.
- Use `npx prisma migrate deploy` for Replit deployment migrations.
- Local file-backed memory can work on Replit, but PostgreSQL should remain the long-term source of truth for durable data.
- If OAuth fails, confirm `NEXTAUTH_URL` exactly matches the Replit or production URL and the Google callback URI.
