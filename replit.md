# FounderForge

An AI-powered startup mentor app that guides founders from idea to revenue in 6 steps.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v4 with Google OAuth
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Storage**: File-based JSON storage per user (`.data/users/`)
- **Styling**: Inline styles (no CSS framework)

## Project Structure

```
src/
  app/
    api/
      auth/[...nextauth]/route.js  - NextAuth Google OAuth handler
      chat/route.js                - Claude AI chat endpoint
      projects/route.js            - User project CRUD
    globals.css                    - Global styles & animations
    layout.js                      - Root layout with SessionProvider
    page.js                        - Main app page (login + full UI)
  components/
    Providers.js                   - NextAuth SessionProvider wrapper
  lib/
    curriculum.js                  - 6-step startup curriculum data
    storage.js                     - File-based user data storage
```

## Environment Variables / Secrets Required

- `NEXTAUTH_SECRET` - Random string for session encryption
- `NEXTAUTH_URL` - Set to `http://localhost:5000` in shared env
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude

## Development

- Run command: `npm run dev` (port 5000, host 0.0.0.0)
- The workflow is configured as "Start application" on port 5000

## Notes

- File storage is per-user under `.data/users/<userId>.json`
- The curriculum has 6 steps: Discover, Define, Develop, Deploy, Deepen, Dominate
- Google OAuth redirect URIs must include the Replit dev domain
