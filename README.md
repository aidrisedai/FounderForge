# FounderForge — AI Startup Mentor

A structured 6-step platform that guides founders from idea to revenue with an AI mentor. Google Sign-In, persistent progress, multi-project support.

## Quick Setup (10 minutes)

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**

### 2. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Copy it

### 3. Configure Environment

Edit `.env.local` and fill in your values:

```bash
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
NEXTAUTH_SECRET=run-this-command-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Admin emails (comma-separated)
ADMIN_EMAILS=your-email@example.com
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add all environment variables from `.env.local`
4. Update `NEXTAUTH_URL` to your production URL
5. Add production callback URL in Google Cloud Console:
   `https://your-app.vercel.app/api/auth/callback/google`
6. Deploy!

## Admin Dashboard

Access the admin dashboard at `/admin` (requires admin email configuration).

Features:
- **User Analytics**: Track total users, projects, messages, and task completions
- **User Management**: View all users, their projects, and activity levels
- **Conversation Monitoring**: Read full conversations between users and AI mentor
- **Progress Tracking**: See user progress through curriculum stages
- **Deliverables Review**: Access all deliverables and outcomes from each task
- **Data Export**: Export all platform data for analysis

To enable admin access:
1. Add your email to `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS` in `.env.local`
2. Sign in with that Google account
3. Navigate to `/admin`

## Architecture

```
src/
├── app/
│   ├── page.js              # Main app (login + mentor chat)
│   ├── admin/page.js        # Admin dashboard
│   ├── layout.js            # Root layout with auth provider
│   ├── globals.css          # Styles
│   └── api/
│       ├── auth/[...nextauth] # Google OAuth via NextAuth
│       ├── chat/              # Proxies to Anthropic API (with activity logging)
│       ├── projects/          # Save/load user data
│       └── admin/            # Admin API endpoints
│           ├── analytics/    # Platform analytics
│           ├── users/        # User management
│           └── conversations/ # Conversation access
├── components/
│   └── Providers.js          # NextAuth session provider
└── lib/
    ├── curriculum.js         # The 38-task structured curriculum
    ├── storage.js            # File-based user storage
    ├── admin-storage.js      # Admin activity tracking
    └── admin-auth.js         # Admin authentication helpers
```

## How It Works

- **Google Sign-In**: No signup forms. One-click Google login via NextAuth.
- **API Key Security**: Anthropic API key stays server-side. Users never see it.
- **Per-User Storage**: Each user's projects, progress, and conversations are saved.
- **Curriculum Engine**: The AI always references the structured curriculum, ensuring consistent guidance.
- **Multi-Project**: Users can run multiple startup ideas through the program simultaneously.

## Production Notes

- Replace file-based storage (`src/lib/storage.js`) with a real database (Supabase, PlanetScale, MongoDB)
- Add rate limiting to the `/api/chat` endpoint
- Consider adding Stripe for paid access
