# 🚀 FounderForge - Replit Setup Guide

## Step 1: Import to Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl" → "Import from GitHub"
3. Paste: `https://github.com/aidrisedai/FounderForge`
4. Click "Import from GitHub"

## Step 2: Database Setup

Replit provides PostgreSQL database automatically. In your Repl:

1. Click "Tools" in the left sidebar
2. Search for "PostgreSQL" and click "Install"
3. This will create a DATABASE_URL automatically

## Step 3: Environment Variables

1. Click the "Secrets" tab (🔒 lock icon) in the left sidebar
2. Add these secrets one by one:

```
GOOGLE_CLIENT_ID = your-google-client-id
GOOGLE_CLIENT_SECRET = your-google-client-secret
NEXTAUTH_SECRET = your-random-secret-here
NEXTAUTH_URL = https://your-repl-name.repl.co
ANTHROPIC_API_KEY = your-anthropic-api-key
```

### Getting the Required Keys:

#### Google OAuth (Required for login):
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Choose "Web application"
6. Add authorized redirect URI: 
   - `https://your-repl-name.repl.co/api/auth/callback/google`
7. Copy Client ID and Client Secret

#### NextAuth Secret:
Generate one at: https://generate-secret.vercel.app/32

#### Anthropic API Key:
Get from: https://console.anthropic.com/settings/keys

## Step 4: Setup Commands

In the Replit Shell, run these commands in order:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations
npx prisma migrate deploy

# 4. (Optional) Import any existing data
npm run migrate-db

# 5. Set up admin (optional)
npm run setup-admin
```

## Step 5: Configure Replit

1. Create a `.replit` file in the root with:

```
run = "npm run start"
entrypoint = "src/app/page.js"

[env]
NODE_ENV = "production"

[[ports]]
localPort = 3000
externalPort = 80

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"
```

2. Create a `replit.nix` file:

```nix
{pkgs}: {
  deps = [
    pkgs.nodejs_20
    pkgs.postgresql_15
    pkgs.openssl
  ];
}
```

## Step 6: Start the Application

1. Click "Run" button at the top
2. Wait for the build to complete
3. Your app will be available at: `https://your-repl-name.repl.co`

## Step 7: Admin Access

To set up admin access:

1. Run in Shell: `npm run setup-admin`
2. Enter your admin email when prompted
3. Access admin dashboard at: `/admin`
4. Login with:
   - Username: `admin`
   - Password: `p@55w0rd123`

## Troubleshooting

### Database Connection Issues
If you see database errors:
```bash
# Check if PostgreSQL is running
psql $DATABASE_URL -c "SELECT 1"

# Recreate database schema
npx prisma migrate reset --force
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Port Issues
If port 3000 is busy, modify `package.json`:
```json
"start": "next start -p $PORT || 3000"
```

## File Structure

Key files for Replit:
- `.env` - Created automatically from Secrets
- `prisma/` - Database schema and migrations
- `src/` - Application source code
- `public/` - Static assets
- `package.json` - Dependencies and scripts

## Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database
npx prisma migrate reset
```

## Performance Tips

1. **Use Replit's "Always On"** - Keeps your Repl running 24/7
2. **Enable Boost** - For better performance
3. **Database Indexes** - Already configured in schema
4. **Caching** - NextJS automatically caches pages

## Deployment Checklist

- [ ] All environment variables set in Secrets
- [ ] Database migrated successfully
- [ ] Google OAuth configured with correct redirect URL
- [ ] Admin user created (optional)
- [ ] Test user login works
- [ ] Test creating a project
- [ ] Test AI chat functionality

## Support

- Database issues: Check Prisma logs
- OAuth issues: Verify redirect URLs match exactly
- API issues: Check Anthropic API key and credits
- General issues: Check browser console and Replit logs

## Notes

- Database data persists in Replit's PostgreSQL
- File uploads are temporary (use database storage)
- Secrets are encrypted and secure
- SSL/HTTPS is automatic on Replit

---

Ready to go! Your AI-powered startup mentor is now live on Replit! 🎉